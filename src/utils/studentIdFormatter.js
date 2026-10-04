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

export function handleStudentIdChange(rawVal, prevVal) {
  let digits = String(rawVal || '').replace(/\D/g, '');
  const prevDigits = String(prevVal || '').replace(/\D/g, '');

  if (
    String(rawVal || '').length < String(prevVal || '').length &&
    digits.length === prevDigits.length &&
    digits.length > 0
  ) {
    digits = digits.slice(0, -1);
  }

  return formatStudentId(digits);
}

export function isValidStudentId(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length === 9;
}
