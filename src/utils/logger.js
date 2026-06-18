function format(level, message, meta) {
  const suffix = meta === undefined ? '' : ` ${typeof meta === 'string' ? meta : JSON.stringify(meta)}`;
  return `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}${suffix}`;
}

module.exports = {
  info(message, meta) {
    console.log(format('info', message, meta));
  },
  error(message, meta) {
    console.error(format('error', message, meta));
  },
  warn(message, meta) {
    console.warn(format('warn', message, meta));
  },
  debug(message, meta) {
    console.debug(format('debug', message, meta));
  }
};
