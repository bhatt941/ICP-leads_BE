const ContactService = require('../services/ContactService');
const response = require('../utils/response');
const { getFilters, getPagination } = require('./controllerUtils');

async function list(req, res) {
  try {
    const result = await ContactService.listContacts(getFilters(req.query), getPagination(req.query));
    return response.success(res, result.data, 'Contacts retrieved', 200, result.pagination);
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function getById(req, res) {
  try {
    const contact = await ContactService.getContactById(req.params.id);
    if (!contact) return response.error(res, 'Contact not found', 404);
    return response.success(res, contact, 'Contact retrieved');
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function create(req, res) {
  try {
    const contact = await ContactService.createContact(req.body);
    return response.success(res, contact, 'Contact created', 201);
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function update(req, res) {
  try {
    const contact = await ContactService.updateContact(req.params.id, req.body);
    if (!contact) return response.error(res, 'Contact not found', 404);
    return response.success(res, contact, 'Contact updated');
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function remove(req, res) {
  try {
    const contact = await ContactService.deleteContact(req.params.id, req.user?._id);
    if (!contact) return response.error(res, 'Contact not found', 404);
    return response.success(res, contact, 'Contact deleted');
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

async function getFilterOptions(req, res) {
  try {
    const options = await ContactService.getFilterOptions();
    return response.success(res, options, 'Contact filter options retrieved');
  } catch (error) {
    return response.error(res, error.message, 400);
  }
}

module.exports = {
  create,
  getById,
  list,
  remove,
  update,
  getFilterOptions
};
