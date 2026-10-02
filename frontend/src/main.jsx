import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './hooks/useInstallPrompt' // precisa carregar cedo para captar o aviso de instalação
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Service worker: só em produção, é ele que torna o app instalável
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
