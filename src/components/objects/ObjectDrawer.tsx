'use client';

import React, { useState } from 'react';
import { ObjectType } from '@/types';
import { useAegis } from '@/context/AegisContext';
import ObjectTable from './ObjectTable';
import { sfx } from '@/lib/sfx';

const FILTERS: { label: string; value: ObjectType | 'ALL' }[] = [
  { label: 'ALL', value: 'ALL' },
  { label: 'PAYLOAD', value: 'PAYLOAD' },
  { label: 'DEBRIS', value: 'DEBRIS' },
  { label: 'ROCKET BODY', value: 'ROCKET_BODY' },
];

interface ObjectDrawerProps {
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
}

export default function ObjectDrawer({ selectedObjectId, onSelectObject }: ObjectDrawerProps) {
  const [filter, setFilter] = useState<ObjectType | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const { objects } = useAegis();

  const selectedObj = selectedObjectId
    ? objects.find(o => o.id === selectedObjectId)
    : null;

  return (
    <div style={styles.drawer} className="shimmer-hover">
      {/* Drag handle */}
      <div style={styles.handleWrap}>
        <div style={styles.handle} />
      </div>

      {/* Header row */}
      <div style={styles.headerRow}>
        {/* Left: title */}
        <span style={styles.title}>OBJECT DATABASE</span>

        {/* Center: search */}
        <div style={{ ...styles.searchWrap, width: '300px' }}>
          {/* Search icon */}
          <svg
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 14,
              height: 14,
              color: 'var(--t2)',
              pointerEvents: 'none',
            }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>

          <input
            type="text"
            placeholder="NORAD ID, name, or country"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              sfx.playTick();
            }}
            style={{
              width: '100%',
              height: 32,
              paddingLeft: 36,
              paddingRight: 16,
              fontFamily: "'Source Code Pro', monospace",
              fontSize: 12,
              color: 'var(--t0)',
              background: 'rgba(19, 17, 24, 0.8)',
              border: '1px solid rgba(255,194,0,0.08)',
              borderRadius: '3px',
              outline: 'none',
              transition: 'all 75ms ease',
            }}
            onFocus={e => {
              e.target.style.border = '1px solid rgba(255,194,0,0.30)';
              e.target.style.boxShadow = '0 0 0 2px rgba(255,194,0,0.06)';
            }}
            onBlur={e => {
              e.target.style.border = '1px solid rgba(255,194,0,0.08)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Right: filter toggles */}
        <div style={styles.filterGroup}>
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setFilter(f.value);
                sfx.playClick();
              }}
              onMouseEnter={() => {
                if (filter !== f.value) sfx.playTick();
              }}
              style={{
                ...styles.filterBtn,
                color: filter === f.value ? 'var(--gold)' : 'var(--t2)',
                borderBottom: filter === f.value ? '1px solid var(--gold)' : '1px solid transparent',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Query Presets Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '5px 20px',
        background: 'rgba(6, 5, 10, 0.35)',
        borderBottom: '0.5px solid var(--b0)',
        gap: 10,
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: "'Source Code Pro', monospace",
          fontSize: 9,
          color: 'var(--t3)',
          letterSpacing: '0.05em',
        }}>PRESET SEARCH:</span>
        {['Starlink', 'ISS', 'Cosmos', 'USA', 'Fengyun', 'Envisat'].map(preset => (
          <button
            key={preset}
            onClick={() => {
              setSearch(preset);
              sfx.playClick();
            }}
            style={{
              fontFamily: "'Source Code Pro', monospace",
              fontSize: 9,
              color: search.toLowerCase() === preset.toLowerCase() ? 'var(--gold)' : 'var(--t1)',
              background: search.toLowerCase() === preset.toLowerCase() ? 'rgba(255,194,0,0.08)' : 'rgba(255,255,255,0.01)',
              border: '0.5px solid',
              borderColor: search.toLowerCase() === preset.toLowerCase() ? 'var(--gold-20)' : 'var(--b1)',
              borderRadius: 2,
              padding: '1px 5px',
              transition: 'all 0.1s ease',
            }}
            onMouseEnter={() => sfx.playTick()}
          >
            #{preset.toUpperCase()}
          </button>
        ))}
        {search && (
          <button
            onClick={() => {
              setSearch('');
              sfx.playClick();
            }}
            style={{
              fontFamily: "'Source Code Pro', monospace",
              fontSize: 9,
              color: 'var(--red)',
              background: 'none',
              border: 'none',
              marginLeft: 'auto',
              cursor: 'pointer',
            }}
          >
            CLEAR [×]
          </button>
        )}
      </div>

      {/* Table + Optional detail float */}
      <div style={styles.body}>
        {/* Selected object info float */}
        {selectedObj && (
          <div style={styles.infoFloat}>
            <div style={styles.infoName}>{selectedObj.name}</div>
            <div style={{ marginBottom: 8 }}>
              <span style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                fontSize: 9,
                letterSpacing: '0.1em',
                padding: '2px 6px',
                borderRadius: 2,
                background: selectedObj.type === 'DEBRIS' ? 'var(--red-dim)' : selectedObj.type === 'PAYLOAD' ? 'var(--green-dim)' : 'var(--gold-dim)',
                color: selectedObj.type === 'DEBRIS' ? 'var(--red)' : selectedObj.type === 'PAYLOAD' ? 'var(--green)' : 'var(--gold)',
              }}>
                {selectedObj.type === 'ROCKET_BODY' ? 'R/B' : selectedObj.type}
              </span>
            </div>
            <div style={styles.infoGrid}>
              <InfoRow label="NORAD" value={String(selectedObj.noradId)} />
              <InfoRow label="ALTITUDE" value={`${selectedObj.altitude.toFixed(1)} km`} />
              <InfoRow label="INCL" value={`${selectedObj.inclination.toFixed(2)}°`} />
              <InfoRow label="PERIOD" value={`${selectedObj.period.toFixed(2)} min`} />
              <InfoRow label="LAUNCHED" value={selectedObj.launched} />
              <InfoRow label="RISK" value={String(selectedObj.riskScore)} />
              <InfoRow label="COUNTRY" value={selectedObj.country} />
              <InfoRow label="STATUS" value={selectedObj.status} />
            </div>

            {/* TLE */}
            {selectedObj.tle1 && (
              <TLEBlock tle1={selectedObj.tle1} tle2={selectedObj.tle2 || ''} />
            )}
          </div>
        )}

        <ObjectTable
          filter={filter}
          search={search}
          selectedId={selectedObjectId}
          onSelect={onSelectObject}
        />
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={infoStyles.row}>
      <span style={infoStyles.label}>{label}</span>
      <span style={infoStyles.value}>{value}</span>
    </div>
  );
}

