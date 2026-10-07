import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Flame, LogOut, Pencil } from 'lucide-react'
import Avatar from '../components/Avatar'
import InstallCard from '../components/InstallCard'
import Notice from '../components/Notice'
import { fileToAvatar } from '../avatar'
import { api, clearSession, fmtHours, fmtNumber, getUserName, hoursByTech, toISODate } from '../api'

export default function Profile() {
  const navigate = useNavigate()
  const userName = getUserName()
  const [stats, setStats] = useState({ currentStreak: 0, totalHours: 0, maxRecord: 0, totalDaysStudied: 0, topLanguage: '' })
  const [techs, setTechs] = useState([])
  const [me, setMe] = useState({ bio: null, avatar: null })

  const fileRef = useRef(null)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoError, setPhotoError] = useState('')

  const [editingBio, setEditingBio] = useState(false)
  const [bioDraft, setBioDraft] = useState('')
  const [bioSaving, setBioSaving] = useState(false)
  const [bioError, setBioError] = useState('')

  useEffect(() => {
    Promise.all([api(`/studies/stats?today=${toISODate()}`), api('/studies'), api('/auth/me')])
      .then(([s, list, profile]) => { setStats(s); setTechs(hoursByTech(list).slice(0, 6)); setMe(profile) })
      .catch(console.error)
  }, [])

  // escolhe a foto -> reduz no navegador -> envia
  const handlePhoto = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // permite escolher o mesmo arquivo de novo
    if (!file) return
    setPhotoError('')
    setPhotoBusy(true)
    try {
      const avatar = await fileToAvatar(file)
      await api('/auth/avatar', { method: 'PUT', body: { avatar } })
      setMe((m) => ({ ...m, avatar }))
    } catch (err) {
      setPhotoError(err.message)
    } finally {
      setPhotoBusy(false)
    }
  }

  const removePhoto = async () => {
    setPhotoError('')
    setPhotoBusy(true)
    try {
      await api('/auth/avatar', { method: 'DELETE' })
      setMe((m) => ({ ...m, avatar: null }))
    } catch (err) {
      setPhotoError(err.message)
    } finally {
      setPhotoBusy(false)
    }
  }

  const startEditBio = () => { setBioDraft(me.bio || ''); setBioError(''); setEditingBio(true) }

  const saveBio = async (e) => {
    e.preventDefault()
    setBioError('')
    setBioSaving(true)
    try {
      const data = await api('/auth/bio', { method: 'PUT', body: { bio: bioDraft } })
      setMe((m) => ({ ...m, bio: data.bio }))
      setEditingBio(false)
    } catch (err) {
      setBioError(err.message)
    } finally {
      setBioSaving(false)
    }
  }

  const bioLength = Array.from(bioDraft).length

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
        <div className="relative shrink-0">
          <Avatar src={me.avatar} name={userName} className="size-20 text-3xl" />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={photoBusy} aria-label="Trocar foto de perfil" className="absolute -right-1 -bottom-1 grid size-8 place-items-center rounded-full border border-line bg-surface text-ink transition-colors hover:border-ember hover:text-ember disabled:opacity-50">
            <Camera size={16} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handlePhoto} />
        </div>
        <div className="min-w-0">
          <h1 className="break-words font-display text-3xl font-bold tracking-tight md:text-4xl">{userName}</h1>
          <p className="text-muted">Seu progresso até agora</p>
          {me.avatar && (
            <button type="button" onClick={removePhoto} disabled={photoBusy} className="mt-1 text-sm text-muted underline transition-colors hover:text-danger disabled:opacity-50">Remover foto</button>
          )}
        </div>
      </header>
      <Notice type="error">{photoError}</Notice>

      <section className="card p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Sobre mim</h2>
          {!editingBio && (
            <button type="button" onClick={startEditBio} className="btn-ghost px-3 py-1.5 text-sm">
              <Pencil size={14} /> {me.bio ? 'Editar' : 'Adicionar'}
            </button>
          )}
        </div>
        {editingBio ? (
          <form onSubmit={saveBio} className="flex flex-col gap-3">
            <label htmlFor="bio" className="sr-only">Sobre mim</label>
            <textarea id="bio" rows={3} autoFocus className="field resize-none" placeholder="Conte um pouco sobre você e o que está estudando" value={bioDraft} onChange={(e) => setBioDraft(e.target.value)} />
            <div className="flex items-center justify-between gap-3">
              <span className={`text-sm ${bioLength > 280 ? 'text-danger' : 'text-muted'}`}>{bioLength}/280</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditingBio(false)} className="btn-ghost px-4 py-2 text-sm">Cancelar</button>
                <button type="submit" disabled={bioSaving || bioLength > 280} className="btn-primary px-4 py-2 text-sm">{bioSaving ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </div>
            <Notice type="error">{bioError}</Notice>
          </form>
        ) : me.bio ? (
          <p className="break-words whitespace-pre-wrap text-ink/90">{me.bio}</p>
        ) : (
          <p className="text-muted">Conte um pouco sobre você e o que está estudando.</p>
        )}
      </section>

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
            <p className="mt-1 break-words font-display text-xl font-bold leading-tight md:text-2xl">{n.value}</p>
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
