'use client';

import React, { useRef } from 'react';
import { TICKER_ITEMS } from '@/lib/mock-data';
import { useAegis } from '@/context/AegisContext';

export default function BottomTicker() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { conjunctions } = useAegis();

  // Build ticker text from database conjunctions & agent logs
  let tickerText = conjunctions.map((c) => {
    const heraldLog = c.assessments.find(a => a.agent === 'HERALD');
    if (heraldLog) {
      return `HERALD: ${heraldLog.text}`;
    }
    return `SENTINEL: Close approach flagged — ${c.primary.name} × ${c.secondary.name} (Miss: ${c.missDistance.toFixed(2)}km, Pc: ${c.collisionPc.toExponential(1)}, DEFCON ${c.defcon})`;
  });

  // Fallback to mock data if there are no database entries
  if (tickerText.length === 0) {
    tickerText = TICKER_ITEMS.map((item) => `${item.agent}: ${item.message}`);
  }

  // Duplicate for seamless looping
  const fullText = [...tickerText, ...tickerText];

  return (
    <div id="bottom-ticker" style={styles.container}>
      {/* Fixed label */}
      <div style={styles.fixedLabel}>
        <span className="pulse" style={styles.dot} />
        <span style={styles.labelText}>AEGIS</span>
      </div>

      {/* Scrolling ticker */}
      <div style={styles.tickerWrap}>
        <div ref={scrollRef} style={styles.ticker}>
          {fullText.map((text, i) => (
            <span key={i} style={styles.tickerItem}>
              {renderTickerItem(text)}
              <span style={styles.separator}>  ·  </span>
            </span>
          ))}
        </div>
      </div>

      {/* Keyboard shortcuts */}
      <div style={styles.shortcuts}>
        <span style={styles.shortcutItem}><span style={styles.key}>[1]</span> THREATS</span>
        <span style={styles.shortcutItem}><span style={styles.key}>[2]</span> TIME MACHINE</span>
        <span style={styles.shortcutItem}><span style={styles.key}>[3]</span> ANALYTICS</span>
        <span style={styles.shortcutItem}><span style={styles.key}>[4]</span> OBJECTS</span>
        <span style={styles.shortcutItem}><span style={styles.key}>[K]</span> CHAT</span>
      </div>
    </div>
  );
}

function renderTickerItem(text: string) {
  const parts = text.split(/^([A-Z]+):/);
  if (parts.length > 2) {
    const agent = parts[1];
    const rest = parts[2];
    const agentColor =
      agent === 'SENTINEL' ? '#2ed87a' :
      agent === 'ANALYST' ? '#4488ff' :
      agent === 'COMMANDER' ? '#ffc200' :
      agent === 'HERALD' ? '#c084fc' : '#a89870';
    return (
      <span>
        <span style={{ color: agentColor, fontWeight: 600 }}>{agent}:</span>
        <span>
          {rest.split(/([A-Z][A-Z0-9-]+(?:\s(?:DEB|R\/B))?)/g).map((part, j) => {
            if (/^[A-Z][A-Z0-9-]+(?:\s(?:DEB|R\/B))?$/.test(part)) {
              return (
                <span key={j} style={{ color: 'var(--gold)' }}>{part}</span>
              );
            }
            return <span key={j}>{part}</span>;
          })}
        </span>
      </span>
    );
  }
  return <span>{text}</span>;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: 28,
    zIndex: 50,
    background: 'rgba(6, 5, 10, 0.95)',
    borderTop: '1px solid rgba(255, 194, 0, 0.06)',
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
  },
  fixedLabel: {
    height: 28,
    padding: '0 12px',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    borderRight: '1px solid rgba(255, 194, 0, 0.08)',
    zIndex: 2,
    flexShrink: 0,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#2ed87a',
    display: 'inline-block',
  },
  labelText: {
    fontFamily: "'Source Code Pro', monospace",
    fontWeight: 500,
    fontSize: 12,
    color: 'var(--gold)',
    letterSpacing: '0.08em',
  },
  tickerWrap: {
    flex: 1,
    overflow: 'hidden',
  },
  ticker: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '32px',
    whiteSpace: 'nowrap',
    animation: 'ticker 60s linear infinite',
  },
  tickerItem: {
    fontFamily: "'Source Code Pro', monospace",
    fontSize: 12,
    color: 'var(--t1)',
  },
  separator: {
    color: 'var(--t2)',
    marginLeft: 16,
    marginRight: 16,
  },
  shortcuts: {
    height: 28,
    padding: '0 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    borderLeft: '1px solid rgba(255, 194, 0, 0.08)',
    background: 'rgba(6, 5, 10, 0.95)',
    zIndex: 2,
    flexShrink: 0,
  },
  shortcutItem: {
    fontFamily: "'Source Code Pro', monospace",
    fontSize: 9,
    color: 'var(--t1)',
    letterSpacing: '0.05em',
  },
  key: {
    color: 'var(--gold)',
    fontWeight: 'bold',
  },
};

