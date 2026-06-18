const BaseRepository = require('./BaseRepository');
const { User } = require('../models');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  findByEmail(email) {
    return this.findOne({ email: String(email || '').toLowerCase() });
  }

  findByGoogleId(id) {
    return this.findOne({ googleId: id });
  }

  findByOrg(orgId) {
    return this.findAll({ organizationId: orgId, isActive: true });
  }
}

module.exports = UserRepository;
