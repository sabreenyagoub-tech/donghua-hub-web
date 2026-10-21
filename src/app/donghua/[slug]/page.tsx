import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient, getSessionAndRole } from '@/lib/supabase/server';
import type { Donghua, Season, Episode, Announcement } from '@/lib/types';
import { statusLabel, formatViews } from '@/lib/utils';
import FollowButtons from '@/components/FollowButtons';
import SectionRow from '@/components/SectionRow';
import { Star, Calendar, Film, Clock, Award, Megaphone } from 'lucide-react';

export const revalidate = 120;

export default async function DonghuaDetail({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const { data: d } = await supabase.from('donghua')
    .select('*, genres:donghua_genres(genres(*))').eq('slug', params.slug).maybeSingle();
  if (!d) notFound();
  const donghua: Donghua = { ...(d as any), genres: (d.genres ?? []).map((g: any) => g.genres) };

  const [{ data: seasons }, { data: ann }, { user: me }] = await Promise.all([
    supabase.from('seasons').select('*, episodes(*)').eq('donghua_id', donghua.id).eq('is_hidden', false).order('sort_order'),
    supabase.from('announcements').select('*').eq('donghua_id', donghua.id).eq('is_published', true).order('published_at', { ascending: false }).limit(5),
    getSessionAndRole().then(r => r.user),
  ]);

  let isFav = false, isFollowing = false, firstEpisodeId: string | null = null;
  if (me) {
    const [{ data: fav }, { data: wl }] = await Promise.all([
      supabase.from('favorites').select('donghua_id').eq('user_id', me.id).eq('donghua_id', donghua.id).maybeSingle(),
      supabase.from('watchlist').select('status').eq('user_id', me.id).eq('donghua_id', donghua.id).maybeSingle(),
    ]);
    isFav = !!fav; isFollowing = !!wl;
  }

  const sortedSeasons = ((seasons as any[]) ?? []).sort((a, b) => a.season_number - b.season_number) as (Season & { episodes: Episode[] })[];
  sortedSeasons.forEach(s => s.episodes?.sort((a, b) => a.episode_number - b.episode_number));
  const firstEp = sortedSeasons[0]?.episodes?.find(e => e.status === 'published');
  firstEpisodeId = firstEp?.id ?? null;

  // أعمال مشابهة (نفس التصنيفات)
  const genreSlugs = donghua.genres?.map(g => g.slug) ?? [];
  let similar: Donghua[] = [];
  if (genreSlugs.length) {
    const { data: sim } = await supabase.from('donghua')
      .select('*, genres:donghua_genres(genres(slug))').eq('is_published', true).eq('copyright_hold', false).neq('id', donghua.id).limit(40);
    similar = ((sim as any[]) ?? [])
      .map(x => ({ ...x, genres: (x.genres ?? []).map((g: any) => g.genres) }))
      .filter(x => x.genres.some((g: any) => genreSlugs.includes(g.slug)))
      .slice(0, 12);
  }

  return (
    <div className="mt-4">
      {/* Banner + cover */}
      <div className="relative overflow-hidden rounded-2xl border border-white/5">
        <div className="h-48 sm:h-64 w-full">
          {donghua.banner_image_url
            ? <img src={donghua.banner_image_url} alt="" className="h-full w-full object-cover opacity-60" />
            : <div className="h-full w-full bg-gradient-to-br from-ink-700 to-ink-950" />}
        </div>
        <div className="absolute inset-0 gradient-overlay" />
        <div className="relative -mt-24 sm:-mt-28 flex flex-col sm:flex-row gap-5 p-4 sm:p-6">
          <div className="w-32 sm:w-44 shrink-0 overflow-hidden rounded-xl border border-white/10 shadow-glow">
            {donghua.cover_image_url
              ? <img src={donghua.cover_image_url} alt={donghua.title_ar} className="aspect-[2/3] w-full object-cover" />
              : <div className="aspect-[2/3] grid place-items-center bg-ink-800 text-gray-600 text-xs">لا يوجد غلاف</div>}
          </div>
          <div className="flex-1 pt-20 sm:pt-28">
            <h1 className="text-2xl sm:text-3xl font-black">{donghua.title_ar}</h1>
            {donghua.title_en && <p className="text-gray-400 mt-1">{donghua.title_en}{donghua.title_zh ? ` · ${donghua.title_zh}` : ''}</p>}
            {donghua.alternative_titles?.length > 0 && <p className="text-xs text-gray-500 mt-1">أسماء أخرى: {donghua.alternative_titles.join('، ')}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-300">
              <span className="flex items-center gap-1 text-amber-300 font-bold"><Star size={15} fill="currentColor" /> {donghua.rating_avg > 0 ? `${donghua.rating_avg.toFixed(1)} (${donghua.rating_count})` : 'لا يوجد تقييم'}</span>
              <span className="flex items-center gap-1"><Calendar size={14} /> {donghua.release_year ?? 'غير محدد'}</span>
              <span className="flex items-center gap-1"><Film size={14} /> {donghua.animation_type.toUpperCase()}</span>
              <span className="flex items-center gap-1"><Clock size={14} /> {donghua.episode_duration_min ? `${donghua.episode_duration_min} دقيقة` : 'المدة غير معروفة'}</span>
              <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-bold">{statusLabel(donghua.status)}</span>
              <span className="text-gray-400">{formatViews(donghua.view_count)} مشاهدة</span>
            </div>
            {donghua.genres?.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {donghua.genres.map(g => (
                  <Link key={g.id} href={`/browse?genre=${g.slug}`} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs hover:bg-white/10">{g.name_ar}</Link>
                ))}
              </div>
            ) : null}
            <div className="mt-5">
              <FollowButtons donghuaId={donghua.id} firstEpisodeId={firstEpisodeId} isFav={isFav} isFollowing={isFollowing} loggedIn={!!me} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          {/* القصة */}
          <section className="rounded-2xl border border-white/5 bg-ink-850 p-5">
            <h2 className="mb-3 text-lg font-extrabold">القصة والوصف</h2>
            <p className="text-sm leading-7 text-gray-300 whitespace-pre-line">{donghua.story || donghua.description || 'لا يوجد وصف متاح حاليًا.'}</p>
            {(donghua.studio || donghua.producers) && (
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                {donghua.studio && <div><span className="text-gray-500">الاستوديو: </span>{donghua.studio}</div>}
                {donghua.producers && <div><span className="text-gray-500">الإنتاج: </span>{donghua.producers}</div>}
                <div><span className="text-gray-500">عدد المواسم: </span>{donghua.seasons_count}</div>
                <div><span className="text-gray-500">أحدث حلقة: </span>{donghua.current_episode > 0 ? donghua.current_episode : '—'}</div>
                <div><span className="text-gray-500">إجمالي الحلقات: </span>{donghua.total_episodes ?? 'غير معروف'}</div>
              </div>
            )}
          </section>

          {/* المواسم والحلقات */}
          {sortedSeasons.map(s => (
            <section key={s.id} className="rounded-2xl border border-white/5 bg-ink-850 p-5">
              <h2 className="mb-3 text-lg font-extrabold">{s.title_ar ?? `الموسم ${s.season_number}`}</h2>
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {(s.episodes ?? []).filter(e => e.status === 'published').map(e => (
                  <Link key={e.id} href={`/watch/${e.id}`}
                    className="rounded-lg border border-white/10 bg-ink-800 px-2 py-2.5 text-center text-sm font-bold hover:border-brand hover:text-white transition">
                    {e.episode_number}
                  </Link>
                ))}
                {!(s.episodes ?? []).some(e => e.status === 'published') && <p className="col-span-full text-sm text-gray-500">لا توجد حلقات منشورة بعد.</p>}
              </div>
            </section>
          ))}

          {/* الإعلانات */}
          {(ann as Announcement[] | null)?.length ? (
            <section className="rounded-2xl border border-white/5 bg-ink-850 p-5">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold"><Megaphone size={18} /> آخر الإعلانات</h2>
              <ul className="space-y-3">
                {(ann as Announcement[]).map(a => (
                  <li key={a.id} className="border-r-2 pr-3 border-brand/60">
                    <div className="font-bold text-sm">{a.title_ar}</div>
                    <p className="text-xs text-gray-400 mt-1 whitespace-pre-line">{a.body_ar}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-white/5 bg-ink-850 p-5 text-sm">
            <h3 className="mb-3 font-extrabold flex items-center gap-2"><Award size={16} /> معلومات سريعة</h3>
            <dl className="space-y-2 text-gray-300">
              <div className="flex justify-between"><dt className="text-gray-500">الحالة</dt><dd>{statusLabel(donghua.status)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">السنة</dt><dd>{donghua.release_year ?? '—'}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">التحريك</dt><dd>{donghua.animation_type.toUpperCase()}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">الترجمة العربية</dt><dd className="text-green-400">متاحة</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">أُضيف في</dt><dd>{new Date(donghua.added_at).toLocaleDateString('ar')}</dd></div>
            </dl>
          </div>
          <Link href="/copyright" className="block rounded-2xl border border-white/5 bg-ink-850 p-4 text-xs text-gray-400 hover:border-white/20">
            هل هذا المحتوى ينتهك حقوقك؟ أبلغ عنه (DMCA)
          </Link>
        </aside>
      </div>

      {similar.length > 0 && <SectionRow title="أعمال مشابهة" items={similar} />}
    </div>
  );
}
