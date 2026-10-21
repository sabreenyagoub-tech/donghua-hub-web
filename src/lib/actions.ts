'use server';
import 'server-only';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSessionAndRole } from '@/lib/supabase/server';

async function requireAdmin(min: 'owner' | 'admin' | 'editor' = 'editor') {
  const { user, role } = await getSessionAndRole();
  if (!user || !role) redirect('/auth/login?next=/admin');
  const rank = { owner: 3, admin: 2, editor: 1 } as const;
  if (rank[role] < rank[min]) throw new Error('صلاحية غير كافية');
  return { user, role };
}

async function audit(actorId: string, action: string, entityType: string, entityId?: string, details: any = {}) {
  const admin = createAdminClient();
  await admin.from('audit_logs').insert({ actor_id: actorId, action, entity_type: entityType, entity_id: entityId ?? null, details });
}

export async function upsertDonghua(formData: FormData) {
  const { user } = await requireAdmin('editor');
  const admin = createAdminClient();
  const id = formData.get('id') as string | null;
  const payload: any = {
    slug: formData.get('slug'),
    title_ar: formData.get('title_ar'),
    title_en: formData.get('title_en') || null,
    title_zh: formData.get('title_zh') || null,
    alternative_titles: String(formData.get('alternative_titles') ?? '').split('\n').map(s => s.trim()).filter(Boolean),
    description: formData.get('description') || null,
    story: formData.get('story') || null,
    release_year: formData.get('release_year') ? +formData.get('release_year')! : null,
    status: formData.get('status'),
    total_episodes: formData.get('total_episodes') ? +formData.get('total_episodes')! : null,
    seasons_count: +(formData.get('seasons_count') ?? 1),
    animation_type: formData.get('animation_type'),
    studio: formData.get('studio') || null,
    producers: formData.get('producers') || null,
    episode_duration_min: formData.get('episode_duration_min') ? +formData.get('episode_duration_min')! : null,
    cover_image_url: formData.get('cover_image_url') || null,
    banner_image_url: formData.get('banner_image_url') || null,
    is_featured: formData.get('is_featured') === 'on',
    featured_order: +(formData.get('featured_order') ?? 0),
    editor_pick: formData.get('editor_pick') === 'on',
    is_published: formData.get('is_published') === 'on',
    license_source: formData.get('license_source') || null,
    license_type: formData.get('license_type') || null,
    license_status: formData.get('license_status') || 'not_reviewed',
  };
  let result: any;
  if (id) {
    result = await admin.from('donghua').update(payload).eq('id', id).select('id').single();
    await audit(user.id, 'donghua.update', 'donghua', id, payload);
  } else {
    result = await admin.from('donghua').insert(payload).select('id').single();
    await audit(user.id, 'donghua.create', 'donghua', result.data?.id, payload);
  }
  if (result.error) throw new Error(result.error.message);
  const donghuaId = result.data.id;
  const genreIds = formData.getAll('genre_ids') as string[];
  await admin.from('donghua_genres').delete().eq('donghua_id', donghuaId);
  if (genreIds.length) await admin.from('donghua_genres').insert(genreIds.map(g => ({ donghua_id: donghuaId, genre_id: g })));
  revalidatePath('/'); revalidatePath('/browse'); revalidatePath(`/donghua/${payload.slug}`);
  redirect('/admin/donghua');
}

export async function deleteDonghua(formData: FormData) {
  const { user } = await requireAdmin('admin');
  const admin = createAdminClient();
  const id = formData.get('id') as string;
  await audit(user.id, 'donghua.delete', 'donghua', id);
  const { error } = await admin.from('donghua').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/'); revalidatePath('/admin/donghua');
  redirect('/admin/donghua');
}

export async function duplicateDonghua(formData: FormData) {
  const { user } = await requireAdmin('editor');
  const admin = createAdminClient();
  const id = formData.get('id') as string;
  const { data: src } = await admin.from('donghua').select('*').eq('id', id).single();
  if (!src) throw new Error('العمل غير موجود');
  const { data: copy, error } = await admin.from('donghua').insert({
    ...src, id: undefined, slug: src.slug + '-copy-' + Date.now(), title_ar: src.title_ar + ' (نسخة)',
    is_published: false, is_featured: false, view_count: 0, rating_avg: 0, rating_count: 0, current_episode: 0,
    created_at: undefined, updated_at: undefined, added_at: new Date().toISOString(),
  }).select('id').single();
  if (error) throw new Error(error.message);
  await audit(user.id, 'donghua.duplicate', 'donghua', copy!.id, { from: id });
  redirect(`/admin/donghua/${copy!.id}`);
}

