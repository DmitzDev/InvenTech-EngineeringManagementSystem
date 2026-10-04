/**
 * InvenTech Student ID Formatter & Validator
 * Enforces UdD Engineering Student ID standard:
 * Pattern: XX-XXXX-XXX (e.g. 23-1374-693)
 * Exact limit: 9 digits max (auto-hyphenated at positions 2 and 6)
 */

/**
 * Formats a raw string or number into XX-XXXX-XXX (max 9 digits)
 * @param {string|number} value 
 * @returns {string} Formatted Student ID
 */
export function formatStudentId(value) {
  if (!value) return '';
  const digits = String(value).replace(/\D/g, '').slice(0, 9);
  
  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 6) {
    return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  }
  return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
}

/**
 * Handles text input change events with intelligent backspace hyphen management
 * @param {string} rawVal Current input target value
 * @param {string} prevVal Previous state value
 * @returns {string} Formatted Student ID
 */
export function handleStudentIdChange(rawVal, prevVal) {
  let digits = String(rawVal || '').replace(/\D/g, '');
  const prevDigits = String(prevVal || '').replace(/\D/g, '');

  // If a deletion occurred (user pressed backspace) and the removed character was a hyphen
  // (rawVal got shorter, but digits count did not change):
  if (
    String(rawVal || '').length < String(prevVal || '').length &&
    digits.length === prevDigits.length &&
    digits.length > 0
  ) {
    // Also delete the digit preceding the deleted hyphen
    digits = digits.slice(0, -1);
  }

  return formatStudentId(digits);
}

/**
 * Checks if a Student ID has exactly 9 digits
 * @param {string} value 
 * @returns {boolean}
 */
export function isValidStudentId(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length === 9;
}
