import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import Notice from '../components/Notice'
import { api, addDays, fmtHours, fromISODate, toISODate } from '../api'

function dayLabel(iso) {
  if (iso === toISODate()) return 'Hoje'
  if (iso === toISODate(addDays(new Date(), -1))) return 'Ontem'
  return fromISODate(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function Historico() {
  const [studies, setStudies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmId, setConfirmId] = useState(null)

  useEffect(() => {
    api('/studies').then(setStudies).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [])

  const remove = async (id) => {
    try {
      await api(`/studies/${id}`, { method: 'DELETE' })
      setStudies((list) => list.filter((s) => s.id !== id))
    } catch (e) {
      setError(e.message)
    } finally {
      setConfirmId(null)
    }
  }

  // agrupa por dia (a API já devolve do mais recente para o mais antigo)
  const groups = []
  for (const s of studies) {
    const last = groups[groups.length - 1]
    if (last && last.date === s.date) last.items.push(s)
    else groups.push({ date: s.date, items: [s] })
  }
  const total = studies.reduce((sum, s) => sum + s.hours, 0)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <header>
        <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">Histórico</h1>
        {studies.length > 0 && (
          <p className="mt-2 text-muted">{studies.length} {studies.length === 1 ? 'registro' : 'registros'}, {fmtHours(total)} no total.</p>
        )}
      </header>

      <Notice>{error}</Notice>

      {loading ? (
        <p className="text-muted">Carregando seus registros...</p>
      ) : studies.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-lg">Nenhum estudo registrado ainda.</p>
          <Link to="/aprendizado" className="btn-primary mt-4">Registrar o primeiro</Link>
        </div>
      ) : (
        groups.map((g) => (
          <section key={g.date}>
            <div className="mb-3 flex items-baseline justify-between border-b border-line pb-2">
              <h2 className="font-display text-lg font-semibold capitalize">{dayLabel(g.date)}</h2>
              <span className="text-sm text-muted">{fmtHours(g.items.reduce((s, i) => s + i.hours, 0))}</span>
            </div>
            <ul className="flex flex-col gap-3">
              {g.items.map((s) => (
                <li key={s.id} className="card flex items-start gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <span className="rounded-full bg-raised px-3 py-1 text-sm font-medium text-ember-soft">{s.technology}</span>
                    {s.description && <p className="mt-2 break-words text-ink/90">{s.description}</p>}
                  </div>
                  <span className="max-w-[7rem] text-right font-display text-lg font-bold leading-tight md:max-w-none md:text-xl">{fmtHours(s.hours)}</span>
                  {confirmId === s.id ? (
                    <div className="flex gap-2 text-sm">
                      <button onClick={() => remove(s.id)} className="rounded-lg bg-danger px-3 py-1.5 font-semibold text-night">Apagar</button>
                      <button onClick={() => setConfirmId(null)} className="rounded-lg border border-line px-3 py-1.5">Cancelar</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmId(s.id)} aria-label={`Apagar registro de ${s.technology}`} className="rounded-lg p-2 text-muted transition-colors hover:bg-raised hover:text-danger">
                      <Trash2 size={18} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
