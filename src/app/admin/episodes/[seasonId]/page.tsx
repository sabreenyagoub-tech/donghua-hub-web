import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { upsertEpisode, bulkInsertEpisodes, deleteEpisode, upsertSource } from '@/lib/actions';
import SubtitleUploaderRouter from '@/components/admin/SubtitleUploaderRouter';
import { Trash2, Plus, ListVideo } from 'lucide-react';
import { QUALITY_OPTIONS } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminEpisodes({ params }: { params: { seasonId: string } }) {
  const supabase = createClient();
  const { data: season } = await supabase.from('seasons').select('*, donghua:donghua_id(id,title_ar,slug)').eq('id', params.seasonId).maybeSingle();
  if (!season) notFound();
  const s = season as any;
  const [{ data: episodes }, { data: sources }, { data: downloads }, { data: subs }] = await Promise.all([
    supabase.from('episodes').select('*').eq('season_id', s.id).order('episode_number'),
    supabase.from('video_sources').select('*, episodes!inner(season_id)').eq('episodes.season_id', s.id),
    supabase.from('download_sources').select('*, episodes!inner(season_id)').eq('episodes.season_id', s.id),
    supabase.from('subtitle_files').select('*, episodes!inner(season_id)').eq('episodes.season_id', s.id),
  ]);
  const eps = (episodes as any[]) ?? [];

  return (
    <div>
      <div className="mb-4">
        <Link href={`/admin/donghua/${s.donghua.id}`} className="text-sm text-gray-400 hover:text-white">← {s.donghua.title_ar}</Link>
        <h1 className="text-2xl font-black">حلقات {s.title_ar ?? `الموسم ${s.season_number}`} ({eps.length})</h1>
      </div>

      {/* قائمة الحلقات */}
      <div className="mb-6 overflow-x-auto rounded-2xl border border-white/5 bg-ink-850">
        <table className="w-full text-sm">
          <thead className="border-b border-white/5 text-gray-400"><tr><th className="p-3 text-right">#</th><th className="p-3 text-right">العنوان</th><th className="p-3 text-right">الحالة</th><th className="p-3 text-right">مشاهدة</th><th className="p-3 text-right">إجراء</th></tr></thead>
          <tbody>
            {eps.map(e => (
              <tr key={e.id} className="border-b border-white/5">
                <td className="p-3 font-bold">{e.episode_number}</td>
                <td className="p-3">{e.title_ar ?? '—'}</td>
                <td className="p-3">{e.status === 'published' ? <span className="text-green-400">منشورة</span> : <span className="text-gray-500">{e.status}</span>}</td>
                <td className="p-3"><Link href={`/watch/${e.id}`} target="_blank" className="text-brand text-xs">عرض</Link></td>
                <td className="p-3">
                  <form action={deleteEpisode} onSubmit={(ev) => { if (!confirm('حذف هذه الحلقة؟')) ev.preventDefault(); }} className="inline">
                    <input type="hidden" name="id" value={e.id} /><input type="hidden" name="season_id" value={s.id} />
                    <button className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10"><Trash2 size={14} /></button>
                  </form>
                </td>
              </tr>
            ))}
            {!eps.length && <tr><td colSpan={5} className="p-6 text-center text-gray-500">لا توجد حلقات بعد.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* إضافة حلقة واحدة */}
        <form action={upsertEpisode} className="space-y-3 rounded-2xl border border-white/5 bg-ink-850 p-5">
          <h2 className="font-extrabold flex items-center gap-2"><Plus size={16} /> إضافة حلقة</h2>
          <input type="hidden" name="season_id" value={s.id} />
          <div className="grid grid-cols-2 gap-2">
            <input name="episode_number" type="number" required placeholder="رقم الحلقة *" className="rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm" />
            <input name="title_ar" placeholder="العنوان (اختياري)" className="rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm" />
            <input name="air_date" type="date" className="rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm" />
            <input name="duration_seconds" type="number" placeholder="المدة بالثواني" className="rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm" />
            <select name="status" className="rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm">
              <option value="published">منشورة فورًا</option><option value="draft">مسودة</option><option value="scheduled">مجدولة</option>
            </select>
            <button className="rounded-lg py-2 text-sm font-bold text-white" style={{ background: 'var(--brand)' }}>إضافة</button>
          </div>
          <textarea name="description" rows={2} placeholder="وصف الحلقة (اختياري)" className="w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm" />
        </form>

        {/* إدخال جماعي */}
        <form action={bulkInsertEpisodes} className="space-y-3 rounded-2xl border border-white/5 bg-ink-850 p-5">
          <h2 className="font-extrabold flex items-center gap-2"><ListVideo size={16} /> إدخال جماعي</h2>
          <input type="hidden" name="season_id" value={s.id} />
          <p className="text-xs text-gray-400">كل سطر: <code className="text-brand">رقم|عنوان|تاريخ(YYYY-MM-DD)</code> — العنوان والتاريخ اختياريان. تنشر فورًا.</p>
          <textarea name="bulk" rows={6} placeholder={'1|بداية الرحلة|2024-01-05\n2|الاختبار\n3'} className="w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 font-mono text-xs" />
          <button className="w-full rounded-lg py-2 text-sm font-bold text-white" style={{ background: 'var(--brand)' }}>إضافة الكل</button>
        </form>

        {/* مصدر مشاهدة */}
        <form action={upsertSource} className="space-y-3 rounded-2xl border border-white/5 bg-ink-850 p-5">
          <h2 className="font-extrabold">إضافة مصدر مشاهدة</h2>
          <input type="hidden" name="kind" value="video" />
          <select name="episode_id" required className="w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm">
            <option value="">اختر الحلقة…</option>
            {eps.map(e => <option key={e.id} value={e.id}>الحلقة {e.episode_number}{e.title_ar ? ` — ${e.title_ar}` : ''}</option>)}
          </select>
          <input name="url" required placeholder="رابط المصدر (mp4 / m3u8 / صفحة خارجية)" className="w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm" />
          <div className="grid grid-cols-3 gap-2">
            <select name="source_type" className="rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm"><option value="mp4">MP4</option><option value="hls">HLS (m3u8)</option><option value="external_page">صفحة خارجية</option></select>
            <select name="quality" className="rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm">{QUALITY_OPTIONS.map(q => <option key={q} value={q}>{q}</option>)}</select>
            <input name="label" placeholder="ملصق (مثال: سيرفر 1)" className="rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm" />
          </div>
          <input name="rights_notes" placeholder="ملاحظات حقوق الاستخدام" className="w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm" />
          <button className="w-full rounded-lg py-2 text-sm font-bold text-white" style={{ background: 'var(--brand)' }}>إضافة المصدر</button>
          <p className="text-xs text-gray-500">مصادر مسجلة هذا الموسم: {(sources as any[] ?? []).length}</p>
        </form>

        {/* مصدر تنزيل */}
        <form action={upsertSource} className="space-y-3 rounded-2xl border border-white/5 bg-ink-850 p-5">
          <h2 className="font-extrabold">إضافة رابط تنزيل (مصرح به فقط)</h2>
          <input type="hidden" name="kind" value="download" />
          <select name="episode_id" required className="w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm">
            <option value="">اختر الحلقة…</option>
            {eps.map(e => <option key={e.id} value={e.id}>الحلقة {e.episode_number}</option>)}
          </select>
          <input name="url" required placeholder="رابط التنزيل المباشر" className="w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <select name="quality" className="rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm">{QUALITY_OPTIONS.filter(q => q !== 'auto').map(q => <option key={q} value={q}>{q}</option>)}</select>
            <input name="file_size_bytes" type="number" placeholder="الحجم بالبايت (اختياري)" className="rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm" />
          </div>
          <input name="rights_notes" placeholder="ملاحظات الترخيص" className="w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm" />
          <button className="w-full rounded-lg py-2 text-sm font-bold text-white" style={{ background: 'var(--brand)' }}>إضافة رابط التنزيل</button>
          <p className="text-xs text-gray-500">روابط تنزيل مسجلة: {(downloads as any[] ?? []).length}</p>
        </form>

        {/* رفع ترجمة */}
        <div className="rounded-2xl border border-white/5 bg-ink-850 p-5 lg:col-span-2">
          <h2 className="mb-3 font-extrabold">رفع ملف ترجمة</h2>
          <SubtitleUploaderRouter episodes={eps.map(e => ({ id: e.id, episode_number: e.episode_number, title_ar: e.title_ar }))} />
          <p className="mt-2 text-xs text-gray-500">ترجمات هذا الموسم: {(subs as any[] ?? []).length}</p>
        </div>
      </div>
    </div>
  );
}
