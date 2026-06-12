'use client';

import React, { useState, useMemo } from 'react';
import { useAegis } from '@/context/AegisContext';
import { SpaceObject, ObjectType } from '@/types';
import { formatNumber } from '@/lib/utils';

import { OBJECT_TYPE_STYLES } from '@/lib/constants';

interface ObjectTableProps {
  filter: ObjectType | 'ALL';
  search: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function ObjectTable({ filter, search, selectedId, onSelect }: ObjectTableProps) {
  const { objects } = useAegis();

  const filtered = useMemo(() => {
    return objects.filter((obj) => {
      if (filter !== 'ALL' && obj.type !== filter) return false;
      if (search) {
        const q = search.toUpperCase();
        return (
          obj.name.toUpperCase().includes(q) ||
          String(obj.noradId).includes(q) ||
          obj.country.toUpperCase().includes(q) ||
          obj.countryFull.toUpperCase().includes(q)
        );
      }
      return true;
    });
  }, [objects, filter, search]);

  return (
    <div style={styles.tableWrap}>
      {/* Header row */}
      <div style={styles.headerRow}>
        <div style={{ ...styles.cell, ...styles.nameCol }}>NAME</div>
        <div style={{ ...styles.cell, ...styles.noradCol }}>NORAD</div>
        <div style={{ ...styles.cell, ...styles.typeCol }}>TYPE</div>
        <div style={{ ...styles.cell, ...styles.altCol }}>ALTITUDE</div>
        <div style={{ ...styles.cell, ...styles.riskCol }}>RISK</div>
        <div style={{ ...styles.cell, ...styles.countryCol }}>COUNTRY</div>
      </div>

      {/* Data rows */}
      {filtered.map((obj) => {
        const isSelected = obj.id === selectedId;
        return (
          <button
            key={obj.id}
            onClick={() => onSelect(obj.id)}
            style={{
              ...styles.row,
              background: isSelected ? 'var(--bg-3)' : 'transparent',
            }}
            onMouseEnter={(e) => {
              if (!isSelected) e.currentTarget.style.background = 'var(--bg-2)';
            }}
            onMouseLeave={(e) => {
              if (!isSelected) e.currentTarget.style.background = isSelected ? 'var(--bg-3)' : 'transparent';
            }}
          >
            <div style={{ ...styles.cell, ...styles.nameCol }}>
              <span style={styles.nameText}>{obj.name}</span>
            </div>
            <div style={{ ...styles.cell, ...styles.noradCol }}>
              <span style={styles.noradText}>{obj.noradId}</span>
            </div>
            <div style={{ ...styles.cell, ...styles.typeCol }}>
              <TypePill type={obj.type} />
            </div>
            <div style={{ ...styles.cell, ...styles.altCol }}>
              <span style={styles.altValue}>{obj.altitude.toFixed(0)}</span>
              <span style={styles.altUnit}> km</span>
            </div>
            <div style={{ ...styles.cell, ...styles.riskCol }}>
              <RiskBar score={obj.riskScore} />
            </div>
            <div style={{ ...styles.cell, ...styles.countryCol }}>
              <span style={styles.countryText}>{obj.country}</span>
            </div>
          </button>
        );
      })}

      {filtered.length === 0 && (
        <div style={styles.empty}>
          No objects matching filter criteria.
        </div>
      )}
    </div>
  );
}

function TypePill({ type }: { type: ObjectType }) {
  const style = OBJECT_TYPE_STYLES[type] || OBJECT_TYPE_STYLES.UNKNOWN;
  return (
    <span style={{
      fontFamily: "'Rajdhani', sans-serif",
      fontWeight: 700,
      fontSize: 9,
      letterSpacing: '0.1em',
      padding: '2px 6px',
      borderRadius: 2,
      background: style.bg,
      color: style.color,
    }}>
      {style.label}
    </span>
  );
}

function RiskBar({ score }: { score: number }) {
  const color = score >= 80 ? '#ff3030' : score >= 50 ? '#ffc200' : '#2ed87a';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{
        fontFamily: "'Source Code Pro', monospace",
        fontSize: 13,
        color,
        width: 24,
      }}>
        {score}
      </span>
      <div style={{
        width: 60,
        height: 2,
        background: 'var(--bg-3)',
        position: 'relative',
      }}>
        <div style={{
          width: `${score}%`,
          height: 2,
          position: 'absolute',
          top: 0,
          left: 0,
          background: `linear-gradient(to right, #2ed87a, #ffc200, #ff3030)`,
          backgroundSize: '60px 2px',
        }} />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  tableWrap: {
    overflow: 'auto',
    flex: 1,
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    height: 32,
    background: 'var(--bg-1)',
    borderBottom: '0.5px solid var(--b1)',
    position: 'sticky',
    top: 0,
    zIndex: 3,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    minHeight: 40,
    padding: '10px 0',
    borderBottom: '0.5px solid var(--b0)',
    cursor: 'pointer',
    transition: 'background var(--ms-0)',
    textAlign: 'left',
  },
  cell: {
    padding: '0 16px',
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 700,
    fontSize: 10,
    color: 'var(--t3)',
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
  },
  nameCol: { flex: '2 1 0', minWidth: 160 },
  noradCol: { width: 80, flexShrink: 0 },
  typeCol: { width: 80, flexShrink: 0 },
  altCol: { width: 100, flexShrink: 0 },
  riskCol: { width: 120, flexShrink: 0 },
  countryCol: { width: 80, flexShrink: 0 },
  nameText: {
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 500,
    fontSize: 13,
    color: 'var(--t0)',
    letterSpacing: 'normal',
    textTransform: 'none' as const,
  },
  noradText: {
    fontFamily: "'Source Code Pro', monospace",
    fontSize: 11,
    color: 'var(--t2)',
    fontWeight: 400,
    letterSpacing: 'normal',
    textTransform: 'none' as const,
  },
  altValue: {
    fontFamily: "'Source Code Pro', monospace",
    fontSize: 12,
    color: 'var(--t1)',
    fontWeight: 400,
    letterSpacing: 'normal',
    textTransform: 'none' as const,
  },
  altUnit: {
    fontFamily: "'Source Code Pro', monospace",
    fontSize: 10,
    color: 'var(--t2)',
    fontWeight: 400,
    letterSpacing: 'normal',
    textTransform: 'none' as const,
  },
  countryText: {
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 400,
    fontSize: 12,
    color: 'var(--t2)',
    letterSpacing: 'normal',
    textTransform: 'none' as const,
  },
  empty: {
    padding: 40,
    textAlign: 'center',
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: 13,
    color: 'var(--t3)',
  },
};
