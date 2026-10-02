import { useEffect, useReducer } from 'react'

// O navegador dispara "beforeinstallprompt" uma vez; guardamos o evento para
// usar quando a pessoa clicar em "Instalar app".
let deferred = null
const listeners = new Set()
const notify = () => listeners.forEach((fn) => fn())

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferred = e
  notify()
})
window.addEventListener('appinstalled', () => {
  deferred = null
  notify()
})

export function useInstallPrompt() {
  const [, rerender] = useReducer((x) => x + 1, 0)

  useEffect(() => {
    listeners.add(rerender)
    return () => listeners.delete(rerender)
  }, [])

  const standalone =
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
  const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent)

  return {
    standalone,
    canInstall: !!deferred && !standalone,
    showIOSHint: isIOS && !standalone, // iOS não tem botão automático: precisa do passo manual
    install: async () => {
      if (!deferred) return
      deferred.prompt()
      await deferred.userChoice
      deferred = null
      notify()
    },
  }
}
