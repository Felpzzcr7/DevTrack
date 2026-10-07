// Foto do usuário; sem foto, mostra a inicial do nome. `className` define tamanho e fonte.
export default function Avatar({ src, name = '', className = 'size-16 text-2xl' }) {
  const base = `shrink-0 overflow-hidden rounded-2xl ${className}`

  if (src) return <img src={src} alt="Sua foto de perfil" className={`${base} object-cover`} />

  return (
    <span className={`grid place-items-center bg-raised font-display font-bold text-ember ${base}`} aria-hidden="true">
      {name.trim().charAt(0).toUpperCase()}
    </span>
  )
}
