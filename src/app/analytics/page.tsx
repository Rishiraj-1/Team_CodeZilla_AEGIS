'use client';

import dynamic from 'next/dynamic';
import Shell from '@/components/shell/Shell';

const AnalyticsOverlay = dynamic(() => import('@/components/analytics/AnalyticsOverlay'), { ssr: false });

export default function AnalyticsPage() {
  return (
    <Shell>
      <AnalyticsOverlay />
    </Shell>
  );
}
