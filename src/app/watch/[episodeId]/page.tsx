import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient, getSessionAndRole } from '@/lib/supabase/server';
import type { VideoSource, SubtitleFile, DownloadSource, Episode, Season, Donghua } from '@/lib/types';
import { formatFileSize, formatDuration } from '@/lib/utils';
import Player from '@/components/Player';
import { Download, ChevronLeft, AlertTriangle } from 'lucide-react';

export const revalidate = 60;

export default async function WatchPage({ params }: { params: { episodeId: string } }) {
  const supabase = createClient();
  const { data: ep } = await supabase.from('episodes').select('*, seasons:season_id(*, donghua:donghua_id(*))').eq('id', params.episodeId).maybeSingle();
  if (!ep) notFound();
  const episode = ep as Episode & { seasons: (Season & { donghua: Donghua }) | null };
  const season = episode.seasons;
  if (!season) notFound();
  const donghua = season.donghua;

  const [{ data: sources }, { data: subs }, { data: downloads }, { data: seasonEps }] = await Promise.all([
    supabase.from('video_sources').select('*').eq('episode_id', episode.id).eq('is_active', true).order('sort_order'),
    supabase.from('subtitle_files').select('*').eq('episode_id', episode.id).eq('status', 'available').order('is_default', { ascending: false }),
    supabase.from('download_sources').select('*').eq('episode_id', episode.id).eq('is_active', true),
    supabase.from('episodes').select('id,episode_number,title_ar,status').eq('season_id', season.id).order('episode_number'),
  ]);

  const publishedEps = ((seasonEps as Episode[]) ?? []).filter(e => e.status === 'published');
  const idx = publishedEps.findIndex(e => e.id === episode.id);
  const nextEp = idx >= 0 ? publishedEps[idx + 1] : null;
  const prevEp = idx >= 0 ? publishedEps[idx - 1] : null;

  const { user } = await getSessionAndRole();
  let autoplayDefault = true;
  if (user) {
    const { data: prof } = await supabase.from('profiles').select('autoplay_next').eq('id', user.id).maybeSingle();
    autoplayDefault = prof?.autoplay_next ?? true;
  }

  return (
    <div className="mt-4 grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <Player
          episodeId={episode.id}
          sources={(sources as VideoSource[]) ?? []}
          subtitles={(subs as SubtitleFile[]) ?? []}
          nextEpisodeId={nextEp?.id ?? null}
          prevEpisodeId={prevEp?.id ?? null}
          autoplayDefault={autoplayDefault}
        />

        <div className="rounded-2xl border border-white/5 bg-ink-850 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Link href={`/donghua/${donghua.slug}`} className="text-sm text-gray-400 hover:text-white">{donghua.title_ar}</Link>
              <h1 className="mt-1 text-xl font-black">الحلقة {episode.episode_number}{episode.title_ar ? ` — ${episode.title_ar}` : ''}</h1>
              <p className="mt-1 text-xs text-gray-500">{episode.air_date ? new Date(episode.air_date).toLocaleDateString('ar') : ''} · مدة {formatDuration(episode.duration_seconds)} · {episode.view_count} مشاهدة</p>
            </div>
            <div className="flex gap-2">
              {prevEp && <Link href={`/watch/${prevEp.id}`} className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5">السابقة</Link>}
              {nextEp && <Link href={`/watch/${nextEp.id}`} className="rounded-lg px-3 py-2 text-sm font-bold text-white" style={{ background: 'var(--brand)' }}>التالية <ChevronLeft size={14} className="inline" /></Link>}
            </div>
          </div>
          {episode.description && <p className="mt-3 text-sm text-gray-300 leading-7">{episode.description}</p>}
        </div>

        {/* التنزيل */}
        {(downloads as DownloadSource[] | null)?.length ? (
          <div className="rounded-2xl border border-white/5 bg-ink-850 p-5">
            <h2 className="mb-3 font-extrabold flex items-center gap-2"><Download size={18} /> التنزيل المصرح به</h2>
            <div className="flex flex-wrap gap-2">
              {(downloads as DownloadSource[]).map(d => (
                <a key={d.id} href={d.url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-ink-800 px-4 py-2 text-sm font-bold hover:border-brand">
                  <Download size={15} /> {d.quality} · {formatFileSize(d.file_size_bytes)}
                </a>
              ))}
            </div>
            <p className="mt-3 text-xs text-gray-500">التنزيل متاح فقط للملفات المرخصة. قد يُحفظ الملف عبر خدمة خارجية.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/5 bg-ink-850 p-4 text-xs text-gray-500 flex items-center gap-2">
            <AlertTriangle size={14} /> التنزيل المباشر غير متاح لهذه الحلقة.
          </div>
        )}
      </div>

      {/* قائمة حلقات الموسم */}
      <aside className="rounded-2xl border border-white/5 bg-ink-850 p-4 max-h-[70vh] overflow-y-auto">
        <h3 className="mb-3 font-extrabold">{season.title_ar ?? `الموسم ${season.season_number}`} — الحلقات</h3>
        <ul className="space-y-1">
          {publishedEps.map(e => (
            <li key={e.id}>
              <Link href={`/watch/${e.id}`}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${e.id === episode.id ? 'text-white' : 'text-gray-300 hover:bg-white/5'}`}
                style={e.id === episode.id ? { background: 'color-mix(in srgb, var(--brand) 25%, transparent)' } : {}}>
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-md text-xs font-bold ${e.id === episode.id ? 'text-white' : 'bg-white/10'}`} style={e.id === episode.id ? { background: 'var(--brand)' } : {}}>{e.episode_number}</span>
                <span className="truncate">{e.title_ar ?? `الحلقة ${e.episode_number}`}</span>
              </Link>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
