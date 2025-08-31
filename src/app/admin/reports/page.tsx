import { createSupabaseServerClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import ResolveButton from '@/app/admin/reports/resolve-button'

type ReportRow = {
  id: string
  post_id: string | null
  reporter_id: string
  reason: 'spam' | 'nsfw' | 'abuse' | 'other'
  note: string | null
  status: 'open' | 'reviewed' | 'resolved'
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminReportsPage() {
  const supabase = await createSupabaseServerClient()

  // Guard: allow only admins
  const { data: isAdminRes } = await supabase.rpc('is_admin')
  const isAdmin = Boolean(isAdminRes)
  if (!isAdmin) {
    redirect('/')
  }

  const { data: reports } = await supabase
    .from('reports')
    .select('id, post_id, reporter_id, reason, note, status, resolved_by, resolved_at, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  const list = (reports ?? []) as ReportRow[]

  // Enrich with reporter usernames for readability
  const reporterIds = Array.from(new Set(list.map((r) => r.reporter_id)))
  const { data: users } = reporterIds.length
    ? await supabase.from('profiles').select('id, username, full_name').in('id', reporterIds)
    : { data: [] as Array<{ id: string; username: string | null; full_name: string | null }> }

  const byId = new Map(
    ((users ?? []) as Array<{ id: string; username: string | null; full_name: string | null }>).map(
      (u) => [u.id, u]
    )
  )

  return (
    <div className="mx-auto w-full max-w-[980px] p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Reports</h1>
      {list.length === 0 ? (
        <div className="text-sm text-muted-foreground">No reports</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-surface">
              <tr>
                <th className="p-2 text-left">Created</th>
                <th className="p-2 text-left">Reporter</th>
                <th className="p-2 text-left">Reason</th>
                <th className="p-2 text-left">Note</th>
                <th className="p-2 text-left">Post</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => {
                const rp = byId.get(r.reporter_id)
                const reporter = rp?.full_name || rp?.username || r.reporter_id
                return (
                  <tr key={r.id} className="border-t">
                    <td className="p-2 whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="p-2 whitespace-nowrap">{reporter}</td>
                    <td className="p-2 whitespace-nowrap">{r.reason}</td>
                    <td className="p-2 max-w-[320px] truncate" title={r.note ?? ''}>
                      {r.note ?? '-'}
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      {r.post_id ? (
                        <Link
                          href={`/watch?post=${r.post_id}`}
                          className="text-primary hover:underline"
                        >
                          Open
                        </Link>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-2 whitespace-nowrap">{r.status}</td>
                    <td className="p-2 whitespace-nowrap">
                      {r.status !== 'resolved' ? (
                        <div className="flex gap-2">
                          <ResolveButton id={r.id} toStatus="reviewed" />
                          <ResolveButton id={r.id} toStatus="resolved" />
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
