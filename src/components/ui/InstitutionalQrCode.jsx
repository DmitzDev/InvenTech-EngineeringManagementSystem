import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

/**
 * Renders a crisp, high-contrast SVG QR code on a pure white surface
 * so phone cameras can scan it effortlessly even from a distance.
 */
export default function InstitutionalQrCode({ value, size = 260 }) {
  const [svgMarkup, setSvgMarkup] = useState('');

  useEffect(() => {
    let isMounted = true;
    if (!value) {
      return () => {
        isMounted = false;
      };
    }

    QRCode.toString(value, {
      type: 'svg',
      errorCorrectionLevel: 'M',
      margin: 2,
      width: size,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((svg) => {
        if (isMounted) setSvgMarkup(svg);
      })
      .catch((err) => {
        console.warn('QR Code generation error:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [value, size]);

  if (!value || !svgMarkup) {
    return (
      <div
        style={{ width: size, height: size }}
        className="bg-white border-2 border-slate-300 rounded-2xl flex items-center justify-center text-xs font-mono text-slate-500 shadow-sm"
      >
        Generating QR Code...
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className="bg-white p-3 rounded-2xl border-4 border-slate-900 shadow-xl flex items-center justify-center shrink-0 select-none overflow-hidden"
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  );
}
