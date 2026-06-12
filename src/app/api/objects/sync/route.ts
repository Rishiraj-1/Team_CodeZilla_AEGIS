import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { fetchAllTLEData } from '@/lib/celestrak';
import { computeAltitude, computePeriod } from '@/lib/orbital';

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const tleData = await fetchAllTLEData();
    let synced = 0;
    let updated = 0;

    // Upsert in batches of 100
    const BATCH = 100;
    for (let i = 0; i < tleData.length; i += BATCH) {
      const batch = tleData.slice(i, i + BATCH);

      const rows = batch.map(obj => ({
        norad_id: obj.noradId,
        name: obj.name,
        tle_line1: obj.tleLine1,
        tle_line2: obj.tleLine2,
        object_type: obj.objectType,
        country: obj.country,
        altitude_km: computeAltitude(obj.tleLine1, obj.tleLine2),
        period_min: computePeriod(obj.tleLine2),
        is_active: obj.objectType === 'PAYLOAD',
        updated_at: new Date().toISOString(),
      }));

      const { error, count } = await supabaseAdmin
        .from('objects')
        .upsert(rows, { onConflict: 'norad_id', count: 'exact' });

      if (!error) {
        synced += batch.length;
        updated += count ?? 0;
      }
    }

    const duration = Date.now() - startTime;

    // Log the sync
    await supabaseAdmin.from('sync_log').insert({
      source: 'celestrak',
      objects_synced: synced,
      objects_updated: updated,
      duration_ms: duration,
    });

    return NextResponse.json({ synced, updated, durationMs: duration });
  } catch (error) {
    const err = error as Error;
    await supabaseAdmin.from('sync_log').insert({
      source: 'celestrak',
      error: err.message,
      duration_ms: Date.now() - startTime,
    });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
