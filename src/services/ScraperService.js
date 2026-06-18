const EventEmitter = require('events');
const config = require('../config/env');
const BaseRepository = require('../repositories/BaseRepository');
const { ScrapingSession } = require('../models');
const CompanyService = require('./companyService');
const ContactService = require('./contactService');
const { discoverWithAi, discoverPeopleWithAi, discoverCompaniesWithApollo, discoverPeopleWithApollo } = require('./aiDiscovery');
const { crawlWebsite } = require('../scrapers/crawlers/websiteCrawler');

const sessionRepo = new BaseRepository(ScrapingSession);
const progressEmitter = new EventEmitter();

class ScraperService {
  constructor() {
    this.progressEmitter = progressEmitter;
  }
  async listSessions(userId, query = {}) {
    const page = Number(query.page || 1);
    const limit = Math.min(Number(query.limit || 20), 100);

    const filters = { userId, isDeleted: false, ...query };
    delete filters.page;
    delete filters.limit;

    const data = await sessionRepo.findAll(filters, { sort: { startedAt: -1 }, skip: (page - 1) * limit, limit });
    const totalRecords = await sessionRepo.count(filters);

    return {
      data,
      pagination: {
        currentPage: page,
        totalPages: Math.max(1, Math.ceil(totalRecords / limit)),
        totalRecords,
        hasNextPage: page * limit < totalRecords,
        hasPreviousPage: page > 1,
      },
    };
  }

  async startSession(userId, payload = {}, io) {
    const session = await sessionRepo.create({
      userId,
      sessionName: payload.sessionName || `Scrape ${new Date().toLocaleString()}`,
      status: 'running',
      country: payload.country || 'All',
      industry: payload.industry || 'All',
      city: payload.city || 'All',
      keywords: payload.keywords || '',
      companySize: payload.companySize || 'All',
      progress: 0,
      queueStatus: 'queued',
      startedAt: new Date(),
      lastActivityAt: new Date()
    });

    const limit = Number(payload.limit) || 10;
    this.runScrapingBackground(session._id, userId, payload, limit, io).catch(err => {
      console.error('Background scraping error:', err);
    });

    return {
      session,
      status: 'running',
      message: 'Scraping session started'
    };
  }

