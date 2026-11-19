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
