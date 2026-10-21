import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient, getSessionAndRole } from '@/lib/supabase/server';
import ProfileSettings from '@/components/ProfileSettings';
import { Heart, Bookmark, History, Settings as SettingsIcon } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const { user } = await getSessionAndRole();
  if (!user) redirect('/auth/login?next=/profile');
  const supabase = createClient();
  const [{ data: prof }, { data: favs }, { data: wl }, { data: hist }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('favorites').select('donghua:donghua_id(id,title_ar,slug,cover_image_url,status,current_episode)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
    supabase.from('watchlist').select('status, donghua:donghua_id(id,title_ar,slug,cover_image_url,status,current_episode)').eq('user_id', user.id).limit(50),
    supabase.from('watch_history').select('position_seconds, last_watched_at, episode:episode_id(id,episode_number,title_ar, seasons:season_id(donghua:donghua_id(title_ar,slug,cover_image_url)))').eq('user_id', user.id).order('last_watched_at', { ascending: false }).limit(20),
  ]);

  const Tab = ({ icon: Icon, title, children, empty }: any) => (
    <section className="mt-8">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold"><Icon size={18} className="text-brand" /> {title}</h2>
      {children?.length ? <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">{children}</div> : <p className="text-sm text-gray-500">{empty}</p>}
    </section>
  );
  const MiniCard = ({ d }: any) => (
    <Link href={`/donghua/${d.slug}`} className="block overflow-hidden rounded-xl border border-white/5 bg-ink-800">
      {d.cover_image_url ? <img src={d.cover_image_url} alt="" className="aspect-[2/3] w-full object-cover" /> : <div className="aspect-[2/3] grid place-items-center text-xs text-gray-600">لا صورة</div>}
      <div className="p-2 text-xs font-bold line-clamp-2">{d.title_ar}</div>
    </Link>
  );

  return (
    <div className="mt-6">
      <h1 className="text-2xl font-black">ملفي الشخصي</h1>
      <p className="text-sm text-gray-400 mt-1">{prof?.display_name ?? user.email} · {user.email}</p>

      <div className="mt-6 rounded-2xl border border-white/5 bg-ink-850 p-5">
        <h2 className="mb-3 flex items-center gap-2 font-extrabold"><SettingsIcon size={18} className="text-brand" /> الإعدادات</h2>
        <ProfileSettings initial={prof as any} />
      </div>

      <Tab icon={Heart} title="المفضلة" empty="لم تُضف أي عمل إلى المفضلة بعد.">
        {(favs as any[] ?? []).map((f: any) => <MiniCard key={f.donghua.id} d={f.donghua} />)}
      </Tab>
      <Tab icon={Bookmark} title="قائمة المشاهدة" empty="قائمة المشاهدة فارغة.">
        {(wl as any[] ?? []).map((w: any) => <MiniCard key={w.donghua.id} d={w.donghua} />)}
      </Tab>

      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold"><History size={18} className="text-brand" /> سجل المشاهدة (استئناف سريع)</h2>
        {(hist as any[] ?? []).length ? (
          <ul className="space-y-2">
            {(hist as any[]).map((h: any) => {
              const ep = h.episode; const dh = ep?.seasons?.donghua;
              if (!dh) return null;
              return (
                <li key={h.episode.id}>
                  <Link href={`/watch/${ep.id}`} className="flex items-center gap-3 rounded-xl border border-white/5 bg-ink-850 p-3 hover:border-brand/50">
                    {dh.cover_image_url && <img src={dh.cover_image_url} alt="" className="h-12 w-9 rounded object-cover" />}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate">{dh.title_ar} — الحلقة {ep.episode_number}</div>
                      <div className="text-xs text-gray-500">آخر مشاهدة: {new Date(h.last_watched_at).toLocaleString('ar')} · عند الدقيقة {Math.floor(h.position_seconds / 60)}</div>
                    </div>
                    <span className="text-xs text-brand font-bold shrink-0">استئناف ←</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : <p className="text-sm text-gray-500">لا يوجد سجل مشاهدة بعد.</p>}
      </section>
    </div>
  );
}
