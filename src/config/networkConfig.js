/**
 * =============================================================================
 * InvenTech Kiosk - Dynamic Network & Local Deployment Configuration
 * =============================================================================
 * Provides dynamic host IP, port, origin, and API base URL resolution.
 * Automatically adapts whether accessed from localhost (kiosk display) or
 * from a mobile device over local Wi-Fi (Home / School Laboratory).
 */

const envHostIp = import.meta.env.VITE_PUBLIC_HOST_IP;
const envPort = import.meta.env.VITE_PORT || '5173';
const envApiUrl = import.meta.env.VITE_API_BASE_URL;

/**
 * Returns the active hostname/IP:
 * Prefers the current browser location hostname (so mobile clients automatically
 * talk to the host machine IP they loaded the page from), falling back to .env.local.
 */
export function getActiveHost() {
  if (typeof window !== 'undefined' && window.location.hostname) {
    return window.location.hostname;
  }
  return envHostIp || 'localhost';
}

/**
 * Returns the active port:
 */
export function getActivePort() {
  if (typeof window !== 'undefined' && window.location.port) {
    return window.location.port;
  }
  return envPort;
}

/**
 * Returns the dynamically resolved Base URL / Origin:
 * e.g., "http://192.168.100.16:5173" or "http://localhost:5173"
 */
export function getNetworkOrigin() {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }
  if (envApiUrl) {
    return envApiUrl;
  }
  const host = getActiveHost();
  const port = getActivePort();
  return `http://${host}:${port}`;
}

/**
 * Validates if the current client is connecting via a private LAN / Wi-Fi subnet:
 * Supports 192.168.x.x, 10.x.x.x, 172.16-31.x.x, and localhost.
 */
export function isPrivateNetwork() {
  const host = getActiveHost();
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(host) ||
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host)
  );
}

export const NETWORK_CONFIG = {
  hostIp: envHostIp || 'localhost',
  port: envPort,
  apiBaseUrl: getNetworkOrigin(),
  getActiveHost,
  getActivePort,
  getNetworkOrigin,
  isPrivateNetwork,
};

export default NETWORK_CONFIG;
