import { createClient } from '@/lib/supabase/server';
import { setUserDisabled } from '@/lib/actions';
import { Ban, CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminUsers() {
  const supabase = createClient();
  const { data } = await supabase.from('profiles').select('*, admin_roles(role)').order('created_at', { ascending: false }).limit(200);
  const users = (data as any[]) ?? [];
  return (
    <div>
      <h1 className="mb-4 text-2xl font-black">المستخدمون ({users.length})</h1>
      <div className="overflow-x-auto rounded-2xl border border-white/5 bg-ink-850">
        <table className="w-full text-sm">
          <thead className="border-b border-white/5 text-gray-400"><tr><th className="p-3 text-right">المعرّف</th><th className="p-3 text-right">الاسم</th><th className="p-3 text-right">الدور</th><th className="p-3 text-right">تاريخ الانضمام</th><th className="p-3 text-right">إجراء</th></tr></thead>
          <tbody>
            {users.map(u => {
              const disabled = u.user_metadata?.disabled;
              const role = u.admin_roles?.[0]?.role;
              return (
                <tr key={u.id} className="border-b border-white/5">
                  <td className="p-3 font-mono text-xs break-all">{u.id.slice(0, 8)}…</td>
                  <td className="p-3">{u.display_name ?? u.username ?? '—'}</td>
                  <td className="p-3">{role ? <span className="rounded bg-brand/20 px-2 py-0.5 text-xs font-bold text-brand">{role}</span> : <span className="text-gray-500 text-xs">مستخدم</span>}</td>
                  <td className="p-3 text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString('ar')}</td>
                  <td className="p-3">
                    {role !== 'owner' && (
                      <form action={setUserDisabled} onSubmit={(e) => { if (!confirm(disabled ? 'إعادة تفعيل الحساب؟' : 'تعطيل الحساب؟')) e.preventDefault(); }} className="inline">
                        <input type="hidden" name="user_id" value={u.id} />
                        <input type="hidden" name="disabled" value={disabled ? 'false' : 'true'} />
                        <button className={`rounded-lg p-1.5 ${disabled ? 'text-green-400 hover:bg-green-500/10' : 'text-red-400 hover:bg-red-500/10'}`} title={disabled ? 'إعادة التفعيل' : 'تعطيل'}>
                          {disabled ? <CheckCircle2 size={14} /> : <Ban size={14} />}
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
            {!users.length && <tr><td colSpan={5} className="p-8 text-center text-gray-500">لا يوجد مستخدمون مسجلون بعد.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-gray-500">كلمات المرور غير مكشوفة أبدًا. التعطيل عبر auth.admin (صلاحية owner فقط).</p>
    </div>
  );
}
