'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Heart, BookmarkPlus, Check, Play } from 'lucide-react';

export default function FollowButtons({ donghuaId, firstEpisodeId, isFav, isFollowing, loggedIn }:
  { donghuaId: string; firstEpisodeId: string | null; isFav: boolean; isFollowing: boolean; loggedIn: boolean }) {
  const [fav, setFav] = useState(isFav);
  const [following, setFollowing] = useState(isFollowing);
  const [busy, setBusy] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const toggleFav = async () => {
    if (!loggedIn) return router.push('/auth/login?next=' + location.pathname);
    setBusy(true);
    if (fav) await supabase.from('favorites').delete().eq('donghua_id', donghuaId);
    else await supabase.from('favorites').insert({ donghua_id: donghuaId });
    setFav(!fav); setBusy(false);
  };
  const toggleFollow = async () => {
    if (!loggedIn) return router.push('/auth/login?next=' + location.pathname);
    setBusy(true);
    if (following) await supabase.from('watchlist').delete().eq('donghua_id', donghuaId);
    else await supabase.from('watchlist').upsert({ donghua_id: donghuaId, status: 'watching' });
    setFollowing(!following); setBusy(false);
  };

  return (
    <div className="flex flex-wrap gap-3">
      {firstEpisodeId && (
        <a href={`/watch/${firstEpisodeId}`} className="inline-flex items-center gap-2 rounded-xl px-6 py-3 font-bold text-white" style={{ background: 'var(--brand)' }}>
          <Play size={18} fill="currentColor" /> ابدأ المشاهدة
        </a>
      )}
      <button onClick={toggleFollow} disabled={busy}
        className={`inline-flex items-center gap-2 rounded-xl border px-5 py-3 font-bold transition ${following ? 'border-green-500/50 text-green-400 bg-green-500/10' : 'border-white/15 hover:bg-white/5'}`}>
        {following ? <Check size={18} /> : <BookmarkPlus size={18} />}
        {following ? 'تتابعه' : 'تابع العمل'}
      </button>
      <button onClick={toggleFav} disabled={busy}
        className={`inline-flex items-center gap-2 rounded-xl border px-5 py-3 font-bold transition ${fav ? 'border-pink-500/50 text-pink-400 bg-pink-500/10' : 'border-white/15 hover:bg-white/5'}`}>
        <Heart size={18} fill={fav ? 'currentColor' : 'none'} /> {fav ? 'في المفضلة' : 'أضف للمفضلة'}
      </button>
    </div>
  );
}
