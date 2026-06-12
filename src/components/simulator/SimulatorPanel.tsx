'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAegis } from '@/context/AegisContext';
import { HISTORICAL_EVENTS, HistoricalEvent } from '@/lib/historical-data';
import { formatPc, getCountdown, defconHex } from '@/lib/utils';
import DefconStamp from '@/components/threats/DefconStamp';
import AgentTag from '@/components/primitives/AgentTag';
import { sfx } from '@/lib/sfx';

export default function SimulatorPanel() {
  const {
    objects,
    conjunctions,
    simulationDate,
    setSimulationDate,
    activeEvent,
    setActiveEvent,
    isPlaying,
    setIsPlaying,
    simulationSpeed,
    setSimulationSpeed,
    setSelectedObjectId
  } = useAegis();

  const [liveDurationHrs, setLiveDurationHrs] = useState<24 | 48 | 72>(24);
  const [sliderVal, setSliderVal] = useState(0); // 0 to 100 percentage
  const isSliderInteracting = useRef(false);

  // Initialize/Reset simulation date when changing events
  useEffect(() => {
    setIsPlaying(false);
    if (activeEvent === 'LIVE') {
      setSimulationDate(null);
      setSliderVal(0);
    } else {
      const event = HISTORICAL_EVENTS.find(e => e.id === activeEvent);
      if (event) {
        // Start 15 minutes before TCA to watch the approach
        const start = new Date(event.tca.getTime() - 15 * 60 * 1000);
        setSimulationDate(start);
        setSliderVal(25); // 15 mins is 25% of the 1-hour window (TCA is at 50% / 30 mins)
      }
    }
    setSelectedObjectId(null);
  }, [activeEvent, setSimulationDate, setSelectedObjectId, setIsPlaying]);

  // Determine current timeline bounds
  const bounds = useMemo(() => {
    if (activeEvent === 'LIVE') {
      const start = new Date();
      const end = new Date(start.getTime() + liveDurationHrs * 60 * 60 * 1000);
      return { start, end, durationMs: liveDurationHrs * 60 * 60 * 1000 };
    } else {
      const event = HISTORICAL_EVENTS.find(e => e.id === activeEvent);
      if (event) {
        // Range: TCA - 30 minutes to TCA + 30 minutes
        const start = new Date(event.tca.getTime() - 30 * 60 * 1000);
        const end = new Date(event.tca.getTime() + 30 * 60 * 1000);
        return { start, end, durationMs: 60 * 60 * 1000 };
      }
    }
    const now = new Date();
    return { start: now, end: now, durationMs: 0 };
  }, [activeEvent, liveDurationHrs]);

  // Update slider position based on simulation clock
  useEffect(() => {
    if (isSliderInteracting.current || !simulationDate) return;
    const elapsed = simulationDate.getTime() - bounds.start.getTime();
    const pct = Math.max(0, Math.min(100, (elapsed / bounds.durationMs) * 100));
    setSliderVal(pct);
  }, [simulationDate, bounds]);

  // Handle slider scrub changes
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isSliderInteracting.current = true;
    const val = parseFloat(e.target.value);
    setSliderVal(val);
    
    const targetMs = bounds.start.getTime() + (val / 100) * bounds.durationMs;
    setSimulationDate(new Date(targetMs));
  };

  const handleSliderRelease = () => {
    isSliderInteracting.current = false;
  };

  // Skip to specific checkpoints
  const jumpToTca = () => {
    if (activeEvent === 'LIVE') {
      // Find closest conjunction TCA
      if (conjunctions.length > 0) {
        const sortedConjs = [...conjunctions].sort(
          (a, b) => new Date(a.tca).getTime() - new Date(b.tca).getTime()
        );
        setSimulationDate(new Date(sortedConjs[0].tca));
      }
    } else {
      const event = HISTORICAL_EVENTS.find(e => e.id === activeEvent);
      if (event) {
        setSimulationDate(event.tca);
      }
    }
  };

  const resetTime = () => {
    setIsPlaying(false);
    if (activeEvent === 'LIVE') {
      setSimulationDate(null);
      setSliderVal(0);
    } else {
      const event = HISTORICAL_EVENTS.find(e => e.id === activeEvent);
      if (event) {
        const start = new Date(event.tca.getTime() - 15 * 60 * 1000);
        setSimulationDate(start);
      }
    }
  };

  // Get current active event info
  const currEvent = HISTORICAL_EVENTS.find(e => e.id === activeEvent);

  const timeString = useMemo(() => {
    const d = simulationDate || new Date();
    return d.toUTCString().replace('GMT', 'UTC');
  }, [simulationDate]);

  // Compute countdown to TCA
  const countdownToTca = useMemo(() => {
    const current = simulationDate || new Date();
    if (activeEvent === 'LIVE') {
      if (conjunctions.length === 0) return 'NO ACTIVE TARGETS';
      const sortedConjs = [...conjunctions].sort(
        (a, b) => new Date(a.tca).getTime() - new Date(b.tca).getTime()
      );
      const diff = new Date(sortedConjs[0].tca).getTime() - current.getTime();
      return formatCountdown(diff);
    } else if (currEvent) {
      const diff = currEvent.tca.getTime() - current.getTime();
      return formatCountdown(diff);
    }
    return '--:--:--';
  }, [simulationDate, activeEvent, conjunctions, currEvent]);

  // Format countdown string
  function formatCountdown(diffMs: number): string {
    const isPast = diffMs < 0;
    const abs = Math.abs(diffMs);
    const h = Math.floor(abs / 3600000);
    const m = Math.floor((abs % 3600000) / 60000);
    const s = Math.floor((abs % 60000) / 1000);
    const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return isPast ? `T+ ${time} (POST-IMPACT)` : `T- ${time}`;
  }

  // Check if collision state is active
  const isImpact = useMemo(() => {
    if (activeEvent === 'LIVE' || !currEvent) return false;
    const current = simulationDate || new Date();
    return current.getTime() >= currEvent.tca.getTime();
  }, [simulationDate, activeEvent, currEvent]);

  // Play alert sound when impact occurs
  useEffect(() => {
    if (isImpact && isPlaying) {
      sfx.playAlert();
    }
  }, [isImpact, isPlaying]);

  const activeConjunction = conjunctions[0] || null;

  return (
    <>
      {/* Left panel: Simulator Mode Selector & play controls */}
      <div style={styles.leftPanel} className="shimmer-hover">
        <div style={styles.header}>
          <span style={styles.headerSquare} />
          <span style={styles.headerTitle}>TIME MACHINE DECK</span>
        </div>

        <div style={styles.paddedContent}>
          <span style={styles.label}>CHOOSE TEMPORAL REGIME</span>
          
          {/* Mode list */}
          <div style={styles.modeList}>
            <button
              onClick={() => { setActiveEvent('LIVE'); sfx.playClick(); }}
              onMouseEnter={() => { if (activeEvent !== 'LIVE') sfx.playTick(); }}
              style={{
                ...styles.modeBtn,
                borderColor: activeEvent === 'LIVE' ? 'var(--gold)' : 'var(--b1)',
                background: activeEvent === 'LIVE' ? 'rgba(255,194,0,0.04)' : 'transparent',
              }}
            >
              <span style={activeEvent === 'LIVE' ? { color: 'var(--gold)' } : {}}>LIVE FEED PROJECTIONS</span>
              <span style={styles.modeDesc}>SGP4 telemetry forecasting</span>
            </button>

            {HISTORICAL_EVENTS.map(event => (
              <button
                key={event.id}
                onClick={() => { setActiveEvent(event.id as any); sfx.playClick(); }}
                onMouseEnter={() => { if (activeEvent !== event.id) sfx.playTick(); }}
                style={{
                  ...styles.modeBtn,
                  borderColor: activeEvent === event.id ? 'var(--gold)' : 'var(--b1)',
                  background: activeEvent === event.id ? 'rgba(255,194,0,0.04)' : 'transparent',
                }}
              >
                <span style={activeEvent === event.id ? { color: 'var(--gold)' } : {}}>{event.name}</span>
                <span style={styles.modeDesc}>{event.dateStr}</span>
              </button>
            ))}
          </div>

          <div style={styles.divider} />

          {/* Preset projection periods (Only for Live) */}
          {activeEvent === 'LIVE' && (
            <div style={styles.section}>
              <span style={styles.label}>PROJECTION DURATION</span>
              <div style={styles.presetGroup}>
                {([24, 48, 72] as const).map(hrs => (
                  <button
                    key={hrs}
                    onClick={() => {
                      setLiveDurationHrs(hrs);
                      setSimulationDate(null);
                      setSliderVal(0);
                      sfx.playClick();
                    }}
                    onMouseEnter={() => { if (liveDurationHrs !== hrs) sfx.playTick(); }}
                    style={{
                      ...styles.presetBtn,
                      color: liveDurationHrs === hrs ? 'var(--gold)' : 'var(--t2)',
                      borderColor: liveDurationHrs === hrs ? 'var(--gold)' : 'var(--b1)',
                    }}
                  >
                    {hrs} HOURS
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Time speed multiplier */}
          <div style={styles.section}>
            <span style={styles.label}>PROPAGATION SPEED MULTIPLIER</span>
            <div style={styles.speedDials}>
              {[
                { label: 'REALTIME', val: 1 },
                { label: '60x (1m/s)', val: 60 },
                { label: '300x (5m/s)', val: 300 },
                { label: '1800x (30m/s)', val: 1800 },
                { label: '3600x (1h/s)', val: 3600 },
              ].map(d => (
                <button
                  key={d.val}
                  onClick={() => { setSimulationSpeed(d.val); sfx.playClick(); }}
                  onMouseEnter={() => { if (simulationSpeed !== d.val) sfx.playTick(); }}
                  style={{
                    ...styles.speedBtn,
                    borderColor: simulationSpeed === d.val ? 'var(--gold)' : 'var(--b1)',
                    color: simulationSpeed === d.val ? 'var(--gold)' : 'var(--t2)',
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right panel: Simulator Status HUD & Briefing */}
      <div style={styles.rightPanel} className="shimmer-hover">
        {/* Playback status block */}
        <div style={styles.document}>
          <div style={styles.docHeader}>
            <div style={styles.headerLine} />
            <div style={styles.headerTitle}>SIMULATION SECURE NODE</div>
            <div style={styles.headerSub}>CLOCK: {timeString}</div>
            <div style={styles.headerLine} />
          </div>

          {/* TCA Countdown timer HUD */}
          <div 
            className={isImpact ? 'hazard-glow' : ''}
            style={{
              ...styles.countdownBanner,
              borderColor: isImpact ? 'var(--red)' : 'var(--b3)',
              background: isImpact ? 'rgba(255, 48, 48, 0.05)' : 'rgba(255, 194, 0, 0.02)'
            }}
          >
            <span style={styles.countdownLabel}>
              {activeEvent === 'LIVE' ? 'NEXT CLOSE APPROACH COUNTDOWN' : 'TIME TO TCA'}
            </span>
            <span style={{
              ...styles.countdownValue,
              color: isImpact ? 'var(--red)' : 'var(--gold)'
            }}>
              {countdownToTca}
            </span>
            {isImpact && (
              <span style={styles.impactFlash}>
                🚨 ORBIT SHATTERED — FRAGMENT CLOUD PROPAGATING
              </span>
            )}
          </div>

          {/* Event description / parameters */}
          {activeEvent === 'LIVE' ? (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>LIVE CHRONOLOGY STATUS</div>
              <div style={styles.sectionRule} />
              <p style={styles.descText}>
                Propagating active satellite orbits using two-line elements (TLEs). Drag the temporal slider below to calculate future close proximity paths and forecast satellite collision alerts over the next 24 to 72 hours.
              </p>
            </div>
          ) : (
            currEvent && (
              <div style={styles.section}>
                <div style={styles.sectionTitle}>HISTORICAL SEQUENCE DOSSIER</div>
                <div style={styles.sectionRule} />
                <p style={styles.descText}>{currEvent.description}</p>
                <div style={styles.telemetryTable}>
                  <div style={styles.telemetryRow}>
                    <span style={styles.telemetryLabel}>LOCATION</span>
                    <span style={styles.telemetryVal}>{currEvent.locationInfo}</span>
                  </div>
                  <div style={styles.telemetryRow}>
                    <span style={styles.telemetryLabel}>MISS DISTANCE</span>
                    <span style={{ ...styles.telemetryVal, color: 'var(--red)' }}>
                      {currEvent.minDistanceM} meters
                    </span>
                  </div>
                  <div style={styles.telemetryRow}>
                    <span style={styles.telemetryLabel}>INTERSECT SPEED</span>
                    <span style={styles.telemetryVal}>{currEvent.velocityKms} km/s</span>
                  </div>
                </div>
              </div>
            )
          )}

          {/* Agent log overrides for historical events */}
          {activeEvent !== 'LIVE' && activeConjunction && (
            <div style={styles.section}>
              <div style={styles.sectionTitle}>AEGIS RETROSPECTIVE INTELLIGENCE</div>
              <div style={styles.sectionRule} />
              <div style={styles.logsContainer}>
                {activeConjunction.assessments.map((log, index) => (
                  <div key={index} style={styles.logCard}>
                    <div style={styles.logHeader}>
                      <AgentTag agent={log.agent} size={7} />
                      <span style={styles.logTime}>{log.agent} COMM LOG</span>
                    </div>
                    <p style={styles.logText}>&ldquo;{log.text}&rdquo;</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Controls overlay */}
          <div style={styles.actionControls}>
            <button
              onClick={() => { setIsPlaying(!isPlaying); sfx.playClick(); }}
              onMouseEnter={() => sfx.playTick()}
              style={{
                ...styles.actionBtn,
                background: isPlaying ? 'var(--red)' : 'var(--gold)',
                color: '#000',
              }}
            >
              {isPlaying ? 'PAUSE CLOCK' : 'PLAY SIMULATOR'}
            </button>
            <button 
              onClick={() => { resetTime(); sfx.playClick(); }}
              onMouseEnter={() => sfx.playTick()}
              style={styles.actionBtnSec}
            >
              RESET CLOCK
            </button>
            <button 
              onClick={() => { jumpToTca(); sfx.playClick(); }}
              onMouseEnter={() => sfx.playTick()}
              style={styles.actionBtnSec}
            >
              {activeEvent === 'LIVE' ? 'JUMP TO FIRST APPROACH' : 'JUMP TO TCA'}
            </button>
          </div>
        </div>
      </div>

      {/* Scrub time slider placed globally across the bottom deck */}
      <div style={styles.bottomSliderWrap}>
        <div style={styles.sliderFlex}>
          <span style={styles.sliderTimeLabel}>
            {bounds.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <input
            type="range"
            min="0"
            max="100"
            step="0.01"
            value={sliderVal}
            onChange={(e) => {
              handleSliderChange(e);
              if (Math.random() < 0.15) sfx.playTick();
            }}
            onMouseUp={handleSliderRelease}
            onTouchEnd={handleSliderRelease}
            style={styles.slider}
          />
          <span style={styles.sliderTimeLabel}>
            {bounds.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  leftPanel: {
    width: 320,
    position: 'fixed',
    left: 0,
    top: 40,
    bottom: 80, // space for bottom slider
    background: 'rgba(6, 5, 10, 0.91)',
    backdropFilter: 'blur(16px) saturate(110%)',
    WebkitBackdropFilter: 'blur(16px) saturate(110%)',
    borderRight: '1px solid rgba(255, 194, 0, 0.09)',
    zIndex: 30,
    animation: 'fade-in-up 280ms cubic-bezier(0.22, 1, 0.36, 1)',
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  rightPanel: {
    width: 440,
    position: 'fixed',
    right: 0,
    top: 40,
    bottom: 80, // space for bottom slider
    background: 'rgba(6, 5, 10, 0.91)',
    backdropFilter: 'blur(16px) saturate(110%)',
    WebkitBackdropFilter: 'blur(16px) saturate(110%)',
    borderLeft: '1px solid rgba(255, 194, 0, 0.09)',
    zIndex: 30,
    animation: 'slide-in-right 280ms cubic-bezier(0.22, 1, 0.36, 1)',
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  header: {
    height: 48,
    borderBottom: '0.5px solid var(--b0)',
    display: 'flex',
    alignItems: 'center',
    padding: '0 20px',
    gap: 8,
  },
  headerSquare: {
    width: 8,
    height: 8,
    background: 'var(--gold)',
    borderRadius: 1,
  },
  headerTitle: {
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 700,
    fontSize: 12,
    color: 'var(--gold)',
    letterSpacing: '0.08em',
  },
  paddedContent: {
    padding: 20,
  },
  label: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--t2)',
    letterSpacing: '0.1em',
    marginBottom: 8,
    display: 'block',
  },
  modeList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 20,
  },
  modeBtn: {
    width: '100%',
    textAlign: 'left',
    padding: '12px 14px',
    border: '0.5px solid var(--b1)',
    borderRadius: 2,
    background: 'transparent',
    cursor: 'pointer',
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 600,
    fontSize: 12,
    color: 'var(--t1)',
    transition: 'all 200ms ease',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  modeDesc: {
    fontFamily: "'Source Code Pro', monospace",
    fontSize: 8,
    color: 'var(--t3)',
    fontWeight: 400,
  },
  divider: {
    height: 0.5,
    background: 'var(--b1)',
    margin: '20px 0',
  },
  section: {
    marginBottom: 20,
  },
  presetGroup: {
    display: 'flex',
    gap: 8,
  },
  presetBtn: {
    flex: 1,
    padding: '8px 0',
    background: 'transparent',
    border: '0.5px solid var(--b1)',
    borderRadius: 2,
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: 10,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 200ms ease',
  },
  speedDials: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 6,
  },
  speedBtn: {
    padding: '6px 4px',
    background: 'transparent',
    border: '0.5px solid var(--b1)',
    borderRadius: 2,
    fontFamily: "'Source Code Pro', monospace",
    fontSize: 9,
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 200ms ease',
  },
  document: {
    padding: 20,
  },
  docHeader: {
    textAlign: 'center',
    marginBottom: 20,
  },
  headerLine: {
    height: 1,
    background: 'var(--b2)',
    margin: '8px 0',
  },
  headerSub: {
    fontFamily: "'Source Code Pro', monospace",
    fontSize: 10,
    color: 'var(--t2)',
  },
  countdownBanner: {
    border: '1px solid',
    padding: '12px 16px',
    borderRadius: 2,
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    marginBottom: 24,
  },
  countdownLabel: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--t2)',
    letterSpacing: '0.08em',
  },
  countdownValue: {
    fontFamily: "'Source Code Pro', monospace",
    fontSize: 20,
    fontWeight: 700,
  },
  impactFlash: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--red)',
    marginTop: 4,
    animation: 'live-pulse 1s ease-in-out infinite',
  },
  sectionTitle: {
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 700,
    fontSize: 10,
    letterSpacing: '0.12em',
    color: 'var(--t2)',
    marginBottom: 4,
  },
  sectionRule: {
    height: 0.5,
    background: 'var(--b1)',
    marginBottom: 10,
  },
  descText: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: 13,
    color: 'var(--t1)',
    lineHeight: 1.5,
    marginBottom: 14,
  },
  telemetryTable: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    background: 'rgba(255,255,255,0.01)',
    border: '0.5px solid var(--b0)',
    padding: 10,
    borderRadius: 2,
  },
  telemetryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: 11,
  },
  telemetryLabel: {
    color: 'var(--t2)',
  },
  telemetryVal: {
    color: 'var(--t0)',
    fontWeight: 600,
  },
  logsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    maxHeight: 220,
    overflowY: 'auto',
    paddingRight: 4,
  },
  logCard: {
    background: 'rgba(255,255,255,0.02)',
    border: '0.5px solid var(--b0)',
    padding: 10,
    borderRadius: 2,
  },
  logHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  logTime: {
    fontFamily: "'Source Code Pro', monospace",
    fontSize: 8,
    color: 'var(--t3)',
  },
  logText: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: 12,
    color: 'var(--t1)',
    lineHeight: 1.4,
  },
  actionControls: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginTop: 24,
  },
  actionBtn: {
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 700,
    fontSize: 12,
    letterSpacing: '0.08em',
    border: 'none',
    borderRadius: 2,
    padding: '10px 0',
    cursor: 'pointer',
    transition: 'all 200ms ease',
  },
  actionBtnSec: {
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 600,
    fontSize: 11,
    background: 'transparent',
    border: '0.5px solid var(--b1)',
    borderRadius: 2,
    padding: '8px 0',
    color: 'var(--t2)',
    cursor: 'pointer',
    transition: 'all 200ms ease',
  },
  bottomSliderWrap: {
    position: 'fixed',
    bottom: 28,
    left: 0,
    right: 0,
    height: 52,
    background: 'rgba(6, 5, 10, 0.91)',
    backdropFilter: 'blur(16px) saturate(110%)',
    WebkitBackdropFilter: 'blur(16px) saturate(110%)',
    borderTop: '1px solid rgba(255, 194, 0, 0.09)',
    zIndex: 40,
    display: 'flex',
    alignItems: 'center',
    padding: '0 40px',
  },
  sliderFlex: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  sliderTimeLabel: {
    fontFamily: "'Source Code Pro', monospace",
    fontSize: 10,
    color: 'var(--t2)',
    width: 80,
    textAlign: 'center',
  },
  slider: {
    flex: 1,
    cursor: 'ew-resize',
    accentColor: 'var(--gold)',
  },
};
