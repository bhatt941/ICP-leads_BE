const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/authenticate');
const { CompanyRepository, ContactRepository } = require('../repositories');
const response = require('../utils/response');

router.use(authenticate);

async function getDistinctValues(repo, field, nestedField = null) {
  const records = await repo.findAll({ isDeleted: false });
  const values = new Set();
  records.forEach(r => {
    let val;
    if (nestedField) {
      val = r[field]?.[nestedField];
    } else {
      val = r[field];
    }
    if (val) {
      if (Array.isArray(val)) {
        val.forEach(v => {
          if (v) values.add(String(v).trim());
        });
      } else {
        values.add(String(val).trim());
      }
    }
  });
  return [...values];
}

router.get('/sectors', async (req, res) => {
  const data = await getDistinctValues(CompanyRepository, 'sector');
  return response.success(res, data, 'Sectors retrieved');
});

router.get('/industries', async (req, res) => {
  const data = await getDistinctValues(CompanyRepository, 'industry');
  return response.success(res, data, 'Industries retrieved');
});

router.get('/countries', async (req, res) => {
  const data = await getDistinctValues(CompanyRepository, 'location', 'country');
  return response.success(res, data, 'Countries retrieved');
});

router.get('/regions', async (req, res) => {
  const data = await getDistinctValues(CompanyRepository, 'location', 'region');
  return response.success(res, data, 'Regions retrieved');
});

router.get('/states', async (req, res) => {
  const data = await getDistinctValues(CompanyRepository, 'location', 'state');
  return response.success(res, data, 'States retrieved');
});

router.get('/cities', async (req, res) => {
  const data = await getDistinctValues(CompanyRepository, 'location', 'city');
  return response.success(res, data, 'Cities retrieved');
});

router.get('/departments', async (req, res) => {
  const data = await getDistinctValues(ContactRepository, 'department');
  return response.success(res, data, 'Departments retrieved');
});

router.get('/seniority', async (req, res) => {
  const data = await getDistinctValues(ContactRepository, 'seniority');
  return response.success(res, data, 'Seniorities retrieved');
});

router.get('/company-sizes', async (req, res) => {
  const data = await getDistinctValues(CompanyRepository, 'company_size');
  return response.success(res, data, 'Company sizes retrieved');
});

router.get('/hiring-status', async (req, res) => {
  const data = await getDistinctValues(CompanyRepository, 'hiring', 'hiring_status');
  return response.success(res, data, 'Hiring statuses retrieved');
});

module.exports = router;