function TLEBlock({ tle1, tle2 }: { tle1: string; tle2: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 10 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 500,
          fontSize: 10,
          color: 'var(--t2)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          background: 'none',
          border: 'none',
        }}
      >
        <span>{open ? '−' : '+'}</span> RAW TLE
      </button>
      {open && (
        <pre style={{
          fontFamily: "'Source Code Pro', monospace",
          fontSize: 9,
          color: 'var(--t2)',
          background: 'var(--bg-1)',
          padding: 8,
          marginTop: 4,
          borderRadius: 2,
          overflowX: 'auto',
          whiteSpace: 'pre',
          lineHeight: 1.5,
        }}>
          {tle1}{'\n'}{tle2}
        </pre>
      )}
    </div>
  );
}

const infoStyles: Record<string, React.CSSProperties> = {
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '2px 0',
  },
  label: {
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 500,
    fontSize: 10,
    color: 'var(--t2)',
    letterSpacing: '0.04em',
  },
  value: {
    fontFamily: "'Source Code Pro', monospace",
    fontSize: 11,
    color: 'var(--t0)',
  },
};

const styles: Record<string, React.CSSProperties> = {
  drawer: {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 28,
    height: '55vh',
    background: 'rgba(6, 5, 10, 0.91)',
    backdropFilter: 'blur(16px) saturate(110%)',
    WebkitBackdropFilter: 'blur(16px) saturate(110%)',
    borderTop: '1px solid rgba(255, 194, 0, 0.09)',
    zIndex: 30,
    display: 'flex',
    flexDirection: 'column',
    animation: 'slide-up 280ms cubic-bezier(0.22, 1, 0.36, 1)',
  },
  handleWrap: {
    display: 'flex',
    justifyContent: 'center',
    padding: '6px 0',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    background: 'var(--b2)',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    height: 44,
    padding: '0 20px',
    background: 'var(--bg)',
    borderBottom: '0.5px solid var(--b0)',
    gap: 20,
    flexShrink: 0,
  },
  title: {
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 700,
    fontSize: 11,
    color: 'var(--t2)',
    letterSpacing: '0.12em',
    flexShrink: 0,
  },
  searchWrap: {
    position: 'relative',
    width: 300,
    flexShrink: 0,
  },
  filterGroup: {
    display: 'flex',
    gap: 12,
    marginLeft: 'auto',
  },
  filterBtn: {
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 500,
    fontSize: 10,
    letterSpacing: '0.1em',
    cursor: 'pointer',
    paddingBottom: 2,
    background: 'none',
    border: 'none',
  },
  body: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
    position: 'relative',
  },
  infoFloat: {
    width: 260,
    padding: 16,
    background: 'rgba(6, 5, 10, 0.91)',
    backdropFilter: 'blur(16px) saturate(110%)',
    WebkitBackdropFilter: 'blur(16px) saturate(110%)',
    border: '1px solid rgba(255, 194, 0, 0.09)',
    borderRadius: 4,
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 5,
  },
  infoName: {
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 600,
    fontSize: 16,
    color: 'var(--t0)',
    marginBottom: 4,
  },
  infoGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
};
