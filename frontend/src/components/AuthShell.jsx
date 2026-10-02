import Brand from './Brand'
import Heatmap, { HeatLegend } from './Heatmap'
import { sampleData } from './sampleData'

const sample = sampleData(18)

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <section className="hidden flex-col justify-between border-r border-line bg-surface p-12 lg:flex">
        <Brand />
        <div>
          <h2 className="max-w-md font-display text-5xl font-bold leading-[1.05] tracking-tight">
            Cada hora estudada acende um quadradinho.
          </h2>
          <p className="mt-4 max-w-sm text-muted">Registre o que você aprendeu e não deixe a ofensiva quebrar.</p>
          <div className="mt-10 max-w-md">
            <Heatmap byDate={sample} weeks={18} />
            <div className="mt-3"><HeatLegend /></div>
          </div>
        </div>
        <span />
      </section>

      <section className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          <Brand className="mb-10 lg:hidden" />
          <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mb-8 mt-2 text-muted">{subtitle}</p>
          {children}
          <p className="mt-8 text-sm text-muted">{footer}</p>
        </div>
      </section>
    </div>
  )
}
