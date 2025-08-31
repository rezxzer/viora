export default function LiveBadge() {
  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
      LIVE
    </div>
  )
}
