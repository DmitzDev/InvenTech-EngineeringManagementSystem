/**
 * Utility to resolve the public or LAN accessible base URL for QR codes.
 *
 * Priority:
 * 1. import.meta.env.VITE_PUBLIC_URL or import.meta.env.VITE_HOST_IP (e.g. https://mykiosk.udd.edu.ph or http://192.168.100.16:5173)
 * 2. If browser hostname is localhost/127.0.0.1, check localStorage override or fall back to window.location.origin
 */
export function getReceiptBaseUrl() {
  const envUrl = import.meta.env.VITE_PUBLIC_URL || import.meta.env.VITE_APP_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined') {
    const customHost = localStorage.getItem('udd_kiosk_network_ip');
    if (customHost && customHost.trim()) {
      const port = window.location.port ? `:${window.location.port}` : '';
      const protocol = window.location.protocol || 'http:';
      return customHost.startsWith('http') ? customHost.replace(/\/+$/, '') : `${protocol}//${customHost}${port}`;
    }

    return window.location.origin;
  }

  return '';
}
