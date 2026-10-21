'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Trash2, Save } from 'lucide-react';

export default function ProfileSettings({ initial }: { initial: any }) {
  const supabase = createClient();
  const router = useRouter();
  const [form, setForm] = useState({
    display_name: initial?.display_name ?? '',
    language: initial?.language ?? 'ar',
    autoplay_next: initial?.autoplay_next ?? true,
    notify_enabled: initial?.notify_enabled ?? true,
    subtitle_size: initial?.subtitle_size ?? 'medium',
  });
  const [msg, setMsg] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('profiles').update(form).eq('id', (await supabase.auth.getUser()).data.user!.id);
    setMsg(error ? error.message : 'تم الحفظ.');
    router.refresh();
  };

  const deleteAccount = async () => {
    if (!confirm('سيُحذف حسابك وكل بياناتك نهائيًا. متابعة؟')) return;
    const r = await fetch('/api/account/delete', { method: 'POST' });
    if (r.ok) { await supabase.auth.signOut(); router.push('/'); }
    else alert('فشل حذف الحساب.');
  };

  return (
    <form onSubmit={save} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <label className="text-xs text-gray-400">الاسم الظاهر<input value={form.display_name} onChange={e => setForm({ ...form, display_name: e.target.value })} className="mt-1 w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm" /></label>
      <label className="text-xs text-gray-400">اللغة
        <select value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} className="mt-1 w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm">
          <option value="ar">العربية</option><option value="en">English</option>
        </select>
      </label>
      <label className="text-xs text-gray-400">حجم الترجمة
        <select value={form.subtitle_size} onChange={e => setForm({ ...form, subtitle_size: e.target.value })} className="mt-1 w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm">
          <option value="small">صغير</option><option value="medium">متوسط</option><option value="large">كبير</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm pt-5"><input type="checkbox" checked={form.autoplay_next} onChange={e => setForm({ ...form, autoplay_next: e.target.checked })} /> تشغيل الحلقة التالية تلقائيًا</label>
      <label className="flex items-center gap-2 text-sm pt-5"><input type="checkbox" checked={form.notify_enabled} onChange={e => setForm({ ...form, notify_enabled: e.target.checked })} /> تفعيل الإشعارات</label>
      <div className="sm:col-span-2 flex items-center gap-3 pt-4">
        <button className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white" style={{ background: 'var(--brand)' }}><Save size={14} /> حفظ</button>
        {msg && <span className="text-xs text-green-400">{msg}</span>}
      </div>
      <div className="sm:col-span-4 border-t border-white/5 pt-4">
        <button type="button" onClick={deleteAccount} className="flex items-center gap-2 rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"><Trash2 size={14} /> طلب حذف الحساب والبيانات</button>
      </div>
    </form>
  );
}
