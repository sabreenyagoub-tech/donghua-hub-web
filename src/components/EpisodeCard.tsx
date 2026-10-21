import Link from 'next/link';
import type { Donghua, Episode } from '@/lib/types';
import { formatViews } from '@/lib/utils';

export default function EpisodeCard({ episode, donghua }: { episode: Episode; donghua: Donghua }) {
  return (
    <Link href={`/watch/${episode.id}`} className="card-hover group block w-52 sm:w-56 shrink-0 overflow-hidden rounded-xl bg-ink-800 border border-white/5">
      <div className="relative aspect-video overflow-hidden bg-ink-700">
        {donghua.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={donghua.cover_image_url} alt="" className="h-full w-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition" />
        ) : <div className="grid h-full place-items-center text-gray-600 text-xs">لا توجد صورة</div>}
        <span className="absolute bottom-2 left-2 rounded bg-black/80 px-1.5 py-0.5 text-[11px] font-bold text-white">
          الحلقة {episode.episode_number}
        </span>
        <span className="absolute top-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-gray-200">{formatViews(episode.view_count)}</span>
      </div>
      <div className="p-3">
        <div className="line-clamp-1 text-sm font-bold">{donghua.title_ar}</div>
        <div className="mt-1 text-xs text-gray-400 line-clamp-1">{episode.title_ar ?? `الحلقة ${episode.episode_number}`}</div>
      </div>
    </Link>
  );
}
