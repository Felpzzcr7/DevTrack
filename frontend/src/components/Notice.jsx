const styles = {
  error: 'border-danger/40 bg-danger/10 text-danger',
  success: 'border-ok/40 bg-ok/10 text-ok',
  warn: 'border-ember/40 bg-ember/10 text-ember-soft',
}

export default function Notice({ type = 'error', children }) {
  if (!children) return null
  return (
    <p role={type === 'error' ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm ${styles[type]}`}>
      {children}
    </p>
  )
}
