import Link from 'next/link';
import type { Donghua } from '@/lib/types';
import { formatViews, statusLabel } from '@/lib/utils';
import { Star } from 'lucide-react';

export default function DonghuaCard({ d }: { d: Donghua }) {
  return (
    <Link href={`/donghua/${d.slug}`} className="card-hover group block w-36 sm:w-40 shrink-0">
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-ink-800">
        {d.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={d.cover_image_url} alt={d.title_ar} loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-105" />
        ) : (
          <div className="grid h-full place-items-center text-gray-600 text-xs p-2 text-center">لا توجد غلاف</div>
        )}
        <div className="absolute inset-x-0 bottom-0 gradient-overlay p-2">
          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-300">
            <Star size={11} fill="currentColor" /> {d.rating_avg > 0 ? d.rating_avg.toFixed(1) : '—'}
            <span className="text-gray-300 font-normal">· {formatViews(d.view_count)} مشاهدة</span>
          </div>
        </div>
        <span className="absolute top-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
          {statusLabel(d.status)}
        </span>
        {d.current_episode > 0 && (
          <span className="absolute top-2 left-2 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ background: 'var(--brand)' }}>
            {d.current_episode} حلقة
          </span>
        )}
      </div>
      <div className="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-gray-100 group-hover:text-white">
        {d.title_ar}
      </div>
      {d.title_en && <div className="text-[11px] text-gray-500 truncate">{d.title_en}</div>}
    </Link>
  );
}
