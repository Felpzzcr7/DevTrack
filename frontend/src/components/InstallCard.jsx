import { Download, Share } from 'lucide-react'
import { useInstallPrompt } from '../hooks/useInstallPrompt'

export default function InstallCard() {
  const { canInstall, showIOSHint, install } = useInstallPrompt()
  if (!canInstall && !showIOSHint) return null

  return (
    <section className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="font-display text-lg font-semibold">Instale o DevTrack</h3>
        <p className="mt-1 max-w-md text-sm text-muted">
          {canInstall
            ? 'Abra direto da tela inicial ou da área de trabalho, sem barra de navegador.'
            : <>No iPhone: toque em <Share size={14} className="inline -translate-y-px" /> Compartilhar e depois em “Adicionar à Tela de Início”.</>}
        </p>
      </div>
      {canInstall && (
        <button onClick={install} className="btn-primary shrink-0">
          <Download size={18} /> Instalar app
        </button>
      )}
    </section>
  )
}
