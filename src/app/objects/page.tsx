'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Shell from '@/components/shell/Shell';

const ObjectDrawer = dynamic(() => import('@/components/objects/ObjectDrawer'), { ssr: false });

export default function ObjectsPage() {
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);

  return (
    <Shell>
      <ObjectDrawer
        selectedObjectId={selectedObjectId}
        onSelectObject={setSelectedObjectId}
      />
    </Shell>
  );
}
