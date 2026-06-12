import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') ?? 'ACTIVE';
    const minDefcon = searchParams.get('minDefcon'); // e.g. "3" means DEFCON 3 or more severe (1, 2, 3)
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '50');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('conjunctions')
      .select(`
        *,
        object_a:objects!conjunctions_object_a_norad_fkey(*),
        object_b:objects!conjunctions_object_b_norad_fkey(*),
        agent_logs(*)
      `, { count: 'exact' });

    if (status !== 'ALL') {
      query = query.eq('status', status);
    }

    if (minDefcon) {
      const minDefconVal = parseInt(minDefcon);
      // In DEFCON, lower numbers (1, 2) are higher severity.
      // So "minDefcon = 3" means DEFCON <= 3.
      query = query.lte('defcon_level', minDefconVal);
    }

    query = query
      .order('time_of_closest_approach', { ascending: true })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, count, page, limit });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
