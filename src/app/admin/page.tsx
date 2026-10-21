import { createClient } from '@/lib/supabase/server';
import { sendNotification } from '@/lib/actions';
import { Film, Clapperboard, Eye, Users, Download, TrendingUp, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

function Stat({ icon: Icon, label, value, color }: { icon: any; label: string; value: any; color: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-ink-850 p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">{label}</span>
        <Icon size={18} style={{ color }} />
      </div>
      <div className="mt-2 text-3xl font-black">{value}</div>
    </div>
  );
}

export default async function AdminDashboard() {
  const supabase = createClient();
  const [
    { count: donghuaCount }, { count: publishedCount }, { count: episodesCount },
    { data: recentEps }, { data: topDonghua }, { count: usersCount },
  ] = await Promise.all([
    supabase.from('donghua').select('*', { count: 'exact', head: true }),
    supabase.from('donghua').select('*', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('episodes').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('episodes').select('id,episode_number,title_ar,published_at,view_count, seasons:season_id(donghua:donghua_id(title_ar,slug))').eq('status', 'published').order('published_at', { ascending: false }).limit(8),
    supabase.from('donghua').select('title_ar,slug,view_count').eq('is_published', true).order('view_count', { ascending: false }).limit(5),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
  ]);

  const totalViews = (topDonghua ?? []).reduce((s, d) => s + (d.view_count || 0), 0);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-black">لوحة الإحصائيات</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Film} label="إجمالي الأعمال" value={donghuaCount ?? 0} color="#e11d48" />
        <Stat icon={Clapperboard} label="أعمال منشورة" value={publishedCount ?? 0} color="#22c55e" />
        <Stat icon={Eye} label="حلقات منشورة" value={episodesCount ?? 0} color="#f59e0b" />
        <Stat icon={Users} label="مستخدمون مسجلون" value={usersCount ?? 0} color="#3b82f6" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/5 bg-ink-850 p-5">
          <h2 className="mb-4 font-extrabold flex items-center gap-2"><TrendingUp size={18} className="text-brand" /> أكثر الأعمال مشاهدة</h2>
          <ul className="space-y-2">
            {(topDonghua ?? []).map((d, i) => (
              <li key={d.slug} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded bg-white/10 text-xs font-bold">{i + 1}</span> {d.title_ar}</span>
                <span className="text-gray-400">{d.view_count} مشاهدة</span>
              </li>
            ))}
            {!(topDonghua ?? []).length && <li className="text-sm text-gray-500">لا توجد بيانات بعد.</li>}
          </ul>
        </div>
        <div className="rounded-2xl border border-white/5 bg-ink-850 p-5">
          <h2 className="mb-4 font-extrabold flex items-center gap-2"><Clock size={18} className="text-accent" /> أحدث الحلقات المضافة</h2>
          <ul className="space-y-2">
            {(recentEps as any[] ?? []).map(e => (
              <li key={e.id} className="flex items-center justify-between text-sm">
                <span className="truncate">{(e as any).seasons?.donghua?.title_ar} — الحلقة {e.episode_number}</span>
                <span className="text-gray-500 text-xs shrink-0">{e.view_count} مشاهدة</span>
              </li>
            ))}
            {!(recentEps ?? []).length && <li className="text-sm text-gray-500">لا توجد حلقات بعد.</li>}
          </ul>
        </div>
      </div>

      {/* إرسال إشعار / خبر */}
      <div className="mt-6 rounded-2xl border border-white/5 bg-ink-850 p-5">
        <h2 className="mb-3 font-extrabold flex items-center gap-2"><Megaphone size={18} /> إرسال إشعار عام (إذاعة)</h2>
        <form action={sendNotification} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input name="title_ar" required placeholder="عنوان الإشعار" className="rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm" />
          <input name="body_ar" placeholder="نص الإشعار" className="rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm" />
          <button className="rounded-lg px-5 py-2 text-sm font-bold text-white" style={{ background: 'var(--brand)' }}>إرسال</button>
        </form>
        <p className="mt-2 text-xs text-gray-500">يُحفظ في قاعدة البيانات ويُدفع عبر FCM إن كان المفتاح مضبوطًا. يمكن اختباره من هنا.</p>
      </div>
    </div>
  );
}
