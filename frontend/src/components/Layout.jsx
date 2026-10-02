import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { SquarePen, History, User, LogOut, Download } from 'lucide-react'
import Brand from './Brand'
import { getToken, clearSession } from '../api'
import { useInstallPrompt } from '../hooks/useInstallPrompt'

const items = [
  { to: '/aprendizado', label: 'Hoje', icon: SquarePen },
  { to: '/historico', label: 'Histórico', icon: History },
  { to: '/perfil', label: 'Perfil', icon: User },
]

// Envolve as páginas que exigem login: sem token, volta para a tela de entrada
export default function Layout() {
  const navigate = useNavigate()
  const { canInstall, install } = useInstallPrompt()

  if (!getToken()) return <Navigate to="/" replace />

  const logout = () => {
    clearSession()
    navigate('/')
  }

  return (
    <div className="min-h-dvh md:flex">
      {/* Menu lateral (computador) */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col justify-between border-r border-line bg-surface/60 px-4 py-6 md:flex lg:w-64">
        <div>
          <Brand className="mb-8 px-3" />
          <nav className="flex flex-col gap-1">
            {items.map((item) => {
              const { to, label } = item
              const Icon = item.icon
              return (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition-colors ${
                    isActive ? 'bg-raised text-ink' : 'text-muted hover:bg-raised/60 hover:text-ink'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={20} className={isActive ? 'text-ember' : ''} /> {label}
                  </>
                )}
              </NavLink>
            )})}
          </nav>
        </div>
        <div className="flex flex-col gap-2">
          {canInstall && (
            <button onClick={install} className="btn-ghost justify-start">
              <Download size={18} /> Instalar app
            </button>
          )}
          <button onClick={logout} className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium text-muted transition-colors hover:bg-raised/60 hover:text-ink">
            <LogOut size={20} /> Sair
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 pb-28 pt-[calc(1.5rem+env(safe-area-inset-top))] md:px-10 md:py-10">
        <div className="mx-auto w-full max-w-5xl">
          <Outlet />
        </div>
      </main>

      {/* Barra inferior (celular) */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {items.map((item) => {
          const { to, label } = item
          const Icon = item.icon
          return (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium ${isActive ? 'text-ink' : 'text-muted'}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} className={isActive ? 'text-ember' : ''} /> {label}
              </>
            )}
          </NavLink>
        )})}
      </nav>
    </div>
  )
}
