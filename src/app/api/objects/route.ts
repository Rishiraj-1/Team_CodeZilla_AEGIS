import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') ?? '1');
  const limit = parseInt(searchParams.get('limit') ?? '50');
  const offset = (page - 1) * limit;

  let query = supabase
    .from('objects')
    .select('*', { count: 'exact' })
    .order('risk_score', { ascending: false })
    .range(offset, offset + limit - 1);

  if (type && type !== 'ALL') query = query.eq('object_type', type);
  if (search) {
    query = query.or(
      `name.ilike.%${search}%,norad_id.ilike.%${search}%,country.ilike.%${search}%`
    );
  }

  const { data, count, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data, count, page, limit });
}
