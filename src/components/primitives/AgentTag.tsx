'use client';

import React from 'react';
import { AgentRole } from '@/types';
import { agentColor } from '@/lib/utils';

interface AgentTagProps {
  agent: AgentRole;
  showLabel?: boolean;
  size?: number;
}

export default function AgentTag({ agent, showLabel = true, size = 10 }: AgentTagProps) {
  const color = agentColor(agent);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span
        style={{
          width: size,
          height: size + 4,
          borderRadius: 1,
          background: color,
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
      {showLabel && (
        <span
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700,
            fontSize: 9,
            letterSpacing: '0.1em',
            color: color,
            textTransform: 'uppercase',
          }}
        >
          {agent}
        </span>
      )}
    </span>
  );
}
