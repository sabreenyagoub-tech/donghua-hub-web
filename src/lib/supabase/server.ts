import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // called from Server Component — ignore
          }
        },
      },
    },
  );
}

/** الجلسة الحالية + الدور الإداري (إن وُجد). آمن للاستخدام server-side فقط. */
export async function getSessionAndRole() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, role: null as null | 'owner' | 'admin' | 'editor' };
  const { data: roleRow } = await supabase
    .from('admin_roles').select('role').eq('user_id', user.id).maybeSingle();
  return { user, role: (roleRow?.role as any) ?? null };
}
