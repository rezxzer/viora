import { NextRequest, NextResponse } from 'next/server'
import { getStreamWithLastSession } from '@/lib/streams'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const payload = await getStreamWithLastSession(id)
    return NextResponse.json(payload)
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'Not found'
    return NextResponse.json({ error: errorMessage }, { status: 404 })
  }
}
