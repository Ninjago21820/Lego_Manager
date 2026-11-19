export const nf = new Intl.NumberFormat('fr-FR')

export const fmt = (n) => nf.format(Math.round(Number(n) || 0))

export const fmtCompact = (n) => {
  const v = Number(n) || 0
  if (v >= 1000000) return (v / 1000000).toFixed(1).replace('.', ',') + ' M'
  if (v >= 10000) return (v / 1000).toFixed(0) + ' k'
  if (v >= 1000) return (v / 1000).toFixed(1).replace('.', ',') + ' k'
  return nf.format(v)
}

export function relDate(ts) {
  const diff = Date.now() - ts
  const m = Math.round(diff / 60000)
  if (m < 1) return "à l'instant"
  if (m < 60) return `il y a ${m} min`
  const h = Math.round(m / 60)
  if (h < 24) return `il y a ${h} h`
  const d = Math.round(h / 24)
  if (d === 1) return 'hier'
  if (d < 30) return `il y a ${d} j`
  return new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function fullDate(ts) {
  return new Date(ts).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function download(filename, content, type = 'application/json') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function toCSV(rows, headers) {
  const esc = (v) => {
    const s = String(v ?? '')
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [headers.map(esc).join(';')]
  for (const r of rows) lines.push(r.map(esc).join(';'))
  return '\uFEFF' + lines.join('\n')
}

const eurFmt = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const eurFmtCompact = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

export const eur = (n) => eurFmt.format(Number(n) || 0)
export const eurShort = (n) => eurFmtCompact.format(Number(n) || 0)

/** Masse en grammes -> « 850 g », « 12,4 kg », « 1,2 t » */
export function weight(grams) {
  const g = Number(grams) || 0
  if (g < 1000) return `${nf.format(Math.round(g * 10) / 10)} g`
  if (g < 1000000) return `${(g / 1000).toFixed(g < 10000 ? 2 : 1).replace('.', ',')} kg`
  return `${(g / 1000000).toFixed(2).replace('.', ',')} t`
}

/** Poids unitaire court : « 2,32 g » */
export const weightUnit = (g) => `${nf.format(Math.round((Number(g) || 0) * 100) / 100)} g`

/** Prix unitaire : « 0,18 € » */
export const priceUnit = (n) => eurFmt.format(Number(n) || 0)
