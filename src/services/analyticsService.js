const { Company, Contact, Job } = require('../models');
const { CompanyRepository, ContactRepository, JobRepository } = require('../repositories');

class AnalyticsService {
  async getOverview() {
    if (CompanyRepository.isMemory()) {
      const companies = CompanyRepository.getMemoryRecords().filter((item) => !item.isDeleted);
      const contacts = ContactRepository.getMemoryRecords().filter((item) => !item.isDeleted);
      const jobs = JobRepository.getMemoryRecords().filter((item) => !item.isDeleted);
      return {
        totalCompanies: companies.length,
        totalContacts: contacts.length,
        totalJobs: jobs.length,
        avgLeadScore: average(companies.map((company) => company.leadScore || 0))
      };
    }

    const [totalCompanies, totalContacts, totalJobs, leadScoreAgg] = await Promise.all([
      Company.countDocuments({ isDeleted: false }),
      Contact.countDocuments({ isDeleted: false }),
      Job.countDocuments({ isDeleted: false }),
      Company.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: null, avgLeadScore: { $avg: '$leadScore' } } }
      ])
    ]);

    return {
      totalCompanies,
      totalContacts,
      totalJobs,
      avgLeadScore: leadScoreAgg[0]?.avgLeadScore || 0
    };
  }

  async getHiringAnalytics() {
    if (CompanyRepository.isMemory()) {
      const companies = CompanyRepository.getMemoryRecords().filter((item) => !item.isDeleted);
      return {
        topHiringIndustries: groupCount(companies.filter((item) => item.hiringStatus === 'active'), 'industry'),
        hiringIntensityDistribution: bucketHiringIntensity(companies)
      };
    }

    const [topHiringIndustries, hiringIntensityDistribution] = await Promise.all([
      Company.aggregate([
        { $match: { isDeleted: false, hiringStatus: 'active' } },
        { $group: { _id: '$industry', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Company.aggregate([
        { $match: { isDeleted: false } },
        {
          $bucket: {
            groupBy: '$hiringIntensity',
            boundaries: [0, 25, 50, 75, 101],
            default: 'unknown',
            output: { count: { $sum: 1 } }
          }
        }
      ])
    ]);

    return { topHiringIndustries, hiringIntensityDistribution };
  }

  async getIndustryBreakdown() {
    if (CompanyRepository.isMemory()) {
      return groupCount(CompanyRepository.getMemoryRecords().filter((item) => !item.isDeleted), 'industry');
    }

    return Company.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$industry', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
  }

  async getLeadScoreDistribution() {
    if (CompanyRepository.isMemory()) {
      return groupCount(CompanyRepository.getMemoryRecords().filter((item) => !item.isDeleted), 'leadGrade');
    }

    return Company.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$leadGrade', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
  }
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length;
}

function groupCount(records, field) {
  return Object.values(records.reduce((acc, record) => {
    const key = record[field] || 'unknown';
    acc[key] = acc[key] || { _id: key, count: 0 };
    acc[key].count += 1;
    return acc;
  }, {})).sort((a, b) => b.count - a.count);
}

function bucketHiringIntensity(companies) {
  const buckets = [
    { _id: '0-24', min: 0, max: 24, count: 0 },
    { _id: '25-49', min: 25, max: 49, count: 0 },
    { _id: '50-74', min: 50, max: 74, count: 0 },
    { _id: '75-100', min: 75, max: 100, count: 0 }
  ];
  for (const company of companies) {
    const score = Number(company.hiringIntensity || 0);
    const bucket = buckets.find((item) => score >= item.min && score <= item.max);
    if (bucket) bucket.count += 1;
  }
  return buckets.map(({ min, max, ...bucket }) => bucket);
}

module.exports = new AnalyticsService();
