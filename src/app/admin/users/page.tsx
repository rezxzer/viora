import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Row = { id: string; email: string | null; created_at: string; is_admin: boolean }

async function toggle(userId: string, isAdmin: boolean) {
  'use server'
  const supabase = await createSupabaseServerClient()
  const { data: isAdminRes } = await supabase.rpc('is_admin')
  if (!isAdminRes) {
    redirect('/')
  }
  await supabase.rpc('admin_toggle_user_admin', { p_user_id: userId, p_is_admin: isAdmin })
}

export default async function AdminUsersPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    return <div>Unauthorized</div>
  }

  const { data: isAdmin } = await supabase.rpc('is_admin', { user_id: session.user.id })
  if (!isAdmin) {
    return <div>Access denied</div>
  }

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  const rows = (users ?? []) as Row[]

  return (
    <div className="mx-auto w-full max-w-[980px] p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Users</h1>
      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full text-sm">
          <thead className="bg-surface">
            <tr>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Created</th>
              <th className="p-2 text-left">Admin</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2 whitespace-nowrap">{r.email ?? '-'}</td>
                <td className="p-2 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                <td className="p-2 whitespace-nowrap">{r.is_admin ? 'Yes' : 'No'}</td>
                <td className="p-2 whitespace-nowrap">
                  <form
                    action={async () => {
                      await toggle(r.id, !r.is_admin)
                    }}
                  >
                    <button
                      className="rounded border px-2 py-1 text-xs hover:bg-elev"
                      type="submit"
                    >
                      {r.is_admin ? 'Remove admin' : 'Make admin'}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
