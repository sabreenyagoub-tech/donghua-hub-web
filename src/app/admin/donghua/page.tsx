import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Plus, Pencil, Trash2, Copy } from 'lucide-react';
import { deleteDonghua, duplicateDonghua } from '@/lib/actions';
import { statusLabel } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminDonghuaList() {
  const supabase = createClient();
  const { data } = await supabase.from('donghua').select('*').order('added_at', { ascending: false }).limit(200);
  const items = (data as any[]) ?? [];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-black">إدارة الأعمال ({items.length})</h1>
        <Link href="/admin/donghua/new" className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white" style={{ background: 'var(--brand)' }}><Plus size={16} /> إضافة عمل</Link>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-white/5 bg-ink-850">
        <table className="w-full text-sm">
          <thead className="border-b border-white/5 text-gray-400">
            <tr><th className="p-3 text-right">العمل</th><th className="p-3 text-right">الحالة</th><th className="p-3 text-right">منشور؟</th><th className="p-3 text-right">الحلقات</th><th className="p-3 text-right">المشاهدات</th><th className="p-3 text-right">إجراءات</th></tr>
          </thead>
          <tbody>
            {items.map(d => (
              <tr key={d.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="p-3">
                  <div className="font-bold">{d.title_ar}</div>
                  <div className="text-xs text-gray-500">{d.title_en ?? ''}</div>
                </td>
                <td className="p-3">{statusLabel(d.status)}</td>
                <td className="p-3">{d.is_published ? <span className="text-green-400">نعم</span> : <span className="text-gray-500">مسودة</span>}</td>
                <td className="p-3">{d.current_episode}{d.total_episodes ? `/${d.total_episodes}` : ''}</td>
                <td className="p-3">{d.view_count}</td>
                <td className="p-3">
                  <div className="flex gap-1">
                    <Link href={`/admin/donghua/${d.id}`} className="rounded-lg p-1.5 hover:bg-white/10" title="تعديل"><Pencil size={14} /></Link>
                    <form action={duplicateDonghua}><input type="hidden" name="id" value={d.id} /><button className="rounded-lg p-1.5 hover:bg-white/10" title="تكرار"><Copy size={14} /></button></form>
                    <form action={deleteDonghua} onSubmit={(e) => { if (!confirm('تأكيد حذف العمل وكل مواسميه وحلقاته؟')) e.preventDefault(); }}>
                      <input type="hidden" name="id" value={d.id} />
                      <button className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10" title="حذف"><Trash2 size={14} /></button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan={6} className="p-8 text-center text-gray-500">لا توجد أعمال. أضف أول عمل.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
