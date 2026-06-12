'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import GlobeCanvas from '@/components/shell/GlobeCanvas';
import TopNav from '@/components/shell/TopNav';
import BottomTicker from '@/components/shell/BottomTicker';
import FloatingDetailPanel from '@/components/objects/FloatingDetailPanel';
import { useAegis } from '@/context/AegisContext';
import { BootSequence } from '@/components/shell/BootSequence';
import { useLiveCountdown } from '@/hooks/useLiveCountdown';

const TOUR_STEPS = [
  {
    title: "EARTH DEBRIS FIELD",
    text: "AEGIS monitors over 28,000 real catalogued space objects. These are loaded directly from CelesTrak and propagated using high-precision SGP4 physics modeling.",
    action: (ctx: any) => {
      ctx.router.push('/threats');
      ctx.setRegime('ALL');
      ctx.setSelectedObjectId(null);
      ctx.setSelectedConjunctionId(null);
    }
  },
  {
    title: "DEFCON ALERT DETECTED",
    text: "A close approach threat (DEFCON 2) has been automatically detected. AEGIS calculates the conjunction TCA (Time of Closest Approach) and propagates coordinates in real time.",
    action: (ctx: any) => {
      const threat = ctx.topThreat || ctx.conjunctions[0];
      if (threat) {
        ctx.setSelectedConjunctionId(threat.id);
        window.dispatchEvent(new CustomEvent('aegis-focus-threat', { detail: threat.id }));
      }
    }
  },
  {
    title: "AUTONOMOUS AGENT PIPELINE",
    text: "Four specialized AI Agents process the threat immediately: SENTINEL flags it, ANALYST calculates probability, COMMANDER plans avoidance maneuvers, and HERALD generates the briefing.",
    action: (ctx: any) => {
      // Keep selection active
    }
  },
  {
    title: "AEGIS CO-PILOT CHAT",
    text: "You can ask the AEGIS Intelligence co-pilot anything about orbital safety, maneuvers, or Kessler syndrome. Try typing a command or using quick starters.",
    action: (ctx: any) => {
      ctx.router.push('/chat');
    }
  }
];

interface GlobalShellProps {
  children: React.ReactNode;
}

