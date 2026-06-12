'use client';

import dynamic from 'next/dynamic';
import Shell from '@/components/shell/Shell';

const ThreatPanel = dynamic(() => import('@/components/threats/ThreatPanel'), { ssr: false });

export default function ThreatsPage() {
  return (
    <Shell>
      <ThreatPanel />
    </Shell>
  );
}
