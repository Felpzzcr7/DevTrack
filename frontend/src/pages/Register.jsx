import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import Notice from '../components/Notice'
import { api, saveSession } from '../api'

export default function Register() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api('/auth/register', { method: 'POST', body: { name, email, password }, auth: false })
      // já entra direto, sem pedir para digitar tudo de novo
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
      title="Criar conta"
      subtitle="Leva menos de um minuto."
      footer={<>Já tem conta? <Link to="/" className="font-medium text-ember hover:underline">Entrar</Link></>}
    >
      <form onSubmit={handleRegister} className="flex flex-col gap-5">
        <div>
          <label htmlFor="name" className="field-label">Nome</label>
          <input id="name" type="text" required autoComplete="name" className="field" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label htmlFor="email" className="field-label">E-mail</label>
          <input id="email" type="email" required autoComplete="email" placeholder="voce@email.com" className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label htmlFor="password" className="field-label">Senha</label>
          <input id="password" type="password" required minLength={6} autoComplete="new-password" placeholder="Mínimo de 6 caracteres" className="field" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Notice>{error}</Notice>
        <button type="submit" disabled={loading} className="btn-primary mt-1">{loading ? 'Criando...' : 'Criar conta'}</button>
      </form>
    </AuthShell>
  )
}
