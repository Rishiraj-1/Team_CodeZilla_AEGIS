'use client';

import React from 'react';

interface ShellProps {
  children: React.ReactNode;
}

export default function Shell({ children }: ShellProps) {
  return (
    <main style={{ position: 'relative', zIndex: 10 }}>
      {children}
    </main>
  );
}
