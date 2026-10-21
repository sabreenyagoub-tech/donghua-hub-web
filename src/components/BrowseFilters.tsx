'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { YEARS } from '@/lib/types';
import { debounce } from '@/lib/utils';
import { Search, SlidersHorizontal } from 'lucide-react';

const SORTS = [
  { v: 'latest', l: 'الأحدث إضافة' },
  { v: 'latest_episodes', l: 'أحدث الحلقات' },
  { v: 'most_viewed', l: 'الأكثر مشاهدة' },
  { v: 'top_rated', l: 'الأعلى تقييمًا' },
  { v: 'az', l: 'أبجدي' },
];
const STATUSES = [
  { v: '', l: 'كل الحالات' }, { v: 'ongoing', l: 'مستمر' }, { v: 'completed', l: 'مكتمل' }, { v: 'upcoming', l: 'قادم' },
];
const ANIMS = [
  { v: '', l: 'كل التحريك' }, { v: '2d', l: '2D' }, { v: '3d', l: '3D' }, { v: 'mixed', l: 'مختلط' },
];

export default function BrowseFilters({ genres }: { genres: { slug: string; name_ar: string }[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get('q') ?? '');
  const [show, setShow] = useState(false);

  const setParam = (k: string, v: string) => {
    const p = new URLSearchParams(sp.toString());
    if (v) p.set(k, v); else p.delete(k);
    if (k !== 'page') p.delete('page');
    router.push(`/browse?${p.toString()}`);
  };

  const debouncedSearch = debounce((val: string) => setParam('q', val), 400);
  useEffect(() => { debouncedSearch(q); }, [q]); // eslint-disable-line

  return (
    <div className="mb-6 rounded-2xl border border-white/5 bg-ink-850 p-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="ابحث بالاسم العربي أو الإنجليزي أو الصيني..."
            className="w-full rounded-xl border border-white/10 bg-ink-900 py-2.5 pr-10 pl-4 text-sm outline-none focus:border-brand" />
        </div>
        <button onClick={() => setShow(!show)} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-bold hover:bg-white/5">
          <SlidersHorizontal size={16} /> المرشحات
        </button>
      </div>
      {show && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-xs text-gray-400">النوع
            <select value={sp.get('genre') ?? ''} onChange={e => setParam('genre', e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm">
              <option value="">كل الأنواع</option>
              {genres.map(g => <option key={g.slug} value={g.slug}>{g.name_ar}</option>)}
            </select>
          </label>
          <label className="text-xs text-gray-400">الحالة
            <select value={sp.get('status') ?? ''} onChange={e => setParam('status', e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm">
              {STATUSES.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
          </label>
          <label className="text-xs text-gray-400">سنة الإصدار
            <select value={sp.get('year') ?? ''} onChange={e => setParam('year', e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm">
              <option value="">كل السنوات</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          <label className="text-xs text-gray-400">نوع التحريك
            <select value={sp.get('anim') ?? ''} onChange={e => setParam('anim', e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm">
              {ANIMS.map(a => <option key={a.v} value={a.v}>{a.l}</option>)}
            </select>
          </label>
          <label className="text-xs text-gray-400">الترتيب
            <select value={sp.get('sort') ?? 'latest'} onChange={e => setParam('sort', e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm">
              {SORTS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
          </label>
        </div>
      )}
    </div>
  );
}
