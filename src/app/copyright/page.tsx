'use client';
import { useState } from 'react';
import { AlertTriangle, Send } from 'lucide-react';

export default function CopyrightPage() {
  const [form, setForm] = useState({ name: '', email: '', url: '', description: '' });
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null);
    const r = await fetch('/api/copyright-report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (r.ok) setSent(true); else setErr('فشل الإرسال. حاول لاحقًا.');
  };

  if (sent) return (
    <div className="mx-auto mt-16 max-w-lg rounded-2xl border border-green-500/30 bg-green-500/10 p-8 text-center">
      <h1 className="text-xl font-black text-green-300">تم استلام البلاغ</h1>
      <p className="mt-2 text-sm text-gray-300">سيراجع فريقنا المحتوى خلال 48 ساعة ويتخذ الإجراء اللازم (إخفاء أو إزالة) وفق الإجراءات الموثقة.</p>
    </div>
  );

  return (
    <div className="mx-auto mt-10 max-w-lg">
      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
        <AlertTriangle className="text-amber-400 shrink-0" />
        <p className="text-sm text-gray-300">نحترم حقوق الملكية الفكرية. استخدم هذا النموذج للإبلاغ عن محتوى تنتهك حقوقك، وسنخفيه فورًا أثناء المراجعة.</p>
      </div>
      <h1 className="mb-4 text-2xl font-black">بلاغ حقوق النشر (DMCA)</h1>
      <form onSubmit={submit} className="space-y-3 rounded-2xl border border-white/5 bg-ink-850 p-6">
        <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="اسمك" className="w-full rounded-xl border border-white/10 bg-ink-900 px-4 py-3 text-sm" />
        <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="بريدك الإلكتروني" className="w-full rounded-xl border border-white/10 bg-ink-900 px-4 py-3 text-sm" />
        <input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="رابط المحتوى المُبلَغ عنه" className="w-full rounded-xl border border-white/10 bg-ink-900 px-4 py-3 text-sm" />
        <textarea required rows={5} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="صف حقوقك وأدلة الملكية..." className="w-full rounded-xl border border-white/10 bg-ink-900 px-4 py-3 text-sm" />
        <button className="flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold text-white" style={{ background: 'var(--brand)' }}>
          <Send size={16} /> إرسال البلاغ
        </button>
        {err && <p className="text-sm text-red-300">{err}</p>}
      </form>
    </div>
  );
}
