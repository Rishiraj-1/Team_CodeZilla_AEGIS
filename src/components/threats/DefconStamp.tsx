'use client';

import React from 'react';
import { DefconLevel } from '@/types';
import { DEFCON_MAP } from '@/types';
import { defconHex } from '@/lib/utils';

interface DefconStampProps {
  level: DefconLevel;
}

export default function DefconStamp({ level }: DefconStampProps) {
  const info = DEFCON_MAP[level];
  const hex = defconHex(level);

  return (
    <div
      style={{
        position: 'absolute',
        top: 24,
        right: 20,
        textAlign: 'center',
        pointerEvents: 'none',
        userSelect: 'none',
        transform: 'rotate(12deg)',
        zIndex: 5,
      }}
    >
      <div
        style={{
          border: `2px solid ${hex}`,
          borderColor: hex,
          color: hex,
          borderRadius: '3px',
          padding: '6px 12px',
        }}
      >
        <span
          className="mono"
          style={{
            display: 'block',
            fontSize: '56px',
            fontWeight: 300,
            lineHeight: 1,
            fontFamily: "'Source Code Pro', monospace",
          }}
        >
          {level}
        </span>
        <span
          style={{
            display: 'block',
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}
        >
          {info.label}
        </span>
      </div>
    </div>
  );
}

