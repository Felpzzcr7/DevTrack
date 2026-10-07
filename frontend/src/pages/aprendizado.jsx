import { useEffect, useState } from 'react'
import { Flame } from 'lucide-react'
import Heatmap, { HeatLegend } from '../components/Heatmap'
import Notice from '../components/Notice'
import TagSelect from '../components/TagSelect'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { api, addDays, fmtHours, fmtHoursShort, getUserName, greeting, hoursByDate, toISODate } from '../api'

// atalhos de tempo, em minutos
const QUICK_MINUTES = [15, 30, 60, 120, 180]
const MAX_MINUTES = 16 * 60

// estudos + estatísticas + tags do usuário (a data local é enviada para a ofensiva valer em qualquer fuso)
const fetchAll = () => Promise.all([api('/studies'), api(`/studies/stats?today=${toISODate()}`), api('/studies/tags')])

// tag escolhida no select -> campo certo para o backend: id se já existe, nome se é nova
const tagToPayload = (tag) => (tag.__isNew__ ? { tagName: tag.label } : { tagId: tag.value })

export default function Aprendizado() {
  const firstName = getUserName().split(' ')[0]
  const wide = useMediaQuery('(min-width: 768px)')
  const weeks = wide ? 26 : 16 // mais semanas em tela larga para os quadrados não ficarem enormes

  const [studies, setStudies] = useState([])
  const [streak, setStreak] = useState(0)
  const [tags, setTags] = useState([])
  const [tag, setTag] = useState(null) // opção do select: { value, label, __isNew__? }
  const [hoursInput, setHoursInput] = useState('')
  const [minutesInput, setMinutesInput] = useState('')
  const [anotacao, setAnotacao] = useState('')
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState(null) // { type, text }

  const refresh = async () => {
    const [list, stats, tagList] = await fetchAll()
    setStudies(list)
    setStreak(stats.currentStreak)
    setTags(tagList)
  }

  useEffect(() => {
    let alive = true
    fetchAll()
      .then(([list, stats, tagList]) => {
        if (!alive) return
        setStudies(list)
        setStreak(stats.currentStreak)
        setTags(tagList)
      })
      .catch(console.error)
    return () => { alive = false }
  }, [])

  const byDate = hoursByDate(studies)
  const todayStr = toISODate()
  const todayHours = byDate[todayStr] || 0
  const topTags = tags.slice(0, 5) // o backend já devolve da mais usada para a menos usada

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(new Date(), i - 6)
    return { iso: toISODate(d), label: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '') }
  })
  const weekMax = Math.max(4, ...week.map((d) => byDate[d.iso] || 0))

  const totalMinutes = (parseInt(hoursInput, 10) || 0) * 60 + (parseInt(minutesInput, 10) || 0)

  const setQuick = (min) => {
    setHoursInput(min >= 60 ? String(Math.floor(min / 60)) : '')
    setMinutesInput(min % 60 ? String(min % 60) : '')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setNotice(null)
    if (!tag) {
      setNotice({ type: 'error', text: 'Escolha uma tag ou crie uma nova.' })
      return
    }
    if (totalMinutes <= 0) {
      setNotice({ type: 'error', text: 'Informe pelo menos 1 minuto de estudo.' })
      return
    }
    if (totalMinutes > MAX_MINUTES) {
      setNotice({ type: 'error', text: 'O máximo por registro é 16 horas.' })
      return
    }
    setLoading(true)
    try {
      const data = await api('/studies', {
        method: 'POST',
        body: {
          ...tagToPayload(tag),
          hours: totalMinutes / 60,
          date: todayStr,
          anotacao: anotacao.trim(),
        },
      })
      setNotice(data.alert ? { type: 'warn', text: data.alert } : { type: 'success', text: 'Estudo registrado. Boa!' })
      setTag(null)
      setHoursInput('')
      setMinutesInput('')
      setAnotacao('')
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
            <label htmlFor="tech" className="field-label">Assunto</label>
            <TagSelect inputId="tech" tags={tags} value={tag} onChange={setTag} disabled={loading} />
            {topTags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {topTags.map((t) => (
                  <button type="button" key={t.id} onClick={() => setTag({ value: t.id, label: t.nome })} className={`rounded-full border px-3 py-1 text-sm transition-colors ${tag?.value === t.id && !tag.__isNew__ ? 'border-ember text-ember' : 'border-line text-muted hover:border-ember hover:text-ink'}`}>{t.nome}</button>
                ))}
              </div>
            )}
          </div>

          <div>
            <span className="field-label">Quanto tempo?</span>
            <div className="flex items-center gap-3">
              <div className="flex flex-1 items-center gap-2">
                <input id="hours" aria-label="Horas" type="number" min="0" max="16" step="1" inputMode="numeric" placeholder="0" className="field" value={hoursInput} onChange={(e) => setHoursInput(e.target.value)} />
                <span className="text-muted">h</span>
              </div>
              <div className="flex flex-1 items-center gap-2">
                <input id="minutes" aria-label="Minutos" type="number" min="0" max="59" step="1" inputMode="numeric" placeholder="0" className="field" value={minutesInput} onChange={(e) => setMinutesInput(e.target.value)} />
                <span className="text-muted">min</span>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {QUICK_MINUTES.map((m) => (
                <button type="button" key={m} onClick={() => setQuick(m)} className={`rounded-full border px-3 py-1 text-sm transition-colors ${totalMinutes === m ? 'border-ember text-ember' : 'border-line text-muted hover:border-ember hover:text-ink'}`}>{fmtHours(m / 60)}</button>
              ))}
            </div>
            {totalMinutes > 0 && <p className="mt-2 text-sm text-muted">Total: {fmtHours(totalMinutes / 60)}</p>}
          </div>

          <div>
            <label htmlFor="notes" className="field-label">Anotações (opcional)</label>
            <textarea id="notes" rows={3} maxLength={2000} className="field resize-none" placeholder="Ex.: hooks, useEffect e custom hooks" value={anotacao} onChange={(e) => setAnotacao(e.target.value)} />
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
                    <span className="whitespace-nowrap text-[10px] text-muted sm:text-xs">{h > 0 ? fmtHoursShort(h) : ''}</span>
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
