'use client';

import React from 'react';
import ThreatList from './ThreatList';
import ThreatDetail from './ThreatDetail';
import ThreatSummary from './ThreatSummary';
import { useAegis } from '@/context/AegisContext';

export default function ThreatPanel() {
  const { conjunctions, selectedConjunctionId, setSelectedConjunctionId } = useAegis();
  
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      if (id && id !== selectedConjunctionId) {
        setSelectedConjunctionId(id);
      }
    }
  }, [selectedConjunctionId, setSelectedConjunctionId]);

  const selected = selectedConjunctionId ? conjunctions.find(c => c.id === selectedConjunctionId) || null : null;

  return (
    <>
      {/* Left panel: Active Conjunction Hazard Feed */}
      <div style={styles.leftPanel}>
        <ThreatList
          conjunctions={conjunctions}
          selectedId={selectedConjunctionId}
          onSelect={setSelectedConjunctionId}
        />
      </div>

      {/* Right panel: Dossier details or General overview */}
      <div style={styles.rightPanel}>
        {selected ? (
          <ThreatDetail
            conjunction={selected}
            onBack={() => setSelectedConjunctionId(null)}
          />
        ) : (
          <ThreatSummary conjunctions={conjunctions} />
        )}
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  leftPanel: {
    width: 360,
    position: 'fixed',
    left: 0,
    top: 40,
    bottom: 28,
    background: 'rgba(6, 5, 10, 0.91)',
    backdropFilter: 'blur(16px) saturate(110%)',
    WebkitBackdropFilter: 'blur(16px) saturate(110%)',
    borderRight: '1px solid rgba(255, 194, 0, 0.09)',
    zIndex: 30,
    animation: 'fade-in-up 280ms cubic-bezier(0.22, 1, 0.36, 1)',
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  rightPanel: {
    width: 460,
    position: 'fixed',
    right: 0,
    top: 40,
    bottom: 28,
    background: 'rgba(6, 5, 10, 0.91)',
    backdropFilter: 'blur(16px) saturate(110%)',
    WebkitBackdropFilter: 'blur(16px) saturate(110%)',
    borderLeft: '1px solid rgba(255, 194, 0, 0.09)',
    zIndex: 30,
    animation: 'slide-in-right 280ms cubic-bezier(0.22, 1, 0.36, 1)',
    overflowY: 'auto',
    overflowX: 'hidden',
  },
};
