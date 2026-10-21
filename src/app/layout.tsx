import type { Metadata } from 'next';
import './globals.css';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Donghua Hub - عالم الدونغهوا',
  description: 'منصة عربية لمشاهدة الدونغهوا الصينية المترجمة',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: settings } = await supabase.from('app_settings').select('*').eq('id', 1).maybeSingle();

  const primary = settings?.primary_color ?? '#e11d48';
  const accent = settings?.accent_color ?? '#f59e0b';
  const bg = settings?.background_color ?? '#0b0d12';
  const siteName = settings?.site_name ?? 'Donghua Hub';

  return (
    <html lang="ar" dir="rtl" className="dark">
      <body className="min-h-screen font-sans" style={{ ['--brand' as any]: primary, ['--accent' as any]: accent, ['--bg' as any]: bg }}>
        <Header siteName={siteName} logoUrl={settings?.logo_url ?? null} />
        <main className="mx-auto max-w-7xl px-3 sm:px-6 pb-16">{children}</main>
        <Footer settings={settings as any} />
      </body>
    </html>
  );
}
