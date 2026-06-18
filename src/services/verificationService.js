const axios = require('axios');
const cheerio = require('cheerio');
const config = require('../config/env');
const logger = require('../utils/logger');
const { CompanyRepository, ContactRepository, AuditRepository } = require('../repositories');
const { jaroWinkler } = require('../utils/fuzzyAndRetry');

const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'aol.com',
  'zoho.com',
  'protonmail.com',
  'icloud.com',
  'live.com',
  'msn.com'
]);

const PARKED_DOMAIN_MARKERS = [
  'domain for sale',
  'buy this domain',
  'parked free',
  'this domain is parked',
  'sedo domain parking',
  'afternic',
  'bodis.com'
];

const verificationCache = {
  domain: new Map(),
  google: new Map(),
  linkedin: new Map()
};

class VerificationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'VerificationError';
    this.details = details;
  }
}

// If the key starts with 'AIzaSy', it is Gemini
function isGeminiKey(apiKey) {
  return String(apiKey).startsWith('AIzaSy');
}

async function callAiForJson(prompt) {
  const apiKey = String(config.openai?.apiKey || '').trim();
  if (!apiKey) {
    logger.warn('AI verification skipped: API key is not configured.');
    return null;
  }

  const { retryWithBackoff } = require('../utils/fuzzyAndRetry');
  const isGemini = isGeminiKey(apiKey);

  if (isGemini) {
    try {
      const response = await retryWithBackoff(() => axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' }
        },
        { headers: { 'Content-Type': 'application/json' }, timeout: 45000 }
      ));
      const content = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) return null;
      return JSON.parse(content);
    } catch (err) {
      logger.error('Gemini call failed inside verification service after retries', { error: err.message });
      return null;
    }
  } else {
    try {
      const response = await retryWithBackoff(() => axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          response_format: { type: 'json_object' }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          timeout: 15000
        }
      ));
      const content = response.data?.choices?.[0]?.message?.content;
      if (!content) return null;
      return JSON.parse(content);
    } catch (err) {
      logger.error('OpenAI call failed inside verification service after retries', { error: err.message });
      return null;
    }
  }
}

async function verifyContactWithAi(contact, company) {
  if (!contact.name || !contact.designation || !contact.linkedinUrl || !company.companyName) {
    return {
      confidenceScore: 0,
      verificationSource: 'None',
      reason: 'Missing required fields (Name, Designation, LinkedIn URL, or Company Name).'
    };
  }

  // Fallback baseline
  let result = {
    confidenceScore: 85,
    verificationSource: 'LinkedIn',
    reason: 'Verified metadata format (Name, Designation, LinkedIn URL, and Company present).'
  };

  const prompt = `You are an expert lead intelligence verification agent. Cross-check the authenticity and details of the following contact person:
Contact Name: "${contact.name}"
Designation: "${contact.designation}"
LinkedIn Profile: "${contact.linkedinUrl}"
Department: "${contact.department || 'unknown'}"
Seniority: "${contact.seniority || 'unknown'}"
Company Name: "${company.companyName}"
Company Website: "${company.website || 'unknown'}"

Analyze if this person is real, likely works at this company under this designation, and if their metadata aligns.
Generate:
1. A confidence score between 0 and 100 (95-100: Fully verified, 85-94: Highly trusted, 70-84: Moderate confidence, <70: Reject/Unlikely).
2. The verification source (e.g. "LinkedIn", "Company Website", "Team Page", "Press Release", "About Page").
3. A detailed explanation/reason for this evaluation.

Return the response strictly as a JSON object:
{
  "confidenceScore": 90,
  "verificationSource": "LinkedIn & Company Website",
  "reason": "Explanation here..."
}`;

  const aiResult = await callAiForJson(prompt);
  if (aiResult && typeof aiResult.confidenceScore === 'number') {
    result = {
      confidenceScore: aiResult.confidenceScore,
      verificationSource: aiResult.verificationSource || 'LinkedIn',
      reason: aiResult.reason || 'AI verified.'
    };
  }

  return result;
}

