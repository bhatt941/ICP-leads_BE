const CompanyService = require('./CompanyService');
const AuditService = require('./AuditService');

class ExportService {
  async exportCompanies(filters = {}, format = 'csv', userId, orgId) {
    const result = await CompanyService.listCompanies(filters, { page: 1, limit: 100, sort: 'companyName', order: 'asc' });
    const companies = result.data;
    const normalizedFormat = String(format || 'csv').toLowerCase();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    await AuditService.log(userId, orgId, 'export_companies', 'Company', null, null, { filters, format: normalizedFormat, count: companies.length });

    if (normalizedFormat === 'json') {
      return {
        data: JSON.stringify(companies, null, 2),
        filename: `companies-${timestamp}.json`,
        mimeType: 'application/json'
      };
    }

    return {
      data: toCsv(companies),
      filename: `companies-${timestamp}.csv`,
      mimeType: 'text/csv'
    };
  }
}

function toCsv(rows) {
  const columns = ['companyName', 'website', 'email', 'phone', 'industry', 'city', 'state', 'country', 'headcount', 'leadScore', 'leadGrade'];
  const lines = [columns.join(',')];
  for (const row of rows) {
    lines.push(columns.map((column) => csvEscape(row[column])).join(','));
  }
  return lines.join('\n');
}

function csvEscape(value) {
  const text = value === undefined || value === null ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

module.exports = new ExportService();
