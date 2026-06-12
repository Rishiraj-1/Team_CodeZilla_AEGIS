'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAegis } from '@/context/AegisContext';
import LivePulse from '@/components/primitives/LivePulse';
import { formatNumber } from '@/lib/utils';

export default function Home() {
  const router = useRouter();
  const { stats, isTransitioning, setIsTransitioning, setHasEntered } = useAegis();
  const [fadedOut, setFadedOut] = useState(false);
  const [systemLoadState, setSystemLoadState] = useState(0);

  // Loading animation simulation for the UI
  useEffect(() => {
    const timer = setInterval(() => {
      setSystemLoadState((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + Math.floor(Math.random() * 12) + 4;
      });
    }, 80);
    return () => clearInterval(timer);
  }, []);

  const handleEnterSystem = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setFadedOut(true);

    // Zoom globe and transition routes after animation concludes
    setTimeout(() => {
      setHasEntered(true);
      router.push('/threats');
      // Reset transitioning state shortly after navigation to allow smooth loading
      setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
    }, 2000);
  };

  return (
    <div style={{
      ...styles.container,
      opacity: fadedOut ? 0 : 1,
      transform: fadedOut ? 'scale(1.03)' : 'scale(1)',
      pointerEvents: fadedOut ? 'none' : 'auto',
    }}>
      {/* Corner brackets */}
      <div style={{ ...styles.bracket, top: 40, left: 40, borderLeft: '1px solid var(--b3)', borderTop: '1px solid var(--b3)' }} />
      <div style={{ ...styles.bracket, top: 40, right: 40, borderRight: '1px solid var(--b3)', borderTop: '1px solid var(--b3)' }} />
      <div style={{ ...styles.bracket, bottom: 40, left: 40, borderLeft: '1px solid var(--b3)', borderBottom: '1px solid var(--b3)' }} />
      <div style={{ ...styles.bracket, bottom: 40, right: 40, borderRight: '1px solid var(--b3)', borderBottom: '1px solid var(--b3)' }} />

      {/* Grid Scan Pattern overlay */}
      <div style={styles.gridOverlay} />

      {/* Center Hero Area */}
      <div style={styles.heroSection}>
        <div style={styles.badgeRow}>
          <LivePulse color="var(--gold)" size={6} />
          <span style={styles.securityTag}>SECURE TELEMETRY LINK</span>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
        }}>
          <img 
            src="/logo.png" 
            alt="AEGIS Logo" 
            style={{
              height: 125,
              width: 'auto',
              filter: 'invert(1) contrast(1.15) brightness(1.3)',
              mixBlendMode: 'screen',
            }}
          />
        </div>
        
        <p style={{ ...styles.subtitle, marginTop: 4 }}>
          AUTONOMOUS EARTH-ORBIT GUARDIAN & INTELLIGENCE SYSTEM
        </p>

        <div style={styles.divider} />

        <p style={styles.briefStatement}>
          Scanning space regimes for catastrophic conjunction events, kinetic fragmentation debris, and active collision avoidance parameters.
        </p>

        {/* Enter CTA */}
        {systemLoadState < 100 ? (
          <div style={styles.loadingBarContainer}>
            <div style={styles.loadingLabel}>INITIALIZING SENTINEL SWEEP... {Math.min(systemLoadState, 100)}%</div>
            <div style={styles.loadingBarTrack}>
              <div style={{ ...styles.loadingBarFill, width: `${Math.min(systemLoadState, 100)}%` }} />
            </div>
          </div>
        ) : (
          <button
            onClick={handleEnterSystem}
            style={styles.enterButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--gold)';
              e.currentTarget.style.color = '#000';
              e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 194, 0, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--gold)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            CONNECT INTEL SECURE DECK
          </button>
        )}
      </div>

      {/* Footer telemetry HUD */}
      <div style={styles.footerHud}>
        <div style={styles.hudItem}>
          <div style={styles.hudLabel}>SWEEP SENSORS</div>
          <div style={styles.hudValue}>SENTINEL ACTIVE</div>
        </div>
        <div style={styles.hudItem}>
          <div style={styles.hudLabel}>CATALOGUED OBJECTS</div>
          <div style={styles.hudValue}>{formatNumber(stats.totalTracked || 28441)}</div>
        </div>
        <div style={styles.hudItem}>
          <div style={styles.hudLabel}>DEFCON ASSESSMENT</div>
          <div style={{ ...styles.hudValue, color: 'var(--red)' }}>CRITICAL RISK DETECTED</div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    inset: 0,
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'radial-gradient(circle at center, rgba(6, 5, 10, 0.4) 0%, rgba(6, 5, 10, 0.85) 60%, rgba(6, 5, 10, 0.98) 100%)',
    transition: 'opacity 1000ms cubic-bezier(0.22, 1, 0.36, 1), transform 1200ms cubic-bezier(0.22, 1, 0.36, 1)',
    color: 'var(--t0)',
    padding: '0 24px',
    overflow: 'hidden',
  },
  gridOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(255, 194, 0, 0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 194, 0, 0.02) 1px, transparent 1px)
    `,
    backgroundSize: '40px 40px',
    backgroundPosition: 'center',
    pointerEvents: 'none',
  },
  bracket: {
    position: 'absolute',
    width: 20,
    height: 20,
    pointerEvents: 'none',
  },
  heroSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    maxWidth: 600,
    zIndex: 20,
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    border: '0.5px solid var(--b1)',
    padding: '4px 10px',
    borderRadius: 2,
    background: 'rgba(8,6,1,0.6)',
    marginBottom: 20,
  },
  securityTag: {
    fontFamily: "'Source Code Pro', monospace",
    fontSize: 9,
    letterSpacing: '0.12em',
    color: 'var(--t1)',
  },
  mainTitle: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: 96,
    fontWeight: 700,
    color: 'var(--gold)',
    letterSpacing: '0.24em',
    paddingLeft: '0.24em', // offset right tracking
    lineHeight: 1,
    marginBottom: 8,
    textShadow: '0 0 30px rgba(255, 194, 0, 0.1)',
  },
  subtitle: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--t1)',
    letterSpacing: '0.28em',
    marginBottom: 32,
  },
  divider: {
    width: 80,
    height: 1,
    background: 'var(--b3)',
    marginBottom: 32,
  },
  briefStatement: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: 15,
    fontWeight: 400,
    color: 'var(--t1)',
    lineHeight: 1.6,
    marginBottom: 48,
    maxWidth: 460,
  },
  enterButton: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.15em',
    color: 'var(--gold)',
    border: '1px solid var(--gold)',
    background: 'transparent',
    padding: '14px 32px',
    borderRadius: 2,
    cursor: 'pointer',
    transition: 'all 280ms cubic-bezier(0.22, 1, 0.36, 1)',
    outline: 'none',
  },
  loadingBarContainer: {
    width: 240,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  loadingLabel: {
    fontFamily: "'Source Code Pro', monospace",
    fontSize: 9,
    color: 'var(--t2)',
    letterSpacing: '0.08em',
  },
  loadingBarTrack: {
    width: '100%',
    height: 3,
    background: 'var(--bg-3)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  loadingBarFill: {
    height: '100%',
    background: 'var(--gold)',
    transition: 'width 100ms ease',
  },
  footerHud: {
    position: 'absolute',
    bottom: 40,
    display: 'flex',
    justifyContent: 'center',
    gap: 48,
    width: '100%',
    maxWidth: 800,
    borderTop: '0.5px solid var(--b0)',
    paddingTop: 24,
    zIndex: 20,
  },
  hudItem: {
    textAlign: 'center',
  },
  hudLabel: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: 10,
    fontWeight: 500,
    color: 'var(--t2)',
    letterSpacing: '0.08em',
    marginBottom: 4,
  },
  hudValue: {
    fontFamily: "'Source Code Pro', monospace",
    fontSize: 11,
    color: 'var(--t0)',
    fontWeight: 400,
  },
};
