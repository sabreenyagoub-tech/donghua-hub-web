import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// زيادة عداد المشاهدات (يستدعيه المشغل عند بدء التشغيل). خدمة فقط.
export async function POST(req: Request) {
  try {
    const { episodeId } = await req.json();
    if (!episodeId) return NextResponse.json({ error: 'episodeId required' }, { status: 400 });
    const admin = createAdminClient();
    const { data: ep } = await admin.from('episodes').select('view_count, season_id').eq('id', episodeId).single();
    if (!ep) return NextResponse.json({ error: 'episode not found' }, { status: 404 });
    await admin.from('episodes').update({ view_count: (ep.view_count ?? 0) + 1 }).eq('id', episodeId);
    const { data: season } = await admin.from('seasons').select('donghua_id').eq('id', ep.season_id).single();
    if (season) {
      const { data: dh } = await admin.from('donghua').select('view_count').eq('id', season.donghua_id).single();
      await admin.from('donghua').update({ view_count: (dh?.view_count ?? 0) + 1 }).eq('id', season.donghua_id);
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
