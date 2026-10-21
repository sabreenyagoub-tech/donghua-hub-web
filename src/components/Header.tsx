'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Search, Menu, X, User, LogOut } from 'lucide-react';

export default function Header({ siteName, logoUrl }: { siteName: string; logoUrl: string | null }) {
  const [user, setUser] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  const nav = [
    { href: '/', label: 'الرئيسية' },
    { href: '/browse', label: 'تصفح الأعمال' },
    { href: '/browse?sort=latest_episodes', label: 'أحدث الحلقات' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-ink-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-3 sm:px-6 h-16">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={siteName} className="h-9 w-9 rounded-lg object-cover" />
          ) : (
            <span className="grid h-9 w-9 place-items-center rounded-lg text-lg font-black text-white" style={{ background: 'var(--brand)' }}>د</span>
          )}
          <span className="text-lg font-extrabold tracking-tight">{siteName}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {nav.map(n => (
            <Link key={n.href} href={n.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${pathname === n.href ? 'text-white bg-white/10' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}>
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        <Link href="/browse" className="hidden sm:flex items-center gap-2 rounded-lg border border-white/10 bg-ink-800 px-3 py-2 text-sm text-gray-400 hover:border-white/20 w-44">
          <Search size={16} /> بحث...
        </Link>

        {user ? (
          <div className="flex items-center gap-2">
            <Link href="/profile" className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-sm font-bold">
              {user.email?.[0]?.toUpperCase() ?? <User size={16} />}
            </Link>
            <button onClick={() => supabase.auth.signOut()} className="hidden sm:inline rounded-lg p-2 text-gray-400 hover:text-white hover:bg-white/5" title="تسجيل الخروج">
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <Link href="/auth/login" className="rounded-lg px-4 py-2 text-sm font-bold text-white" style={{ background: 'var(--brand)' }}>
            تسجيل الدخول
          </Link>
        )}

        <button className="md:hidden p-2" onClick={() => setOpen(!open)}>{open ? <X size={20} /> : <Menu size={20} />}</button>
      </div>
      {open && (
        <div className="md:hidden border-t border-white/5 px-4 py-3 space-y-1">
          {nav.map(n => <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm hover:bg-white/5">{n.label}</Link>)}
          <Link href="/browse" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm hover:bg-white/5">بحث</Link>
          {!user && <Link href="/auth/login" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm font-bold" style={{ color: 'var(--brand)' }}>تسجيل الدخول</Link>}
        </div>
      )}
    </header>
  );
}
