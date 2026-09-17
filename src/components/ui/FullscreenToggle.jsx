import React, { useState, useEffect } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

export default function FullscreenToggle({ className = '' }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement || document.webkitFullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleToggle = () => {
    try {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        const docEl = document.documentElement;
        if (docEl.requestFullscreen) {
          docEl.requestFullscreen();
        } else if (docEl.webkitRequestFullscreen) {
          docEl.webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen toggle failed:', err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-2xl neu-btn-raised text-cyan-400 hover:text-cyan-300 text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95 ${className}`}
      title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen (15" Touch Kiosk Mode)'}
    >
      {isFullscreen ? (
        <>
          <Minimize2 className="w-4 h-4 text-cyan-400" />
          <span className="hidden lg:inline text-xs font-extrabold">Exit Full</span>
        </>
      ) : (
        <>
          <Maximize2 className="w-4 h-4 text-cyan-400" />
          <span className="hidden lg:inline text-xs font-extrabold">Fullscreen</span>
        </>
      )}
    </button>
  );
}
