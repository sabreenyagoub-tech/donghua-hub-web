import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// رابط موقّع لملف ترجمة خاص (صلاحية 1 ساعة). عام — أي زائر يمكنه جلب ترجمة "متاحة".
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const subtitleId = searchParams.get('subtitleId');
  if (!subtitleId) return NextResponse.json({ error: 'subtitleId required' }, { status: 400 });
  const admin = createAdminClient();
  const { data: sub } = await admin.from('subtitle_files').select('storage_path, format, status').eq('id', subtitleId).single();
  if (!sub || sub.status !== 'available') return NextResponse.json({ error: 'not found' }, { status: 404 });
  const { data: signed } = await admin.storage.from('subtitles').createSignedUrl(sub.storage_path, 3600);
  if (!signed) return NextResponse.json({ error: 'sign failed' }, { status: 500 });
  return NextResponse.json({ signedUrl: signed.signedUrl, format: sub.format });
}
