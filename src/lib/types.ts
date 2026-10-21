// أنواع البيانات — تطابق مخطط Supabase (0001_initial_schema.sql)
export type UUID = string;

export type DonghuaStatus = 'upcoming' | 'ongoing' | 'completed' | 'hiatus';
export type AnimationType = '2d' | '3d' | 'mixed' | 'other';
export type EpisodeStatus = 'draft' | 'scheduled' | 'published';
export type SourceType = 'mp4' | 'hls' | 'external_page';
export type Quality = 'auto' | '240p' | '360p' | '480p' | '720p' | '1080p' | '1440p' | '4k';
export type SubtitleFormat = 'srt' | 'vtt' | 'ass' | 'ssa';
export type SubtitleStatus = 'unavailable' | 'reviewing' | 'available';

export interface Genre { id: UUID; slug: string; name_ar: string; name_en?: string | null; icon?: string | null; sort_order: number; }

export interface Donghua {
  id: UUID; slug: string; title_ar: string; title_en?: string | null; title_zh?: string | null;
  alternative_titles: string[]; description?: string | null; story?: string | null;
  release_year?: number | null; release_date?: string | null; status: DonghuaStatus;
  total_episodes?: number | null; current_episode: number; seasons_count: number;
  animation_type: AnimationType; studio?: string | null; producers?: string | null;
  episode_duration_min?: number | null; rating_avg: number; rating_count: number;
  view_count: number; cover_image_url?: string | null; banner_image_url?: string | null;
  is_featured: boolean; featured_order: number; editor_pick: boolean; is_published: boolean;
  added_at: string; license_source?: string | null; license_type?: string | null;
  copyright_hold: boolean; created_at: string; updated_at: string;
  genres?: Genre[];
}

export interface Season { id: UUID; donghua_id: UUID; season_number: number; title_ar?: string | null; title_en?: string | null; is_hidden: boolean; sort_order: number; }

export interface Episode {
  id: UUID; season_id: UUID; episode_number: number; title_ar?: string | null; title_en?: string | null;
  description?: string | null; air_date?: string | null; duration_seconds?: number | null;
  status: EpisodeStatus; published_at?: string | null; view_count: number;
}

export interface VideoSource { id: UUID; episode_id: UUID; source_type: SourceType; url: string; quality: Quality; language: string; label?: string | null; is_active: boolean; sort_order: number; rights_notes?: string | null; }
export interface DownloadSource { id: UUID; episode_id: UUID; url: string; quality: Quality; file_size_bytes?: number | null; is_active: boolean; rights_notes?: string | null; }
export interface SubtitleFile { id: UUID; episode_id: UUID; storage_path: string; original_filename?: string | null; format: SubtitleFormat; language: string; translator_name?: string | null; is_default: boolean; status: SubtitleStatus; file_size_bytes?: number | null; }

export interface Profile { id: UUID; username?: string | null; display_name?: string | null; avatar_url?: string | null; language: string; theme: string; notify_enabled: boolean; autoplay_next: boolean; subtitle_size: string; }
export interface AppSettings { id: number; site_name: string; site_tagline?: string | null; site_description?: string | null; logo_url?: string | null; primary_color: string; accent_color: string; background_color: string; social_links: Record<string, string>; contact_email?: string | null; privacy_policy_url?: string | null; terms_url?: string | null; dmca_email?: string | null; sections_order: string[]; enabled_sections: string[]; notifications_on: boolean; }
export interface Announcement { id: UUID; title_ar: string; title_en?: string | null; body_ar?: string | null; body_en?: string | null; donghua_id?: UUID | null; is_published: boolean; published_at?: string | null; }
export interface WatchHistory { id: UUID; user_id: UUID; episode_id: UUID; position_seconds: number; duration_seconds?: number | null; completed: boolean; last_watched_at: string; }
export interface CopyrightReport { id: UUID; reporter_name?: string | null; reporter_email: string; donghua_id?: UUID | null; episode_id?: UUID | null; reported_url?: string | null; description: string; status: 'pending' | 'reviewed' | 'content_removed' | 'rejected'; created_at: string; }

// أقسام الصفحة الرئيسية (الترتيب والتفعيل من app_settings)
export const HOME_SECTIONS = [
  { key: 'featured',        label: 'الأعمال المميزة' },
  { key: 'latest_episodes', label: 'أحدث الحلقات' },
  { key: 'recently_updated',label: 'حُدّثت مؤخرًا' },
  { key: 'most_viewed',     label: 'الأكثر مشاهدة' },
  { key: 'top_rated',       label: 'الأعلى تقييمًا' },
  { key: 'ongoing',         label: 'مستمرة حاليًا' },
  { key: 'completed',       label: 'أعمال مكتملة' },
  { key: 'upcoming',        label: 'قادمة' },
  { key: 'latest_added',    label: 'أحدث الأعمال' },
  { key: 'editor_picks',    label: 'اختيارات المحرر' },
  { key: 'genre_action',    label: 'أكشن وقتال',       genre: 'action' },
  { key: 'genre_fantasy',   label: 'فانتازيا وسحر',    genre: 'fantasy' },
  { key: 'genre_cultivation', label: 'زراعة القوة الروحية', genre: 'cultivation' },
  { key: 'genre_martial',   label: 'فنون قتالية',      genre: 'martial-arts' },
  { key: 'genre_adventure', label: 'مغامرات',           genre: 'adventure' },
  { key: 'genre_isekai',    label: 'تناسخ وعالم آخر',   genre: 'isekai' },
  { key: 'genre_scifi',     label: 'خيال علمي',         genre: 'sci-fi' },
  { key: 'genre_drama',     label: 'دراما',             genre: 'drama' },
  { key: 'genre_3d',        label: 'أعمال 3D',          genre: '3d' },
  { key: 'genre_2d',        label: 'أعمال 2D',          genre: '2d' },
] as const;

export const QUALITY_OPTIONS: Quality[] = ['auto','240p','360p','480p','720p','1080p','1440p','4k'];
export const YEARS = Array.from({ length: 26 }, (_, i) => 2026 - i);
