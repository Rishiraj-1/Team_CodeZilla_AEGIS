'use client';

import dynamic from 'next/dynamic';
import Shell from '@/components/shell/Shell';

const SimulatorPanel = dynamic(() => import('@/components/simulator/SimulatorPanel'), { ssr: false });

export default function SimulatorPage() {
  return (
    <Shell>
      <SimulatorPanel />
    </Shell>
  );
}
