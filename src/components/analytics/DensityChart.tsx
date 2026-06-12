import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis,
  ResponsiveContainer, Cell,
} from 'recharts';
import { useAegis } from '@/context/AegisContext';

export default function DensityChart() {
  const { objects } = useAegis();

  const shellData = React.useMemo(() => {
    const shells = [
      { name: 'VLEO / ISS (<450km)', count: 0, min: 0, max: 450 },
      { name: 'Starlink (450-600km)', count: 0, min: 450, max: 600 },
      { name: 'LEO Core (600-900km)', count: 0, min: 600, max: 900 },
      { name: 'LEO Outer (900-2000km)', count: 0, min: 900, max: 2000 },
      { name: 'MEO Region (2k-35k km)', count: 0, min: 2000, max: 35000 },
      { name: 'GEO Ring (>=35k km)', count: 0, min: 35000, max: 1000000 },
    ];

    objects.forEach(obj => {
      const alt = obj.altitude || 0;
      for (const shell of shells) {
        if (alt >= shell.min && alt < shell.max) {
          shell.count++;
          break;
        }
      }
    });

    return shells.map(({ name, count }) => ({ name, count }));
  }, [objects]);

  const maxCount = Math.max(...shellData.map(s => s.count), 1);

  return (
    <div>
      <div style={styles.label}>
        <span>OBJECTS BY ORBITAL SHELL DEPLOYMENT</span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={shellData}
          layout="vertical"
          margin={{ top: 0, right: 20, bottom: 0, left: 0 }}
          barSize={8}
          barGap={20}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 11, fill: '#c8b070' }}
            axisLine={false}
            tickLine={false}
            width={120}
          />
          <Bar dataKey="count" radius={0} animationDuration={600}>
            {shellData.map((entry, index) => {
              const ratio = entry.count / maxCount;
              // Gradient from gold to red by density
              const r = Math.round(255 * (0.76 + 0.24 * ratio));
              const g = Math.round(194 * (1 - ratio * 0.6));
              const b = 0;
              return <Cell key={index} fill={`rgb(${r},${g},${b})`} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  label: {
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 700,
    fontSize: 10,
    letterSpacing: '0.12em',
    color: 'var(--t2)',
    marginBottom: 16,
  },
};
