import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // called from Server Component - ignore
          }
        },
      },
    }
  );
}

/** جلب الجلسة والدور (للتأكد من صلاحيات المالك) */
export async function getSessionAndRole() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, role: null as any };
  const { data: roleRow } = await supabase
    .from('admin_roles').select('role').eq('user_id', user.id).maybeSingle();
  return { user, role: (roleRow?.role as any) ?? null };
}
