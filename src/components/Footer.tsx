import Link from 'next/link';
import type { AppSettings } from '@/lib/types';

export default function Footer({ settings }: { settings: AppSettings | null }) {
  const s = settings;
  return (
    <footer className="border-t border-white/5 bg-ink-950 mt-10">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 py-10 grid gap-8 md:grid-cols-4 text-sm">
        <div>
          <div className="text-lg font-extrabold mb-2">{s?.site_name ?? 'Donghua Hub'}</div>
          <p className="text-gray-400 leading-relaxed">{s?.site_tagline ?? 'عالم الدونغهوا الصينية المترجمة'}</p>
        </div>
        <div>
          <div className="font-bold mb-3 text-gray-200">روابط سريعة</div>
          <ul className="space-y-2 text-gray-400">
            <li><Link href="/browse" className="hover:text-white">تصفح الأعمال</Link></li>
            <li><Link href="/browse?status=ongoing" className="hover:text-white">أعمال مستمرة</Link></li>
            <li><Link href="/browse?sort=top_rated" className="hover:text-white">الأعلى تقييمًا</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-bold mb-3 text-gray-200">قانوني</div>
          <ul className="space-y-2 text-gray-400">
            {s?.privacy_policy_url && <li><a href={s.privacy_policy_url} className="hover:text-white">سياسة الخصوصية</a></li>}
            {s?.terms_url && <li><a href={s.terms_url} className="hover:text-white">شروط الاستخدام</a></li>}
            <li><Link href="/copyright" className="hover:text-white">بلاغ حقوق نشر (DMCA)</Link></li>
            {s?.dmca_email && <li className="break-all">اتصال: {s.dmca_email}</li>}
          </ul>
        </div>
        <div>
          <div className="font-bold mb-3 text-gray-200">تواصل</div>
          <ul className="space-y-2 text-gray-400">
            {s?.contact_email && <li className="break-all">{s.contact_email}</li>}
            {s?.social_links && Object.entries(s.social_links).map(([k, v]) => (
              <li key={k}><a href={v as string} target="_blank" rel="noopener noreferrer" className="hover:text-white capitalize">{k}</a></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5 py-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} {s?.site_name ?? 'Donghua Hub'} — جميع المحتويات المعروضة مملوكة لأصحابها. نحن لا نستضيف محتوى غير مرخص.
      </div>
    </footer>
  );
}
