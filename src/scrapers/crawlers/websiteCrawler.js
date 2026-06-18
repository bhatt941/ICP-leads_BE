const cheerio = require('cheerio');
const logger = require('../../utils/logger');
const { loadPage } = require('../utils/pageLoader');
const { absoluteUrl, clean, extractEmails, extractPhones } = require('../utils/extractors');

const targetPagePatterns = /(about|contact|team|leadership|careers|jobs)/i;

async function crawlWebsite(websiteUrl) {
  const empty = {
    email: undefined,
    phone: undefined,
    socialLinks: {},
    personalLinkedinUrls: [],
    description: undefined,
    address: undefined,
    pagesCrawled: [],
    linkedinUrl: undefined,
    careersUrl: undefined
  };

  try {
    const pages = [websiteUrl];
    const homepage = await loadPage(websiteUrl);
    if (!homepage.html) return empty;
    const $ = cheerio.load(homepage.html);

    const internalLinks = extractInternalLinks($, homepage.finalUrl || websiteUrl);
    pages.push(...internalLinks.filter((link) => targetPagePatterns.test(link)).slice(0, 8));

    const aggregate = {
      emails: [],
      phones: [],
      socialLinks: {},
      personalLinkedinUrls: [],
      description: clean($('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content')),
      address: extractAddress($),
      pagesCrawled: []
    };

    for (const pageUrl of [...new Set(pages)]) {
      const loaded = pageUrl === websiteUrl ? homepage : await loadPage(pageUrl);
      if (!loaded.html) continue;
      const page$ = cheerio.load(loaded.html);
      const text = page$('body').text();
      aggregate.emails.push(...extractEmails(text));
      aggregate.phones.push(...extractPhones(text));
      
      const resSocial = extractSocialLinks(page$, loaded.finalUrl || pageUrl);
      aggregate.socialLinks = { ...aggregate.socialLinks, ...resSocial.socialLinks };
      aggregate.personalLinkedinUrls.push(...resSocial.personalLinkedinUrls);

      aggregate.address = aggregate.address || extractAddress(page$);
      aggregate.pagesCrawled.push(loaded.finalUrl || pageUrl);
    }

    return {
      email: [...new Set(aggregate.emails)][0],
      phone: [...new Set(aggregate.phones)][0],
      socialLinks: aggregate.socialLinks,
      personalLinkedinUrls: [...new Set(aggregate.personalLinkedinUrls)],
      description: aggregate.description,
      address: aggregate.address,
      pagesCrawled: aggregate.pagesCrawled,
      linkedinUrl: aggregate.socialLinks.linkedin,
      careersUrl: findCareersUrl(internalLinks)
    };
  } catch (error) {
    logger.warn('Website crawl failed', { websiteUrl, error: error.message });
    return empty;
  }
}

function extractInternalLinks($, baseUrl) {
  const baseHost = new URL(baseUrl).hostname;
  const links = [];
  $('a[href]').each((_index, element) => {
    const url = absoluteUrl(baseUrl, $(element).attr('href'));
    if (!url) return;
    try {
      if (new URL(url).hostname === baseHost) links.push(url);
    } catch (_error) {}
  });
  return [...new Set(links)];
}

function extractSocialLinks($, baseUrl) {
  const socialLinks = {};
  const personalLinkedinUrls = [];
  $('a[href]').each((_index, element) => {
    const url = absoluteUrl(baseUrl, $(element).attr('href'));
    if (!url) return;
    if (url.includes('linkedin.com/company/') || url.includes('linkedin.com/school/')) {
      socialLinks.linkedin = url;
    } else if (url.includes('linkedin.com/in/')) {
      personalLinkedinUrls.push(url);
    } else if (url.includes('linkedin.com')) {
      if (url.includes('/in/')) {
        personalLinkedinUrls.push(url);
      } else {
        socialLinks.linkedin = url;
      }
    }
    if (url.includes('twitter.com') || url.includes('x.com')) socialLinks.twitter = url;
    if (url.includes('facebook.com')) socialLinks.facebook = url;
    if (url.includes('instagram.com')) socialLinks.instagram = url;
    if (url.includes('youtube.com')) socialLinks.youtube = url;
  });
  return { socialLinks, personalLinkedinUrls };
}

function extractAddress($) {
  const schemaAddress = clean($('[itemtype*="PostalAddress"], [itemprop="address"]').first().text());
  if (schemaAddress) return schemaAddress;
  const text = clean($('body').text());
  const match = text.match(/\d{1,6}\s+[A-Za-z0-9\s.,'-]+(?:Street|St|Road|Rd|Avenue|Ave|Lane|Ln|Boulevard|Blvd|Drive|Dr)[A-Za-z0-9\s.,'-]*/i);
  return match ? clean(match[0]).slice(0, 250) : undefined;
}

function findCareersUrl(links) {
  return links.find((link) => /(careers|jobs|join-us|work-with-us)/i.test(link));
}

module.exports = {
  crawlWebsite
};
