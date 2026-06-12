'use client';

import React, { useState, useEffect } from 'react';
import { useAegis } from '@/context/AegisContext';
import { usePathname } from 'next/navigation';
import { orbitalVelocity } from '@/lib/orbital-utils';

export default function FloatingDetailPanel() {
  const pathname = usePathname();
  const { selectedObjectId, setSelectedObjectId, objects } = useAegis();
  const [tleExpanded, setTleExpanded] = useState(false);

  // Close panel on route changes
  useEffect(() => {
    setSelectedObjectId(null);
  }, [pathname, setSelectedObjectId]);

  // If on objects page, the bottom drawer already manages the detail view
  if (pathname === '/objects' || !selectedObjectId) return null;

  const obj = objects.find((o) => o.id === selectedObjectId);
  if (!obj) return null;

  const velocity = orbitalVelocity(obj.altitude);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.titleWrap}>
          <span style={styles.subtitle}>ORBITAL OBJECT DOSSIER</span>
          <span style={styles.title}>{obj.name}</span>
        </div>
        <button
          onClick={() => setSelectedObjectId(null)}
          style={styles.closeBtn}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--t2)'; }}
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div style={styles.body} className="scrollable">
        <div style={styles.sectionTitle}>TECTONIC REGIME PARAMETERS</div>
        <div style={styles.grid}>
          <DetailRow label="NORAD ID" value={String(obj.noradId)} mono />
          <DetailRow label="STATUS" value={obj.status} highlight={obj.status === 'ACTIVE'} />
          <DetailRow label="REGIME TYPE" value={obj.type} />
          <DetailRow label="COUNTRY" value={obj.countryFull || obj.country} />
          <DetailRow label="LAUNCH DATE" value={obj.launched} />
          <DetailRow label="ALTITUDE" value={`${obj.altitude.toFixed(1)} km`} mono />
          <DetailRow label="VELOCITY" value={`${velocity.toFixed(3)} km/s`} mono highlight />
          <DetailRow label="INCLINATION" value={`${obj.inclination.toFixed(2)}°`} mono />
          <DetailRow label="ORBITAL PERIOD" value={`${obj.period.toFixed(2)} min`} mono />
        </div>

        {/* Risk Assessment */}
        <div style={styles.riskCard}>
          <div style={styles.riskHeader}>
            <span style={styles.riskTitle}>RISK INDEX</span>
            <span style={{
              fontFamily: "'Source Code Pro', monospace",
              fontWeight: 700,
              fontSize: 16,
              color: obj.riskScore >= 80 ? 'var(--red)' : obj.riskScore >= 50 ? 'var(--orange)' : 'var(--green)'
            }}>
              {obj.riskScore}/100
            </span>
          </div>
          <div style={styles.riskBarTrack}>
            <div style={{
              ...styles.riskBarFill,
              width: `${obj.riskScore}%`,
              background: obj.riskScore >= 80 ? 'var(--red)' : obj.riskScore >= 50 ? 'var(--orange)' : 'var(--green)'
            }} />
          </div>
        </div>

        {/* Collapsible TLE */}
        {obj.tle1 && (
          <div style={styles.tleWrap}>
            <button
              onClick={() => setTleExpanded(!tleExpanded)}
              style={styles.tleHeader}
            >
              <span>{tleExpanded ? '−' : '+'}</span> RAW TLE MATRIX
            </button>
            {tleExpanded && (
              <pre style={styles.tlePre}>
                {obj.tle1}
                {'\n'}
                {obj.tle2}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
  highlight = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div style={styles.row}>
      <span style={styles.rowLabel}>{label}</span>
      <span style={{
        ...styles.rowVal,
        fontFamily: mono ? "'Source Code Pro', monospace" : "'Rajdhani', sans-serif",
        color: highlight ? 'var(--gold)' : 'var(--t0)',
        fontWeight: mono ? 400 : 600,
      }}>
        {value}
      </span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    right: 20,
    top: 60,
    bottom: 48,
    width: 320,
    background: 'rgba(6, 5, 10, 0.91)',
    backdropFilter: 'blur(16px) saturate(110%)',
    WebkitBackdropFilter: 'blur(16px) saturate(110%)',
    border: '1px solid rgba(255, 194, 0, 0.09)',
    borderRadius: 4,
    boxShadow: 'none',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    animation: 'slide-in-right 280ms cubic-bezier(0.22, 1, 0.36, 1)',
  },
  header: {
    padding: '16px 20px',
    borderBottom: '0.5px solid var(--b0)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  subtitle: {
    fontFamily: "'Source Code Pro', monospace",
    fontSize: 9,
    letterSpacing: '0.12em',
    color: 'var(--t2)',
  },
  title: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--gold)',
    letterSpacing: '0.04em',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--t2)',
    fontSize: 24,
    lineHeight: 1,
    cursor: 'pointer',
    padding: 0,
    marginTop: -4,
    transition: 'color var(--ms-0)',
  },
  body: {
    flex: 1,
    padding: 20,
    overflowY: 'auto',
  },
  sectionTitle: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--t2)',
    letterSpacing: '0.1em',
    marginBottom: 10,
    borderBottom: '0.5px solid var(--b0)',
    paddingBottom: 4,
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    marginBottom: 20,
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 0',
  },
  rowLabel: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: 11,
    fontWeight: 500,
    color: 'var(--t2)',
  },
  rowVal: {
    fontSize: 13,
  },
  riskCard: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '0.5px solid var(--b0)',
    padding: 12,
    borderRadius: 2,
    marginBottom: 20,
  },
  riskHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  riskTitle: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--t2)',
    letterSpacing: '0.04em',
  },
  riskBarTrack: {
    height: 3,
    background: 'var(--bg-3)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  riskBarFill: {
    height: '100%',
  },
  tleWrap: {
    marginTop: 10,
  },
  tleHeader: {
    background: 'none',
    border: 'none',
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--t2)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: 0,
    width: '100%',
    textAlign: 'left',
  },
  tlePre: {
    fontFamily: "'Source Code Pro', monospace",
    fontSize: 8,
    lineHeight: 1.4,
    background: 'var(--bg-1)',
    color: 'var(--t2)',
    padding: 8,
    borderRadius: 2,
    overflowX: 'auto',
    whiteSpace: 'pre',
    marginTop: 6,
    border: '0.5px solid var(--b0)',
  },
};
