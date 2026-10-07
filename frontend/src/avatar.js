// Prepara a foto de perfil no próprio navegador: corta em quadrado (centro) e reduz para 256x256.
// Assim o arquivo enviado fica com ~20-40 KB, mesmo que a foto original tenha vários MB.
const SIZE = 256
const MAX_INPUT_BYTES = 15 * 1024 * 1024 // foto original
const MAX_OUTPUT_CHARS = 140000 // abaixo do limite do servidor (150000)

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Não foi possível abrir essa imagem. Tente um JPG ou PNG.')) }
    img.src = url
  })
}

// File -> "data:image/webp;base64,..." (ou jpeg, se o navegador não gerar webp)
export async function fileToAvatar(file) {
  if (!file.type.startsWith('image/')) throw new Error('Escolha um arquivo de imagem.')
  if (file.size > MAX_INPUT_BYTES) throw new Error('Essa imagem é muito grande (máximo 15 MB).')

  const img = await loadImage(file)
  const side = Math.min(img.naturalWidth, img.naturalHeight)
  const sx = (img.naturalWidth - side) / 2
  const sy = (img.naturalHeight - side) / 2

  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#161e31' // cor do card: PNG com fundo transparente não vira preto no JPEG
  ctx.fillRect(0, 0, SIZE, SIZE)
  ctx.drawImage(img, sx, sy, side, side, 0, 0, SIZE, SIZE)

  // tenta qualidades decrescentes até caber no limite
  for (const quality of [0.85, 0.7, 0.5]) {
    let url = canvas.toDataURL('image/webp', quality)
    if (!url.startsWith('data:image/webp')) url = canvas.toDataURL('image/jpeg', quality)
    if (url.length <= MAX_OUTPUT_CHARS) return url
  }
  throw new Error('Não foi possível reduzir essa imagem. Tente outra.')
}
