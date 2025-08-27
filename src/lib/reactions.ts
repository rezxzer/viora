export async function fetchReactionStats(commentIds: string[]) {
  try {
    const qs = new URLSearchParams({ ids: commentIds.join(',') })
    const res = await fetch(`/api/reactions/stats?${qs.toString()}`, { cache: 'no-store' })

    if (!res.ok) {
      console.error(`Reaction stats fetch failed: ${res.status} ${res.statusText}`)
      throw new Error(`stats fetch failed: ${res.status}`)
    }

    const data = await res.json()
    return data
  } catch (error) {
    console.error('Error fetching reaction stats:', error)
    throw error
  }
}
