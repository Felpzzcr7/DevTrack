import { useEffect, useState } from 'react'
import { Flame } from 'lucide-react'
import Heatmap, { HeatLegend } from '../components/Heatmap'
import Notice from '../components/Notice'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { api, addDays, fmtHours, getUserName, greeting, hoursByDate, hoursByTech, toISODate } from '../api'

const QUICK_HOURS = [0.5, 1, 2, 3]

// lista de estudos + estatísticas (a data local é enviada para a ofensiva valer em qualquer fuso)
const fetchAll = () => Promise.all([api('/studies'), api(`/studies/stats?today=${toISODate()}`)])

export default function Aprendizado() {
  const firstName = getUserName().split(' ')[0]
  const wide = useMediaQuery('(min-width: 768px)')
  const weeks = wide ? 26 : 16 // mais semanas em tela larga para os quadrados não ficarem enormes

  const [studies, setStudies] = useState([])
  const [streak, setStreak] = useState(0)
  const [technology, setTechnology] = useState('')
  const [hours, setHours] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState(null) // { type, text }

  const refresh = async () => {
    const [list, stats] = await fetchAll()
    setStudies(list)
    setStreak(stats.currentStreak)
  }

  useEffect(() => {
    let alive = true
    fetchAll()
      .then(([list, stats]) => {
        if (!alive) return
        setStudies(list)
        setStreak(stats.currentStreak)
      })
      .catch(console.error)
    return () => { alive = false }
  }, [])

  const byDate = hoursByDate(studies)
  const todayStr = toISODate()
  const todayHours = byDate[todayStr] || 0
  const topTechs = hoursByTech(studies).slice(0, 5).map((t) => t.name)

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(new Date(), i - 6)
    return { iso: toISODate(d), label: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '') }
  })
  const weekMax = Math.max(4, ...week.map((d) => byDate[d.iso] || 0))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setNotice(null)
    setLoading(true)
    try {
      const data = await api('/studies', {
        method: 'POST',
        body: {
          technology: technology.trim(),
          hours: parseFloat(hours),
          date: todayStr,
          description: description.trim() || `Estudo de ${technology.trim()}`,
        },
      })
      setNotice(data.alert ? { type: 'warn', text: data.alert } : { type: 'success', text: 'Estudo registrado. Boa!' })
      setTechnology('')
      setHours('')
      setDescription('')
      await refresh()
    } catch (err) {
      setNotice({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-muted">{greeting()}, {firstName}.</p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight md:text-5xl">O que você estudou hoje?</h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-5">
        <form onSubmit={handleSubmit} className="card flex flex-col gap-5 p-6 lg:col-span-3">
          <div>
            <label htmlFor="tech" className="field-label">Tecnologia</label>
            <input id="tech" list="techs" required maxLength={60} placeholder="Ex.: React, Java, SQL" className="field" value={technology} onChange={(e) => setTechnology(e.target.value)} />
            <datalist id="techs">{topTechs.map((t) => <option key={t} value={t} />)}</datalist>
            {topTechs.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {topTechs.map((t) => (
                  <button type="button" key={t} onClick={() => setTechnology(t)} className="rounded-full border border-line px-3 py-1 text-sm text-muted transition-colors hover:border-ember hover:text-ink">{t}</button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="hours" className="field-label">Quantas horas?</label>
            <input id="hours" type="number" required min="0.1" max="16" step="0.1" inputMode="decimal" placeholder="Ex.: 1.5" className="field" value={hours} onChange={(e) => setHours(e.target.value)} />
            <div className="mt-2 flex flex-wrap gap-2">
              {QUICK_HOURS.map((h) => (
                <button type="button" key={h} onClick={() => setHours(String(h))} className={`rounded-full border px-3 py-1 text-sm transition-colors ${parseFloat(hours) === h ? 'border-ember text-ember' : 'border-line text-muted hover:border-ember hover:text-ink'}`}>{fmtHours(h)}</button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="desc" className="field-label">O que você aprendeu? (opcional)</label>
            <textarea id="desc" rows={3} className="field resize-none" placeholder="Ex.: hooks, useEffect e custom hooks" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {notice && <Notice type={notice.type}>{notice.text}</Notice>}
          <button type="submit" disabled={loading} className="btn-primary text-lg">{loading ? 'Registrando...' : 'Registrar estudo'}</button>
        </form>

        <div className="flex flex-col gap-6 lg:col-span-2">
          <section className="card flex items-center gap-4 p-6">
            <Flame size={44} strokeWidth={1.5} className={streak > 0 ? 'text-ember' : 'text-line'} />
            <div>
              <p className="font-display text-5xl font-bold leading-none">{streak}</p>
              <p className="mt-1 text-sm text-muted">
                {streak === 1 ? 'dia de ofensiva' : 'dias de ofensiva'}
                {todayHours === 0 && streak > 0 && ' · estude hoje para manter'}
              </p>
            </div>
          </section>

          <section className="card p-6">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="font-display text-lg font-semibold">Últimos 7 dias</h2>
              <span className="text-sm text-muted">hoje: {fmtHours(todayHours)}</span>
            </div>
            <div className="flex h-32 items-end gap-2">
              {week.map((d) => {
                const h = byDate[d.iso] || 0
                const isToday = d.iso === todayStr
                return (
                  <div key={d.iso} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                    <span className="text-xs text-muted">{h > 0 ? h : ''}</span>
                    <div className={`w-full rounded-md ${h === 0 ? 'bg-raised' : isToday ? 'bg-ember' : 'bg-heat-2'}`} style={{ height: h === 0 ? 4 : `${Math.max((h / weekMax) * 100, 6)}%` }} />
                  </div>
                )
              })}
            </div>
            <div className="mt-2 flex gap-2 text-xs text-muted">
              {week.map((d) => <span key={d.iso} className="flex-1 text-center">{d.label}</span>)}
            </div>
          </section>
        </div>
      </div>

      <section className="card p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold">Últimas {weeks} semanas</h2>
          <HeatLegend />
        </div>
        <Heatmap byDate={byDate} weeks={weeks} />
      </section>
    </div>
  )
}
