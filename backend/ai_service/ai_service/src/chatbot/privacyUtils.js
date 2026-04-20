'use strict';

// Patterns for detecting and stripping personal identifiable information (PII)
// before sending user messages to external AI services (OWASP MASVS compliance)

const PII_PATTERNS = [
  // Turkish ID number (11 digits)
  { pattern: /\b\d{11}\b/g, replacement: '[PII_REMOVED]' },
  // Email addresses
  { pattern: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, replacement: '[PII_REMOVED]' },
  // Phone numbers (Turkish and international formats)
  { pattern: /(\+?90[\s\-]?)?(0?5\d{2}[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2})/g, replacement: '[PII_REMOVED]' },
  { pattern: /\+\d{1,3}[\s\-]?\(?\d{1,4}\)?[\s\-]?\d{1,4}[\s\-]?\d{1,9}/g, replacement: '[PII_REMOVED]' },
  // Credit/debit card numbers
  { pattern: /\b(?:\d[ \-]?){13,16}\b/g, replacement: '[PII_REMOVED]' },
  // Home addresses (common patterns)
  { pattern: /\b\d+\s+[A-Za-z\u00C0-\u024F]+\s+(street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr|caddesi|sokak|sk|mah|mahallesi)\b/gi, replacement: '[PII_REMOVED]' },
  // Social security / passport numbers
  { pattern: /\b[A-Z]{1,2}\d{6,9}\b/g, replacement: '[PII_REMOVED]' },
];

/**
 * Strips PII from a message before sending to external AI services.
 * @param {string} message
 * @returns {string} sanitized message
 */
function filterPersonalInformation(message) {
  if (!message || typeof message !== 'string') return message;

  let sanitized = message;
  for (const { pattern, replacement } of PII_PATTERNS) {
    sanitized = sanitized.replace(pattern, replacement);
  }
  return sanitized;
}

/**
 * Strips PII from an array of conversation history messages.
 * @param {Array<{role: string, parts: Array<{text: string}>}>} history
 * @returns {Array} sanitized history
 */
function filterHistoryPersonalInformation(history) {
  if (!Array.isArray(history)) return history;

  return history.map((entry) => ({
    ...entry,
    parts: entry.parts.map((part) => ({
      ...part,
      text: filterPersonalInformation(part.text),
    })),
  }));
}

module.exports = { filterPersonalInformation, filterHistoryPersonalInformation };
