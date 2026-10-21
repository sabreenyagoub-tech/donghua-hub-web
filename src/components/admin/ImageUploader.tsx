'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Upload, Loader2, X } from 'lucide-react';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX = 5 * 1024 * 1024;

export default function ImageUploader({ bucket, name, label, defaultValue }:
  { bucket: 'covers' | 'banners'; name: string; label: string; defaultValue?: string | null }) {
  const [url, setUrl] = useState<string | null>(defaultValue ?? null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const supabase = createClient();

  const onFile = async (f: File) => {
    setErr(null);
    if (!ALLOWED.includes(f.type)) return setErr('صيغة غير مسموحة. استخدم JPG/PNG/WEBP.');
    if (f.size > MAX) return setErr('الحجم أكبر من 5 ميجابايت.');
    setBusy(true);
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${f.name.replace(/[^\w.\-]/g, '_')}`;
    const { error } = await supabase.storage.from(bucket).upload(path, f, { contentType: f.type, upsert: false });
    setBusy(false);
    if (error) return setErr('فشل الرفع: ' + error.message);
    const pub = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
    setUrl(pub);
  };

  return (
    <div>
      <label className="mb-1 block text-xs font-bold text-gray-400">{label}</label>
      <input type="hidden" name={name} value={url ?? ''} />
      {url ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className={`rounded-lg border border-white/10 object-cover ${bucket === 'covers' ? 'h-40 w-28' : 'h-28 w-full max-w-md'}`} />
          <button type="button" onClick={() => setUrl(null)} className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white"><X size={12} /></button>
        </div>
      ) : (
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-white/15 bg-ink-900 p-6 text-sm text-gray-400 hover:border-brand">
          {busy ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
          {busy ? 'جارٍ الرفع...' : 'اضغط لاختيار صورة (JPG/PNG/WEBP ≤ 5MB)'}
          <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && onFile(e.target.files[0])} />
        </label>
      )}
      {err && <p className="mt-1 text-xs text-red-400">{err}</p>}
    </div>
  );
}
