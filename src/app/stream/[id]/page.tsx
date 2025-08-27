type Params = { params: Promise<{ id: string }> }

export default async function StreamRoomPage({ params }: Params) {
  const { id } = await params

  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold">Stream Room</h1>
      <p className="text-sm text-muted-foreground">Stream room page - ID: {id}</p>
    </div>
  )
}
