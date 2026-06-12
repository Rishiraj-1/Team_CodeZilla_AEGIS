import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateContentSafe } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { message, sessionId } = await req.json();

    if (!message || !sessionId) {
      return NextResponse.json({ error: 'Message and sessionId are required' }, { status: 400 });
    }

    // Extract query terms for specific object lookup
    const noradMatches = message.match(/\b\d{5}\b/);
    const noradSearchId = noradMatches ? noradMatches[0] : null;
    
    const searchWords = message.split(/\s+/)
      .map((w: string) => w.replace(/[^a-zA-Z0-9-]/g, '').trim())
      .filter((w: string) => w.length > 3 && !['about', 'status', 'where', 'what', 'find', 'show', 'tell', 'aegis', 'debris', 'satellite', 'track'].includes(w.toLowerCase()));
    const nameSearchWord = searchWords.length > 0 ? searchWords[0] : null;

    // 1. Fetch current orbital context + specific object if requested
    const [objectsRes, activeConjRes, criticalConjRes, topThreatsRes, specificObjNoradRes, specificObjNameRes] = await Promise.all([
      supabaseAdmin.from('objects').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('conjunctions').select('id', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
      supabaseAdmin.from('conjunctions').select('id', { count: 'exact', head: true }).lte('defcon_level', 2).eq('status', 'ACTIVE'),
      supabaseAdmin.from('conjunctions')
        .select(`
          *,
          object_a:objects!conjunctions_object_a_norad_fkey(name),
          object_b:objects!conjunctions_object_b_norad_fkey(name)
        `)
        .eq('status', 'ACTIVE')
        .order('defcon_level', { ascending: true })
        .limit(3),
      noradSearchId ? supabaseAdmin.from('objects').select('*').eq('norad_id', noradSearchId).maybeSingle() : Promise.resolve({ data: null, error: null }),
      (nameSearchWord && !noradSearchId) ? supabaseAdmin.from('objects').select('*').ilike('name', `%${nameSearchWord}%`).limit(1) : Promise.resolve({ data: null, error: null })
    ]);

    const totalObjects = objectsRes.count ?? 0;
    const activeConjunctions = activeConjRes.count ?? 0;
    const criticalConjunctions = criticalConjRes.count ?? 0;
    const topThreats = topThreatsRes.data || [];

    const specificObj = specificObjNoradRes?.data || (specificObjNameRes?.data && specificObjNameRes.data[0]) || null;
    let specificObjectContext = '';
    if (specificObj) {
      specificObjectContext = `
Specific Telemetry Info for "${specificObj.name}" (${specificObj.norad_id}):
- Type: ${specificObj.object_type}
- Status: ${specificObj.is_active ? 'Operational (Active)' : 'Derelict / Inactive'}
- Country: ${specificObj.country || 'Unknown'}
- Altitude: ${specificObj.altitude_km ? specificObj.altitude_km.toFixed(1) : 'N/A'} km
- Inclination: ${specificObj.inclination_deg ? specificObj.inclination_deg.toFixed(2) : 'N/A'}°
- Period: ${specificObj.period_min ? specificObj.period_min.toFixed(2) : 'N/A'} min
- Risk Score: ${specificObj.risk_score || 0}
- TLE Line 1: ${specificObj.tle_line1 || 'N/A'}
- TLE Line 2: ${specificObj.tle_line2 || 'N/A'}
`;
    }

    const orbitalContext = `
- Total tracked objects in database: ${totalObjects}
- Active conjunction events: ${activeConjunctions}
- Critical alerts (DEFCON 1 or 2): ${criticalConjunctions}
- Top active threats:
${topThreats.map((t: any) => `  * ${t.object_a?.name || t.object_a_norad} vs ${t.object_b?.name || t.object_b_norad}: Miss distance = ${t.miss_distance_km.toFixed(3)} km, Collision Pc = ${t.collision_probability.toExponential(2)}, DEFCON level = ${t.defcon_level}`).join('\n')}
${specificObjectContext ? `\n- USER REQUESTED OBJECT DETAILS:\n${specificObjectContext}` : ''}
`;

    const CHAT_SYSTEM_PROMPT = `You are AEGIS (Autonomous Earth-Orbit Guardian & Intelligence System), a defense-grade satellite collision prediction and mitigation AI.
Your tone is tactical, precise, and extremely concise. You speak to busy orbital operators who require immediate, actionable briefings.

RULES:
1. NEVER output long introductory or concluding text (e.g. "Certainly, here is...", "Hope this helps"). Be direct and start answering immediately.
2. Structure your response using brief, bold headers or bullet points.
3. Keep the total length under 4-5 sentences.
4. Utilize the following real-time orbital intelligence context:
${orbitalContext}
5. If the user asks about a specific satellite and details are found under "USER REQUESTED OBJECT DETAILS", summarize its telemetry (altitude, type, status, risk score) clearly and briefly.

Example format for threats:
- **Threat Vector**: [Object A] × [Object B]
- **Collision Probability (Pc)**: [Pc]
- **DEFCON Level**: [DEFCON]
- **Maneuver Recommendation**: [Maneuver plan or MONITOR status]`;

    // 2. Persist user message in DB
    await supabaseAdmin.from('chat_messages').insert({
      session_id: sessionId,
      role: 'user',
      content: message
    });

    // 3. Retrieve chat history
    const { data: history } = await supabaseAdmin
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    // Format for Gemini API (alternating user/model)
    const rawMessages = (history || [])
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }))
      .filter(msg => msg.parts[0].text.trim() !== '');

    // Clean and strictly alternate the chat history to satisfy Gemini API constraints
    const formattedMessages: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
    for (const msg of rawMessages) {
      const role = msg.role as 'user' | 'model';
      if (formattedMessages.length === 0) {
        if (role === 'user') {
          formattedMessages.push({ role, parts: msg.parts });
        }
        continue;
      }
      
      const last = formattedMessages[formattedMessages.length - 1];
      if (last.role === role) {
        last.parts[0].text += '\n' + msg.parts[0].text;
      } else {
        formattedMessages.push({ role, parts: msg.parts });
      }
    }

    // Fallback if formatting was empty
    if (formattedMessages.length === 0) {
      formattedMessages.push({ role: 'user', parts: [{ text: message }] });
    }

    // 4. Call Gemini API safely
    const reply = await generateContentSafe(formattedMessages, {
      systemInstruction: CHAT_SYSTEM_PROMPT,
      maxOutputTokens: 800,
      temperature: 0.2,
      timeoutMs: 12000,
    });

    // 5. Persist AEGIS reply in DB
    await supabaseAdmin.from('chat_messages').insert({
      session_id: sessionId,
      role: 'aegis',
      content: reply
    });

    return NextResponse.json({ reply });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
