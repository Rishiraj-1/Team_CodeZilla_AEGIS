import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // 1. Authorization check
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const results: any = {};
  const baseUrl = new URL(req.url).origin;

  try {
    // 2. Trigger conjunction scanning
    const scanRes = await fetch(`${baseUrl}/api/agents/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (scanRes.ok) {
      results.scan = await scanRes.json();
    } else {
      results.scan = { error: `HTTP ${scanRes.status}: ${await scanRes.text()}` };
    }

    // 3. Trigger full agent pipeline run
    const runRes = await fetch(`${baseUrl}/api/agents/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (runRes.ok) {
      results.run = await runRes.json();
    } else {
      results.run = { error: `HTTP ${runRes.status}: ${await runRes.text()}` };
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results
    });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
