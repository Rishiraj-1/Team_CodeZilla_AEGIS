'use client';

import React from 'react';

interface DataValueProps {
  children: React.ReactNode;
  size?: number;
  weight?: number;
  color?: string;
}

export default function DataValue({
  children,
  size = 12,
  weight = 400,
  color = 'var(--t0)',
}: DataValueProps) {
  return (
    <span
      style={{
        fontFamily: "'Source Code Pro', monospace",
        fontSize: size,
        fontWeight: weight,
        color,
        lineHeight: 1.4,
      }}
    >
      {children}
    </span>
  );
}
