'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import LivePulse from '@/components/primitives/LivePulse';
import { utcNow, formatNumber } from '@/lib/utils';
import { useAegis } from '@/context/AegisContext';
import { sfx } from '@/lib/sfx';
import { useCountUp } from '@/hooks/useCountUp';

const NAV_ITEMS = [
  { label: 'THREATS', path: '/threats' },
  { label: 'TIME MACHINE', path: '/simulator' },
  { label: 'ANALYTICS', path: '/analytics' },
  { label: 'OBJECTS', path: '/objects' },
  { label: 'CHAT', path: '/chat' },
];

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [time, setTime] = useState('--:--:-- UTC');
  const [mounted, setMounted] = useState(false);
  const { stats, regime, setRegime } = useAegis();
  const animatedTracked = useCountUp(stats.totalTracked || 28441, 1800);

  const [crtOn, setCrtOn] = useState(true);
  const [audioOn, setAudioOn] = useState(false);
  const [trailMinutes, setTrailMinutes] = useState(30);

  useEffect(() => {
    setMounted(true);
    setTime(utcNow());
    const interval = setInterval(() => setTime(utcNow()), 1000);

    const crt = localStorage.getItem('aegis-crt-enabled');
    setCrtOn(crt !== 'false');
    setAudioOn(!sfx.muted);

    const trail = localStorage.getItem('aegis-trail-length');
    setTrailMinutes(trail ? parseInt(trail) : 30);

    return () => clearInterval(interval);
  }, []);

  const toggleCrt = () => {
    const next = !crtOn;
    setCrtOn(next);
    localStorage.setItem('aegis-crt-enabled', String(next));
    window.dispatchEvent(new CustomEvent('aegis-crt-toggle', { detail: next }));
    sfx.playClick();
  };

  const toggleAudio = () => {
    const next = !audioOn;
    setAudioOn(next);
    sfx.setMuted(!next);
    window.dispatchEvent(new CustomEvent('aegis-sfx-toggle', { detail: !next }));
    if (next) {
      setTimeout(() => sfx.playClick(), 50);
    }
  };

  const handleTrailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setTrailMinutes(val);
    localStorage.setItem('aegis-trail-length', String(val));
    window.dispatchEvent(new CustomEvent('aegis-trail-change', { detail: val }));
    sfx.playTick();
  };

  return (
    <nav id="top-nav" style={styles.nav}>
      {/* Left: AEGIS wordmark */}
      <div 
        style={{ ...styles.left, cursor: 'pointer' }} 
        onClick={() => { router.push('/'); sfx.playClick(); }}
        title="Return to System Portal"
      >
        <div style={{
          height: 18,
          width: 24,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <img 
            src="/logo.png" 
            alt="AEGIS Logo" 
            style={{
              height: 25,
              width: 'auto',
              transform: 'translateY(-2px)',
              filter: 'invert(1) contrast(1.15) brightness(1.25)',
              mixBlendMode: 'screen',
            }}
          />
        </div>
        <span style={styles.wordmark}>AEGIS</span>
        <LivePulse color="var(--gold)" size={6} />
      </div>

      {/* Center-left: navigation */}
      <div style={styles.navLinks}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => { router.push(item.path); sfx.playClick(); }}
              style={{
                ...styles.navLink,
                color: isActive ? 'var(--gold)' : 'var(--t2)',
                borderBottom: isActive ? '1px solid var(--gold)' : '1px solid transparent',
                paddingBottom: 3,
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--t1)';
                  sfx.playTick();
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.color = 'var(--t2)';
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Center: Regime Shell filter */}
      <div style={styles.regimeWrap}>
        <span style={styles.regimeLabel}>SHELL:</span>
        <div style={styles.regimeGroup}>
          {(['ALL', 'LEO', 'MEO', 'GEO'] as const).map((r) => {
            const active = regime === r;
            return (
              <button
                key={r}
                onClick={() => { setRegime(r); sfx.playClick(); }}
                style={{
                  ...styles.regimeBtn,
                  color: active ? 'var(--gold)' : 'var(--t2)',
                  background: active ? 'rgba(255,194,0,0.06)' : 'transparent',
                  borderColor: active ? 'var(--gold)' : 'transparent',
                }}
              >
                {r}
              </button>
            );
          })}
        </div>
      </div>

      {/* Orbit Trail Slider */}
      <div style={styles.trailWrap}>
        <span style={styles.trailLabel}>TRAIL: {trailMinutes}m</span>
        <input 
          type="range" 
          min="10" 
          max="360" 
          step="10" 
          value={trailMinutes} 
          onChange={handleTrailChange}
          style={styles.trailSlider}
          title="Extend orbital prediction path trail length"
        />
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Right: status info */}
      <div style={styles.right}>
        {/* CRT FX Toggle */}
        <button 
          onClick={toggleCrt}
          style={{
            fontFamily: "'Source Code Pro', monospace",
            fontSize: 9,
            color: crtOn ? 'var(--gold)' : 'var(--t2)',
            background: 'none',
            border: '0.5px solid',
            borderColor: crtOn ? 'var(--gold-20)' : 'var(--b1)',
            borderRadius: 2,
            padding: '1px 5px',
            marginRight: 6,
            transition: 'all 0.15s ease',
          }}
          title="Toggle CRT Screen Scanlines"
        >
          CRT: {crtOn ? 'ON' : 'OFF'}
        </button>

        {/* Audio Toggle */}
        <button 
          onClick={toggleAudio}
          style={{
            fontFamily: "'Source Code Pro', monospace",
            fontSize: 9,
            color: audioOn ? 'var(--gold)' : 'var(--t2)',
            background: 'none',
            border: '0.5px solid',
            borderColor: audioOn ? 'var(--gold-20)' : 'var(--b1)',
            borderRadius: 2,
            padding: '1px 5px',
            marginRight: 16,
            transition: 'all 0.15s ease',
          }}
          title="Toggle Synth Sound Feedback"
        >
          {audioOn ? '🔊 SFX' : '🔇 MUTED'}
        </button>

        <LivePulse color="var(--green)" size={6} />
        <span style={styles.statusLabel}>SENTINEL ACTIVE</span>
        <span style={styles.separator}>|</span>
        <span style={styles.time}>{time}</span>
        <span style={styles.separator}>|</span>
        <span style={styles.tracked}>{formatNumber(animatedTracked)}</span>
        <span style={styles.trackedLabel}>tracked</span>
      </div>
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: 40,
    zIndex: 50,
    background: 'transparent',
    display: 'flex',
    alignItems: 'center',
    padding: '0 24px',
    gap: 32,
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  wordmark: {
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 700,
    fontSize: 15,
    color: 'var(--gold)',
    letterSpacing: '0.2em',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: 24,
  },
  navLink: {
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 500,
    fontSize: 11,
    letterSpacing: '0.12em',
    transition: 'color var(--ms-0)',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: 0,
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  statusLabel: {
    fontFamily: "'Source Code Pro', monospace",
    fontSize: 10,
    color: 'var(--t2)',
  },
  separator: {
    color: 'var(--b2)',
    fontSize: 10,
  },
  time: {
    fontFamily: "'Source Code Pro', monospace",
    fontSize: 11,
    color: 'var(--t1)',
  },
  tracked: {
    fontFamily: "'Source Code Pro', monospace",
    fontSize: 11,
    color: 'var(--gold)',
  },
  trackedLabel: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: 10,
    fontWeight: 400,
    color: 'var(--t2)',
  },
  regimeWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(255,255,255,0.01)',
    border: '0.5px solid var(--b1)',
    padding: '2px 4px',
    borderRadius: 2,
    zIndex: 100,
  },
  regimeLabel: {
    fontFamily: "'Source Code Pro', monospace",
    fontSize: 9,
    color: 'var(--t3)',
    paddingLeft: 4,
  },
  regimeGroup: {
    display: 'flex',
    gap: 2,
  },
  regimeBtn: {
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 700,
    fontSize: 9,
    padding: '2px 8px',
    border: '0.5px solid transparent',
    borderRadius: 1,
    cursor: 'pointer',
    background: 'transparent',
    transition: 'all 150ms ease',
    outline: 'none',
  },
  trailWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(255,255,255,0.01)',
    border: '0.5px solid var(--b1)',
    padding: '2px 8px',
    borderRadius: 2,
    zIndex: 100,
  },
  trailLabel: {
    fontFamily: "'Source Code Pro', monospace",
    fontSize: 9,
    color: 'var(--t2)',
    whiteSpace: 'nowrap',
  },
  trailSlider: {
    width: 70,
    accentColor: 'var(--gold)',
    cursor: 'pointer',
    background: 'rgba(255,255,255,0.04)',
    height: 3,
    borderRadius: 1,
    outline: 'none',
  },
};
