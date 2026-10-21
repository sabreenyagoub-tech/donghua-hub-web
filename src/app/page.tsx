import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { Donghua, Episode, AppSettings } from '@/lib/types';
import { HOME_SECTIONS } from '@/lib/types';
import SectionRow from '@/components/SectionRow';
import EpisodeCard from '@/components/EpisodeCard';
import { Play, Star } from 'lucide-react';

interface EpisodeWithDonghua extends Episode {
  seasons: { donghua: Donghua } | null;
}

export const revalidate = 300; // كاش عام 5 دقائق (بيانات عامة)

export default async function HomePage() {
  const supabase = createClient();
  const [{ data: settings }, { data: genres }, { data: donghuaList }, { data: latestEps }] = await Promise.all([
    supabase.from('app_settings').select('*').eq('id', 1).maybeSingle(),
    supabase.from('genres').select('*').order('sort_order'),
    supabase.from('donghua').select('*, genres:donghua_genres(genres(*))').eq('is_published', true).eq('copyright_hold', false).order('added_at', { ascending: false }).limit(500),
    supabase.from('episodes').select('*, seasons:season_id(donghua:donghua_id(*))').eq('status', 'published').order('published_at', { ascending: false }).limit(30),
  ]);

  const s = settings as AppSettings | null;
  const all: Donghua[] = ((donghuaList as any[]) ?? []).map(d => ({ ...d, genres: (d.genres ?? []).map((g: any) => g.genres) }));
  const byGenre = (slug: string) => all.filter(d => d.genres?.some(g => g.slug === slug)).slice(0, 12);
  const featured = all.filter(d => d.is_featured).sort((a, b) => a.featured_order - b.featured_order);
  const hero = featured[0] ?? all[0];

  const enabled = new Set(s?.enabled_sections?.length ? s.enabled_sections : HOME_SECTIONS.map(h => h.key));
  const order = (s?.sections_order?.length ? s.sections_order : HOME_SECTIONS.map(h => h.key))
    .filter(k => enabled.has(k));

  const sectionData: Record<string, Donghua[]> = {
    most_viewed: [...all].sort((a, b) => b.view_count - a.view_count).slice(0, 12),
    top_rated: [...all].sort((a, b) => b.rating_avg - a.rating_avg).slice(0, 12),
    ongoing: all.filter(d => d.status === 'ongoing').slice(0, 12),
    completed: all.filter(d => d.status === 'completed').slice(0, 12),
    upcoming: all.filter(d => d.status === 'upcoming').slice(0, 12),
    latest_added: all.slice(0, 12),
    editor_picks: all.filter(d => d.editor_pick).slice(0, 12),
  };
  HOME_SECTIONS.filter(h => 'genre' in h).forEach(h => { sectionData[h.key] = byGenre((h as any).genre); });

  const latestEpisodes = (latestEps as unknown as EpisodeWithDonghua[]) ?? [];

  return (
    <div>
      {/* HERO */}
      {hero && (
        <section className="relative mt-4 overflow-hidden rounded-2xl border border-white/5">
          <div className="relative h-[320px] sm:h-[420px]">
            {hero.banner_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={hero.banner_image_url} alt={hero.title_ar} className="absolute inset-0 h-full w-full object-cover" />
            ) : hero.cover_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={hero.cover_image_url} alt={hero.title_ar} className="absolute inset-0 h-full w-full object-cover opacity-40 blur-sm scale-110" />
            ) : <div className="absolute inset-0 bg-gradient-to-br from-ink-800 to-ink-950" />}
            <div className="absolute inset-0 gradient-overlay" />
            <div className="absolute inset-0 gradient-overlay-r hidden sm:block" />
            <div className="absolute bottom-0 right-0 p-5 sm:p-8 max-w-2xl">
              <span className="inline-block rounded-md px-2 py-1 text-[11px] font-bold text-white mb-3" style={{ background: 'var(--brand)' }}>عمل مميز</span>
              <h1 className="text-2xl sm:text-4xl font-black leading-tight">{hero.title_ar}</h1>
              {hero.title_en && <p className="text-gray-300 mt-1 text-sm sm:text-base">{hero.title_en}</p>}
              <div className="mt-2 flex items-center gap-3 text-sm text-gray-300">
                <span className="flex items-center gap-1 text-amber-300 font-bold"><Star size={14} fill="currentColor" /> {hero.rating_avg.toFixed(1)}</span>
                <span>{hero.release_year ?? '—'}</span>
                <span>{hero.current_episode > 0 ? `${hero.current_episode} حلقة` : 'قريبًا'}</span>
              </div>
              <p className="mt-3 hidden sm:block text-sm text-gray-300 line-clamp-2 max-w-xl">{hero.description}</p>
              <div className="mt-4 flex gap-3">
                <Link href={`/donghua/${hero.slug}`} className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 font-bold text-white" style={{ background: 'var(--brand)' }}>
                  <Play size={16} fill="currentColor" /> ابدأ المشاهدة
                </Link>
                <Link href={`/donghua/${hero.slug}`} className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-black/40 px-5 py-2.5 font-bold text-white backdrop-blur hover:bg-black/60">
                  التفاصيل
                </Link>
              </div>
            </div>
          </div>
          {featured.length > 1 && (
            <div className="absolute bottom-4 left-4 hidden lg:flex gap-2">
              {featured.slice(0, 6).map(f => (
                <Link key={f.id} href={`/donghua/${f.slug}`} className="h-16 w-12 overflow-hidden rounded-md border-2 border-white/20 hover:border-white transition">
                  {f.cover_image_url && <img src={f.cover_image_url} alt="" className="h-full w-full object-cover" />}
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {!all.length && (
        <div className="mt-16 text-center text-gray-400">
          <p className="text-lg font-bold">لا توجد أعمال منشورة بعد</p>
          <p className="text-sm mt-1">أضف أول عمل من لوحة الإدارة.</p>
        </div>
      )}

      {/* أقسام حسب الإعدادات */}
      {order.map(key => {
        const meta = HOME_SECTIONS.find(h => h.key === key);
        if (!meta) return null;
        if (key === 'featured') return <SectionRow key={key} title={meta.label} items={featured.slice(1)} href="/browse?sort=featured" />;
        if (key === 'latest_episodes' || key === 'recently_updated') {
          const items = key === 'recently_updated' ? latestEpisodes.slice().reverse() : latestEpisodes;
          if (!items.length) return null;
          return (
            <section key={key} className="mt-10 animate-fadeUp">
              <h2 className="mb-4 text-xl font-extrabold flex items-center gap-2">
                <span className="h-5 w-1.5 rounded-full" style={{ background: 'var(--brand)' }} /> {meta.label}
              </h2>
              <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
                {items.slice(0, 20).map(e => e.seasons?.donghua && <EpisodeCard key={e.id} episode={e} donghua={e.seasons.donghua} />)}
              </div>
            </section>
          );
        }
        return <SectionRow key={key} title={meta.label} items={sectionData[key] ?? []} href={`/browse?section=${key}`} />;
      })}
    </div>
  );
}
