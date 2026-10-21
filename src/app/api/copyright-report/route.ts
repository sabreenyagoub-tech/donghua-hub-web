import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.email || !body.description) return NextResponse.json({ error: 'missing fields' }, { status: 400 });
    if (String(body.description).length > 5000) return NextResponse.json({ error: 'too long' }, { status: 400 });
    const admin = createAdminClient();
    await admin.from('copyright_reports').insert({
      reporter_name: body.name ?? null,
      reporter_email: String(body.email).slice(0, 200),
      reported_url: body.url ?? null,
      description: String(body.description).slice(0, 5000),
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
