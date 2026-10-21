import { createClient } from '@/lib/supabase/server';
import { deleteSubtitle } from '@/lib/actions';
import { Trash2, Subtitles } from 'lucide-react';
import { formatFileSize } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminSubtitles() {
  const supabase = createClient();
  const { data } = await supabase.from('subtitle_files').select('*, episodes:episode_id(episode_number, seasons:season_id(donghua:donghua_id(title_ar,slug)))').order('created_at', { ascending: false }).limit(200);
  const items = (data as any[]) ?? [];
  return (
    <div>
      <h1 className="mb-4 text-2xl font-black flex items-center gap-2"><Subtitles size={22} /> ملفات الترجمة ({items.length})</h1>
      <div className="overflow-x-auto rounded-2xl border border-white/5 bg-ink-850">
        <table className="w-full text-sm">
          <thead className="border-b border-white/5 text-gray-400"><tr><th className="p-3 text-right">العمل / الحلقة</th><th className="p-3 text-right">الملف</th><th className="p-3 text-right">الصيغة</th><th className="p-3 text-right">المترجم</th><th className="p-3 text-right">الحجم</th><th className="p-3 text-right">الحالة</th><th className="p-3 text-right">حذف</th></tr></thead>
          <tbody>
            {items.map(s => (
              <tr key={s.id} className="border-b border-white/5">
                <td className="p-3">{s.episodes?.seasons?.donghua?.title_ar} — الحلقة {s.episodes?.episode_number}</td>
                <td className="p-3 text-xs">{s.original_filename}</td>
                <td className="p-3 uppercase">{s.format}</td>
                <td className="p-3">{s.translator_name ?? '—'}</td>
                <td className="p-3">{formatFileSize(s.file_size_bytes)}</td>
                <td className="p-3">{s.status === 'available' ? <span className="text-green-400">متاحة</span> : <span className="text-amber-400">{s.status}</span>}</td>
                <td className="p-3">
                  <form action={deleteSubtitle} onSubmit={(e) => { if (!confirm('حذف ملف الترجمة نهائيًا من التخزين؟')) e.preventDefault(); }}>
                    <input type="hidden" name="id" value={s.id} /><input type="hidden" name="storage_path" value={s.storage_path} />
                    <button className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10"><Trash2 size={14} /></button>
                  </form>
                </td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan={7} className="p-8 text-center text-gray-500">لا توجد ترجمات مرفوعة بعد.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
