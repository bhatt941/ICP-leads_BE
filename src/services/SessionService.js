const BaseRepository = require('../repositories/BaseRepository');
const { Session } = require('../models');

const sessionRepo = new BaseRepository(Session);

class SessionService {
  listActive(userId) {
    return sessionRepo.findAll({ userId, isActive: true }, { sort: { lastActiveAt: -1 } });
  }

  async revoke(sessionId, userId) {
    const session = await sessionRepo.findById(sessionId);
    if (!session || String(session.userId) !== String(userId)) throw new Error('Session not found');
    return sessionRepo.updateById(sessionId, { isActive: false, lastActiveAt: new Date() });
  }
}

module.exports = new SessionService();
