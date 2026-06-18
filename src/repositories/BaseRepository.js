const config = require('../config/env');

const memoryCollections = new Map();

function isMemoryMode() {
  return config.database.mode === 'memory';
}

function matchesFilter(record, filter = {}) {
  return Object.entries(filter).every(([key, expected]) => {
    if (expected === undefined || expected === null || expected === '') return true;
    const actual = record[key];

    if (expected === false && actual === undefined) {
      return true;
    }

    if (expected instanceof RegExp) {
      return expected.test(String(actual || ''));
    }

    if (typeof expected === 'object' && !Array.isArray(expected)) {
      if (expected.$gte !== undefined && !(actual >= expected.$gte)) return false;
      if (expected.$lte !== undefined && !(actual <= expected.$lte)) return false;
      if (expected.$in !== undefined) {
        const values = Array.isArray(actual) ? actual : [actual];
        return values.some((value) =>
          expected.$in.some((candidate) =>
            candidate instanceof RegExp ? candidate.test(String(value || '')) : String(candidate) === String(value)
          )
        );
      }
      if (expected.$regex !== undefined) {
        const regex = expected.$regex instanceof RegExp ? expected.$regex : new RegExp(expected.$regex, expected.$options || '');
        return regex.test(String(actual || ''));
      }
    }

    return String(actual) === String(expected);
  });
}

function applyOptions(data, options = {}) {
  let result = [...data];

  if (options.sort) {
    const entries = Object.entries(options.sort);
    result.sort((a, b) => {
      for (const [field, direction] of entries) {
        const aValue = a[field];
        const bValue = b[field];
        if (aValue === bValue) continue;
        return (aValue > bValue ? 1 : -1) * (direction === -1 ? -1 : 1);
      }
      return 0;
    });
  }

  if (options.skip) result = result.slice(options.skip);
  if (options.limit) result = result.slice(0, options.limit);
  return result;
}

class BaseRepository {
  constructor(model) {
    this.model = model;
    this.collectionName = model.modelName;

    if (!memoryCollections.has(this.collectionName)) {
      memoryCollections.set(this.collectionName, new Map());
    }
  }

  get store() {
    return memoryCollections.get(this.collectionName);
  }

  isMemory() {
    return isMemoryMode();
  }

  generateId() {
    return `${Date.now()}${Math.floor(Math.random() * 100000)}`;
  }

  async findById(id) {
    if (this.isMemory()) return this.store.get(String(id)) || null;
    return this.model.findById(id);
  }

  async findOne(filter = {}) {
    if (this.isMemory()) {
      return [...this.store.values()].find((record) => matchesFilter(record, filter)) || null;
    }
    return this.model.findOne(filter);
  }

  async findAll(filter = {}, options = {}) {
    if (this.isMemory()) {
      const data = [...this.store.values()].filter((record) => matchesFilter(record, filter));
      return applyOptions(data, options);
    }

    let query = this.model.find(filter);
    if (options.sort) query = query.sort(options.sort);
    if (options.skip) query = query.skip(options.skip);
    if (options.limit) query = query.limit(options.limit);
    if (options.populate) query = query.populate(options.populate);
    return query;
  }

  async create(data) {
    if (this.isMemory()) {
      const id = this.generateId();
      const now = new Date();
      const record = { _id: id, id, ...data, createdAt: now, updatedAt: now };
      this.store.set(id, record);
      return record;
    }
    return this.model.create(data);
  }

  async updateById(id, data) {
    if (this.isMemory()) {
      const key = String(id);
      const existing = this.store.get(key);
      if (!existing) return null;
      const updated = { ...existing, ...data, updatedAt: new Date() };
      this.store.set(key, updated);
      return updated;
    }
    return this.model.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async softDelete(id, userId) {
    const data = { isDeleted: true, deletedAt: new Date() };
    if (userId) data.deletedBy = userId;
    return this.updateById(id, data);
  }

  async count(filter = {}) {
    if (this.isMemory()) {
      return [...this.store.values()].filter((record) => matchesFilter(record, filter)).length;
    }
    return this.model.countDocuments(filter);
  }

  async exists(filter = {}) {
    if (this.isMemory()) return Boolean(await this.findOne(filter));
    return this.model.exists(filter);
  }

  getMemoryRecords() {
    return [...this.store.values()];
  }
}

BaseRepository.memoryCollections = memoryCollections;
BaseRepository.matchesFilter = matchesFilter;
BaseRepository.applyOptions = applyOptions;

module.exports = BaseRepository;
