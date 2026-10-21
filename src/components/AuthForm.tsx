'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function AuthForm({ mode }: { mode: 'login' | 'register' | 'reset' }) {
  const router = useRouter();
  const sp = useSearchParams();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null); setMsg(null); setBusy(true);
    try {
      if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/auth/reset-password` });
        if (error) throw error;
        setMsg('أُرسل رابط استعادة كلمة المرور إلى بريدك.');
      } else if (mode === 'register') {
        const { error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: name } } });
        if (error) throw error;
        setMsg('تم إنشاء الحساب. تحقق من بريدك لتأكيده (إن كان مفعّلاً).');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(sp.get('next') ?? '/profile');
        router.refresh();
      }
    } catch (er: any) { setErr(er.message ?? 'حدث خطأ.'); }
    setBusy(false);
  };

  const titles = { login: 'تسجيل الدخول', register: 'إنشاء حساب', reset: 'استعادة كلمة المرور' };

  return (
    <div className="mx-auto mt-12 max-w-md rounded-2xl border border-white/5 bg-ink-850 p-8">
      <h1 className="mb-6 text-2xl font-black text-center">{titles[mode]}</h1>
      <form onSubmit={submit} className="space-y-4">
        {mode === 'register' && (
          <input value={name} onChange={e => setName(e.target.value)} placeholder="الاسم الظاهر" className="w-full rounded-xl border border-white/10 bg-ink-900 px-4 py-3 text-sm outline-none focus:border-brand" />
        )}
        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="البريد الإلكتروني" className="w-full rounded-xl border border-white/10 bg-ink-900 px-4 py-3 text-sm outline-none focus:border-brand" />
        {mode !== 'reset' && (
          <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="كلمة المرور (6 أحرف على الأقل)" className="w-full rounded-xl border border-white/10 bg-ink-900 px-4 py-3 text-sm outline-none focus:border-brand" />
        )}
        <button disabled={busy} className="w-full rounded-xl py-3 font-bold text-white disabled:opacity-50" style={{ background: 'var(--brand)' }}>
          {busy ? 'جارٍ التنفيذ...' : titles[mode]}
        </button>
      </form>
      {err && <p className="mt-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-300">{err}</p>}
      {msg && <p className="mt-4 rounded-lg bg-green-500/10 border border-green-500/30 p-3 text-sm text-green-300">{msg}</p>}
      <div className="mt-6 text-center text-sm text-gray-400 space-y-1">
        {mode === 'login' && <>
          <div>ليس لديك حساب؟ <Link href="/auth/register" className="text-brand font-bold">سجّل الآن</Link></div>
          <div><Link href="/auth/reset-password" className="hover:text-white">نسيت كلمة المرور؟</Link></div>
        </>}
        {mode === 'register' && <div>لديك حساب؟ <Link href="/auth/login" className="text-brand font-bold">سجّل الدخول</Link></div>}
        {mode === 'reset' && <div><Link href="/auth/login" className="text-brand font-bold">عودة لتسجيل الدخول</Link></div>}
      </div>
      <p className="mt-4 text-center text-xs text-gray-500">يمكنك تصفح الأعمال ومشاهدتها دون حساب. الحساب اختياري لحفظ المفضلة وسجل المشاهدة.</p>
    </div>
  );
}