  async runScrapingBackground(sessionId, userId, payload, limit, io) {
    const emitUpdate = (sessionObj) => {
      this.progressEmitter.emit('update', {
        userId: String(userId),
        type: 'progress',
        session: sessionObj
      });

      if (io && userId) {
        io.to(`user:${String(userId)}`).emit('scraping:update', {
          type: 'progress',
          session: sessionObj
        });
      }
    };

    try {
      let session = await sessionRepo.findById(sessionId);
      if (!session) return;

      const maxResults = limit || 10;
      
      session.progress = 5;
      session.queueStatus = 'discovering';
      session.lastActivityAt = new Date();
      await sessionRepo.updateById(sessionId, session);
      emitUpdate(session);

      const { discoverFromGoogle } = require('../scrapers/discovery/googleSearch');
      const queryParts = [];
      if (payload.industry && payload.industry !== 'All') queryParts.push(`"${payload.industry}"`);
      if (payload.city && payload.city !== 'All') queryParts.push(`"${payload.city}"`);
      if (payload.country && payload.country !== 'All') queryParts.push(`"${payload.country}"`);
      const googleQuery = `site:linkedin.com/company/ ${queryParts.join(' ')}`.trim();
      console.info(`Linear Synced Engine: Running Google discovery query: ${googleQuery}`);
      let discoveredCompanies = [];
      try {
        const { retryWithBackoff } = require('../utils/fuzzyAndRetry');
        discoveredCompanies = await retryWithBackoff(() => discoverFromGoogle(googleQuery, maxResults));
      } catch (googleErr) {
        console.error('Google discovery query failed:', googleErr.message);
      }

      if (!discoveredCompanies || discoveredCompanies.length === 0) {
        console.info('Google discovery returned empty results. Falling back to Gemini/AI discovery...');
        const { retryWithBackoff } = require('../utils/fuzzyAndRetry');
        try {
          discoveredCompanies = await retryWithBackoff(() => discoverWithAi({
            industry: payload.industry,
            country: payload.country,
            city: payload.city,
            maxResults
          }));
        } catch (aiErr) {
          console.error('AI discovery fallback failed:', aiErr.message);
        }
      }

      if (!discoveredCompanies || discoveredCompanies.length === 0) {
        session.progress = 100;
        session.status = 'completed';
        session.queueStatus = 'idle';
        session.endedAt = new Date();
        session.lastActivityAt = new Date();
        await sessionRepo.updateById(sessionId, session);
        emitUpdate(session);
        return;
      }

      const totalCompanies = discoveredCompanies.length;
      let processedCompanies = 0;
      let savedLeadsCount = 0;
      let activeWorkers = 0;

      const checkSessionCompletion = async () => {
        if (processedCompanies === totalCompanies && activeWorkers === 0) {
          session.status = 'completed';
          session.queueStatus = 'idle';
          session.endedAt = new Date();
          session.lastActivityAt = new Date();
          session.totalLeads = savedLeadsCount;
          await sessionRepo.updateById(sessionId, session);
          emitUpdate(session);
          console.info(`Scraping session ${sessionId} fully completed. Total leads saved: ${savedLeadsCount}`);
        }
      };

      for (let i = 0; i < totalCompanies; i++) {
        const currentSession = await sessionRepo.findById(sessionId);
        if (!currentSession) break;
        if (currentSession.status === 'stopped' || currentSession.status === 'completed') {
          break;
        }

        while (currentSession.status === 'paused') {
          await new Promise(resolve => setTimeout(resolve, 2000));
          const checkedSession = await sessionRepo.findById(sessionId);
          if (!checkedSession || checkedSession.status === 'stopped' || checkedSession.status === 'completed') {
            break;
          }
          currentSession.status = checkedSession.status;
        }

        if (currentSession.status === 'stopped' || currentSession.status === 'completed') {
          break;
        }

        let savedCompany;
        const compData = discoveredCompanies[i];

        try {
          const { fuzzyMatch, sanitizePhone } = require('../utils/fuzzyAndRetry');

          // Normalize Location and Industry using Fuzzy String Matcher (score >= 0.82 or substring matching)
          if (payload.industry && compData.industry && fuzzyMatch(compData.industry, payload.industry)) {
            compData.industry = payload.industry;
          }
          if (!compData.location) compData.location = {};
          if (payload.city && compData.location.city && fuzzyMatch(compData.location.city, payload.city)) {
            compData.location.city = payload.city;
            compData.city = payload.city;
          }
          if (payload.country && compData.location.country && fuzzyMatch(compData.location.country, payload.country)) {
            compData.location.country = payload.country;
            compData.country = payload.country;
          }

          if (payload.city && !compData.location.city) {
            compData.location.city = payload.city;
            compData.city = payload.city;
          }
          if (payload.country && !compData.location.country) {
            compData.location.country = payload.country;
            compData.country = payload.country;
          }

          if (compData.phone) {
            compData.phone = sanitizePhone(compData.phone);
          }

          // Rule 1: Company Isolation Gate (Zero Contamination Policy)
          const matchesCountry = !payload.country || payload.country === 'All' || fuzzyMatch(compData.location?.country || compData.country, payload.country);
          const matchesCity = !payload.city || payload.city === 'All' || fuzzyMatch(compData.location?.city || compData.city, payload.city);
          const matchesIndustry = !payload.industry || payload.industry === 'All' || fuzzyMatch(compData.industry, payload.industry);

          if (!matchesCountry || !matchesCity || !matchesIndustry) {
            console.warn(`[Hard Gate-Keeper] Zero Contamination Rule triggered. Dropping company ${compData.companyName}. Reason: Mismatched location/industry filters.`);
            processedCompanies++;
            await checkSessionCompletion();
            continue;
          }

          savedCompany = {
            ...compData,
            isEnriched: false
          };
          console.info(`[Stage 1 Verification Queue] Company held in memory until strict verification passes: ${savedCompany.companyName}`);
          
        } catch (companyErr) {
          console.error(`Failed to process company Stage 1 ${discoveredCompanies[i]?.companyName || 'unknown'}:`, companyErr.message);
          processedCompanies++;
          await checkSessionCompletion();
          continue;
        }

        // Spawn Asynchronous Task Thread for Contacts Discovery and Lead Synthesis
        activeWorkers++;
        (async () => {
          try {
            const { retryWithBackoff, sanitizePhone, fuzzyMatch } = require('../utils/fuzzyAndRetry');

            let crawledData = {};
            let finalWebsite = compData.website;
            let linkedinCompanyUrl = compData.linkedinCompanyUrl || (compData.website && compData.website.includes('linkedin.com/company/') ? compData.website : null);
            
            if (finalWebsite && finalWebsite.includes('linkedin.com/company/')) {
              console.info(`Website URL is a LinkedIn company page. Resolving official company website via search: ${compData.companyName}`);
              try {
                const resolvedWebsite = await retryWithBackoff(() => resolveCompanyWebsiteWithSearch(compData.companyName));
                if (resolvedWebsite) {
                  finalWebsite = resolvedWebsite;
                  console.info(`Resolved official website: ${finalWebsite}`);
                } else {
                  finalWebsite = undefined;
                }
              } catch (webErr) {
                console.error(`Failed to resolve official website for ${compData.companyName}:`, webErr.message);
                finalWebsite = undefined;
              }
            }

            if (finalWebsite) {
              console.info(`Crawling website for enrichment: ${finalWebsite}`);
              try {
                crawledData = await crawlWebsite(finalWebsite);
                if (crawledData.phone) {
                  crawledData.phone = sanitizePhone(crawledData.phone);
                }
              } catch (crawlErr) {
                console.error(`Failed crawling ${finalWebsite}:`, crawlErr.message);
              }
            }

            if (!linkedinCompanyUrl) {
              linkedinCompanyUrl = crawledData.linkedinUrl || (compData.socialLinks && compData.socialLinks.linkedin);
            }
            if (!linkedinCompanyUrl) {
              console.info(`Company LinkedIn URL missing. Running search fallback for company: ${compData.companyName}`);
              try {
                linkedinCompanyUrl = await retryWithBackoff(() => resolveCompanyLinkedinUrlWithSearch(compData.companyName));
                if (linkedinCompanyUrl) {
                  console.info(`Resolved company LinkedIn URL via search: ${linkedinCompanyUrl}`);
                }
              } catch (searchErr) {
                console.error(`Search for company LinkedIn failed:`, searchErr.message);
              }
            }

            let finalEmail = crawledData.email || compData.email;
            
            const finalLinkedin = linkedinCompanyUrl;

            // Enforce strict criteria: must have website, email, and linkedin
            if (!finalWebsite || !finalEmail || !finalLinkedin) {
              console.warn(`Skipping company ${compData.companyName}: Missing website (${finalWebsite}), email (${finalEmail}), or LinkedIn (${finalLinkedin}).`);
              return;
            }

            const enrichedCompanyData = {
              ...compData,
              website: finalWebsite,
              email: finalEmail,
              linkedinCompanyUrl: finalLinkedin,
              apolloOrgId: compData.apolloOrgId,
              phone: crawledData.phone || compData.phone,
              socialLinks: {
                ...(compData.socialLinks || {}),
                ...(crawledData.socialLinks || {}),
                linkedin: finalLinkedin
              },
              careersUrl: crawledData.careersUrl || compData.careersUrl,
              description: crawledData.description || compData.description,
              address: crawledData.address || compData.address,
              isEnriched: true
            };

            // Re-verify under gatekeeper rules with enriched data
            const matchesCountryEnriched = !payload.country || payload.country === 'All' || fuzzyMatch(enrichedCompanyData.location?.country || enrichedCompanyData.country, payload.country);
            const matchesCityEnriched = !payload.city || payload.city === 'All' || fuzzyMatch(enrichedCompanyData.location?.city || enrichedCompanyData.city, payload.city);
            const matchesIndustryEnriched = !payload.industry || payload.industry === 'All' || fuzzyMatch(enrichedCompanyData.industry, payload.industry);

            if (!matchesCountryEnriched || !matchesCityEnriched || !matchesIndustryEnriched) {
              console.warn(`[Hard Gate-Keeper] Zero Contamination Rule triggered during enrichment. Dropping company ${compData.companyName}.`);
              return;
            }

            savedCompany = await CompanyService.upsertDiscoveredCompany(enrichedCompanyData);
            console.info(`[Strict Verification Write] Verified company saved to DB: ${savedCompany.companyName}`);

            let apolloOrgData = null;
            let apolloOrgId = savedCompany.apolloOrgId;
            const domainName = savedCompany.website ? extractDomain(savedCompany.website) : null;
            if (!apolloOrgId && domainName) {
              console.info(`Linear Synced Engine: Running Apollo Verification for domain: ${domainName}`);
              try {
                apolloOrgData = await retryWithBackoff(() => enrichOrganizationWithApollo(domainName));
                if (apolloOrgData) {
                  apolloOrgId = apolloOrgData.id;
                  console.info(`Apollo Verification successful. Found apolloOrgId: ${apolloOrgId}`);
                }
              } catch (apolloErr) {
                console.error(`Apollo Enrichment failed for domain ${domainName}:`, apolloErr.message);
              }
            }

            let jobsData = [];
            if (apolloOrgId) {
              console.info(`Fetching Apollo company info and jobs for: ${savedCompany.companyName} (${apolloOrgId})`);
              try {
                const apolloInfo = await CompanyService.getApolloCompanyInfo(apolloOrgId, savedCompany._id);
                if (apolloInfo && apolloInfo.savedCompany) {
                  savedCompany = apolloInfo.savedCompany;
                }
                const JobService = require('./jobService');
                const apolloJobs = await retryWithBackoff(() => JobService.getApolloJobPostings(apolloOrgId, 1, 10, savedCompany._id));
                jobsData = apolloJobs?.organization_job_postings || [];
              } catch (apolloErr) {
                console.error(`Failed to fetch Apollo info/jobs for ${savedCompany.companyName}:`, apolloErr.message);
              }
            }

            const { verifyCompanyStrict } = require('./verificationService');
            const compVerification = await verifyCompanyStrict(savedCompany);
            savedCompany.confidenceScore = compVerification.score;
            
            if (compVerification.isLowConfidence) {
              savedCompany.isLowConfidence = true;
            }

            if (!compVerification.isAccepted) {
              console.warn(`[Strict Verification] Company ${savedCompany.companyName} rejected. Score: ${compVerification.score}. Reasons: ${compVerification.reasons.join(', ')}`);
              return;
            }
            
            await CompanyService.updateCompany(savedCompany._id, { 
              confidenceScore: compVerification.score,
              isLowConfidence: !!compVerification.isLowConfidence
            });

            try {
              const { enrichCompanyWithAi } = require('./verificationService');
              const freshCompany = await CompanyService.getCompanyById(savedCompany._id);
              const aiEnriched = await retryWithBackoff(() => enrichCompanyWithAi(freshCompany, jobsData));
              if (aiEnriched) {
                console.info(`Gemini AI enrichment completed for company: ${savedCompany.companyName}`);
                savedCompany = await CompanyService.updateCompany(savedCompany._id, aiEnriched);
              }
            } catch (aiErr) {
              console.error(`AI enrichment failed for ${savedCompany.companyName}:`, aiErr.message);
            }

            let discoveredContacts = [];
            try {
              discoveredContacts = await retryWithBackoff(() => discoverPeopleWithApollo(savedCompany.companyName, savedCompany.website));
            } catch (apolloPeopleErr) {
              console.error(`Apollo people search failed for ${savedCompany.companyName}:`, apolloPeopleErr.message);
            }

            let contactsFromApollo = true;
            if (!discoveredContacts || discoveredContacts.length === 0) {
              console.info(`Using fallback Gemini/AI people discovery for ${savedCompany.companyName}...`);
              try {
                discoveredContacts = await retryWithBackoff(() => discoverPeopleWithAi(savedCompany.companyName, savedCompany.website));
              } catch (aiPeopleErr) {
                console.error(`AI people discovery failed for ${savedCompany.companyName}:`, aiPeopleErr.message);
              }
              contactsFromApollo = false;
            }

            if (discoveredContacts && discoveredContacts.length > 0) {
              for (const contact of discoveredContacts) {
                try {
                  // Rule 2: Contact Association Block (Zero Contamination Policy)
                  const contactEmailDomain = contact.email ? extractDomain(contact.email) : null;
                  const companyDomain = savedCompany.website ? extractDomain(savedCompany.website) : null;
                  const isDomainMatch = !contactEmailDomain || !companyDomain || contactEmailDomain === companyDomain;
                  const isNameMatch = fuzzyMatch(contact.companyName, savedCompany.companyName);

                  if (!isNameMatch || !isDomainMatch) {
                    console.warn(`[Hard Gate-Keeper] Contact Association Block triggered. Dropping contact ${contact.name}. Reason: Mismatched company/domain.`);
                    continue;
                  }

                  let currentUrl = contact.linkedinUrl || '';
                  let searchSnippetText = '';

                  let matched = contactsFromApollo && !!currentUrl;
                  if (!matched && (!currentUrl || isPlaceholder(currentUrl, contact.companyName))) {
                    if (crawledData.personalLinkedinUrls && crawledData.personalLinkedinUrls.length > 0) {
                      const nameTokens = String(contact.name).toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(t => t.length >= 2);
                      if (nameTokens.length >= 2) {
                        const firstName = nameTokens[0];
                        const lastName = nameTokens[nameTokens.length - 1];
                        for (const url of crawledData.personalLinkedinUrls) {
                          const s = url.split('/in/')[1]?.split('?')[0]?.toLowerCase() || '';
                          if (s.includes(firstName) && s.includes(lastName)) {
                            console.info(`Matched contact ${contact.name} with crawled LinkedIn URL: ${url}`);
                            currentUrl = url;
                            matched = true;
                            break;
                          }
                        }
                      }
                    }
                  }

                  if (!matched && (!currentUrl || isPlaceholder(currentUrl, contact.companyName))) {
                    console.info(`Running search fallback for: ${contact.name} (${contact.companyName})`);
                    try {
                      const searchRes = await retryWithBackoff(() => resolveLinkedInUrlAndSnippetWithSearch(contact.name, contact.companyName));
                      if (searchRes && searchRes.linkedinUrl) {
                        currentUrl = searchRes.linkedinUrl;
                        searchSnippetText = searchRes.snippet;
                        console.info(`Resolved LinkedIn URL and snippet via Yahoo Search for ${contact.name}: ${currentUrl}`);
                        matched = true;
                      }
                    } catch (searchErr) {
                      console.error(`Search fallback failed for ${contact.name}:`, searchErr.message);
                    }
                  }

                  if (!currentUrl || (!matched && isPlaceholder(currentUrl, contact.companyName))) {
                    console.warn(`Skipping contact ${contact.name}: Missing or invalid LinkedIn URL.`);
                    continue;
                  }

                  contact.linkedinUrl = currentUrl;

                  try {
                    console.info(`Google Search Tenure Check: Verifying tenure for ${contact.name} at ${contact.companyName}`);
                    const tenureSearch = await retryWithBackoff(() => resolveLinkedInUrlAndSnippetWithSearch(contact.name, contact.companyName));
                    if (tenureSearch && tenureSearch.snippet) {
                      const snippetLower = tenureSearch.snippet.toLowerCase();
                      const companyLower = contact.companyName.toLowerCase();
                      if (!snippetLower.includes(companyLower) && !snippetLower.includes(companyLower.split(' ')[0])) {
                        console.warn(`Tenure warning: Company name not found in search snippet for ${contact.name}`);
                      }
                    }
                  } catch (tenureErr) {
                    console.error('Tenure check failed:', tenureErr.message);
                  }

                  let directEmail = contact.email;
                  let directDial = contact.phone || '';
                  if (!directEmail && contact.linkedinUrl) {
                    console.info(`Apollo Direct Verification: Querying Apollo for contact details of ${contact.name}`);
                    try {
                      const apolloContact = await retryWithBackoff(() => findContactDetailsWithApollo(contact.name, contact.companyName));
                      if (apolloContact) {
                        directEmail = apolloContact.email || directEmail;
                        directDial = apolloContact.phone || directDial;
                        console.info(`Apollo Direct Verification retrieved email: ${directEmail}, phone: ${directDial}`);
                      }
                    } catch (apolloContactErr) {
                      console.error('Apollo contact detail retrieval failed:', apolloContactErr.message);
                    }
                  }

                  contact.email = directEmail || contact.email;
                  contact.phone = sanitizePhone(directDial || contact.phone);

                  const { verifyContactStrict } = require('./verificationService');
                  const contactVerification = await verifyContactStrict(contact, savedCompany);
                  contact.confidenceScore = contactVerification.score;
                  if (contactVerification.isLowConfidence) {
                    contact.isLowConfidence = true;
                  }

                  if (!contactVerification.isAccepted) {
                    console.warn(`[Strict Verification] Contact ${contact.name} rejected. Score: ${contactVerification.score}. Reasons: ${contactVerification.reasons.join(', ')}`);
                    continue;
                  }

                  console.info(`SUCCESS: Verified contact ${contact.name} with score ${contactVerification.score}`);

                  contact.companyId = savedCompany._id;
                  if (!contact.location) {
                    contact.location = `${savedCompany.location?.city || ''}, ${savedCompany.location?.country || ''}`.replace(/^,\s*/, '').trim();
                  }
                  await ContactService.createContact(contact);
                  
                  const SavedLeadService = require('./SavedLeadService');
                  const leadData = {
                    userId: userId,
                    companyId: savedCompany._id,
                    companyName: savedCompany.companyName,
                    industry: savedCompany.industry,
                    country: savedCompany.location?.country || '',
                    city: savedCompany.location?.city || '',
                    website: savedCompany.website,
                    linkedinUrl: contact.linkedinUrl,
                    executiveName: contact.name,
                    designation: contact.designation,
                    aiOpportunityScore: savedCompany.leadScore || 85,
                    hiringStatus: savedCompany.hiring?.hiring_status || 'unknown',
                    status: 'new',
                    saved: true,
                    source: 'scraper',
                    sessionId: sessionId
                  };
                  await SavedLeadService.create(leadData);
                  savedLeadsCount++;
                  
                  this.progressEmitter.emit('update', {
                    userId: String(userId),
                    type: 'lead:discovered',
                    company: savedCompany,
                    contact: contact
                  });

                  if (io && userId) {
                    io.to(`user:${String(userId)}`).emit('lead:discovered', {
                      company: savedCompany,
                      contact: contact
                    });
                  }
                } catch (contactErr) {
                  console.error(`Failed to save contact ${contact?.name || 'unknown'}:`, contactErr.message);
                }
              }
            }

          } catch (asyncErr) {
            console.error(`Asynchronous processing failed for company ${savedCompany.companyName}:`, asyncErr.message);
          } finally {
            activeWorkers--;
            processedCompanies++;
            const percent = Math.round(10 + ((processedCompanies / totalCompanies) * 90));
            
            session.progress = Math.min(percent, 100);
            session.totalLeads = savedLeadsCount;
            session.lastActivityAt = new Date();
            
            await sessionRepo.updateById(sessionId, session);
            emitUpdate(session);

            await checkSessionCompletion();
          }
        })();

        // Small delay to space out worker threads
        await new Promise(resolve => setTimeout(resolve, 800));
      }

    } catch (err) {
      console.error('Error in background scraping:', err);
      try {
        const session = await sessionRepo.findById(sessionId);
        if (session) {
          session.status = 'failed';
          session.queueStatus = 'idle';
          session.notes = `Error: ${err.message}`;
          session.endedAt = new Date();
          session.lastActivityAt = new Date();
          await sessionRepo.updateById(sessionId, session);
          emitUpdate(session);
        }
      } catch (dbErr) {
        console.error('Failed to set scraping session status to failed:', dbErr);
      }
    }
  }


