import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

/**
 * Renders a crisp, high-contrast SVG QR code on a pure white surface
 * so phone cameras can scan it effortlessly in any lighting condition.
 */
export default function InstitutionalQrCode({ value, size = 168 }) {
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
      margin: 1,
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
        className="bg-white border border-slate-300 rounded-xl flex items-center justify-center text-[11px] font-mono text-slate-400"
      >
        Generating QR...
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className="bg-white p-2 rounded-xl border-2 border-slate-300 shadow-xs flex items-center justify-center shrink-0 select-none"
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  );
}
