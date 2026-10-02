import { addDays, toISODate } from '../api'

// dados fictícios (e sempre iguais) para a tela de login
export function sampleData(weeks = 18) {
  const map = {}
  const today = new Date()
  for (let i = 0; i < weeks * 7; i++) {
    const v = (i * 37 + 11) % 13
    if (v > 4) map[toISODate(addDays(today, -i))] = [0.5, 1, 1.5, 2.5, 3, 4.5, 6, 2][v % 8]
  }
  return map
}