  async pauseSession(sessionId) {
    if (!sessionId) throw new Error('Session id is required');
    const session = await sessionRepo.updateById(sessionId, { status: 'paused', lastActivityAt: new Date() });
    if (!session) throw new Error('Session not found');
    return session;
  }

  async resumeSession(sessionId) {
    if (!sessionId) throw new Error('Session id is required');
    const session = await sessionRepo.updateById(sessionId, { status: 'running', lastActivityAt: new Date() });
    if (!session) throw new Error('Session not found');
    return session;
  }

  async stopSession(sessionId, options = {}) {
    if (!sessionId) throw new Error('Session id is required');
    const session = await sessionRepo.updateById(sessionId, {
      status: options.force ? 'stopped' : 'completed',
      endedAt: new Date(),
      lastActivityAt: new Date()
    });
    if (!session) throw new Error('Session not found');
    return session;
  }

  async getStatus(sessionId) {
    if (!sessionId) {
      return { status: 'idle', message: 'No active session' };
    }

    const session = await sessionRepo.findById(sessionId);
    if (!session) throw new Error('Session not found');
    return session;
  }

  async clearAllSessions(userId) {
    const sessions = await sessionRepo.findAll({ userId, isDeleted: false });
    for (const session of sessions) {
      await sessionRepo.updateById(session._id, { isDeleted: true, deletedAt: new Date() });
    }
    return { success: true, message: 'All scraping sessions cleared' };
  }

