'use client';
import { useState } from 'react';
import SubtitleUploader from './SubtitleUploader';

/** يختار الحلقة ثم يعرض أداة رفع الترجمة الخاصة بها. */
export default function SubtitleUploaderRouter({ episodes }: { episodes: { id: string; episode_number: number; title_ar?: string | null }[] }) {
  const [epId, setEpId] = useState<string | null>(null);
  return (
    <div>
      <select value={epId ?? ''} onChange={e => setEpId(e.target.value || null)} className="mb-3 w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm">
        <option value="">اختر الحلقة للترجمة…</option>
        {episodes.map(e => <option key={e.id} value={e.id}>الحلقة {e.episode_number}{e.title_ar ? ` — ${e.title_ar}` : ''}</option>)}
      </select>
      {epId && <SubtitleUploader episodeId={epId} />}
    </div>
  );
}
