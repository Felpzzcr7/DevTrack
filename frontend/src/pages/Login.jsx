import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import Notice from '../components/Notice'
import { api, getToken, saveSession } from '../api'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (getToken()) return <Navigate to="/aprendizado" replace />

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api('/auth/login', { method: 'POST', body: { email, password }, auth: false })
      saveSession(data)
      navigate('/aprendizado')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Entrar"
      subtitle="Continue de onde parou."
      footer={<>Ainda não tem conta? <Link to="/register" className="font-medium text-ember hover:underline">Criar conta</Link></>}
    >
      <form onSubmit={handleLogin} className="flex flex-col gap-5">
        <div>
          <label htmlFor="email" className="field-label">E-mail</label>
          <input id="email" type="email" required autoComplete="email" placeholder="voce@email.com" className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label htmlFor="password" className="field-label">Senha</label>
          <input id="password" type="password" required autoComplete="current-password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Notice>{error}</Notice>
        <button type="submit" disabled={loading} className="btn-primary mt-1">{loading ? 'Entrando...' : 'Entrar'}</button>
      </form>
    </AuthShell>
  )
}
