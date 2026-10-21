import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSessionAndRole } from '@/lib/supabase/server';
import { LayoutDashboard, Film, Clapperboard, Subtitles, Settings, Users, Flag, Megaphone, LogOut, Globe } from 'lucide-react';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, role } = await getSessionAndRole();
  if (!user || !role) redirect('/auth/login?next=/admin');

  const links = [
    { href: '/admin', label: 'الإحصائيات', icon: LayoutDashboard },
    { href: '/admin/donghua', label: 'الأعمال', icon: Film },
    { href: '/admin/subtitles', label: 'الترجمات', icon: Subtitles },
    { href: '/admin/users', label: 'المستخدمون', icon: Users, min: 'admin' as const },
    { href: '/admin/reports', label: 'بلاغات الحقوق', icon: Flag, min: 'admin' as const },
    { href: '/admin/settings', label: 'إعدادات الموقع', icon: Settings, min: 'admin' as const },
  ];
  const rank = { owner: 3, admin: 2, editor: 1 } as const;

  return (
    <div className="mt-4 grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="rounded-2xl border border-white/5 bg-ink-850 p-3 h-fit lg:sticky lg:top-20">
        <div className="mb-3 px-2 text-xs font-bold uppercase tracking-wider text-gray-500">لوحة الإدارة · {role}</div>
        <nav className="space-y-1">
          {links.filter(l => !l.min || rank[role!] >= rank[l.min]).map(l => (
            <Link key={l.href} href={l.href} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white">
              <l.icon size={16} /> {l.label}
            </Link>
          ))}
          <Link href="/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white"><Globe size={16} /> عرض الموقع</Link>
          <form action="/auth/login"><button formAction={async () => {}} className="hidden" /></form>
        </nav>
        <div className="mt-4 border-t border-white/5 pt-3 px-2 text-xs text-gray-500 break-all">{user.email}</div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
