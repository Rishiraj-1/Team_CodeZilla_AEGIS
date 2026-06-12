'use client';

import React from 'react';
import { STAT_STATEMENTS } from '@/lib/mock-data';

export default function StatsGrid() {
  return (
    <div style={styles.container}>
      {STAT_STATEMENTS.map((stat, i) => (
        <React.Fragment key={i}>
          {i > 0 && <div style={styles.divider} />}
          <div style={styles.stat}>
            <div style={styles.value}>
              {stat.value}
              {stat.unit && (
                <span style={styles.unit}> {stat.unit}</span>
              )}
            </div>
            <div style={styles.text}>{stat.text}</div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    gap: 0,
    marginTop: 48,
    marginBottom: 40,
  },
  divider: {
    width: 0.5,
    background: 'var(--b0)',
    alignSelf: 'stretch',
  },
  stat: {
    flex: 1,
    padding: '0 24px',
  },
  value: {
    fontFamily: "'Source Code Pro', monospace",
    fontWeight: 300,
    fontSize: 48,
    color: 'var(--t0)',
    lineHeight: 1,
    marginBottom: 10,
  },
  unit: {
    fontSize: 20,
    color: 'var(--t2)',
  },
  text: {
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 400,
    fontSize: 14,
    color: 'var(--t2)',
    maxWidth: 200,
    lineHeight: 1.5,
  },
};