export async function upsertSeason(formData: FormData) {
  const { user } = await requireAdmin('editor');
  const admin = createAdminClient();
  const id = formData.get('id') as string | null;
  const payload: any = {
    donghua_id: formData.get('donghua_id'),
    season_number: +formData.get('season_number')!,
    title_ar: formData.get('title_ar') || null,
    is_hidden: formData.get('is_hidden') === 'on',
    sort_order: +(formData.get('sort_order') ?? 0),
  };
  const q = id ? admin.from('seasons').update(payload).eq('id', id) : admin.from('seasons').insert(payload);
  const { error } = await q;
  if (error) throw new Error(error.message);
  await audit(user.id, id ? 'season.update' : 'season.create', 'season', id ?? undefined, payload);
  revalidatePath('/admin');
  redirect(`/admin/donghua/${payload.donghua_id}`);
}

export async function upsertEpisode(formData: FormData) {
  const { user } = await requireAdmin('editor');
  const admin = createAdminClient();
  const id = formData.get('id') as string | null;
  const status = formData.get('status') as string;
  const payload: any = {
    season_id: formData.get('season_id'),
    episode_number: +formData.get('episode_number')!,
    title_ar: formData.get('title_ar') || null,
    description: formData.get('description') || null,
    air_date: formData.get('air_date') || null,
    duration_seconds: formData.get('duration_seconds') ? +formData.get('duration_seconds')! : null,
    status,
    published_at: status === 'published' ? new Date().toISOString() : null,
  };
  const q = id ? admin.from('episodes').update(payload).eq('id', id) : admin.from('episodes').insert(payload);
  const { error, data } = await q.select('id').single();
  if (error) throw new Error(error.message);
  await audit(user.id, id ? 'episode.update' : 'episode.create', 'episode', data?.id, payload);
  revalidatePath('/');
  redirect(`/admin/episodes/${payload.season_id}`);
}

/** إدخال جماعي: كل سطر "رقم|عنوان|تاريخ(YYYY-MM-DD)" */
export async function bulkInsertEpisodes(formData: FormData) {
  const { user } = await requireAdmin('editor');
  const admin = createAdminClient();
  const seasonId = formData.get('season_id') as string;
  const lines = String(formData.get('bulk') ?? '').split('\n').map(l => l.trim()).filter(Boolean);
  const rows = lines.map(l => {
    const [num, title, air] = l.split('|').map(s => s.trim());
    return { season_id: seasonId, episode_number: +num, title_ar: title || null, air_date: air || null, status: 'published' as const, published_at: new Date().toISOString() };
  }).filter(r => !isNaN(r.episode_number));
  const { error } = await admin.from('episodes').insert(rows);
  if (error) throw new Error(error.message);
  await audit(user.id, 'episode.bulk_create', 'season', seasonId, { count: rows.length });
  revalidatePath('/');
  redirect(`/admin/episodes/${seasonId}`);
}

export async function deleteEpisode(formData: FormData) {
  const { user } = await requireAdmin('editor');
  const admin = createAdminClient();
  const id = formData.get('id') as string; const seasonId = formData.get('season_id') as string;
  await audit(user.id, 'episode.delete', 'episode', id);
  await admin.from('episodes').delete().eq('id', id);
  revalidatePath('/');
  redirect(`/admin/episodes/${seasonId}`);
}

export async function upsertSource(formData: FormData) {
  const { user } = await requireAdmin('editor');
  const admin = createAdminClient();
  const kind = formData.get('kind') as 'video' | 'download';
  const table = kind === 'video' ? 'video_sources' : 'download_sources';
  const payload: any = {
    episode_id: formData.get('episode_id'),
    url: formData.get('url'),
    quality: formData.get('quality') ?? 'auto',
    is_active: formData.get('is_active') !== 'off',
    rights_notes: formData.get('rights_notes') || null,
  };
  if (kind === 'video') { payload.source_type = formData.get('source_type'); payload.language = formData.get('language') ?? 'ar'; payload.label = formData.get('label') || null; payload.sort_order = +(formData.get('sort_order') ?? 0); }
  else { payload.file_size_bytes = formData.get('file_size_bytes') ? +formData.get('file_size_bytes')! : null; }
  const { error } = await admin.from(table).insert(payload);
  if (error) throw new Error(error.message);
  await audit(user.id, `${table}.create`, table, undefined, payload);
  revalidatePath('/admin');
  redirect(`/admin/episodes/${payload.episode_id ? (await admin.from('episodes').select('season_id').eq('id', payload.episode_id).single()).data?.season_id : ''}`);
}

