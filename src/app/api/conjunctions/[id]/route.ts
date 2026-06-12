import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch the conjunction and its objects
    const { data: conjunction, error: conjError } = await supabase
      .from('conjunctions')
      .select(`
        *,
        object_a:objects!conjunctions_object_a_norad_fkey(*),
        object_b:objects!conjunctions_object_b_norad_fkey(*)
      `)
      .eq('id', id)
      .single();

    if (conjError || !conjunction) {
      return NextResponse.json(
        { error: conjError?.message || 'Conjunction not found' },
        { status: 404 }
      );
    }

    // Fetch associated agent logs
    const { data: agentLogs, error: logsError } = await supabase
      .from('agent_logs')
      .select('*')
      .eq('conjunction_id', id)
      .order('created_at', { ascending: true });

    if (logsError) {
      return NextResponse.json({ error: logsError.message }, { status: 500 });
    }

    return NextResponse.json({
      ...conjunction,
      agent_logs: agentLogs || []
    });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