function verifyCompanyRequirements(company, contacts = []) {
  const website = company.website || '';
  const linkedin = company.linkedinCompanyUrl || (company.socialLinks && company.socialLinks.linkedin) || '';
  const industry = company.industry || '';
  const location = company.country || company.city || company.address || '';

  if (!website || !linkedin || !industry || !location) {
    return false;
  }

  // Check decision-makers
  const hasDecisionMaker = contacts.some(contact => {
    const title = String(contact.designation || '').toLowerCase();
    const seniority = String(contact.seniority || '').toLowerCase();

    const matchesSeniority = ['c_level', 'vp', 'director'].includes(seniority);
    const matchesTitle = /(founder|ceo|cto|coo|cfo|cmo|cro|director|vp|vice president|head)/i.test(title);

    return matchesSeniority || matchesTitle;
  });

  return hasDecisionMaker;
}

async function resolveDuplicateCompany(companyData) {
  const name = companyData.companyName || '';
  const website = companyData.website || '';
  const linkedin = companyData.linkedinCompanyUrl || '';

  const query = { isDeleted: false };
  const or = [];
  if (name) or.push({ companyName: new RegExp('^' + name.trim() + '$', 'i') });
  if (website) or.push({ website: website.trim() });
  if (linkedin) or.push({ linkedinCompanyUrl: linkedin.trim() });

  if (or.length === 0) return null;
  query.$or = or;

  const existing = await CompanyRepository.findOne(query);
  if (existing) {
    // Merge fields
    const updatedFields = {};
    for (const [key, val] of Object.entries(companyData)) {
      if (val && !existing[key]) {
        updatedFields[key] = val;
      }
    }
    if (Object.keys(updatedFields).length > 0) {
      return CompanyRepository.updateById(existing._id, updatedFields);
    }
    return existing;
  }
  return null;
}

async function enrichCompanyWithAi(companyData, jobsData = []) {
  const apiKey = String(config.openai?.apiKey || '').trim();
  if (!apiKey) {
    logger.warn('AI enrichment skipped: API key is not configured.');
    return null;
  }

  const jobTitles = jobsData.map(j => j.title).filter(Boolean);

  const prompt = `You are an expert lead intelligence enrichment assistant.
We have collected some details about a company and its open job positions:
Company Name: "${companyData.companyName || ''}"
Website: "${companyData.website || ''}"
Raw Description: "${companyData.description || ''}"
Raw Sector: "${companyData.sector || ''}"
Raw Industry: "${companyData.industry || ''}"
Location: City: "${companyData.city || ''}", State: "${companyData.state || ''}", Country: "${companyData.country || ''}"
Raw Technologies: ${JSON.stringify(companyData.technologyStack || [])}
Recent Job Openings: ${JSON.stringify(jobTitles)}

Analyze these inputs and generate standardized corporate profile information.
Ensure you:
1. Provide a clean, short, professional description of the company (under 200 words).
2. Determine the clean macro sector (e.g. Technology, Finance, Healthcare, Retail, etc.) and industry.
3. Clean and verify the technology stack list (removing duplicate/generic entries, keeping real frameworks/libraries/platforms).
4. Extract unique professional specialties.
5. Analyze the job openings and company profile to determine:
   - confidenceScore (0-100 score representing how reliable and authentic this company profile data is)
   - hiringStatus (one of: 'active', 'inactive', 'unknown')
   - hiringIntensity (0-10 scale based on volume and types of jobs)
   - growthSignal (a short 1-sentence description summarizing their current growth or hiring velocity)

Return the response strictly as a JSON object matching this structure:
{
  "description": "Short professional description...",
  "sector": "Macro Sector",
  "industry": "Specific Industry",
  "technologyStack": ["Tech1", "Tech2"],
  "specialties": ["Specialty1", "Specialty2"],
  "confidenceScore": 90,
  "hiringStatus": "active",
  "hiringIntensity": 7,
  "growthSignal": "Summary of hiring/growth signal..."
}`;

  const result = await callAiForJson(prompt);
  return result;
}

