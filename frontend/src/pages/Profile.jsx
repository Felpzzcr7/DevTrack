import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flame, LogOut } from 'lucide-react'
import InstallCard from '../components/InstallCard'
import { api, clearSession, fmtHours, fmtNumber, getUserName, hoursByTech, toISODate } from '../api'

export default function Profile() {
  const navigate = useNavigate()
  const userName = getUserName()
  const [stats, setStats] = useState({ currentStreak: 0, totalHours: 0, maxRecord: 0, totalDaysStudied: 0, topLanguage: '' })
  const [techs, setTechs] = useState([])

  useEffect(() => {
    Promise.all([api(`/studies/stats?today=${toISODate()}`), api('/studies')])
      .then(([s, list]) => { setStats(s); setTechs(hoursByTech(list).slice(0, 6)) })
      .catch(console.error)
  }, [])

  const logout = () => { clearSession(); navigate('/') }
  const maxTech = techs[0]?.hours || 1

  const numbers = [
    { label: 'Horas no total', value: fmtHours(stats.totalHours) },
    { label: 'Dias estudados', value: fmtNumber(stats.totalDaysStudied) },
    { label: 'Recorde em um dia', value: fmtHours(stats.maxRecord) },
    { label: 'Mais estudada', value: stats.topLanguage && stats.topLanguage !== 'Nenhuma' ? stats.topLanguage : '-' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-4">
        <span className="grid size-16 place-items-center rounded-2xl bg-raised font-display text-2xl font-bold text-ember" aria-hidden="true">
          {userName.trim().charAt(0).toUpperCase()}
        </span>
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{userName}</h1>
          <p className="text-muted">Seu progresso até agora</p>
        </div>
      </header>

      <section className="card flex items-center gap-5 p-6 md:p-8">
        <Flame size={72} strokeWidth={1.25} className={stats.currentStreak > 0 ? 'text-ember' : 'text-line'} />
        <div>
          <p className="font-display text-7xl font-bold leading-none">{stats.currentStreak}</p>
          <p className="mt-2 text-muted">{stats.currentStreak === 1 ? 'dia seguido estudando' : 'dias seguidos estudando'}</p>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {numbers.map((n) => (
          <div key={n.label} className="card p-5">
            <p className="text-sm text-muted">{n.label}</p>
            <p className="mt-1 truncate font-display text-2xl font-bold md:text-3xl">{n.value}</p>
          </div>
        ))}
      </div>

      <section className="card p-6">
        <h2 className="mb-4 font-display text-lg font-semibold">Horas por tecnologia</h2>
        {techs.length === 0 ? (
          <p className="text-muted">Registre seu primeiro estudo para ver o gráfico.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {techs.map((t) => (
              <li key={t.name}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-medium">{t.name}</span>
                  <span className="text-muted">{fmtHours(t.hours)}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-raised">
                  <div className="h-full rounded-full bg-heat-3" style={{ width: `${(t.hours / maxTech) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <InstallCard />

      <button onClick={logout} className="btn-ghost justify-center md:hidden">
        <LogOut size={18} /> Sair
      </button>
    </div>
  )
}
