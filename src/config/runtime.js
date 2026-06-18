const state = {
  databaseMode: 'mongo'
};

function useMemoryDatabase() {
  state.databaseMode = 'memory';
}

function isMemoryDatabase() {
  return state.databaseMode === 'memory';
}

module.exports = {
  isMemoryDatabase,
  state,
  useMemoryDatabase
};