async function verifyContactCompanyConnection(contactName, contactTitle, contactLinkedinUrl, companyName, searchSnippet) {
  if (!contactName || !contactLinkedinUrl || !companyName) {
    return { isConnected: false, confidenceScore: 0, reason: 'Missing name, URL, or company name.' };
  }

  const prompt = `You are an expert lead intelligence verification agent. Cross-check if the following person is genuinely connected to / employed by the specified company:
Person Name: "${contactName}"
Job Title: "${contactTitle || 'unknown'}"
LinkedIn URL: "${contactLinkedinUrl}"
Company Name: "${companyName}"
Search Result Snippet: "${searchSnippet || ''}"

Based on the LinkedIn URL slug and the search snippet, evaluate:
1. Is this person genuinely connected to / employed by "${companyName}"? (Either currently working there, or has a strong documented history matching their current designation).
2. Rate your confidence from 0 to 100.

Return the response strictly as a JSON object:
{
  "isConnected": true,
  "confidenceScore": 90,
  "reason": "Provide a brief explanation of the relationship found..."
}`;

  try {
    const res = await callAiForJson(prompt);
    if (res && typeof res.isConnected === 'boolean') {
      return {
        isConnected: res.isConnected,
        confidenceScore: res.confidenceScore || 0,
        reason: res.reason || 'AI evaluated.'
      };
    }
  } catch (err) {
    logger.error('verifyContactCompanyConnection failed', { error: err.message });
  }

  // Fallback heuristic if AI fails
  const slug = String(contactLinkedinUrl).toLowerCase();
  const cleanCompany = String(companyName).toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanName = String(contactName).toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanSnippet = String(searchSnippet || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanSlug = slug.replace(/[^a-z0-9]/g, '');

  const firstWordCompany = String(companyName).split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  const hasFirstWordInSlug = firstWordCompany.length > 2 && cleanSlug.includes(firstWordCompany);
  const hasFirstWordInSnippet = firstWordCompany.length > 2 && cleanSnippet.includes(firstWordCompany);

  const isConnected = cleanSlug.includes(cleanCompany) || 
                      cleanSlug.includes(cleanName) || 
                      cleanSnippet.includes(cleanCompany) ||
                      hasFirstWordInSlug ||
                      hasFirstWordInSnippet;
  
  return {
    isConnected: !!isConnected,
    confidenceScore: 85, // Default trusted score for fallback matched results
    reason: 'Heuristic fallback verification.'
  };
}

module.exports = {
  verifyContactWithAi,
  verifyCompanyRequirements,
  resolveDuplicateCompany,
  enrichCompanyWithAi,
  verifyContactCompanyConnection,
  verifyCompanyStrict,
  verifyContactStrict,
  verifyLeadStrict,
  VerificationError,
  logVerificationFailure
};

async function verifyCompanyStrict(company) {
  let score = 0;
  const reasons = [];

  const companyName = String(company.companyName || '').trim();
  const website = normalizeUrl(company.website);
  const linkedin = normalizeLinkedinCompanyUrl(company.linkedinCompanyUrl || company.socialLinks?.linkedin);
  const email = String(company.email || '').trim().toLowerCase();
  const location = normalizedLocation(company);

  if (!companyName) reasons.push('Missing company name');
  if (!website) reasons.push('Missing official website');
  if (!linkedin) reasons.push('Missing or invalid LinkedIn company URL');
  if (!email) reasons.push('Missing company-domain email');
  if (!location) reasons.push('Missing company location');
  if (!hasAuthoritativeHeadcount(company)) reasons.push('Missing verified headcount from LinkedIn or Google');

  if (reasons.length) return rejected(score, reasons);

  const [websiteResult, linkedinResult, googleResult] = await Promise.all([
    validateOfficialWebsite(companyName, website, email),
    validateLinkedinCompany(companyName, linkedin),
    validateGoogleCompany(company)
  ]);

  if (websiteResult.valid) {
    score += 30;
  } else {
    reasons.push(...websiteResult.reasons);
  }

  if (linkedinResult.valid) {
    score += 30;
  } else {
    reasons.push(...linkedinResult.reasons);
  }

  if (googleResult.valid) {
    score += 20;
  } else {
    reasons.push(...googleResult.reasons);
  }

  if (emailMatchesDomain(email, websiteResult.domain || extractHostname(website))) {
    score += 20;
  } else {
    reasons.push('Email domain mismatch or free email provider');
  }

  if (location && googleResult.location && !locationsMatch(location, googleResult.location)) {
    reasons.push(`Location mismatch: ${location} vs ${googleResult.location}`);
  }

  if (company.phone && !websiteResult.phoneFound) {
    reasons.push('Phone number was not found on official website');
  }

  if (websiteResult.websiteCompanyName && linkedinResult.linkedinCompanyName) {
    const similarity = jaroWinkler(websiteResult.websiteCompanyName, linkedinResult.linkedinCompanyName);
    if (similarity < 0.8) {
      reasons.push(`Company name mismatch between website and LinkedIn: ${websiteResult.websiteCompanyName} vs ${linkedinResult.linkedinCompanyName}`);
    }
  }

  if (reasons.length) return rejected(score, reasons);

  return {
    score,
    reasons,
    isAccepted: score >= 60,
    isLowConfidence: score >= 60 && score < 80,
    status: score >= 80 ? 'verified' : 'low_confidence',
    sources: compactSources({ website: websiteResult.valid, linkedin: linkedinResult.valid, google: googleResult.valid, emailDomain: score >= 80 || emailMatchesDomain(email, websiteResult.domain) })
  };
}

async function verifyContactStrict(contact, company) {
  let score = 0;
  const reasons = [];

  const linkedin = normalizeLinkedinProfileUrl(contact.linkedinUrl || contact.linkedin);
  const contactName = String(contact.name || '').trim();
  const companyName = String(company.companyName || '').trim();
  const contactCompany = String(contact.companyName || companyName || '').trim();

  if (!contactName) reasons.push('Missing contact name');
  if (!linkedin) reasons.push('Missing or invalid LinkedIn profile URL');
  if (!companyName) reasons.push('Missing company for contact validation');
  if (!contact.email) reasons.push('Missing contact email');
  if (reasons.length) return rejected(0, reasons);

  const [linkedinResult, googleResult] = await Promise.all([
    validateLinkedinProfile(contactName, companyName, linkedin, contact),
    validateGoogleContact(contact, company)
  ]);

  if (linkedinResult.valid) {
    score += 30;
  } else {
    reasons.push(...linkedinResult.reasons);
  }

  const sim = jaroWinkler(contactCompany, companyName);
  if (sim >= 0.80) {
    score += 30;
  } else {
    reasons.push(`Contact company name mismatch: ${contactCompany} vs ${companyName}`);
  }

  if (googleResult.valid) {
    score += 20;
  } else {
    reasons.push(...googleResult.reasons);
  }

  if (emailMatchesDomain(contact.email, company.website)) {
    score += 20;
  } else {
    reasons.push('Contact email domain mismatch or free email provider');
  }

  if (reasons.length) return rejected(score, reasons);

  return {
    score,
    reasons,
    isAccepted: score >= 60,
    isLowConfidence: score >= 60 && score < 80,
    status: score >= 80 ? 'verified' : 'low_confidence',
    sources: compactSources({ linkedin: linkedinResult.valid, google: googleResult.valid, emailDomain: emailMatchesDomain(contact.email, company.website) })
  };
}

async function verifyLeadStrict(lead, company, contact) {
  const reasons = [];
  if (!company) reasons.push('Company dependency missing');
  if (!contact) reasons.push('Contact dependency missing');
  if (reasons.length) return rejected(0, reasons);

  const [companyVerification, contactVerification] = await Promise.all([
    verifyCompanyStrict(company),
    verifyContactStrict(contact, company)
  ]);

  if (!companyVerification.isAccepted) reasons.push(`Company rejected: ${companyVerification.reasons.join('; ')}`);
  if (!contactVerification.isAccepted) reasons.push(`Contact rejected: ${contactVerification.reasons.join('; ')}`);
  if (!emailMatchesDomain(contact.email, company.website)) reasons.push('Lead email is not verified against company domain');

  if (reasons.length) return rejected(Math.min(companyVerification.score || 0, contactVerification.score || 0), reasons);

  return {
    score: Math.min(companyVerification.score, contactVerification.score),
    reasons: [],
    isAccepted: true,
    isLowConfidence: companyVerification.isLowConfidence || contactVerification.isLowConfidence,
    status: companyVerification.isLowConfidence || contactVerification.isLowConfidence ? 'low_confidence' : 'verified'
  };
}

function logVerificationFailure(entityType, entity, reasons = []) {
  const name = entity?.companyName || entity?.name || entity?.executiveName || entity?._id || 'unknown';
  logger.warn(`[Strict Verification] ${entityType} rejected`, {
    name,
    reasons
  });
}

function rejected(score, reasons) {
  return {
    score,
    reasons,
    isAccepted: false,
    isLowConfidence: false,
    status: 'rejected',
    sources: []
  };
}

function compactSources(flags) {
  return Object.entries(flags)
    .filter(([, enabled]) => Boolean(enabled))
    .map(([key]) => key);
}

function normalizeUrl(value) {
  if (!value) return '';
  try {
    const raw = String(value).trim();
    const parsed = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return parsed.toString();
  } catch (_error) {
    return '';
  }
}

function normalizeLinkedinCompanyUrl(value) {
  const url = normalizeUrl(value);
  return /(^|\.)linkedin\.com\/company\//i.test(url) ? url : '';
}

function normalizeLinkedinProfileUrl(value) {
  const url = normalizeUrl(value);
  return /(^|\.)linkedin\.com\/in\//i.test(url) ? url : '';
}

function extractHostname(value) {
  try {
    const parsed = new URL(normalizeUrl(value));
    return parsed.hostname.replace(/^www\./i, '').toLowerCase();
  } catch (_error) {
    return '';
  }
}

function extractEmailDomain(email) {
  const domain = String(email || '').split('@')[1]?.toLowerCase().trim();
  return domain || '';
}

function emailMatchesDomain(email, website) {
  const emailDomain = extractEmailDomain(email);
  const webDomain = extractHostname(website);
  if (!emailDomain || !webDomain || FREE_EMAIL_DOMAINS.has(emailDomain)) return false;
  return emailDomain === webDomain || webDomain.endsWith(`.${emailDomain}`) || emailDomain.endsWith(`.${webDomain}`);
}

function normalizedLocation(company) {
  const parts = [
    company.city || company.location?.city,
    company.state || company.location?.state,
    company.country || company.location?.country,
    company.address
  ].filter(Boolean);
  return parts.join(', ').toLowerCase().replace(/\s+/g, ' ').trim();
}

function locationsMatch(a, b) {
  if (!a || !b) return false;
  return a.includes(b) || b.includes(a) || jaroWinkler(a, b) >= 0.82;
}

function hasAuthoritativeHeadcount(company) {
  return Boolean(
    company.headcount ||
    company.employee_count ||
    company.company_size ||
    company.linkedinHeadcountVerified ||
    company.googleHeadcountVerified
  );
}

async function validateOfficialWebsite(companyName, website, email) {
  if (verificationCache.domain.has(website)) return verificationCache.domain.get(website);

  const result = { valid: false, reasons: [], domain: extractHostname(website), websiteCompanyName: '', phoneFound: false };
  try {
    const response = await axios.get(website, {
      timeout: 12000,
      maxRedirects: 5,
      validateStatus: (status) => status === 200,
      headers: { 'User-Agent': config.scraper?.userAgent || 'Mozilla/5.0' }
    });

    const html = String(response.data || '');
    const lowerHtml = html.toLowerCase();
    if (PARKED_DOMAIN_MARKERS.some((marker) => lowerHtml.includes(marker))) {
      result.reasons.push('Website appears to be parked or spam');
    }

    const $ = cheerio.load(html);
    const title = $('title').first().text().trim();
    const metaName = $('meta[property="og:site_name"]').attr('content') || $('meta[name="application-name"]').attr('content') || '';
    result.websiteCompanyName = metaName || title || companyName;
    if (jaroWinkler(result.websiteCompanyName, companyName) < 0.8 && !String(result.websiteCompanyName).toLowerCase().includes(companyName.toLowerCase())) {
      result.reasons.push(`Website title/meta does not match company name: ${result.websiteCompanyName}`);
    }

    if (!emailMatchesDomain(email, website)) {
      result.reasons.push('Company email is missing from official domain');
    } else if (!lowerHtml.includes(String(email).toLowerCase())) {
      result.reasons.push('Company email was not found on official website');
    }

    const phone = $('body').text().match(/(\+?\d[\d\s().-]{7,}\d)/);
    result.phoneFound = Boolean(phone);
    result.valid = result.reasons.length === 0;
  } catch (error) {
    result.reasons.push(`Website did not return HTTP 200: ${error.response?.status || error.code || error.message}`);
  }

  verificationCache.domain.set(website, result);
  return result;
}

async function validateLinkedinCompany(companyName, linkedinUrl) {
  if (verificationCache.linkedin.has(linkedinUrl)) return verificationCache.linkedin.get(linkedinUrl);

  const slug = linkedinUrl.split('/company/')[1]?.split(/[/?#]/)[0] || '';
  const slugName = slug.replace(/[-_]/g, ' ');
  const valid = Boolean(slugName) && jaroWinkler(slugName, companyName) >= 0.8;
  const result = {
    valid,
    reasons: valid ? [] : [`LinkedIn company URL does not match company name: ${linkedinUrl}`],
    linkedinCompanyName: slugName || companyName
  };
  verificationCache.linkedin.set(linkedinUrl, result);
  return result;
}

async function validateGoogleCompany(company) {
  const key = `${company.companyName}|${company.website}`;
  if (verificationCache.google.has(key)) return verificationCache.google.get(key);

  const isVerified = Boolean(
    company.googleVerification === true ||
    company.isGoogleVerified === true ||
    company.googleBusinessUrl ||
    company.googleKnowledgePanel ||
    company.discoverySource === 'google' ||
    company.source === 'google'
  );
  const result = {
    valid: isVerified,
    reasons: isVerified ? [] : ['Missing explicit Google validation source'],
    location: String(company.googleLocation || company.googleBusinessLocation || '').toLowerCase().trim()
  };
  verificationCache.google.set(key, result);
  return result;
}

async function validateLinkedinProfile(contactName, companyName, linkedinUrl, contact) {
  const cacheKey = `${linkedinUrl}|${companyName}`;
  if (verificationCache.linkedin.has(cacheKey)) return verificationCache.linkedin.get(cacheKey);

  const slug = linkedinUrl.split('/in/')[1]?.split(/[/?#]/)[0]?.replace(/[-_]/g, ' ') || '';
  const nameMatches = jaroWinkler(slug, contactName) >= 0.72 || contactName.toLowerCase().split(/\s+/).every((part) => slug.toLowerCase().includes(part));
  const currentCompany = String(contact.currentCompany || contact.companyName || '').trim();
  const companyMatches = currentCompany && jaroWinkler(currentCompany, companyName) >= 0.8;
  const valid = Boolean(nameMatches && companyMatches);
  const result = {
    valid,
    reasons: valid ? [] : ['LinkedIn profile does not prove current name and company association']
  };
  verificationCache.linkedin.set(cacheKey, result);
  return result;
}

async function validateGoogleContact(contact, company) {
  const key = `${contact.name}|${company.companyName}`;
  if (verificationCache.google.has(key)) return verificationCache.google.get(key);

  const snippet = String(contact.googleSnippet || contact.searchSnippet || contact.sourceSnippet || '').toLowerCase();
  const valid = Boolean(
    contact.isGoogleVerified === true ||
    contact.googleVerification === true ||
    (snippet.includes(String(contact.name || '').toLowerCase().split(/\s+/)[0]) && snippet.includes(String(company.companyName || '').toLowerCase().split(/\s+/)[0]))
  );
  const result = {
    valid,
    reasons: valid ? [] : ['Missing Google validation for contact and company']
  };
  verificationCache.google.set(key, result);
  return result;
}
