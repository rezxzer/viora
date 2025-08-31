export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function ChatPage() {
  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold">Chat</h1>
      <p className="text-sm text-muted-foreground">
        Direct Messages (temporarily hidden - replaced with Streams).
      </p>
    </div>
  )
}
