import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { Donghua } from '@/lib/types';
import BrowseFilters from '@/components/BrowseFilters';
import DonghuaCard from '@/components/DonghuaCard';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const PAGE_SIZE = 24;

export const revalidate = 120;

export default async function BrowsePage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const supabase = createClient();
  const q = searchParams.q?.trim() ?? '';
  const genre = searchParams.genre ?? '';
  const status = searchParams.status ?? '';
  const year = searchParams.year ?? '';
  const anim = searchParams.anim ?? '';
  const sort = searchParams.sort ?? 'latest';
  const page = Math.max(1, parseInt(searchParams.page ?? '1') || 1);

  const { data: genres } = await supabase.from('genres').select('slug,name_ar').order('sort_order');

  let query = supabase.from('donghua')
    .select('*, genres:donghua_genres(genres(slug))', { count: 'exact' })
    .eq('is_published', true).eq('copyright_hold', false);

  if (q) {
    const like = `%${q}%`;
    query = query.or(`title_ar.ilike.${like},title_en.ilike.${like},title_zh.ilike.${like}`);
  }
  if (status) query = query.eq('status', status);
  if (year) query = query.eq('release_year', parseInt(year));
  if (anim) query = query.eq('animation_type', anim);
  // ملاحظة: تصفية التصنيف تتم بعد جلب النتائج (انظر أسفل) لضمان الدقة مع العلاقات المضمّنة.

  switch (sort) {
    case 'most_viewed': query = query.order('view_count', { ascending: false }); break;
    case 'top_rated': query = query.order('rating_avg', { ascending: false }); break;
    case 'az': query = query.order('title_ar', { ascending: true }); break;
    case 'latest_episodes': query = query.order('current_episode', { ascending: false }).order('added_at', { ascending: false }); break;
    default: query = query.order('added_at', { ascending: false });
  }

  const from = (page - 1) * PAGE_SIZE;
  const { data, count } = await query.range(from, from + PAGE_SIZE - 1);
  let items: Donghua[] = ((data as any[]) ?? []).map(d => ({ ...d, genres: (d.genres ?? []).map((g: any) => g.genres) }));
  if (genre) items = items.filter(d => d.genres?.some(g => g.slug === genre)); // دقة إضافية بعد الاستعلام
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const mkPage = (p: number) => {
    const sp = new URLSearchParams(searchParams as any);
    sp.set('page', String(p));
    return `/browse?${sp.toString()}`;
  };

  return (
    <div className="mt-6">
      <h1 className="mb-4 text-2xl font-black">تصفح الأعمال</h1>
      <BrowseFilters genres={(genres as any[]) ?? []} />

      {items.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-ink-850 p-12 text-center text-gray-400">
          <p className="text-lg font-bold">لا توجد نتائج</p>
          <p className="text-sm mt-1">جرّب تعديل كلمة البحث أو المرشحات.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {items.map(d => <DonghuaCard key={d.id} d={d} />)}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {page > 1 && <Link href={mkPage(page - 1)} className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5"><ChevronRight size={16} /></Link>}
          <span className="text-sm text-gray-400">صفحة {page} من {totalPages}</span>
          {page < totalPages && <Link href={mkPage(page + 1)} className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5"><ChevronLeft size={16} /></Link>}
        </div>
      )}
    </div>
  );
}
