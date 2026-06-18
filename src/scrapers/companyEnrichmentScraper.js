const { absoluteUrl, loadPage } = require('./baseScraper');
const { clean, extractEmails, extractPhones } = require('./parsers');

function findSocialUrls($, baseUrl) {
  const socialLinks = {};
  $('a[href]').each((_index, element) => {
    const href = $(element).attr('href');
    const url = absoluteUrl(baseUrl, href);
    if (!url) return;
    if (url.includes('linkedin.com/company')) socialLinks.linkedin = url;
    if (url.includes('twitter.com') || url.includes('x.com')) socialLinks.twitter = url;
    if (url.includes('facebook.com')) socialLinks.facebook = url;
    if (url.includes('instagram.com')) socialLinks.instagram = url;
    if (url.includes('youtube.com')) socialLinks.youtube = url;
  });
  return socialLinks;
}

async function enrichCompany(website) {
  const $ = await loadPage(website);
  const bodyText = $('body').text();
  const title = clean($('title').first().text());
  const description = clean($('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content'));
  const emails = extractEmails(bodyText);
  const phones = extractPhones(bodyText);
  const socialLinks = findSocialUrls($, website);

  const companyName = clean($('meta[property="og:site_name"]').attr('content')) || title?.split('|')[0] || title;

  return {
    companyName,
    website,
    email: emails[0],
    phone: phones[0],
    description,
    linkedinCompanyUrl: socialLinks.linkedin,
    socialLinks,
    sourceUrl: website,
    isEnriched: true
  };
}

module.exports = {
  enrichCompany
};
