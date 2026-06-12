'use client';

import React from 'react';
import { DefconLevel } from '@/types';
import { defconColor, defconHex } from '@/lib/utils';
import { DEFCON_MAP } from '@/types';

interface DefconBadgeProps {
  level: DefconLevel;
}

export default function DefconBadge({ level }: DefconBadgeProps) {
  const info = DEFCON_MAP[level];
  const hex = defconHex(level);
  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: "'Source Code Pro', monospace",
        fontSize: 9,
        fontWeight: 500,
        padding: '2px 6px',
        borderRadius: 2,
        background: `${hex}18`,
        color: hex,
        letterSpacing: '0.06em',
        lineHeight: 1.4,
      }}
    >
      DEFCON {level}
    </span>
  );
}
