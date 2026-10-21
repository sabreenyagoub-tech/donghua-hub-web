import { createClient } from '@/lib/supabase/server';
import { updateReport } from '@/lib/actions';
import { Flag } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminReports() {
  const supabase = createClient();
  const { data } = await supabase.from('copyright_reports').select('*, donghua:donghua_id(title_ar,slug)').order('created_at', { ascending: false }).limit(200);
  const items = (data as any[]) ?? [];
  const statuses = [
    { v: 'pending', l: 'قيد الانتظار' }, { v: 'reviewed', l: 'تمت المراجعة' },
    { v: 'content_removed', l: 'تم إخفاء المحتوى' }, { v: 'rejected', l: 'مرفوض' },
  ];
  return (
    <div>
      <h1 className="mb-4 text-2xl font-black flex items-center gap-2"><Flag size={22} /> بلاغات حقوق النشر ({items.length})</h1>
      <div className="space-y-3">
        {items.map(r => (
          <div key={r.id} className="rounded-2xl border border-white/5 bg-ink-850 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-bold text-sm">{r.reporter_name ?? 'مجهول'} <span className="text-gray-500 font-normal">· {r.reporter_email}</span></div>
              <span className={`rounded px-2 py-0.5 text-xs font-bold ${r.status === 'pending' ? 'bg-amber-500/20 text-amber-300' : r.status === 'content_removed' ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>{statuses.find(s => s.v === r.status)?.l}</span>
            </div>
            <p className="mt-2 text-sm text-gray-300 whitespace-pre-line">{r.description}</p>
            {r.reported_url && <p className="mt-1 text-xs text-gray-500 break-all">الرابط: {r.reported_url}</p>}
            {r.donghua && <p className="mt-1 text-xs text-brand">العمل المبلَغ عنه: {r.donghua.title_ar}</p>}
            <form action={updateReport} className="mt-3 flex flex-wrap gap-2 items-center">
              <input type="hidden" name="id" value={r.id} />
              <select name="status" defaultValue={r.status} className="rounded-lg border border-white/10 bg-ink-900 px-3 py-1.5 text-xs">
                {statuses.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
              </select>
              <button className="rounded-lg px-3 py-1.5 text-xs font-bold text-white" style={{ background: 'var(--brand)' }}>تحديث الحالة</button>
              <span className="text-xs text-gray-500">اختيار «تم إخفاء المحتوى» يخفي العمل تلقائيًا (copyright_hold).</span>
            </form>
          </div>
        ))}
        {!items.length && <div className="rounded-2xl border border-white/5 bg-ink-850 p-8 text-center text-gray-500">لا توجد بلاغات.</div>}
      </div>
    </div>
  );
}
