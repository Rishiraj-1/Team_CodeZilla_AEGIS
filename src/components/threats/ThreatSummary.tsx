'use client';

import React from 'react';
import { Conjunction } from '@/types';
import DefconStamp from './DefconStamp';
import AgentTag from '@/components/primitives/AgentTag';
import { useAegis } from '@/context/AegisContext';

interface ThreatSummaryProps {
  conjunctions: Conjunction[];
}

export default function ThreatSummary({ conjunctions }: ThreatSummaryProps) {
  const { stats } = useAegis();
  
  // System DEFCON is the lowest level (highest severity) among active conjunctions
  const systemDefcon = conjunctions.length > 0 
    ? Math.min(...conjunctions.map(c => c.defcon)) as any
    : 5;

  return (
    <div style={styles.container} className="scrollable">
      {/* Header */}
      <div style={styles.document}>
        {/* DEFCON Stamp */}
        <DefconStamp level={systemDefcon} />

        <div style={styles.docHeader}>
          <div style={styles.headerLine} />
          <div style={styles.headerTitle}>AEGIS OVERWATCH OPERATIONS BRIEF</div>
          <div style={styles.headerSub}>SYSTEM ALERT LEVEL: DEFCON {systemDefcon}</div>
          <div style={styles.headerLine} />
        </div>

        {/* SECTION 1 — ORBITAL SECURITY POSTURE */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>SECTION 1 — SECURITY POSTURE</div>
          <div style={styles.sectionRule} />

          <div style={styles.briefingParagraph}>
            The Sentinel satellite detection array is currently monitoring <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{stats.totalTracked.toLocaleString()}</span> active space objects. 
            There are currently <span style={{ color: 'var(--red)', fontWeight: 600 }}>{conjunctions.length}</span> active conjunction tracks being propagated through the SGP4 orbital model.
          </div>

          {/* DEFCON Threat Board */}
          <div style={boardStyles.grid}>
            {([1, 2, 3, 4, 5] as const).map((lvl) => {
              const count = conjunctions.filter((c) => c.defcon === lvl).length;
              const isActive = count > 0;
              const isLvlCritical = lvl <= 2;
              
              let color = '#777777'; // nominal/inactive
              if (isActive) {
                if (lvl === 1 || lvl === 2) color = '#ff3030';
                else if (lvl === 3) color = '#ff6820';
                else if (lvl === 4) color = '#4488ff';
                else color = '#2ed87a';
              }
              
              return (
                <div
                  key={lvl}
                  style={{
                    ...boardStyles.card,
                    borderColor: isActive ? color : 'var(--b0)',
                    background: isActive ? `${color}08` : 'rgba(255,255,255,0.01)',
                    opacity: isActive ? 1 : 0.45,
                    animation: isLvlCritical && isActive ? 'defcon-flicker 1.8s ease-in-out infinite' : 'none'
                  }}
                >
                  <div style={{ ...boardStyles.levelNum, color }}>{lvl}</div>
                  <div style={boardStyles.levelLabel}>
                    {lvl === 1 ? 'MAXIMUM' : lvl === 2 ? 'CRITICAL' : lvl === 3 ? 'ELEVATED' : lvl === 4 ? 'GUARDED' : 'NOMINAL'}
                  </div>
                  <div style={{ ...boardStyles.count, color: isActive ? '#fff' : 'var(--t3)' }}>
                    {count} {count === 1 ? 'event' : 'events'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 2 — CO-INTELLIGENCE AGENT STATUS */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>SECTION 2 — AGENT CLUSTERS</div>
          <div style={styles.sectionRule} />

          <div style={styles.agentStatusRow}>
            <AgentTag agent="SENTINEL" />
            <div style={styles.agentInfo}>
              <div style={styles.agentAction}>SCANNING ORBITAL SECTORS</div>
              <div style={styles.agentSubtext}>Propagating TLE vectors and resolving proximity metrics.</div>
            </div>
          </div>

          <div style={styles.agentStatusRow}>
            <AgentTag agent="ANALYST" />
            <div style={styles.agentInfo}>
              <div style={styles.agentAction}>EVALUATING COLLISION PROBABILITY</div>
              <div style={styles.agentSubtext}>Running Foster-Estes covariances and covariance ellipsoid intersections.</div>
            </div>
          </div>

          <div style={styles.agentStatusRow}>
            <AgentTag agent="COMMANDER" />
            <div style={styles.agentInfo}>
              <div style={styles.agentAction}>PROPOSING DEFENSIVE MANEUVERS</div>
              <div style={styles.agentSubtext}>Calculating fuel consumption, delta-V burns, and window timing.</div>
            </div>
          </div>

          <div style={styles.agentStatusRow}>
            <AgentTag agent="HERALD" />
            <div style={styles.agentInfo}>
              <div style={styles.agentAction}>COMPILING SECURITY BULLETINS</div>
              <div style={styles.agentSubtext}>Drafting automated orbital hazard reports and alert dossiers.</div>
            </div>
          </div>
        </div>

        {/* SECTION 3 — PROTOCOL DIRECTIVE */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>SECTION 3 — WATCH OFFICER OPERATIONS DIRECTIVE</div>
          <div style={styles.sectionRule} />
          
          <div style={styles.briefingParagraph}>
            Select an orbital threat vector from the left sidebar to generate the full intelligence dossier, review individual agent reasonings, and initialize avoidance maneuver guidelines.
          </div>
          
          <div style={styles.protocolBox}>
            <div style={styles.protocolHeader}>AEGIS DIRECT PROTOCOL 4-B</div>
            <div style={styles.protocolItem}>1. Prioritize DEFCON 1 and 2 events with TCA under 6 hours.</div>
            <div style={styles.protocolItem}>2. Confirm burn directions and fuel costs before triggering.</div>
            <div style={styles.protocolItem}>3. Use the integrated Chat terminal for real-time query support.</div>
          </div>
        </div>

        <div style={styles.footerRule} />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '0 0 40px 0',
    overflowY: 'auto',
    height: '100%',
  },
  document: {
    padding: '20px',
    position: 'relative',
    background: 'var(--bg)',
  },
  docHeader: {
    textAlign: 'center',
    marginBottom: 32,
    paddingRight: 100, // space for DEFCON stamp
  },
  headerLine: {
    height: 1,
    background: 'var(--b2)',
    margin: '8px 0',
  },
  headerTitle: {
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: '0.14em',
    color: 'var(--t1)',
    margin: '12px 0 4px',
  },
  headerSub: {
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 500,
    fontSize: 10,
    letterSpacing: '0.12em',
    color: 'var(--t2)',
    marginBottom: 8,
  },
  section: {
    marginBottom: 28,
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
    marginBottom: 12,
  },
  briefingParagraph: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: 13,
    color: 'var(--t1)',
    lineHeight: 1.6,
    marginBottom: 16,
  },
  telemetryTable: {
    width: '100%',
    borderCollapse: 'collapse',
    fontFamily: "'Source Code Pro', monospace",
    fontSize: 11,
    marginTop: 12,
  },
  tableLabel: {
    padding: '6px 0',
    color: 'var(--t2)',
    textAlign: 'left',
    borderBottom: '0.5px solid var(--b0)',
  },
  tableVal: {
    padding: '6px 0',
    textAlign: 'right',
    fontWeight: 500,
    borderBottom: '0.5px solid var(--b0)',
  },
  agentStatusRow: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  agentInfo: {
    flex: 1,
  },
  agentAction: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--t0)',
    marginBottom: 2,
  },
  agentSubtext: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: 11,
    color: 'var(--t2)',
    lineHeight: 1.3,
  },
  protocolBox: {
    border: '0.5px solid var(--b3)',
    background: 'rgba(255, 194, 0, 0.02)',
    padding: '12px 14px',
    marginTop: 12,
    borderRadius: 2,
  },
  protocolHeader: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--gold)',
    letterSpacing: '0.08em',
    marginBottom: 8,
  },
  protocolItem: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: 11,
    color: 'var(--t1)',
    lineHeight: 1.4,
    marginBottom: 4,
  },
  footerRule: {
    height: 1,
    background: 'var(--b2)',
    marginTop: 20,
  },
};

const boardStyles: Record<string, React.CSSProperties> = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  card: {
    border: '0.5px solid',
    borderRadius: 2,
    padding: '12px 4px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    transition: 'all 200ms ease',
  },
  levelNum: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 1,
    marginBottom: 4,
  },
  levelLabel: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: 8,
    fontWeight: 700,
    color: 'var(--t2)',
    letterSpacing: '0.04em',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  count: {
    fontFamily: "'Source Code Pro', monospace",
    fontSize: 9,
    fontWeight: 400,
  },
};
