import { addDays, fromISODate, toISODate, fmtHours } from '../api'

const level = (h) => (!h ? 0 : h < 1 ? 1 : h < 2 ? 2 : h < 4 ? 3 : 4)
const BG = ['bg-heat-0', 'bg-heat-1', 'bg-heat-2', 'bg-heat-3', 'bg-heat-4']

// byDate: { 'YYYY-MM-DD': horas }. Colunas = semanas (segunda a domingo), como no GitHub.
export default function Heatmap({ byDate, weeks = 16 }) {
  const today = new Date()
  const todayIdx = (today.getDay() + 6) % 7 // segunda = 0
  const start = addDays(today, -((weeks - 1) * 7 + todayIdx))
  const todayStr = toISODate(today)

  const cells = Array.from({ length: weeks * 7 }, (_, i) => {
    const date = addDays(start, i)
    const iso = toISODate(date)
    return { iso, date, hours: byDate[iso] || 0, future: iso > todayStr, col: Math.floor(i / 7) }
  })

  return (
    <div
      className="grid w-full gap-[3px] sm:gap-1"
      style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))`, gridAutoFlow: 'column', gridTemplateRows: 'repeat(7, auto)' }}
      role="img"
      aria-label={`Mapa de estudos das últimas ${weeks} semanas`}
    >
      {cells.map((c) =>
        c.future ? (
          <span key={c.iso} className="aspect-square" />
        ) : (
          <span
            key={c.iso}
            title={`${fromISODate(c.iso).toLocaleDateString('pt-BR')}: ${c.hours ? fmtHours(c.hours) : 'sem estudo'}`}
            className={`cell-in aspect-square rounded-[3px] sm:rounded-[4px] ${BG[level(c.hours)]} ${c.iso === todayStr ? 'ring-1 ring-ink/70' : ''}`}
            style={{ animationDelay: `${c.col * 28}ms` }}
          />
        ),
      )}
    </div>
  )
}

export function HeatLegend() {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted">
      menos
      {BG.map((b) => <span key={b} className={`size-3 rounded-[3px] ${b}`} />)}
      mais
    </div>
  )
}
