'use client';

import React, { useState, useMemo } from 'react';
import DebrisChart from './DebrisChart';
import DensityChart from './DensityChart';
import StatsGrid from './StatsGrid';
import { formatNumber } from '@/lib/utils';
import { useAegis } from '@/context/AegisContext';
import { sfx } from '@/lib/sfx';
import { useCountUp } from '@/hooks/useCountUp';
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid
} from 'recharts';

export default function AnalyticsOverlay() {
  const { objects, conjunctions, stats, loading } = useAegis();
  const [activeTab, setActiveTab] = useState<'overview' | 'threats' | 'distribution'>('overview');

  const animatedObjectsCount = useCountUp(objects.length || 28441, 1500);
  const animatedThreatsCount = useCountUp(conjunctions.filter(c => c.status !== 'RESOLVED').length, 1200);
  const animatedCriticalCount = useCountUp(conjunctions.filter(c => c.defcon <= 2 && c.status !== 'RESOLVED').length, 1200);
  const animatedPayloadsCount = useCountUp(objects.filter(o => o.status === 'ACTIVE').length || 8000, 1500);

  if (loading) {
    return (
      <div style={styles.overlay} className="scrollable">
        {/* Header Skeleton */}
        <div style={styles.header}>
          <div style={{ width: '250px', height: '11px', background: 'rgba(255,194,0,0.1)', animation: 'pulse 1.5s ease-in-out infinite', borderRadius: '2px', marginBottom: '4px' }} />
          <div style={{ width: '350px', height: '11px', background: 'rgba(192,168,112,0.1)', animation: 'pulse 1.5s ease-in-out 0.2s infinite', marginTop: '6px', borderRadius: '2px' }} />
          <div style={styles.headerRule} />
        </div>

        {/* Operational Dashboard Cards Skeleton */}
        <div style={styles.cardGrid}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={styles.card}>
              <div style={{ width: '80px', height: '28px', background: 'rgba(237,224,196,0.1)', animation: `pulse 1.5s ease-in-out ${i * 0.1}s infinite`, borderRadius: '2px' }} />
              <div style={{ width: '120px', height: '10px', background: 'rgba(192,168,112,0.1)', animation: `pulse 1.5s ease-in-out ${i * 0.15}s infinite`, marginTop: '8px', borderRadius: '2px' }} />
            </div>
          ))}
        </div>

        {/* Tab Controls Skeleton */}
        <div style={styles.tabBar}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ width: '150px', height: '18px', background: 'rgba(192,168,112,0.08)', animation: `pulse 1.5s ease-in-out ${i * 0.1}s infinite`, padding: '12px 4px', margin: '12px 0', borderRadius: '2px' }} />
          ))}
        </div>

        {/* Overview Tab Content Skeleton */}
        <div style={{ animation: 'fade-in-up 200ms ease-out' }}>
          {/* Statement lines */}
          <div style={{ marginBottom: '36px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ width: '85%', height: '28px', background: 'rgba(192,168,112,0.08)', animation: 'pulse 1.5s ease-in-out infinite', borderRadius: '2px' }} />
            <div style={{ width: '60%', height: '28px', background: 'rgba(192,168,112,0.08)', animation: 'pulse 1.5s ease-in-out 0.1s infinite', borderRadius: '2px' }} />
          </div>

          {/* Area Chart Skeleton - Debris growth (Pulsed bar lines representing chart axes/grid bars) */}
          <div style={{ ...styles.tabContent, height: '260px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(255, 194, 0, 0.08)', marginBottom: '24px' }}>
            <div style={{ width: '150px', height: '10px', background: 'rgba(192,168,112,0.1)', animation: 'pulse 1.5s ease-in-out infinite', borderRadius: '2px', marginBottom: '16px' }} />
            <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: '20px' }}>
              {/* Horizontal grid lines */}
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{ width: '100%', height: '1px', background: 'rgba(255,194,0,0.04)' }} />
              ))}
              {/* Pulsing bars/axes inside chart */}
              <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', height: '120px', display: 'flex', alignItems: 'end', gap: '8px' }}>
                {[30, 45, 35, 50, 60, 55, 70, 65, 80, 75, 90, 85, 100].map((h, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: `${h}%`,
                      background: 'rgba(255, 194, 0, 0.05)',
                      animation: `pulse 1.5s ease-in-out ${i * 0.08}s infinite`,
                    }}
                  />
                ))}
              </div>
              {/* X Axis line */}
              <div style={{ width: '100%', height: '1px', background: 'rgba(255,194,0,0.08)' }} />
            </div>
          </div>

          <div style={styles.twoCol}>
            {/* Left Column (Density Chart Skeleton) */}
            <div style={styles.colLeft}>
              <div style={{ ...styles.tabContent, height: '240px', display: 'flex', flexDirection: 'column', border: '1px solid rgba(255, 194, 0, 0.08)', marginBottom: '24px' }}>
                <div style={{ width: '200px', height: '10px', background: 'rgba(192,168,112,0.1)', animation: 'pulse 1.5s ease-in-out infinite', borderRadius: '2px', marginBottom: '20px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                  {[100, 80, 60, 40, 70, 90].map((w, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '120px', height: '10px', background: 'rgba(192,168,112,0.08)', animation: 'pulse 1.5s ease-in-out infinite', borderRadius: '2px' }} />
                      <div style={{ flex: 1, height: '8px', background: 'rgba(255, 194, 0, 0.03)', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${w}%`, background: 'rgba(255, 194, 0, 0.06)', animation: `pulse 1.5s ease-in-out ${i * 0.1}s infinite` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column (Country List Skeleton) */}
            <div style={styles.colRight}>
              <div style={{ width: '220px', height: '10px', background: 'rgba(192,168,112,0.1)', animation: 'pulse 1.5s ease-in-out infinite', borderRadius: '2px', marginBottom: '20px' }} />
              <div style={styles.countryList}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} style={styles.countryRow}>
                    <div style={{ width: '70px', height: '12px', background: 'rgba(192,168,112,0.08)', animation: 'pulse 1.5s ease-in-out infinite', borderRadius: '2px' }} />
                    <div style={styles.barTrack}>
                      <div
                        style={{
                          ...styles.barFill,
                          width: `${100 - i * 10}%`,
                          background: 'rgba(255, 194, 0, 0.05)',
                          animation: `pulse 1.5s ease-in-out ${i * 0.05}s infinite`,
                        }}
                      />
                    </div>
                    <div style={{ width: '40px', height: '12px', background: 'rgba(192,168,112,0.08)', animation: 'pulse 1.5s ease-in-out infinite', borderRadius: '2px' }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Resolutions Section Skeleton */}
        <div style={styles.resolutionsSection}>
          <div style={{ width: '250px', height: '10px', background: 'rgba(192,168,112,0.1)', animation: 'pulse 1.5s ease-in-out infinite', borderRadius: '2px', marginBottom: '20px' }} />
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  {['TARGET VECTOR', 'SECTOR / SHELL', 'MISS DISTANCE', 'PROBABILITY (Pc)', 'AEGIS MITIGATION Burn', 'RESOLUTION OUTCOME'].map((th, idx) => (
                    <th key={idx} style={styles.th}>{th}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4].map((i) => (
                  <tr key={i} style={styles.tr}>
                    <td style={styles.td}><div style={{ width: '180px', height: '14px', background: 'rgba(237,224,196,0.08)', animation: 'pulse 1.5s ease-in-out infinite', borderRadius: '2px' }} /></td>
                    <td style={styles.td}><div style={{ width: '80px', height: '12px', background: 'rgba(192,168,112,0.08)', animation: 'pulse 1.5s ease-in-out infinite', borderRadius: '2px' }} /></td>
                    <td style={styles.td}><div style={{ width: '60px', height: '12px', background: 'rgba(192,168,112,0.08)', animation: 'pulse 1.5s ease-in-out infinite', borderRadius: '2px' }} /></td>
                    <td style={styles.td}><div style={{ width: '60px', height: '12px', background: 'rgba(192,168,112,0.08)', animation: 'pulse 1.5s ease-in-out infinite', borderRadius: '2px' }} /></td>
                    <td style={styles.td}><div style={{ width: '140px', height: '12px', background: 'rgba(192,168,112,0.08)', animation: 'pulse 1.5s ease-in-out infinite', borderRadius: '2px' }} /></td>
                    <td style={styles.td}><div style={{ width: '80px', height: '14px', background: 'rgba(192,168,112,0.08)', animation: 'pulse 1.5s ease-in-out infinite', borderRadius: '2px' }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // 1. Country breakdown logic
  const dynamicCountryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    objects.forEach(obj => {
      const c = obj.country || 'UNKNOWN';
      counts[c] = (counts[c] || 0) + 1;
    });
    
    return Object.entries(counts)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // Top 8 countries
  }, [objects]);

  const maxCountry = useMemo(() => {
    return Math.max(...dynamicCountryBreakdown.map(c => c.count), 1);
  }, [dynamicCountryBreakdown]);

  // 2. Conjunctions scatter plot data mapping
  const scatterData = useMemo(() => {
    return conjunctions.map(c => ({
      id: c.id,
      name: `${c.primary.name} × ${c.secondary.name}`,
      missDistance: c.missDistance,
      pc: c.collisionPc,
      defcon: c.defcon,
      size: c.defcon === 1 ? 120 : c.defcon === 2 ? 90 : c.defcon === 3 ? 60 : 35
    }));
  }, [conjunctions]);

  // 3. Object type donut chart data mapping
  const objectTypeData = useMemo(() => {
    const counts = { PAYLOAD: 0, DEBRIS: 0, ROCKET_BODY: 0, UNKNOWN: 0 };
    objects.forEach(o => {
      if (o.type === 'PAYLOAD') counts.PAYLOAD++;
      else if (o.type === 'DEBRIS') counts.DEBRIS++;
      else if (o.type === 'ROCKET_BODY') counts.ROCKET_BODY++;
      else counts.UNKNOWN++;
    });
    return [
      { name: 'ACTIVE PAYLOAD', value: counts.PAYLOAD, color: 'var(--green)' },
      { name: 'SPACE DEBRIS', value: counts.DEBRIS, color: 'var(--red)' },
      { name: 'ROCKET BODY / BOOSTER', value: counts.ROCKET_BODY, color: 'var(--orange)' },
    ].filter(d => d.value > 0);
  }, [objects]);

  // 4. Regime donut chart data mapping
  const regimeData = useMemo(() => {
    const counts = { LEO: 0, MEO: 0, GEO: 0 };
    objects.forEach(o => {
      const alt = o.altitude || 0;
      if (alt < 2000) counts.LEO++;
      else if (alt < 35000) counts.MEO++;
      else counts.GEO++;
    });
    return [
      { name: 'LOW EARTH ORBIT (LEO)', value: counts.LEO, color: '#2ed87a' },
      { name: 'MEDIUM EARTH ORBIT (MEO)', value: counts.MEO, color: '#4488ff' },
      { name: 'GEOSTATIONARY ORBIT (GEO)', value: counts.GEO, color: '#ffc200' },
    ].filter(d => d.value > 0);
  }, [objects]);

  const getDefconColor = (defcon: number) => {
    if (defcon === 1) return 'var(--red)';
    if (defcon === 2) return 'var(--orange)';
    if (defcon === 3) return 'var(--gold)';
    if (defcon === 4) return 'var(--blue)';
    return 'var(--green)';
  };

  const CustomScatterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          background: 'rgba(6, 5, 10, 0.98)',
          border: `0.5px solid ${getDefconColor(data.defcon)}`,
          padding: '10px 14px',
          borderRadius: 2,
          fontFamily: "'Rajdhani', sans-serif",
          boxShadow: '0 4px 12px rgba(0,0,0,0.6)'
        }}>
          <div style={{ fontWeight: 700, color: '#fff', fontSize: 13, marginBottom: 4 }}>
            {data.name}
          </div>
          <div style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 11, color: 'var(--t1)' }}>
            <div>Miss Distance: <span style={{ color: '#fff' }}>{data.missDistance.toFixed(3)} km</span></div>
            <div>Probability (Pc): <span style={{ color: getDefconColor(data.defcon), fontWeight: 700 }}>{data.pc.toExponential(2)}</span></div>
            <div>DEFCON Level: <span style={{ color: getDefconColor(data.defcon), fontWeight: 700 }}>{data.defcon}</span></div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={styles.overlay} className="scrollable">
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLabel}>ORBITAL INTELLIGENCE & TELEMETRY REPORT</div>
        <div style={styles.headerSub}>
          Live LEO Catalog · {formatNumber(objects.length)} synced targets · AEGIS active
        </div>
        <div style={styles.headerRule} />
      </div>

      {/* Operational Dashboard Cards */}
      <div style={styles.cardGrid}>
        <div style={styles.card} className="shimmer-hover">
          <span style={styles.cardVal}>{formatNumber(animatedObjectsCount)}</span>
          <span style={styles.cardLabel}>TOTAL OBJECTS SYNCED</span>
        </div>
        <div style={styles.card} className="shimmer-hover">
          <span style={{ ...styles.cardVal, color: 'var(--red)' }}>
            {animatedThreatsCount}
          </span>
          <span style={styles.cardLabel}>ACTIVE THREAT VECTOR CONJUNCTIONS</span>
        </div>
        <div style={styles.card} className="shimmer-hover">
          <span style={{ ...styles.cardVal, color: 'var(--gold)' }}>
            {animatedCriticalCount}
          </span>
          <span style={styles.cardLabel}>CRITICAL DEFCON 1/2 THREATS</span>
        </div>
        <div style={styles.card} className="shimmer-hover">
          <span style={{ ...styles.cardVal, color: 'var(--green)' }}>
            {formatNumber(animatedPayloadsCount)}
          </span>
          <span style={styles.cardLabel}>OPERATIONAL PAYLOADS IN ORBIT</span>
        </div>
      </div>

      {/* Tab controls */}
      <div style={styles.tabBar}>
        <button
          onClick={() => { setActiveTab('overview'); sfx.playClick(); }}
          onMouseEnter={() => { if (activeTab !== 'overview') sfx.playTick(); }}
          style={{
            ...styles.tabBtn,
            color: activeTab === 'overview' ? 'var(--gold)' : 'var(--t2)',
            borderBottom: activeTab === 'overview' ? '2px solid var(--gold)' : '2px solid transparent',
          }}
        >
          ORBITAL DYNAMICS & GROWTH
        </button>
        <button
          onClick={() => { setActiveTab('threats'); sfx.playClick(); }}
          onMouseEnter={() => { if (activeTab !== 'threats') sfx.playTick(); }}
          style={{
            ...styles.tabBtn,
            color: activeTab === 'threats' ? 'var(--gold)' : 'var(--t2)',
            borderBottom: activeTab === 'threats' ? '2px solid var(--gold)' : '2px solid transparent',
          }}
        >
          THREAT MATRIX SEVERITY CHART
        </button>
        <button
          onClick={() => { setActiveTab('distribution'); sfx.playClick(); }}
          onMouseEnter={() => { if (activeTab !== 'distribution') sfx.playTick(); }}
          style={{
            ...styles.tabBtn,
            color: activeTab === 'distribution' ? 'var(--gold)' : 'var(--t2)',
            borderBottom: activeTab === 'distribution' ? '2px solid var(--gold)' : '2px solid transparent',
          }}
        >
          CATALOG CLASSIFICATION
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div style={{ animation: 'fade-in-up 200ms ease-out' }}>
          <p style={styles.statement}>
            In 1957, Earth orbit was empty. Today, {formatNumber(objects.length)} objects circle the planet. Most of them are junk.
          </p>
          <DebrisChart />
          
          <div style={styles.twoCol}>
            {/* Left: Density chart */}
            <div style={styles.colLeft}>
              <DensityChart />
            </div>

            {/* Right: Country breakdown */}
            <div style={styles.colRight}>
              <div style={styles.sectionLabel}>BY COUNTRY OF ORIGIN (DYNAMIC CATALOG)</div>
              <div style={styles.countryList}>
                {dynamicCountryBreakdown.map((c) => (
                  <div key={c.country} style={styles.countryRow}>
                    <span style={styles.countryName}>{c.country}</span>
                    <div style={styles.barTrack}>
                      <div
                        style={{
                          ...styles.barFill,
                          width: `${(c.count / maxCountry) * 100}%`,
                          transition: 'width 0.6s ease'
                        }}
                      />
                    </div>
                    <span style={styles.countryCount}>{formatNumber(c.count)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'threats' && (
        <div style={{ ...styles.tabContent, animation: 'fade-in-up 200ms ease-out' }}>
          <div style={styles.sectionLabel}>COLLISION PROBABILITY (Pc) vs MISS DISTANCE (TCA PROXIMITY)</div>
          <p style={{ ...styles.cardLabel, color: 'var(--t1)', marginBottom: 20 }}>
            Visual mapping of active hazard vectors. Larger bubbles indicate critical Defcon severity levels. Click objects on the main map to track specific paths.
          </p>
          {scatterData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--b0)" />
                <XAxis
                  type="number"
                  dataKey="missDistance"
                  name="Miss Distance"
                  unit=" km"
                  tick={{ fontFamily: "'Source Code Pro', monospace", fontSize: 9, fill: '#7a6a3a' }}
                  axisLine={false}
                  label={{ value: 'Miss Distance (km)', position: 'bottom', fill: 'var(--t2)', offset: 0, fontFamily: "'Rajdhani', sans-serif", fontSize: 11, fontWeight: 600 }}
                />
                <YAxis
                  type="number"
                  dataKey="pc"
                  name="Collision Probability"
                  tickFormatter={(v) => v.toExponential(0)}
                  tick={{ fontFamily: "'Source Code Pro', monospace", fontSize: 9, fill: '#7a6a3a' }}
                  axisLine={false}
                  label={{ value: 'Collision Probability (Pc)', angle: -90, position: 'left', fill: 'var(--t2)', fontFamily: "'Rajdhani', sans-serif", fontSize: 11, fontWeight: 600 }}
                />
                <ZAxis type="number" dataKey="size" range={[50, 400]} />
                <Tooltip content={<CustomScatterTooltip />} />
                <Scatter name="Active Conjunctions" data={scatterData}>
                  {scatterData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getDefconColor(entry.defcon)} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <div style={styles.emptyThreats}>
              <span>NO ACTIVE HAZARD VECTORS REGISTERED. ORBIT STABLE.</span>
            </div>
          )}
        </div>
      )}

      {activeTab === 'distribution' && (
        <div style={{ ...styles.twoCol, animation: 'fade-in-up 200ms ease-out', marginTop: 16 }}>
          {/* Pie 1: Object Types */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={styles.sectionLabel}>CATALOG OBJECT CLASSIFICATIONS</div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={objectTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  animationDuration={600}
                >
                  {objectTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatNumber(value)} />
              </PieChart>
            </ResponsiveContainer>
            <div style={styles.legendContainer}>
              {objectTypeData.map((d, i) => (
                <div key={i} style={styles.legendItem}>
                  <span style={{ ...styles.legendDot, background: d.color }} />
                  <span style={styles.legendLabel}>{d.name} ({formatNumber(d.value)})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pie 2: Altitude Regimes */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={styles.sectionLabel}>ALTITUDE REGIME DISTRIBUTION</div>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={regimeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  animationDuration={600}
                >
                  {regimeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatNumber(value)} />
              </PieChart>
            </ResponsiveContainer>
            <div style={styles.legendContainer}>
              {regimeData.map((d, i) => (
                <div key={i} style={styles.legendItem}>
                  <span style={{ ...styles.legendDot, background: d.color }} />
                  <span style={styles.legendLabel}>{d.name} ({formatNumber(d.value)})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stat statements */}
      <StatsGrid />

      {/* Historical & Active Alert Resolutions Section */}
      <div style={styles.resolutionsSection}>
        <div style={styles.sectionLabel}>REAL-TIME & HISTORICAL CONJUNCTION MITIGATION LOG</div>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>TARGET VECTOR</th>
                <th style={styles.th}>SECTOR / SHELL</th>
                <th style={styles.th}>MISS DISTANCE</th>
                <th style={styles.th}>PROBABILITY (Pc)</th>
                <th style={styles.th}>AEGIS MITIGATION Burn</th>
                <th style={styles.th}>RESOLUTION OUTCOME</th>
              </tr>
            </thead>
            <tbody>
              {/* Display active DB conjunctions first dynamically */}
              {conjunctions.map((c) => (
                <tr
                  key={c.id}
                  style={styles.tr}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-2)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <td style={{ ...styles.td, fontWeight: 600 }}>{c.primary.name} × {c.secondary.name}</td>
                  <td style={{ ...styles.td, fontFamily: "'Source Code Pro', monospace", fontSize: 12, color: 'var(--t2)' }}>
                    LEO {c.primary.altitude.toFixed(0)} km
                  </td>
                  <td style={{ ...styles.td, fontFamily: "'Source Code Pro', monospace", fontSize: 12, color: 'var(--t2)' }}>
                    {c.missDistance.toFixed(3)} km
                  </td>
                  <td style={{ ...styles.td, fontFamily: "'Source Code Pro', monospace", fontSize: 12, color: getDefconColor(c.defcon) }}>
                    {c.collisionPc.toExponential(2)}
                  </td>
                  <td style={{ ...styles.td, fontFamily: "'Source Code Pro', monospace", fontSize: 12, color: c.defcon <= 2 ? 'var(--red)' : 'var(--orange)' }}>
                    {c.recommendation?.action || (c.defcon <= 2 ? 'MANEUVER Burn' : 'MONITOR')}
                  </td>
                  <td style={{ ...styles.td, color: c.status === 'RESOLVED' ? 'var(--green)' : 'var(--gold)', fontWeight: 600 }}>
                    {c.status === 'RESOLVED' ? 'RESOLVED' : 'MONITORING'}
                  </td>
                </tr>
              ))}
              
              {/* Fallback to static historical events if database conjunctions are cleared */}
              {conjunctions.length === 0 && (
                <>
                  <tr
                    style={styles.tr}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-2)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td style={styles.td}>COSMOS-1500 × STARLINK-2847</td>
                    <td style={{ ...styles.td, fontFamily: "'Source Code Pro', monospace", fontSize: 12, color: 'var(--t2)' }}>LEO 550 km</td>
                    <td style={{ ...styles.td, fontFamily: "'Source Code Pro', monospace", fontSize: 12, color: 'var(--t2)' }}>1.8 km</td>
                    <td style={{ ...styles.td, fontFamily: "'Source Code Pro', monospace", fontSize: 12, color: 'var(--t2)' }}>1.4e-6</td>
                    <td style={{ ...styles.td, fontFamily: "'Source Code Pro', monospace", fontSize: 12, color: 'var(--red)' }}>MANEUVER (RETROGRADE BURN)</td>
                    <td style={{ ...styles.td, color: 'var(--green)', fontWeight: 600 }}>RESOLVED</td>
                  </tr>
                  <tr
                    style={styles.tr}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-2)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td style={styles.td}>COSMOS-2251 DEB × STARLINK-1007</td>
                    <td style={{ ...styles.td, fontFamily: "'Source Code Pro', monospace", fontSize: 12, color: 'var(--t2)' }}>LEO 550 km</td>
                    <td style={{ ...styles.td, fontFamily: "'Source Code Pro', monospace", fontSize: 12, color: 'var(--t2)' }}>2.1 km</td>
                    <td style={{ ...styles.td, fontFamily: "'Source Code Pro', monospace", fontSize: 12, color: 'var(--t2)' }}>3.8e-6</td>
                    <td style={{ ...styles.td, fontFamily: "'Source Code Pro', monospace", fontSize: 12, color: 'var(--red)' }}>MANEUVER (PROGRADE BURN)</td>
                    <td style={{ ...styles.td, color: 'var(--green)', fontWeight: 600 }}>RESOLVED</td>
                  </tr>
                  <tr
                    style={styles.tr}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-2)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td style={styles.td}>FENGYUN-1C DEB × SL-16 R/B</td>
                    <td style={{ ...styles.td, fontFamily: "'Source Code Pro', monospace", fontSize: 12, color: 'var(--t2)' }}>LEO 830 km</td>
                    <td style={{ ...styles.td, fontFamily: "'Source Code Pro', monospace", fontSize: 12, color: 'var(--t2)' }}>3.4 km</td>
                    <td style={{ ...styles.td, fontFamily: "'Source Code Pro', monospace", fontSize: 12, color: 'var(--t2)' }}>8.9e-8</td>
                    <td style={{ ...styles.td, fontFamily: "'Source Code Pro', monospace", fontSize: 12, color: 'var(--orange)' }}>MONITOR (No Action - Non-Maneuverable)</td>
                    <td style={{ ...styles.td, color: 'var(--green)', fontWeight: 600 }}>RESOLVED</td>
                  </tr>
                  <tr
                    style={styles.tr}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-2)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td style={styles.td}>ISS (ZARYA) × BREEZE-M FRAGMENT</td>
                    <td style={{ ...styles.td, fontFamily: "'Source Code Pro', monospace", fontSize: 12, color: 'var(--t2)' }}>LEO 415 km</td>
                    <td style={{ ...styles.td, fontFamily: "'Source Code Pro', monospace", fontSize: 12, color: 'var(--t2)' }}>150 m</td>
                    <td style={{ ...styles.td, fontFamily: "'Source Code Pro', monospace", fontSize: 12, color: 'var(--red)' }}>4.8e-3</td>
                    <td style={{ ...styles.td, fontFamily: "'Source Code Pro', monospace", fontSize: 12, color: 'var(--orange)' }}>SOYUZ EMERGENCY SHELTER</td>
                    <td style={{ ...styles.td, color: 'var(--green)', fontWeight: 600 }}>RESOLVED</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 40,
    left: 0,
    right: 0,
    bottom: 28,
    zIndex: 20,
    overflowY: 'auto',
    padding: '32px 48px',
    animation: 'fade-in-up 280ms cubic-bezier(0.22, 1, 0.36, 1)',
    background: 'rgba(6, 5, 10, 0.91)',
    backdropFilter: 'blur(16px) saturate(110%)',
    WebkitBackdropFilter: 'blur(16px) saturate(110%)',
    border: '1px solid rgba(255, 194, 0, 0.09)',
    borderRadius: '4px',
  },
  header: {
    marginBottom: 24,
  },
  headerLabel: {
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 700,
    fontSize: 11,
    letterSpacing: '0.14em',
    color: 'var(--t2)',
    marginBottom: 4,
  },
  headerSub: {
    fontFamily: "'Source Code Pro', monospace",
    fontSize: 11,
    color: 'var(--t2)',
    marginBottom: 16,
  },
  headerRule: {
    height: 0.5,
    background: 'var(--b1)',
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16,
    marginBottom: 24,
  },
  card: {
    background: 'var(--bg-1)',
    border: '1px solid var(--b1)',
    padding: '16px 20px',
    borderRadius: 4,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  cardVal: {
    fontFamily: "'Source Code Pro', monospace",
    fontSize: 28,
    fontWeight: 300,
    color: 'var(--t0)',
    lineHeight: 1.1,
  },
  cardLabel: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--t2)',
    letterSpacing: '0.08em',
  },
  tabBar: {
    display: 'flex',
    gap: 24,
    borderBottom: '0.5px solid var(--b1)',
    marginBottom: 24,
    flexShrink: 0,
  },
  tabBtn: {
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 700,
    fontSize: 12,
    letterSpacing: '0.1em',
    padding: '12px 4px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  tabContent: {
    background: 'var(--bg-1)',
    border: '1px solid var(--b1)',
    borderRadius: 4,
    padding: '24px',
    marginBottom: 24,
  },
  statement: {
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 300,
    fontSize: 28,
    color: 'var(--t1)',
    maxWidth: 700,
    lineHeight: 1.3,
    marginBottom: 36,
  },
  twoCol: {
    display: 'flex',
    gap: 48,
    marginBottom: 0,
  },
  colLeft: {
    flex: '3 1 0',
  },
  colRight: {
    flex: '2 1 0',
  },
  sectionLabel: {
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 700,
    fontSize: 10,
    letterSpacing: '0.12em',
    color: 'var(--t2)',
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  countryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  countryRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  countryName: {
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 500,
    fontSize: 12,
    color: 'var(--t1)',
    width: 70,
    flexShrink: 0,
  },
  barTrack: {
    flex: 1,
    height: 2,
    background: 'var(--bg-3)',
    position: 'relative',
  },
  barFill: {
    height: 2,
    background: 'var(--gold)',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  countryCount: {
    fontFamily: "'Source Code Pro', monospace",
    fontSize: 11,
    color: 'var(--t1)',
    width: 50,
    textAlign: 'right',
    flexShrink: 0,
  },
  emptyThreats: {
    height: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Source Code Pro', monospace",
    fontSize: 12,
    color: 'var(--t2)',
    border: '1px dashed var(--b1)',
  },
  legendContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px 24px',
    justifyContent: 'center',
    marginTop: 12,
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
  },
  legendLabel: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: 11,
    fontWeight: 500,
    color: 'var(--t1)',
  },
  resolutionsSection: {
    marginTop: 32,
    marginBottom: 40,
  },
  tableWrap: {
    background: 'var(--bg-1)',
    border: '1px solid var(--b1)',
    borderRadius: 4,
    marginTop: 16,
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: 13,
  },
  thRow: {
    borderBottom: '1px solid var(--b2)',
  },
  th: {
    padding: '10px 16px',
    textAlign: 'left',
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--t3)',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
  },
  tr: {
    borderBottom: '1px solid var(--b0)',
    transition: 'background var(--ms-0)',
    cursor: 'pointer',
  },
  td: {
    padding: '12px 16px',
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--t0)',
  },
};
