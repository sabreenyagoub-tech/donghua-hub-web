'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { createClient } from '@/lib/supabase/client';
import { srtToVtt, formatDuration } from '@/lib/utils';
import type { VideoSource, SubtitleFile } from '@/lib/types';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, SkipBack, SkipForward, Loader2, AlertTriangle, ExternalLink, Subtitles } from 'lucide-react';

interface Props {
  episodeId: string;
  sources: VideoSource[];
  subtitles: SubtitleFile[];
  nextEpisodeId?: string | null;
  prevEpisodeId?: string | null;
  autoplayDefault?: boolean;
}

interface SubTrack { id: string; label: string; src: string; lang: string; }

export default function Player({ episodeId, sources, subtitles, nextEpisodeId, prevEpisodeId, autoplayDefault = true }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const [srcIdx, setSrcIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [tracks, setTracks] = useState<SubTrack[]>([]);
  const [activeSub, setActiveSub] = useState<string>('off');
  const [autoplayNext, setAutoplayNext] = useState(autoplayDefault);
  const [viewLogged, setViewLogged] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const src = sources[srcIdx];

  // تحميل الترجمات الموقّعة
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded: SubTrack[] = [];
      for (const sub of subtitles) {
        try {
          const r = await fetch(`/api/subtitle-url?subtitleId=${sub.id}`);
          if (!r.ok) continue;
          const { signedUrl, format } = await r.json();
          let vttUrl = signedUrl;
          if (format === 'srt') {
            const txt = await (await fetch(signedUrl)).text();
            const blob = new Blob([srtToVtt(txt)], { type: 'text/vtt' });
            vttUrl = URL.createObjectURL(blob);
          } else if (format === 'ass' || format === 'ssa') {
            continue; // غير مدعوم داخل المشغل — يظهر كرابط تنزيل خارجي
          }
          loaded.push({ id: sub.id, label: `${sub.translator_name ?? sub.language} (${sub.format.toUpperCase()})`, src: vttUrl, lang: sub.language });
        } catch { /* تجاهل ترجمة فاشلة */ }
      }
      if (!cancelled) {
        setTracks(loaded);
        const def = subtitles.find(s => s.is_default);
        if (def && loaded.some(t => t.id === def.id)) setActiveSub(def.id);
      }
    })();
    return () => { cancelled = true; };
  }, [subtitles]);

  // تفعيل/إيقاف track
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    Array.from(v.textTracks).forEach((t, i) => {
      t.mode = tracks[i] && tracks[i].id === activeSub ? 'showing' : 'disabled';
    });
  }, [activeSub, tracks]);

  // تحميل المصدر + استئناف الموضع
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !src) return;
    setError(null); setLoading(true);
    hlsRef.current?.destroy(); hlsRef.current = null;

    const resume = async () => {
      let pos = 0;
      const local = localStorage.getItem(`pos:${episodeId}`);
      if (local) pos = parseInt(local) || 0;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: h } = await supabase.from('watch_history').select('position_seconds').eq('episode_id', episodeId).maybeSingle();
        if (h && h.position_seconds > pos) pos = h.position_seconds;
      }
      if (pos > 5) { try { v.currentTime = pos; setCurrent(pos); } catch {} }
    };

    if (src.source_type === 'hls' && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hlsRef.current = hls;
      hls.loadSource(src.url);
      hls.attachMedia(v);
      hls.on(Hls.Events.MANIFEST_PARSED, () => { setLoading(false); resume(); });
      hls.on(Hls.Events.ERROR, (_e, d) => {
        if (d.fatal) setError('تعذّر تشغيل مصدر HLS. جرّب جودة أخرى أو المصدر البديل.');
      });
    } else {
      v.src = src.url;
      v.addEventListener('loadedmetadata', () => { setLoading(false); resume(); }, { once: true });
    }
    return () => { hlsRef.current?.destroy(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [srcIdx, episodeId]);

  // حفظ الموضع كل 10 ثوانٍ + عند الخروج
  useEffect(() => {
    const save = async () => {
      const v = videoRef.current; if (!v) return;
      const pos = Math.floor(v.currentTime);
      localStorage.setItem(`pos:${episodeId}`, String(pos));
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('watch_history').upsert(
          { user_id: user.id, episode_id: episodeId, position_seconds: pos, duration_seconds: Math.floor(v.duration || 0), last_watched_at: new Date().toISOString() },
          { onConflict: 'user_id,episode_id' },
        );
      }
    };
    saveTimer.current = setInterval(save, 10000);
    window.addEventListener('beforeunload', save);
    return () => { if (saveTimer.current) clearInterval(saveTimer.current); window.removeEventListener('beforeunload', save); save(); };
  }, [episodeId, supabase]);

  const logView = useCallback(() => {
    if (viewLogged) return; setViewLogged(true);
    fetch('/api/views', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ episodeId }) }).catch(() => {});
  }, [episodeId, viewLogged]);

  const togglePlay = () => {
    const v = videoRef.current; if (!v) return;
    if (v.paused) { v.play(); logView(); } else v.pause();
  };
  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current; if (!v) return;
    v.currentTime = (e.target.value as unknown as number) / 100 * (v.duration || 0);
  };
  const onEnded = () => {
    if (autoplayNext && nextEpisodeId) window.location.href = `/watch/${nextEpisodeId}`;
  };

  if (sources.length === 0) {
    return <div className="rounded-2xl border border-white/10 bg-ink-850 p-10 text-center text-gray-400">لا يوجد مصدر مشاهدة متاح لهذه الحلقة بعد.</div>;
  }
  if (src?.source_type === 'external_page') {
    return (
      <div className="rounded-2xl border border-white/10 bg-ink-850 p-10 text-center">
        <ExternalLink size={36} className="mx-auto text-gray-500 mb-3" />
        <p className="font-bold mb-1">هذا المصدر خارجي (صفحة مشاهدة)</p>
        <p className="text-sm text-gray-400 mb-4">لا يمكن تشغيله داخل المشغل. افتحه من الرابط المصرح به.</p>
        <a href={src.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 font-bold text-white" style={{ background: 'var(--brand)' }}>
          فتح المشغل الخارجي <ExternalLink size={16} />
        </a>
        {sources.length > 1 && (
          <div className="mt-4 text-sm text-gray-400">جرّب مصدرًا آخر:
            <select className="ml-2 rounded-lg bg-ink-800 border border-white/10 px-2 py-1" value={srcIdx} onChange={e => setSrcIdx(+e.target.value)}>
              {sources.map((s, i) => <option key={s.id} value={i}>{s.label ?? `${s.source_type} ${s.quality}`}</option>)}
            </select>
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="group relative aspect-video w-full overflow-hidden rounded-2xl bg-black border border-white/10">
      <video
        ref={videoRef}
        className="h-full w-full"
        onClick={togglePlay}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={e => { const v = e.target as HTMLVideoElement; setCurrent(v.currentTime); if (v.buffered.length) setBuffered(v.buffered.end(v.buffered.length - 1)); }}
        onLoadedMetadata={e => setDuration((e.target as HTMLVideoElement).duration)}
        onWaiting={() => setLoading(true)}
        onPlaying={() => setLoading(false)}
        onError={() => { setLoading(false); setError('تعذّر تحميل الفيديو. تحقق من اتصالك أو جرّب مصدرًا آخر.'); }}
        onEnded={onEnded}
        crossOrigin="anonymous"
      >
        {tracks.map(t => <track key={t.id} kind="subtitles" src={t.src} srcLang={t.lang} label={t.label} />)}
      </video>

      {loading && !error && <div className="absolute inset-0 grid place-items-center bg-black/40"><Loader2 size={40} className="animate-spin text-white" /></div>}
      {error && (
        <div className="absolute inset-0 grid place-items-center bg-black/70 p-6 text-center">
          <div><AlertTriangle size={36} className="mx-auto text-amber-400 mb-2" /><p className="text-sm">{error}</p></div>
        </div>
      )}

      {/* شريط التحكم */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3 opacity-0 transition group-hover:opacity-100">
        <input type="range" min={0} max={100} value={duration ? (current / duration) * 100 : 0} onChange={seek}
          className="mb-2 w-full accent-brand" style={{ accentColor: 'var(--brand)' }} />
        <div className="flex items-center gap-3 text-white">
          <button onClick={togglePlay} className="p-1 hover:text-brand">{playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}</button>
          {prevEpisodeId && <a href={`/watch/${prevEpisodeId}`} className="p-1 hover:text-brand" title="السابقة"><SkipBack size={18} /></a>}
          {nextEpisodeId && <a href={`/watch/${nextEpisodeId}`} className="p-1 hover:text-brand" title="التالية"><SkipForward size={18} /></a>}
          <button onClick={() => { const v = videoRef.current!; setMuted(!muted); v.muted = !muted; }} className="p-1 hover:text-brand">{muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
          <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume} onChange={e => { const v = videoRef.current!; v.volume = +e.target.value; v.muted = false; setVolume(+e.target.value); setMuted(false); }} className="w-20 accent-brand" style={{ accentColor: 'var(--brand)' }} />
          <span className="text-xs text-gray-300 tabular-nums">{formatDuration(current)} / {formatDuration(duration)}</span>
          <div className="flex-1" />
          <label className="flex items-center gap-1 text-xs text-gray-300 cursor-pointer">
            <input type="checkbox" checked={autoplayNext} onChange={e => setAutoplayNext(e.target.checked)} /> تلقائي التالي
          </label>
          <div className="relative">
            <button onClick={() => setShowSettings(!showSettings)} className="p-1 hover:text-brand"><Settings size={18} /></button>
            {showSettings && (
              <div className="absolute bottom-8 left-0 w-56 rounded-xl border border-white/10 bg-ink-900 p-3 text-xs shadow-xl">
                <div className="mb-2 font-bold text-gray-300">الجودة</div>
                <div className="mb-3 flex flex-wrap gap-1">
                  {sources.map((s, i) => (
                    <button key={s.id} onClick={() => { setSrcIdx(i); setShowSettings(false); }}
                      className={`rounded px-2 py-1 ${i === srcIdx ? 'text-white' : 'bg-white/5 text-gray-400'}`} style={i === srcIdx ? { background: 'var(--brand)' } : {}}>
                      {s.quality}
                    </button>
                  ))}
                </div>
                <div className="mb-2 font-bold text-gray-300">السرعة</div>
                <div className="mb-3 flex flex-wrap gap-1">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map(r => (
                    <button key={r} onClick={() => { const v = videoRef.current!; v.playbackRate = r; setRate(r); }}
                      className={`rounded px-2 py-1 ${rate === r ? 'text-white' : 'bg-white/5 text-gray-400'}`} style={rate === r ? { background: 'var(--brand)' } : {}}>{r}x</button>
                  ))}
                </div>
                <div className="mb-1 font-bold text-gray-300 flex items-center gap-1"><Subtitles size={12} /> الترجمة</div>
                <div className="flex flex-wrap gap-1">
                  <button onClick={() => setActiveSub('off')} className={`rounded px-2 py-1 ${activeSub === 'off' ? 'text-white' : 'bg-white/5 text-gray-400'}`} style={activeSub === 'off' ? { background: 'var(--brand)' } : {}}>إيقاف</button>
                  {tracks.map(t => (
                    <button key={t.id} onClick={() => setActiveSub(t.id)} className={`rounded px-2 py-1 ${activeSub === t.id ? 'text-white' : 'bg-white/5 text-gray-400'}`} style={activeSub === t.id ? { background: 'var(--brand)' } : {}}>{t.label}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button onClick={() => containerRef.current?.requestFullscreen()} className="p-1 hover:text-brand"><Maximize size={18} /></button>
        </div>
      </div>
    </div>
  );
}
