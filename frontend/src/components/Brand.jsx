export function LogoMark({ size = 28 }) {
  const heat = ['bg-heat-0', 'bg-heat-1', 'bg-heat-2', 'bg-heat-1', 'bg-heat-2', 'bg-heat-3', 'bg-heat-2', 'bg-heat-3', 'bg-heat-4']
  return (
    <span className="grid grid-cols-3 gap-[3px]" style={{ width: size, height: size }} aria-hidden="true">
      {heat.map((c, i) => <span key={i} className={`${c} rounded-[3px]`} />)}
    </span>
  )
}

export default function Brand({ className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark />
      <span className="font-display text-xl font-bold tracking-tight">DevTrack</span>
    </div>
  )
}
