'use client';

import { useEffect, useState } from 'react';

const BOOT_LINES = [
  { text: 'AEGIS ORBITAL COMMAND — INITIALIZING', delay: 0,    color: '#ffc200' },
  { text: 'CONNECTING TO CELESTRAK FEED...', delay: 400,  color: '#a89870' },
  { text: 'TLE DATA SYNC: 28,441 OBJECTS LOADED', delay: 800,  color: '#2ed87a' },
  { text: 'SGP4 PROPAGATION ENGINE: ONLINE', delay: 1100, color: '#2ed87a' },
  { text: 'SENTINEL AGENT: ACTIVE', delay: 1300, color: '#2ed87a' },
  { text: 'ANALYST AGENT: ACTIVE',  delay: 1500, color: '#4488ff' },
  { text: 'COMMANDER AGENT: ACTIVE',delay: 1700, color: '#ffc200' },
  { text: 'HERALD AGENT: ACTIVE',   delay: 1900, color: '#c084fc' },
  { text: 'SCANNING 28,441 OBJECTS FOR CONJUNCTIONS...', delay: 2100, color: '#a89870' },
  { text: '⚠  DEFCON 2 DECLARED — 3 CRITICAL EVENTS ACTIVE', delay: 2600, color: '#e83535' },
];

export function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    BOOT_LINES.forEach((line, i) => {
      setTimeout(() => {
        setVisibleLines(prev => [...prev, i]);
        if (i === BOOT_LINES.length - 1) {
          // Hold on last line for 600ms then fade out
          setTimeout(() => {
            setDone(true);
            setTimeout(onComplete, 500);
          }, 600);
        }
      }, line.delay);
    });
  }, [onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999, // Super high z-index to overlay everything
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingLeft: '4rem',
        paddingRight: '4rem',
        background: '#06050a',
        opacity: done ? 0 : 1,
        transition: 'opacity 500ms ease',
        pointerEvents: done ? 'none' : 'all',
      }}
    >
      {/* AEGIS wordmark */}
      <div style={{ marginBottom: '2rem' }}>
        <span
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 'bold',
            fontSize: '11px',
            letterSpacing: '0.3em',
            color: 'var(--gold)',
          }}
        >
          AEGIS
        </span>
        <span
          style={{
            display: 'block',
            fontFamily: "'Source Code Pro', monospace",
            color: 'var(--t2)',
            marginTop: '0.25rem',
            fontSize: '9px',
            letterSpacing: '0.15em',
          }}
        >
          AUTONOMOUS EARTH-ORBIT GUARDIAN & INTELLIGENCE SYSTEM
        </span>
      </div>

      {/* Boot lines */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          width: '100%',
          maxWidth: '32rem',
        }}
      >
        {BOOT_LINES.map((line, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontFamily: "'Source Code Pro', monospace",
              fontSize: '0.75rem',
              opacity: visibleLines.includes(i) ? 1 : 0,
              transform: visibleLines.includes(i) ? 'translateX(0)' : 'translateX(-8px)',
              transition: 'opacity 200ms ease, transform 200ms ease',
              color: line.color,
            }}
          >
            <span style={{ color: '#2e2820' }}>›</span>
            {line.text}
            {i === visibleLines[visibleLines.length - 1] && !done && (
              <span className="pulse" style={{ color: line.color, marginLeft: '2px' }}>▊</span>
            )}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div
        style={{
          marginTop: '2rem',
          height: '1px',
          width: '16rem',
          background: 'rgba(255, 194, 0, 0.10)',
        }}
      >
        <div
          style={{
            height: '100%',
            backgroundColor: 'var(--gold)',
            width: `${(visibleLines.length / BOOT_LINES.length) * 100}%`,
            transition: 'width 300ms ease',
          }}
        />
      </div>
    </div>
  );
}
