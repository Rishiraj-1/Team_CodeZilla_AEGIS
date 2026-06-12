'use client';

import React from 'react';

interface LivePulseProps {
  color?: string;
  size?: number;
}

export default function LivePulse({ color = 'var(--green)', size = 6 }: LivePulseProps) {
  return (
    <span
      className="pulse"
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
      }}
    />
  );
}
