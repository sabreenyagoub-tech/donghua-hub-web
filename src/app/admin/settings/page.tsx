import { createClient } from '@/lib/supabase/server';
import { updateSettings } from '@/lib/actions';
import { HOME_SECTIONS } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminSettings() {
  const supabase = createClient();
  const { data: s } = await supabase.from('app_settings').select('*').eq('id', 1).single();
  const settings: any = s ?? {};

  const field = (name: string, label: string, type = 'text', ph = '') => (
    <label className="block text-xs font-bold text-gray-400">{label}
      <input type={type} name={name} defaultValue={settings[name] ?? ''} placeholder={ph} className="mt-1 w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm" />
    </label>
  );

  return (
    <div>
      <h1 className="mb-4 text-2xl font-black">إعدادات الموقع والتطبيق</h1>
      <form action={updateSettings} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {field('site_name', 'اسم التطبيق والموقع *')}
          {field('site_tagline', 'الشعار النصي')}
          {field('logo_url', 'رابط الشعار (URL)')}
          {field('contact_email', 'بريد التواصل')}
          {field('dmca_email', 'بريد بلاغات الحقوق')}
          {field('privacy_policy_url', 'رابط سياسة الخصوصية')}
          {field('terms_url', 'رابط شروط الاستخدام')}
          <label className="block text-xs font-bold text-gray-400">اللون الأساسي<input type="color" name="primary_color" defaultValue={settings.primary_color ?? '#e11d48'} className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-ink-900" /></label>
          <label className="block text-xs font-bold text-gray-400">اللون المميز<input type="color" name="accent_color" defaultValue={settings.accent_color ?? '#f59e0b'} className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-ink-900" /></label>
          <label className="block text-xs font-bold text-gray-400">لون الخلفية<input type="color" name="background_color" defaultValue={settings.background_color ?? '#0b0d12'} className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-ink-900" /></label>
        </div>
        <label className="block text-xs font-bold text-gray-400">وصف الموقع (SEO)
          <textarea name="site_description" rows={2} defaultValue={settings.site_description ?? ''} className="mt-1 w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm" />
        </label>
        <label className="block text-xs font-bold text-gray-400">روابط التواصل (JSON: {`{"telegram":"https://...","twitter":"https://..."}`})
          <textarea name="social_links" rows={2} defaultValue={JSON.stringify(settings.social_links ?? {}, null, 2)} className="mt-1 w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 font-mono text-xs" />
        </label>
        <div>
          <div className="mb-2 text-xs font-bold text-gray-400">أقسام الصفحة الرئيسية (الترتيب = أرقام صغيرة أولاً؛ ألغِ التحديد لإخفاء القسم)</div>
          <input type="hidden" name="sections_order" value={HOME_SECTIONS.map(h => h.key).join(',')} />
          <input type="hidden" name="enabled_sections" value={HOME_SECTIONS.map(h => h.key).join(',')} />
          <div className="flex flex-wrap gap-2">
            {HOME_SECTIONS.map(h => <span key={h.key} className="rounded-full border border-white/10 bg-ink-800 px-3 py-1 text-xs">{h.label}</span>)}
          </div>
          <p className="mt-2 text-xs text-gray-500">ملاحظة: التحكم الكامل بالترتيب والإخفاء متاح عبر تعديل عمودي sections_order/enabled_seasons في جدول app_settings (قيم JSON). النموذج أعلاه يحفظ الافتراضي.</p>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="notifications_on" defaultChecked={settings.notifications_on} /> تفعيل الإشعارات</label>
        <button className="rounded-xl px-6 py-3 font-bold text-white" style={{ background: 'var(--brand)' }}>حفظ الإعدادات</button>
      </form>
    </div>
  );
}
