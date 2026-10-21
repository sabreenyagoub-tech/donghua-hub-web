import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { upsertDonghua, upsertSeason } from '@/lib/actions';
import ImageUploader from '@/components/admin/ImageUploader';
import { Plus, Eye, Clapperboard } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDonghuaForm({ params }: { params: { id: string } }) {
  const isNew = params.id === 'new';
  const supabase = createClient();
  let d: any = null, selectedGenres: string[] = [], seasons: any[] = [];
  const { data: genres } = await supabase.from('genres').select('*').order('sort_order');

  if (!isNew) {
    const { data: row } = await supabase.from('donghua').select('*').eq('id', params.id).maybeSingle();
    if (!row) notFound();
    d = row;
    const { data: dg } = await supabase.from('donghua_genres').select('genre_id').eq('donghua_id', d.id);
    selectedGenres = (dg ?? []).map(x => x.genre_id);
    const { data: ss } = await supabase.from('seasons').select('*, episodes(count)').eq('donghua_id', d.id).order('season_number');
    seasons = ss ?? [];
  }

  const input = (name: string, label: string, type = 'text', ph = '') => (
    <label className="block text-xs font-bold text-gray-400">{label}
      <input type={type} name={name} defaultValue={d?.[name] ?? ''} placeholder={ph}
        className="mt-1 w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm" />
    </label>
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-black">{isNew ? 'إضافة عمل جديد' : `تعديل: ${d.title_ar}`}</h1>
        {!isNew && <Link href={`/donghua/${d.slug}`} target="_blank" className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5"><Eye size={14} /> معاينة</Link>}
      </div>

      <form action={upsertDonghua} className="space-y-6">
        <input type="hidden" name="id" value={isNew ? '' : d.id} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {input('title_ar', 'الاسم العربي *')}
          {input('title_en', 'الاسم الإنجليزي')}
          {input('title_zh', 'الاسم الصيني')}
          {input('slug', 'المعرف (slug) *', 'text', 'مثال: battle-through-heavens')}
          {input('release_year', 'سنة الإصدار', 'number')}
          {input('total_episodes', 'إجمالي الحلقات (إن كان معروفًا)', 'number')}
          {input('seasons_count', 'عدد المواسم', 'number')}
          {input('episode_duration_min', 'مدة الحلقة (دقائق)', 'number')}
          {input('studio', 'الاستوديو')}
          {input('producers', 'الجهات المنتجة')}
          <label className="block text-xs font-bold text-gray-400">الحالة
            <select name="status" defaultValue={d?.status ?? 'ongoing'} className="mt-1 w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm">
              <option value="ongoing">مستمر</option><option value="completed">مكتمل</option><option value="upcoming">قادم</option><option value="hiatus">متوقف</option>
            </select>
          </label>
          <label className="block text-xs font-bold text-gray-400">نوع التحريك
            <select name="animation_type" defaultValue={d?.animation_type ?? '2d'} className="mt-1 w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm">
              <option value="2d">2D</option><option value="3d">3D</option><option value="mixed">مختلط</option><option value="other">أخرى</option>
            </select>
          </label>
        </div>

        <label className="block text-xs font-bold text-gray-400">أسماء بديلة (كل اسم في سطر)
          <textarea name="alternative_titles" rows={2} defaultValue={(d?.alternative_titles ?? []).join('\n')} className="mt-1 w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm" />
        </label>
        <label className="block text-xs font-bold text-gray-400">الوصف المختصر
          <textarea name="description" rows={2} defaultValue={d?.description ?? ''} className="mt-1 w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm" />
        </label>
        <label className="block text-xs font-bold text-gray-400">القصة الكاملة
          <textarea name="story" rows={4} defaultValue={d?.story ?? ''} className="mt-1 w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm" />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <ImageUploader bucket="covers" name="cover_image_url" label="غلاف العمل (2:3)" defaultValue={d?.cover_image_url} />
          <ImageUploader bucket="banners" name="banner_image_url" label="بانر عريض (16:5)" defaultValue={d?.banner_image_url} />
        </div>

        <div>
          <div className="mb-2 text-xs font-bold text-gray-400">التصنيفات</div>
          <div className="flex flex-wrap gap-2">
            {(genres ?? []).map((g: any) => (
              <label key={g.id} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-ink-800 px-3 py-1.5 text-xs cursor-pointer">
                <input type="checkbox" name="genre_ids" value={g.id} defaultChecked={selectedGenres.includes(g.id)} /> {g.name_ar}
              </label>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {input('featured_order', 'ترتيب التمييز', 'number')}
          <label className="flex items-center gap-2 text-sm mt-5"><input type="checkbox" name="is_featured" defaultChecked={!!d?.is_featured} /> عمل مميز (بانر)</label>
          <label className="flex items-center gap-2 text-sm mt-5"><input type="checkbox" name="editor_pick" defaultChecked={!!d?.editor_pick} /> اختيار المحرر</label>
          <label className="flex items-center gap-2 text-sm mt-5"><input type="checkbox" name="is_published" defaultChecked={!!d?.is_published} /> منشور</label>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="mb-2 text-xs font-bold text-amber-300">توثيق حقوق الاستخدام (إلزامي)</div>
          <div className="grid gap-3 sm:grid-cols-3">
            {input('license_source', 'مصدر المحتوى/الترخيص')}
            {input('license_type', 'نوع الترخيص')}
            <label className="block text-xs font-bold text-gray-400">حالة المراجعة
              <select name="license_status" defaultValue={d?.license_status ?? 'not_reviewed'} className="mt-1 w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm">
                <option value="not_reviewed">لم تُراجع</option><option value="in_review">قيد المراجعة</option><option value="approved">معتمد</option><option value="rejected">مرفوض</option>
              </select>
            </label>
          </div>
        </div>

        <button className="rounded-xl px-6 py-3 font-bold text-white" style={{ background: 'var(--brand)' }}>{isNew ? 'إنشاء العمل' : 'حفظ التعديلات'}</button>
      </form>

      {/* المواسم */}
      {!isNew && (
        <div className="mt-10">
          <h2 className="mb-3 text-lg font-extrabold flex items-center gap-2"><Clapperboard size={18} /> المواسم ({seasons.length})</h2>
          <div className="space-y-2 mb-4">
            {seasons.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-ink-850 p-3">
                <div>
                  <span className="font-bold">الموسم {s.season_number}</span> {s.title_ar && <span className="text-gray-400 text-sm">— {s.title_ar}</span>}
                  <span className="mr-3 text-xs text-gray-500">{s.episodes?.[0]?.count ?? 0} حلقة{s.is_hidden && ' · مخفي'}</span>
                </div>
                <Link href={`/admin/episodes/${s.id}`} className="rounded-lg px-3 py-1.5 text-xs font-bold text-white" style={{ background: 'var(--brand)' }}>إدارة الحلقات</Link>
              </div>
            ))}
          </div>
          <form action={upsertSeason} className="flex flex-wrap items-end gap-2 rounded-xl border border-white/5 bg-ink-850 p-4">
            <input type="hidden" name="donghua_id" value={d.id} />
            <label className="text-xs text-gray-400">رقم الموسم<input type="number" name="season_number" required defaultValue={(seasons[seasons.length - 1]?.season_number ?? 0) + 1} className="mt-1 block w-24 rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm" /></label>
            <label className="text-xs text-gray-400 flex-1 min-w-[150px]">عنوان الموسم<input type="text" name="title_ar" placeholder="اختياري" className="mt-1 block w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm" /></label>
            <label className="flex items-center gap-2 text-xs pb-2"><input type="checkbox" name="is_hidden" /> مخفي</label>
            <button className="flex items-center gap-1 rounded-lg px-4 py-2 text-xs font-bold text-white" style={{ background: 'var(--brand)' }}><Plus size={14} /> إضافة موسم</button>
          </form>
        </div>
      )}
    </div>
  );
}
