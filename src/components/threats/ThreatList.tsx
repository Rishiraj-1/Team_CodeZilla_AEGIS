'use client';

import React, { useState, useEffect } from 'react';
import { Conjunction } from '@/types';
import { formatPc, getCountdown, defconHex } from '@/lib/utils';
import DefconBadge from '@/components/primitives/DefconBadge';
import { useAegis } from '@/context/AegisContext';

interface ThreatListProps {
  conjunctions: Conjunction[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function ThreatList({ conjunctions, selectedId, onSelect }: ThreatListProps) {
  const { simulationDate } = useAegis();
  const [countdowns, setCountdowns] = useState<Record<string, string>>({});
  const [newAlerts, setNewAlerts] = useState<Set<string>>(new Set());
  const prevIdsRef = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    const currentIds = new Set(conjunctions.map(c => c.id));
    const newIds = new Set<string>();
    
    currentIds.forEach(id => {
      if (prevIdsRef.current.size > 0 && !prevIdsRef.current.has(id)) {
        newIds.add(id);
      }
    });

    if (newIds.size > 0) {
      setNewAlerts(prev => {
        const next = new Set(prev);
        newIds.forEach(id => next.add(id));
        return next;
      });

      setTimeout(() => {
        setNewAlerts(prev => {
          const next = new Set(prev);
          newIds.forEach(id => next.delete(id));
          return next;
        });
      }, 3000);
    }

    prevIdsRef.current = currentIds;
  }, [conjunctions]);

  useEffect(() => {
    const update = () => {
      const map: Record<string, string> = {};
      const targetTime = simulationDate ? simulationDate.getTime() : Date.now();
      conjunctions.forEach((c) => {
        const diff = new Date(c.tca).getTime() - targetTime;
        if (diff <= 0) {
          map[c.id] = 'PASSED';
        } else {
          const hrs = Math.floor(diff / 3600000);
          const mins = Math.floor((diff % 3600000) / 60000);
          if (hrs > 0) {
            map[c.id] = `${hrs}h ${mins.toString().padStart(2, '0')}m`;
          } else {
            const secs = Math.floor((diff % 60000) / 1000);
            map[c.id] = `${mins}m ${secs.toString().padStart(2, '0')}s`;
          }
        }
      });
      setCountdowns(map);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [conjunctions, simulationDate]);

  // Sort by defcon level (most critical first)
  const sorted = [...conjunctions].sort((a, b) => a.defcon - b.defcon);

  return (
    <div>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.headerLabel}>ACTIVE CONJUNCTIONS</span>
        <span style={styles.headerCount}>{conjunctions.length}</span>
      </div>

      {/* List */}
      {conjunctions.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: '12px', textAlign: 'center' }}>
          <span style={{ fontFamily: "'Source Code Pro', monospace", fontSize: '11px', color: 'var(--green)', letterSpacing: '0.12em', fontWeight: 'bold' }}>● ALL CLEAR</span>
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '13px', color: 'var(--t1)' }}>
            No active conjunctions above monitoring threshold
          </span>
          <span style={{ fontFamily: "'Source Code Pro', monospace", fontSize: '11px', color: 'var(--t2)' }}>
            SENTINEL scanning every 10 minutes
          </span>
        </div>
      ) : (
        sorted.map((conj) => {
          const isSelected = conj.id === selectedId;
          const hex = defconHex(conj.defcon);
          const isCritical = conj.defcon <= 2;

          return (
            <button
              key={conj.id}
              onClick={() => onSelect(conj.id)}
              style={{
                ...styles.item,
                background: isSelected 
                  ? 'var(--bg-3)' 
                  : newAlerts.has(conj.id) 
                    ? 'rgba(255, 194, 0, 0.08)' 
                    : 'transparent',
                transition: 'background 1000ms ease',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.background = 'var(--bg-2)';
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.background = 'transparent';
              }}
            >
              {/* Left DEFCON bar — the ONLY decoration */}
              <div
                className={isCritical && !isSelected ? 'critical-flicker' : ''}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 2,
                  backgroundColor: hex,
                }}
              />

              <div style={styles.itemContent}>
                {/* Row 1: names */}
                <div style={styles.row1}>
                  <span style={styles.namesText}>
                    {conj.primary.name}
                    <span style={styles.cross}>×</span>
                    {conj.secondary.name}
                  </span>
                  <span style={{ ...styles.tcaText, color: hex }}>
                    {countdowns[conj.id] || '00 hrs 00 min'}
                  </span>
                </div>

                {/* Row 2: data */}
                <div style={styles.row2}>
                  <span style={styles.dataText}>{conj.missDistance.toFixed(2)} km</span>
                  <span style={styles.verticalDivider} />
                  <span style={styles.dataText}>Pc {conj.collisionPc.toExponential(2)}</span>
                  <span style={styles.verticalDivider} />
                  <span style={{ ...styles.dataText, color: hex }}>D-{conj.defcon}</span>
                </div>
              </div>
            </button>
          );
        })
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    padding: '20px 20px 12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  headerLabel: {
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 700,
    fontSize: 11,
    color: 'var(--t2)',
    letterSpacing: '0.14em',
  },
  headerCount: {
    fontFamily: "'Source Code Pro', monospace",
    fontSize: 20,
    fontWeight: 400,
    color: 'var(--gold)',
  },
  item: {
    width: '100%',
    display: 'flex',
    borderBottom: '1px solid var(--b1)',
    padding: '14px 20px',
    cursor: 'pointer',
    transition: 'background var(--ms-1)',
    textAlign: 'left',
    position: 'relative',
    background: 'transparent',
    borderLeft: 'none',
    borderRight: 'none',
    borderTop: 'none',
  },
  itemContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    paddingLeft: 8,
  },
  row1: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  namesText: {
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 600,
    fontSize: 14,
    color: 'var(--t0)',
  },
  cross: {
    color: 'var(--gold)',
    marginLeft: 8,
    marginRight: 8,
    fontWeight: 300,
  },
  tcaText: {
    fontFamily: "'Source Code Pro', monospace",
    fontSize: 12,
  },
  row2: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  dataText: {
    fontFamily: "'Source Code Pro', monospace",
    fontSize: 12,
    color: 'var(--t1)',
  },
  verticalDivider: {
    width: 1,
    height: 12,
    background: 'var(--b2)',
  },
};
