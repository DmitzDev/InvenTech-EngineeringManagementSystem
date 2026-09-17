const SALT = '_UDD_ENG_LAB_SECURE_SALT_v1_';
const AUTHORIZED_DIGESTS = [
  '4441213ae93407ef95b09c9f6d50c5b4faf2d8283955f908cf5850b6b63deed1',
  '1d2b4d0d58bf5ff8764047cecbe16b66cf41c1b95529004504372cdcbcf548a8',
];

const CUSTOM_HASH_STORAGE_KEY = 'udd_custodian_pin_digest';

export async function computePasscodeDigest(pin) {
  if (!pin || typeof pin !== 'string') return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(pin.trim() + SALT);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyCustodianPin(inputPin) {
  if (!inputPin || typeof inputPin !== 'string') return false;
  try {
    const inputDigest = await computePasscodeDigest(inputPin);
    const customDigest = localStorage.getItem(CUSTOM_HASH_STORAGE_KEY);
    if (customDigest && inputDigest === customDigest) {
      return true;
    }
    return AUTHORIZED_DIGESTS.includes(inputDigest);
  } catch (err) {
    console.error('Cryptographic hash evaluation error', err);
    return false;
  }
}
