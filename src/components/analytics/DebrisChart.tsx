'use client';

import React from 'react';
import {
  AreaChart, Area, XAxis, CartesianGrid,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { DEBRIS_GROWTH } from '@/lib/mock-data';

const EVENTS = [
  { year: 2007, label: 'FY-1C ASAT' },
  { year: 2009, label: 'IRIDIUM-COSMOS' },
  { year: 2021, label: 'RUS ASAT' },
];

export default function DebrisChart() {
  return (
    <div style={styles.container}>
      <div style={styles.label}>
        <span>TRACKED OBJECTS 1957–2026</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={DEBRIS_GROWTH} margin={{ top: 20, right: 20, bottom: 0, left: 0 }} style={{ background: 'transparent' }}>
          <defs>
            <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffc200" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#ffc200" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="rgba(255,194,0,0.06)"
            strokeDasharray="4 4"
          />
          <XAxis
            dataKey="year"
            tick={{ fill: '#5a5040', fontSize: 10, fontFamily: 'Source Code Pro' }}
            axisLine={{ stroke: 'rgba(255,194,0,0.08)' }}
            tickLine={false}
            interval={4}
          />
          {EVENTS.map((event) => (
            <ReferenceLine
              key={event.year}
              x={event.year}
              stroke="#ff3030"
              strokeDasharray="4 4"
              strokeWidth={0.5}
              label={{
                value: event.label,
                position: 'top',
                style: {
                  fontFamily: "'Rajdhani', sans-serif",
                  fontSize: 9,
                  fill: '#ff3030',
                  fontWeight: 500,
                },
              }}
            />
          ))}
          <Area
            type="monotone"
            dataKey="count"
            stroke="#ffc200"
            strokeWidth={1.5}
            fill="url(#goldFill)"
            dot={false}
            activeDot={{ r: 3, fill: '#ffc200', stroke: 'none' }}
            animationDuration={800}
          />
        </AreaChart>

      </ResponsiveContainer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    marginBottom: 48,
  },
  label: {
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 700,
    fontSize: 10,
    letterSpacing: '0.12em',
    color: 'var(--t2)',
    marginBottom: 16,
  },
};
