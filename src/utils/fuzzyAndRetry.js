const logger = require('./logger');

/**
 * Calculates the Jaro-Winkler similarity between two strings.
 * Returns a score between 0 (completely different) and 1 (exact match).
 */
function jaroWinkler(s1, s2) {
  s1 = String(s1 || '').trim().toLowerCase();
  s2 = String(s2 || '').trim().toLowerCase();

  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  const s1Len = s1.length;
  const s2Len = s2.length;
  const matchWindow = Math.floor(Math.max(s1Len, s2Len) / 2) - 1;

  const s1Matches = new Array(s1Len).fill(false);
  const s2Matches = new Array(s2Len).fill(false);

  let matches = 0;
  for (let i = 0; i < s1Len; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(s2Len - 1, i + matchWindow);

    for (let j = start; j <= end; j++) {
      if (!s2Matches[j] && s1[i] === s2[j]) {
        s1Matches[i] = true;
        s2Matches[j] = true;
        matches++;
        break;
      }
    }
  }

  if (matches === 0) return 0.0;

  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < s1Len; i++) {
    if (s1Matches[i]) {
      while (!s2Matches[k]) k++;
      if (s1[i] !== s2[k]) transpositions++;
      k++;
    }
  }

  const jaro = (matches / s1Len + matches / s2Len + (matches - transpositions / 2) / matches) / 3.0;

  // Winkler modification
  let prefix = 0;
  const maxPrefix = Math.min(4, Math.min(s1Len, s2Len));
  for (let i = 0; i < maxPrefix; i++) {
    if (s1[i] === s2[i]) {
      prefix++;
    } else {
      break;
    }
  }

  return jaro + prefix * 0.1 * (1.0 - jaro);
}

/**
 * Checks if s1 and s2 match fuzzy (Jaro-Winkler similarity >= 0.82)
 * Or check if one string contains the other as a fallback.
 */
function fuzzyMatch(s1, s2, threshold = 0.82) {
  if (!s1 || !s2) return false;
  const val1 = String(s1).toLowerCase().trim();
  const val2 = String(s2).toLowerCase().trim();

  // If one contains another directly, return true
  if (val1.includes(val2) || val2.includes(val1)) {
    return true;
  }

  const score = jaroWinkler(val1, val2);
  return score >= threshold;
}

/**
 * Sanitizes phone numbers into E.164 formats
 */
function sanitizePhone(phone) {
  if (!phone) return undefined;
  let cleaned = String(phone).replace(/[^\d+]/g, '');
  if (!cleaned) return undefined;

  // Basic check: if it doesn't start with +, and is 10 digits, default to USA +1
  if (cleaned.length === 10 && !cleaned.startsWith('+')) {
    cleaned = '+1' + cleaned;
  } else if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  return cleaned;
}

/**
 * General retry wrapper with exponential backoff and jitter
 */
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (err) {
      const isFatalNetwork = err.code && [
        'ENOTFOUND',
        'ECONNRESET',
        'ETIMEDOUT',
        'ECONNABORTED',
        'EHOSTUNREACH',
        'ECONNREFUSED',
        'EPIPE',
        'ERR_NAME_NOT_RESOLVED',
        'ERR_CONNECTION_REFUSED',
        'ERR_CONNECTION_RESET'
      ].includes(err.code);

      const msg = String(err.message || '').toUpperCase();
      const isFatalMessage = msg.includes('ENOTFOUND') || 
                             msg.includes('ECONNRESET') || 
                             msg.includes('ETIMEDOUT') || 
                             msg.includes('TIMEOUT') || 
                             msg.includes('ERR_NAME_NOT_RESOLVED') ||
                             msg.includes('DNS') ||
                             msg.includes('SOCKET HANG UP');

      if (isFatalNetwork || isFatalMessage) {
        logger.warn(`Fatal network error encountered (${err.code || 'NO_CODE'}: ${err.message}). Skipping retries.`);
        throw err;
      }

      attempt++;
      if (attempt >= maxRetries) {
        throw err;
      }
      const status = err.response?.status;
      const jitter = Math.floor(Math.random() * 1000);
      const delayMs = Math.pow(2, attempt) * baseDelay + jitter;
      logger.warn(`Operation failed, retrying attempt ${attempt}/${maxRetries} after ${delayMs}ms. Status: ${status || 'network'}. Error: ${err.message}`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

module.exports = {
  jaroWinkler,
  fuzzyMatch,
  sanitizePhone,
  retryWithBackoff
};
