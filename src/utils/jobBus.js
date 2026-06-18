const { EventEmitter } = require('events');

const jobBus = new EventEmitter();
jobBus.setMaxListeners(100);

module.exports = jobBus;
