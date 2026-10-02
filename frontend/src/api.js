// Em produção o front e a API ficam no mesmo endereço (/api).
// Se um dia a API ficar em outro domínio, defina VITE_API_URL no build.
const BASE = import.meta.env.VITE_API_URL || '/api'

export const getToken = () => localStorage.getItem('token')
export const getUserName = () => localStorage.getItem('userName') || 'Dev'

export function saveSession({ token, name }) {
  localStorage.setItem('token', token)
  localStorage.setItem('userName', name)
}

export function clearSession() {
  localStorage.removeItem('token')
  localStorage.removeItem('userName')
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

// auth: false -> login/cadastro (não envia token e não derruba a sessão em caso de 401)
export async function api(path, { method = 'GET', body, auth = true } = {}) {
  const token = auth ? getToken() : null

  let res
  try {
    res = await fetch(BASE + path, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('Não foi possível conectar ao servidor. Verifique sua internet.', 0)
  }

  const data = await res.json().catch(() => null)

  if (res.status === 401 && auth) {
    clearSession()
    window.location.assign('/')
    throw new ApiError('Sessão expirada.', 401)
  }

  if (!res.ok) {
    throw new ApiError(data?.message || data?.error || 'Algo deu errado. Tente de novo.', res.status)
  }
  return data
}

// ---------- datas (sempre no fuso do aparelho) ----------
const pad = (n) => String(n).padStart(2, '0')

export const toISODate = (d = new Date()) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const fromISODate = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const addDays = (d, n) => {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + n)
  return copy
}

const nf = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
export const fmtHours = (h) => `${nf.format(h)} h`
export const fmtNumber = (n) => nf.format(n)

export function greeting() {
  const h = new Date().getHours()
  if (h < 5) return 'Boa madrugada'
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

// soma as horas por dia: { '2026-10-01': 2.5, ... }
export function hoursByDate(studies) {
  const map = {}
  for (const s of studies) map[s.date] = (map[s.date] || 0) + s.hours
  return map
}

// tecnologias mais estudadas: [{ name, hours }, ...]
export function hoursByTech(studies) {
  const map = {}
  for (const s of studies) map[s.technology] = (map[s.technology] || 0) + s.hours
  return Object.entries(map)
    .map(([name, hours]) => ({ name, hours }))
    .sort((a, b) => b.hours - a.hours)
}
