'use client';

import { useEffect, useState } from 'react';

export function useLiveCountdown(targetISO: string) {
  const [display, setDisplay] = useState('');

  useEffect(() => {
    const update = () => {
      const diff = new Date(targetISO).getTime() - Date.now();
      if (diff <= 0) {
        setDisplay('PASSED');
        return;
      }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);

      setDisplay(
        h > 0
          ? `${h}h ${m.toString().padStart(2, '0')}m`
          : `${m}m ${s.toString().padStart(2, '0')}s`
      );
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [targetISO]);

  return display;
}
