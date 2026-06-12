import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const [objectsRes, conjunctionsRes, criticalRes] = await Promise.all([
    supabase.from('objects').select('object_type', { count: 'exact' }),
    supabase.from('conjunctions')
      .select('defcon_level, status', { count: 'exact' })
      .eq('status', 'ACTIVE'),
    supabase.from('conjunctions')
      .select('id', { count: 'exact' })
      .lte('defcon_level', 2)
      .eq('status', 'ACTIVE'),
  ]);

  const typeCounts = (objectsRes.data || []).reduce((acc, obj) => {
    acc[obj.object_type] = (acc[obj.object_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return NextResponse.json({
    totalTracked: objectsRes.count ?? 0,
    payloads: typeCounts['PAYLOAD'] ?? 0,
    debris: typeCounts['DEBRIS'] ?? 0,
    rocketBodies: typeCounts['ROCKET_BODY'] ?? 0,
    activeConjunctions: conjunctionsRes.count ?? 0,
    criticalAlerts: criticalRes.count ?? 0,
    lastUpdated: new Date().toISOString(),
  });
}
