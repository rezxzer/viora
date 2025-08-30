export default function VioraLogo({
  size = 'md',
  withWordmark = true,
}: {
  size?: 'sm' | 'md'
  withWordmark?: boolean
}) {
  const cls = size === 'sm' ? 'h-5 w-5' : 'h-6 w-6'

  return (
    <div className="flex items-center gap-2">
      <div className={`relative ${cls}`}>
        <svg viewBox="0 0 24 24" className="h-full w-full">
          <defs>
            <linearGradient id="viora-g" x1="0" x2="1">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
          <path
            d="M3 4l9 16L21 4"
            fill="none"
            stroke="url(#viora-g)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      {withWordmark && (
        <span className="text-base font-semibold tracking-[0.12em] bg-gradient-to-r from-violet-500 to-cyan-400 bg-clip-text text-transparent">
          VIORA
        </span>
      )}
    </div>
  )
}