export async function insertSubtitle(formData: FormData) {
  const { user } = await requireAdmin('editor');
  const admin = createAdminClient();
  const payload = {
    episode_id: formData.get('episode_id') as string,
    storage_path: formData.get('storage_path') as string,
    original_filename: formData.get('original_filename') as string,
    format: formData.get('format') as 'srt' | 'vtt' | 'ass' | 'ssa',
    language: formData.get('language') as string,
    translator_name: formData.get('translator_name') as string || null,
    is_default: formData.get('is_default') === 'on',
    status: (formData.get('status') as any) ?? 'available',
    file_size_bytes: formData.get('file_size_bytes') ? +formData.get('file_size_bytes')! : null,
  };
  const { error } = await admin.from('subtitle_files').insert(payload);
  if (error) throw new Error(error.message);
  await admin.from('upload_records').insert({ uploader_user_id: user.id, file_type: 'subtitle', file_name: payload.original_filename, file_size_bytes: payload.file_size_bytes, storage_path: payload.storage_path });
  await audit(user.id, 'subtitle.create', 'subtitle_file', undefined, { episode: payload.episode_id });
  revalidatePath('/admin');
  redirect(`/admin/subtitles`);
}

export async function deleteSubtitle(formData: FormData) {
  const { user } = await requireAdmin('editor');
  const admin = createAdminClient();
  const id = formData.get('id') as string; const path = formData.get('storage_path') as string;
  await admin.storage.from('subtitles').remove([path]);
  await admin.from('subtitle_files').delete().eq('id', id);
  await audit(user.id, 'subtitle.delete', 'subtitle_file', id);
  revalidatePath('/admin/subtitles');
  redirect('/admin/subtitles');
}

export async function updateSettings(formData: FormData) {
  const { user } = await requireAdmin('admin');
  const admin = createAdminClient();
  const payload: any = {
    site_name: formData.get('site_name'),
    site_tagline: formData.get('site_tagline') || null,
    site_description: formData.get('site_description') || null,
    logo_url: formData.get('logo_url') || null,
    primary_color: formData.get('primary_color'),
    accent_color: formData.get('accent_color'),
    background_color: formData.get('background_color'),
    contact_email: formData.get('contact_email') || null,
    dmca_email: formData.get('dmca_email') || null,
    privacy_policy_url: formData.get('privacy_policy_url') || null,
    terms_url: formData.get('terms_url') || null,
    notifications_on: formData.get('notifications_on') === 'on',
    social_links: (() => { try { return JSON.parse(String(formData.get('social_links') ?? '{}')); } catch { return {}; } })(),
  };
  const { error } = await admin.from('app_settings').update(payload).eq('id', 1);
  if (error) throw new Error(error.message);
  await audit(user.id, 'settings.update', 'app_settings', '1', payload);
  revalidatePath('/', 'layout');
  redirect('/admin/settings');
}

export async function updateReport(formData: FormData) {
  const { user } = await requireAdmin('admin');
  const admin = createAdminClient();
  const id = formData.get('id') as string;
  const status = formData.get('status') as string;
  const { data: report } = await admin.from('copyright_reports').select('donghua_id').eq('id', id).single();
  await admin.from('copyright_reports').update({ status, reviewer_id: user.id, reviewed_at: new Date().toISOString() }).eq('id', id);
  if (status === 'content_removed' && report?.donghua_id) {
    await admin.from('donghua').update({ copyright_hold: true }).eq('id', report.donghua_id);
  }
  await audit(user.id, `copyright_report.${status}`, 'copyright_report', id);
  revalidatePath('/admin/reports');
  redirect('/admin/reports');
}

export async function setUserDisabled(formData: FormData) {
  const { user } = await requireAdmin('owner');
  const admin = createAdminClient();
  const targetId = formData.get('user_id') as string;
  const disabled = formData.get('disabled') === 'true';
  const { error } = await admin.auth.admin.updateUserById(targetId, { user_metadata: { disabled } });
  if (error) throw new Error(error.message);
  await audit(user.id, `user.${disabled ? 'disable' : 'enable'}`, 'auth_user', targetId);
  revalidatePath('/admin/users');
  redirect('/admin/users');
}

export async function sendNotification(formData: FormData) {
  const { user } = await requireAdmin('admin');
  const admin = createAdminClient();
  const title = formData.get('title_ar') as string;
  const body = formData.get('body_ar') as string;
  const donghuaId = formData.get('donghua_id') as string || null;
  const { data: notif } = await admin.from('notifications').insert({ title_ar: title, body_ar: body, related_donghua_id: donghuaId, sent_at: new Date().toISOString() }).select('id').single();
  await audit(user.id, 'notification.broadcast', 'notification', notif?.id, { title });
  // FCM اختياري: إن وُجد المفتاح، أرسل إلى كل التوكنات المسجلة
  const fcmKey = process.env.FCM_SERVER_KEY;
  if (fcmKey) {
    const { data: tokens } = await admin.from('notification_tokens').select('token');
    const toks = (tokens ?? []).map(t => t.token);
    if (toks.length) {
      await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: { Authorization: `key=${fcmKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ registration_ids: toks, notification: { title, body, sound: 'default' }, data: { donghuaId: donghuaId ?? '' } }),
      }).catch(() => {});
    }
  }
  revalidatePath('/admin');
  redirect('/admin');
}
