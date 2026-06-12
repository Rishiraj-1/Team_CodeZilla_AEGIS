'use client';

import React from 'react';
import { useAegis } from '@/context/AegisContext';
import { usePathname } from 'next/navigation';

const REGIMES = [
  { value: 'ALL', label: 'ALL REGIMES', desc: 'Full orbital catalog' },
  { value: 'LEO', label: 'LEO LAYER', desc: 'Low Earth Orbit (200 - 2,000 km)' },
  { value: 'MEO', label: 'MEO LAYER', desc: 'Medium Earth Orbit (2,000 - 35,786 km)' },
  { value: 'GEO', label: 'GEO LAYER', desc: 'Geostationary Orbit (35,786 km+)' },
] as const;

export default function OrbitalRegimeControls() {
  const pathname = usePathname();
  const { regime, setRegime, stats } = useAegis();

  // Do not show on landing page
  if (pathname === '/') return null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.dot} />
        <span style={styles.title}>ORBITAL REGIMES</span>
      </div>

      <div style={styles.buttonList}>
        {REGIMES.map((r) => {
          const isActive = regime === r.value;
          return (
            <button
              key={r.value}
              onClick={() => setRegime(r.value)}
              style={{
                ...styles.btn,
                borderColor: isActive ? 'var(--gold)' : 'var(--b1)',
                background: isActive ? 'rgba(255, 194, 0, 0.04)' : 'rgba(6, 5, 10, 0.6)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.borderColor = 'var(--b3)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.borderColor = 'var(--b1)';
              }}
            >
              <div style={styles.btnContent}>
                <span style={{
                  ...styles.btnLabel,
                  color: isActive ? 'var(--gold)' : 'var(--t1)'
                }}>
                  {r.label}
                </span>
                <span style={styles.btnDesc}>{r.desc}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    left: 20,
    bottom: 48,
    width: 240,
    background: 'rgba(6, 5, 10, 0.91)',
    backdropFilter: 'blur(16px) saturate(110%)',
    WebkitBackdropFilter: 'blur(16px) saturate(110%)',
    border: '1px solid rgba(255, 194, 0, 0.09)',
    borderRadius: 4,
    boxShadow: 'none',
    padding: '12px 16px',
    zIndex: 40,
    animation: 'fade-in-up 350ms cubic-bezier(0.22, 1, 0.36, 1) 200ms',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    borderBottom: '0.5px solid var(--b0)',
    paddingBottom: 6,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: '50%',
    background: 'var(--gold)',
    display: 'inline-block',
  },
  title: {
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 700,
    fontSize: 10,
    letterSpacing: '0.12em',
    color: 'var(--t2)',
  },
  buttonList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  btn: {
    width: '100%',
    border: '0.5px solid',
    borderRadius: 2,
    padding: '8px 10px',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 200ms cubic-bezier(0.22, 1, 0.36, 1)',
    outline: 'none',
  },
  btnContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  btnLabel: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.08em',
  },
  btnDesc: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: 9,
    color: 'var(--t3)',
    fontWeight: 400,
  },
};