  async deleteSession(sessionId) {
    const session = await sessionRepo.updateById(sessionId, { isDeleted: true, deletedAt: new Date() });
    if (!session) throw new Error('Session not found');
    return session;
  }
}

function isPlaceholder(url, companyName) {
  if (!url) return true;
  const slug = url.split('/in/')[1]?.split('?')[0] || '';
  const isSimple = !slug.match(/-\w+\d+/) && slug.split('-').length <= 3;
  const hasExample = url.toLowerCase().includes('example');
  const hasPlainCompany = companyName ? url.includes(String(companyName).toLowerCase().replace(/[^a-z0-9]/g, '')) : false;
  return isSimple || hasExample || hasPlainCompany;
}

async function resolveCompanyLinkedinUrlWithSearch(companyName) {
  if (!companyName) return null;
  const { chromium } = require('playwright');
  const cheerio = require('cheerio');
  const query = `"${companyName}" official linkedin company page`;
  const url = `https://search.yahoo.com/search?q=${encodeURIComponent(query)}`;
  
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 7000 });
    const html = await page.content();
    const $ = cheerio.load(html);
    
    let matchedUrl = null;
    $('a[href]').each((i, el) => {
      const href = $(el).attr('href') || '';
      if (href.includes('linkedin.com/company/') && !href.includes('/posts/') && !href.includes('/jobs/')) {
        const match = href.match(/https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/company\/[^&\s/]+/);
        if (match) {
          matchedUrl = match[0];
          return false;
        }
      }
    });
    return matchedUrl;
  } catch (error) {
    console.error('Yahoo company search resolution failed:', error.message);
    return null;
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

async function resolveLinkedInUrlAndSnippetWithSearch(name, companyName) {
  if (!name || !companyName) return null;
  const { chromium } = require('playwright');
  const cheerio = require('cheerio');
  const query = `${name} ${companyName} Linkedin`;
  const url = `https://search.yahoo.com/search?q=${encodeURIComponent(query)}`;
  
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 7000 });
    const html = await page.content();
    const $ = cheerio.load(html);
    
    let matchedUrl = null;
    let matchedSnippet = '';
    
    $('a[href]').each((i, el) => {
      const href = $(el).attr('href') || '';
      if (href.includes('linkedin.com/in/') && !href.includes('/posts/') && !href.includes('/jobs/')) {
        const match = href.match(/https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/in\/[^&\s/]+(?:\/[^&\s/]+)*/);
        if (match) {
          matchedUrl = match[0];
          const parentText = $(el).closest('div').text().trim().replace(/\s+/g, ' ');
          matchedSnippet = parentText || $(el).text();
          return false;
        }
      }
    });
    return { linkedinUrl: matchedUrl, snippet: matchedSnippet };
  } catch (error) {
    console.error('Yahoo search resolution failed:', error.message);
    return null;
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

async function resolveLinkedInUrlWithSearch(name, companyName) {
  const res = await resolveLinkedInUrlAndSnippetWithSearch(name, companyName);
  return res ? res.linkedinUrl : null;
}

function extractDomain(website) {
  if (!website) return '';
  try {
    const cleaned = String(website).trim();
    const url = new URL(cleaned.startsWith('http') ? cleaned : `https://${cleaned}`);
    return url.hostname.replace(/^www\./, '');
  } catch (e) {
    return String(website).replace(/^www\./, '').trim();
  }
}

async function resolveCompanyWebsiteWithSearch(companyName) {
  if (!companyName) return null;
  const { chromium } = require('playwright');
  const cheerio = require('cheerio');
  const query = `"${companyName}" official website homepage`;
  const url = `https://search.yahoo.com/search?q=${encodeURIComponent(query)}`;
  
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 7000 });
    const html = await page.content();
    const $ = cheerio.load(html);
    
    let matchedUrl = null;
    const excludedHosts = ['google.com', 'yahoo.com', 'linkedin.com', 'facebook.com', 'wikipedia.org', 'twitter.com', 'x.com', 'instagram.com'];
    $('a[href]').each((i, el) => {
      const href = $(el).attr('href') || '';
      try {
        if (/^https?:\/\//i.test(href)) {
          const parsed = new URL(href);
          const host = parsed.hostname.toLowerCase();
          if (!excludedHosts.some(ex => host.includes(ex))) {
            matchedUrl = `${parsed.protocol}//${parsed.hostname}`;
            return false;
          }
        }
      } catch (e) {}
    });
    return matchedUrl;
  } catch (error) {
    console.error('Yahoo company website search resolution failed:', error.message);
    return null;
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

async function enrichOrganizationWithApollo(domain) {
  const apiKey = String(config.apollo?.apiKey || process.env.APOLLO_API_KEY || '').trim();
  if (!apiKey || !domain) return null;
  try {
    const axios = require('axios');
    const response = await axios.get('https://api.apollo.io/api/v1/organizations/enrich', {
      params: {
        domain: domain,
        api_key: apiKey
      },
      timeout: 10000
    });
    return response.data?.organization || null;
  } catch (err) {
    console.error(`Apollo domain enrichment failed for ${domain}:`, err.message);
    return null;
  }
}

async function findContactDetailsWithApollo(name, companyName) {
  const apiKey = String(config.apollo?.apiKey || process.env.APOLLO_API_KEY || '').trim();
  if (!apiKey) return null;
  try {
    const axios = require('axios');
    const response = await axios.post('https://api.apollo.io/api/v1/mixed_people/api_search', {
      q_keywords: `${name} ${companyName}`,
      per_page: 1
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'accept': 'application/json',
        'X-Api-Key': apiKey
      },
      timeout: 10000
    });
    const person = response.data?.people?.[0];
    if (person) {
      return {
        email: person.email,
        phone: person.sanitized_phone || person.phone_number
      };
    }
    return null;
  } catch (err) {
    console.error(`Apollo contact search failed for ${name} (${companyName}):`, err.message);
    return null;
  }
}

module.exports = new ScraperService();

