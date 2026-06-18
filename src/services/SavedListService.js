const BaseRepository = require('../repositories/BaseRepository');
const { SavedList } = require('../models');

const savedListRepo = new BaseRepository(SavedList);

class SavedListService {
  create(data) {
    return savedListRepo.create({
      ...data,
      companyIds: data.companyIds || [],
      contactIds: data.contactIds || []
    });
  }

  getById(id) {
    return savedListRepo.findById(id);
  }

  async list(orgId, userId) {
    return savedListRepo.findAll({ organizationId: orgId, userId, isDeleted: false }, { sort: { createdAt: -1 } });
  }

  update(id, data) {
    return savedListRepo.updateById(id, data);
  }

  remove(id) {
    return savedListRepo.softDelete(id);
  }

  async addCompany(id, companyId) {
    const list = await savedListRepo.findById(id);
    if (!list) throw new Error('Saved list not found');
    const companyIds = unique([...(list.companyIds || []), companyId]);
    return savedListRepo.updateById(id, { companyIds });
  }

  async removeCompany(id, companyId) {
    const list = await savedListRepo.findById(id);
    if (!list) throw new Error('Saved list not found');
    const companyIds = (list.companyIds || []).filter((item) => String(item) !== String(companyId));
    return savedListRepo.updateById(id, { companyIds });
  }
}

function unique(values) {
  return [...new Map(values.map((value) => [String(value), value])).values()];
}

module.exports = new SavedListService();
