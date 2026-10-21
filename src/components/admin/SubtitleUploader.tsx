'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { insertSubtitle } from '@/lib/actions';
import { Upload, Loader2, FileText } from 'lucide-react';

const ALLOWED_EXT = ['srt', 'vtt', 'ass', 'ssa'];
const MAX = 2 * 1024 * 1024;

export default function SubtitleUploader({ episodeId }: { episodeId: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ path: string; name: string; format: string; size: number } | null>(null);
  const supabase = createClient();

  const onFile = async (f: File) => {
    setErr(null); setMeta(null);
    const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_EXT.includes(ext)) return setErr('صيغة غير مدعومة. SRT / VTT / ASS / SSA فقط.');
    if (f.size > MAX) return setErr('حجم الملف أكبر من 2 ميجابايت.');
    setBusy(true);
    const path = `${episodeId}/${Date.now()}-${f.name.replace(/[^\w.\-]/g, '_')}`;
    const { error } = await supabase.storage.from('subtitles').upload(path, f, { contentType: 'text/plain', upsert: false });
    setBusy(false);
    if (error) return setErr('فشل الرفع: ' + error.message);
    setMeta({ path, name: f.name, format: ext, size: f.size });
  };

  if (!meta) return (
    <div>
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-white/15 bg-ink-900 p-5 text-xs text-gray-400 hover:border-brand">
        {busy ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
        {busy ? 'جارٍ الرفع...' : 'ارفع ملف الترجمة (SRT/VTT/ASS ≤ 2MB)'}
        <input type="file" accept=".srt,.vtt,.ass,.ssa" className="hidden" onChange={e => e.target.files?.[0] && onFile(e.target.files[0])} />
      </label>
      {err && <p className="mt-1 text-xs text-red-400">{err}</p>}
    </div>
  );

  return (
    <form action={insertSubtitle} className="rounded-xl border border-green-500/30 bg-green-500/5 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm text-green-300"><FileText size={16} /> {meta.name} ({(meta.size / 1024).toFixed(0)} KB) — رُفع بنجاح. أكمل البيانات:</div>
      {/* نستخدم إجراء الخادم عبر form action مباشرة */}
      <input type="hidden" name="episode_id" value={episodeId} />
      <input type="hidden" name="storage_path" value={meta.path} />
      <input type="hidden" name="original_filename" value={meta.name} />
      <input type="hidden" name="format" value={meta.format} />
      <input type="hidden" name="file_size_bytes" value={meta.size} />
      <div className="grid grid-cols-2 gap-2">
        <input name="translator_name" placeholder="اسم المترجم/الفريق" className="rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-xs" />
        <select name="language" className="rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-xs">
          <option value="ar">العربية</option><option value="en">الإنجليزية</option><option value="zh">الصينية</option>
        </select>
        <select name="status" className="rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-xs">
          <option value="available">متاحة</option><option value="reviewing">قيد المراجعة</option>
        </select>
        <label className="flex items-center gap-2 text-xs text-gray-300"><input type="checkbox" name="is_default" /> افتراضية</label>
      </div>
      <button type="submit" className="w-full rounded-lg py-2 text-xs font-bold text-white" style={{ background: 'var(--brand)' }}>حفظ الترجمة</button>
    </form>
  );
}