export default function GlobalShell({ children }: GlobalShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { hasEntered, isTransitioning, conjunctions, setRegime, setSelectedObjectId, setSelectedConjunctionId } = useAegis();
  const [crtEnabled, setCrtEnabled] = useState(true);
  
  // Show boot sequence on first visit only (sessionStorage flag)
  const [booting, setBooting] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !sessionStorage.getItem('aegis-booted');
  });

  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState<number | null>(null);

  const handleBootComplete = () => {
    sessionStorage.setItem('aegis-booted', '1');
    setBooting(false);
  };

  useEffect(() => {
    if (!booting) {
      const tourCompleted = localStorage.getItem('aegis-tour-completed');
      if (!tourCompleted) {
        setShowTour(true);
      }
    }
  }, [booting]);

  const topThreat = useMemo(() => {
    if (!conjunctions || conjunctions.length === 0) return null;
    const active = conjunctions.filter(c => c.status !== 'RESOLVED');
    if (active.length === 0) return null;
    return [...active].sort((a, b) => {
      if (a.defcon !== b.defcon) return a.defcon - b.defcon;
      return b.collisionPc - a.collisionPc;
    })[0];
  }, [conjunctions]);

  const countdown = useLiveCountdown(topThreat ? topThreat.tca : '');

  const isLanding = pathname === '/';
  const showNavElements = !isLanding;

  useEffect(() => {
    // Read initial preference
    if (typeof window !== 'undefined') {
      const crt = localStorage.getItem('aegis-crt-enabled');
      setCrtEnabled(crt !== 'false');
    }

    const handleCrtToggle = (e: Event) => {
      setCrtEnabled((e as CustomEvent).detail);
    };

    window.addEventListener('aegis-crt-toggle', handleCrtToggle);
    return () => {
      window.removeEventListener('aegis-crt-toggle', handleCrtToggle);
    };
  }, []);

  // Globals — keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }
      if (e.key === '1') {
        router.push('/threats');
      } else if (e.key === '2') {
        router.push('/simulator');
      } else if (e.key === '3') {
        router.push('/analytics');
      } else if (e.key === '4') {
        router.push('/objects');
      } else if (e.key.toLowerCase() === 'k') {
        router.push('/chat');
      } else if (e.key === 'Escape') {
        setSelectedObjectId(null);
        setSelectedConjunctionId(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [router, setSelectedObjectId, setSelectedConjunctionId]);

  return (
    <>
      {booting && <BootSequence onComplete={handleBootComplete} />}

      {/* The 3D globe — mounted exactly once at the root layout level */}
      <GlobeCanvas />

      {/* Subtle Radar Sweep in Background (visible when entered dashboard) */}
      {showNavElements && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}>
          <div className="radar-sweep-line" />
        </div>
      )}

      {/* CRT Scanline Filter Overlays */}
      {crtEnabled && (
        <>
          <div className="crt-overlay" />
          <div className="crt-vignette" />
        </>
      )}

      {/* Top Nav — fades in when transitioning or in dashboard */}
      <div style={{
        opacity: showNavElements ? 1 : 0,
        pointerEvents: showNavElements ? 'auto' : 'none',
        transition: 'opacity 1200ms cubic-bezier(0.22, 1, 0.36, 1) 400ms',
        position: 'relative',
        zIndex: 50
      }}>
        <TopNav />
      </div>

      {showNavElements && topThreat && topThreat.defcon <= 2 && (
        <div
          style={{
            position: 'fixed',
            top: '52px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 40,
            cursor: 'pointer',
            background: 'rgba(6, 5, 10, 0.93)',
            border: '1px solid rgba(232, 53, 53, 0.35)',
            borderRadius: '3px',
            padding: '8px 20px',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
          onClick={() => router.push(`/threats?id=${topThreat.id}`)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Pulsing red dot */}
            <span
              className="pulse"
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--red)',
                flexShrink: 0,
              }}
            />
            {/* Alert text */}
            <span
              style={{
                fontFamily: "'Source Code Pro', monospace",
                fontSize: '11px',
                fontWeight: 'bold',
                color: 'var(--red)',
              }}
            >
              DEFCON {topThreat.defcon}
            </span>
            <span
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '11px',
                color: 'var(--t0)',
                fontWeight: 600,
              }}
            >
              {topThreat.primary.name} × {topThreat.secondary.name}
            </span>
            <span
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '11px',
                color: 'var(--t1)',
                marginLeft: '4px',
                marginRight: '4px',
              }}
            >
              —
            </span>
            <span
              style={{
                fontFamily: "'Source Code Pro', monospace",
                fontSize: '11px',
                fontWeight: 'bold',
                color: 'var(--gold)',
              }}
            >
              {countdown}
            </span>
            <span
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '11px',
                color: 'var(--t2)',
                marginLeft: '8px',
                letterSpacing: '0.05em',
              }}
            >
              ↗ VIEW BRIEF
            </span>
          </div>
        </div>
      )}

      {/* Floating details panel for clicked satellites */}
      <FloatingDetailPanel />

      {/* Main page content container */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        {children}
      </div>

      {/* Tour Button */}
      {showTour && (
        <button
          className="shimmer-hover"
          style={{
            position: 'fixed',
            bottom: '48px',
            right: '20px',
            zIndex: 45,
            fontFamily: "'Source Code Pro', monospace",
            fontSize: '11px',
            fontWeight: 'bold',
            color: 'var(--gold)',
            background: 'rgba(6, 5, 10, 0.93)',
            border: '1px solid rgba(255, 194, 0, 0.25)',
            borderRadius: '3px',
            padding: '8px 14px',
            boxShadow: '0 0 10px rgba(255, 194, 0, 0.05)',
            cursor: 'pointer',
          }}
          onClick={() => {
            setShowTour(false);
            setTourStep(0);
            TOUR_STEPS[0].action({
              router,
              setRegime,
              setSelectedObjectId,
              setSelectedConjunctionId,
              topThreat,
              conjunctions
            });
          }}
        >
          SHOW ME AEGIS →
        </button>
      )}

      {/* Tour Dialogue Card */}
      {tourStep !== null && (
        <div
          style={{
            position: 'fixed',
            bottom: '48px',
            right: '20px',
            width: '320px',
            background: 'rgba(6, 5, 10, 0.95)',
            border: '1px solid var(--gold)',
            borderRadius: '4px',
            padding: '16px 20px',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            zIndex: 9999,
            boxShadow: '0 0 20px rgba(255, 194, 0, 0.15)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontFamily: "'Source Code Pro', monospace", fontSize: '10px', color: 'var(--gold)', fontWeight: 'bold' }}>
              AEGIS SYSTEM TOUR ({tourStep + 1}/4)
            </span>
            <button
              onClick={() => {
                setTourStep(null);
                localStorage.setItem('aegis-tour-completed', '1');
              }}
              style={{ color: 'var(--t2)', fontSize: '16px', cursor: 'pointer' }}
            >
              ×
            </button>
          </div>
          <h3 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '16px', fontWeight: 700, color: 'var(--t0)', marginBottom: '6px' }}>
            {TOUR_STEPS[tourStep].title}
          </h3>
          <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '13px', color: 'var(--t1)', lineHeight: 1.5, marginBottom: '14px' }}>
            {TOUR_STEPS[tourStep].text}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => {
                setTourStep(null);
                localStorage.setItem('aegis-tour-completed', '1');
              }}
              style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '11px', color: 'var(--t2)', cursor: 'pointer' }}
            >
              SKIP TOUR
            </button>
            <button
              onClick={() => {
                const nextStep = tourStep + 1;
                if (nextStep < TOUR_STEPS.length) {
                  setTourStep(nextStep);
                  TOUR_STEPS[nextStep].action({
                    router,
                    setRegime,
                    setSelectedObjectId,
                    setSelectedConjunctionId,
                    topThreat,
                    conjunctions
                  });
                } else {
                  setTourStep(null);
                  localStorage.setItem('aegis-tour-completed', '1');
                }
              }}
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: '11px',
                fontWeight: 'bold',
                color: '#000',
                background: 'var(--gold)',
                border: 'none',
                borderRadius: '2px',
                padding: '6px 14px',
                cursor: 'pointer',
              }}
            >
              {tourStep === TOUR_STEPS.length - 1 ? 'FINISH' : 'NEXT STEP →'}
            </button>
          </div>
        </div>
      )}

      {/* Bottom Ticker — fades in when transitioning or in dashboard */}
      <div style={{
        opacity: showNavElements ? 1 : 0,
        pointerEvents: showNavElements ? 'auto' : 'none',
        transition: 'opacity 1200ms cubic-bezier(0.22, 1, 0.36, 1) 400ms',
        position: 'relative',
        zIndex: 50
      }}>
        <BottomTicker />
      </div>
    </>
  );
}
