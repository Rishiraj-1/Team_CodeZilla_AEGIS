import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const start = Date.now();
    
    // Test database connectivity
    const { error } = await supabase.from('objects').select('id').limit(1);
    const dbHealthy = !error;
    const geminiHealthy = !!process.env.GEMINI_API_KEY;

    return NextResponse.json({
      status: dbHealthy && geminiHealthy ? 'ONLINE' : 'DEGRADED',
      database: dbHealthy ? 'CONNECTED' : 'ERROR',
      gemini: geminiHealthy ? 'CONFIGURED' : 'MISSING_KEY',
      agents: {
        SENTINEL: 'ACTIVE',
        ANALYST: 'ACTIVE',
        COMMANDER: 'ACTIVE',
        HERALD: 'ACTIVE'
      },
      latencyMs: Date.now() - start
    });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ status: 'OFFLINE', error: error.message }, { status: 500 });
  }
}
