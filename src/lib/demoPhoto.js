// Génère des photos de démonstration (pièces LEGO posées sur un fond uni)
// pour pouvoir essayer le scanner sans appareil photo.

import { COLORS } from './lego'

const PALETTE = ['Rouge', 'Bleu', 'Jaune', 'Vert', 'Noir', 'Blanc', 'Orange', 'Gris clair', 'Tan', 'Lime']
const hexOf = (name) => COLORS.find((c) => c.name === name)?.hex ?? '#C4281B'

function shade(hex, factor) {
  const h = hex.replace('#', '')
  const r = Math.min(255, Math.round(parseInt(h.slice(0, 2), 16) * factor))
  const g = Math.min(255, Math.round(parseInt(h.slice(2, 4), 16) * factor))
  const b = Math.min(255, Math.round(parseInt(h.slice(4, 6), 16) * factor))
  return `rgb(${r},${g},${b})`
}

function roundedRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

function drawPiece(ctx, { x, y, fx, fy, color, studs = true, pitch = 30 }) {
  const w = fx * pitch
  const h = fy * pitch
  const base = hexOf(color)

  // ombre portée
  ctx.save()
  ctx.shadowColor = 'rgba(20,20,25,0.28)'
  ctx.shadowBlur = 14
  ctx.shadowOffsetX = 3
  ctx.shadowOffsetY = 6
  ctx.fillStyle = shade(base, 0.85)
  roundedRect(ctx, x, y, w, h, 5)
  ctx.fill()
  ctx.restore()

  // corps avec léger dégradé (la lumière vient du haut-gauche)
  const grad = ctx.createLinearGradient(x, y, x + w * 0.4, y + h)
  grad.addColorStop(0, shade(base, 1.14))
  grad.addColorStop(0.55, base)
  grad.addColorStop(1, shade(base, 0.9))
  ctx.fillStyle = grad
  roundedRect(ctx, x, y, w, h, 5)
  ctx.fill()

  // arête inférieure plus sombre
  ctx.strokeStyle = shade(base, 0.72)
  ctx.lineWidth = 1.5
  roundedRect(ctx, x + 0.75, y + 0.75, w - 1.5, h - 1.5, 5)
  ctx.stroke()

  if (!studs) {
    // tuile lisse : reflet
    ctx.save()
    ctx.globalAlpha = 0.18
    ctx.fillStyle = '#ffffff'
    roundedRect(ctx, x + w * 0.12, y + h * 0.16, w * 0.55, h * 0.2, 3)
    ctx.fill()
    ctx.restore()
    return
  }

  const r = pitch * 0.3
  for (let i = 0; i < fx; i += 1) {
    for (let j = 0; j < fy; j += 1) {
      const cx = x + pitch * (i + 0.5)
      const cy = y + pitch * (j + 0.5)
      // flanc du tenon
      ctx.beginPath()
      ctx.arc(cx, cy + 1.4, r, 0, Math.PI * 2)
      ctx.fillStyle = shade(base, 0.78)
      ctx.fill()
      // dessus du tenon
      const g2 = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.15, cx, cy, r)
      g2.addColorStop(0, shade(base, 1.3))
      g2.addColorStop(0.7, shade(base, 1.06))
      g2.addColorStop(1, shade(base, 0.94))
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fillStyle = g2
      ctx.fill()
    }
  }
}

function paintBackground(ctx, w, h, kind) {
  if (kind === 'dark') {
    const g = ctx.createLinearGradient(0, 0, w, h)
    g.addColorStop(0, '#2b3038')
    g.addColorStop(1, '#1c2026')
    ctx.fillStyle = g
  } else if (kind === 'table') {
    const g = ctx.createLinearGradient(0, 0, w, h)
    g.addColorStop(0, '#d9d3c8')
    g.addColorStop(0.5, '#e3ddd2')
    g.addColorStop(1, '#d2ccc0')
    ctx.fillStyle = g
  } else {
    ctx.fillStyle = '#f7f6f2'
  }
  ctx.fillRect(0, 0, w, h)

  // léger grain pour un rendu photo
  const img = ctx.getImageData(0, 0, w, h)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 7
    d[i] += n
    d[i + 1] += n
    d[i + 2] += n
  }
  ctx.putImageData(img, 0, 0)

  // vignettage
  const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.75)
  v.addColorStop(0, 'rgba(0,0,0,0)')
  v.addColorStop(1, 'rgba(0,0,0,0.10)')
  ctx.fillStyle = v
  ctx.fillRect(0, 0, w, h)
}

const SCENES = {
  bricks: {
    label: 'Lot de briques',
    background: 'white',
    pieces: [
      { fx: 4, fy: 2, color: 'Rouge', studs: true },
      { fx: 4, fy: 2, color: 'Bleu', studs: true },
      { fx: 2, fy: 2, color: 'Jaune', studs: true },
      { fx: 2, fy: 2, color: 'Vert', studs: true },
      { fx: 2, fy: 1, color: 'Tan', studs: true },
      { fx: 4, fy: 1, color: 'Noir', studs: true },
      { fx: 1, fy: 1, color: 'Orange', studs: true },
      { fx: 2, fy: 2, color: 'Gris clair', studs: true },
    ],
  },
  mixed: {
    label: 'Vrac coloré',
    background: 'table',
    pieces: [
      { fx: 4, fy: 2, color: 'Rouge', studs: true },
      { fx: 4, fy: 2, color: 'Jaune', studs: true },
      { fx: 6, fy: 1, color: 'Bleu', studs: true },
      { fx: 2, fy: 2, color: 'Tan', studs: true },
      { fx: 2, fy: 4, color: 'Lime', studs: true },
      { fx: 1, fy: 2, color: 'Noir', studs: true },
      { fx: 2, fy: 2, color: 'Orange', studs: true },
      { fx: 1, fy: 4, color: 'Blanc', studs: true },
      { fx: 1, fy: 1, color: 'Vert', studs: true },
    ],
  },
  plates: {
    label: 'Plaques et tuiles',
    background: 'dark',
    pieces: [
      { fx: 4, fy: 2, color: 'Blanc', studs: false },
      { fx: 4, fy: 2, color: 'Bleu', studs: true },
      { fx: 2, fy: 2, color: 'Rouge', studs: false },
      { fx: 4, fy: 4, color: 'Jaune', studs: true },
      { fx: 1, fy: 4, color: 'Gris clair', studs: false },
      { fx: 2, fy: 2, color: 'Lime', studs: true },
    ],
  },
}

export const DEMO_SCENES = Object.entries(SCENES).map(([id, s]) => ({ id, label: s.label }))

/** Dessine une photo de démonstration et renvoie son dataURL. */
export function generateDemoPhoto(sceneId = 'bricks') {
  const scene = SCENES[sceneId] ?? SCENES.bricks
  const w = 960
  const h = 720
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')

  paintBackground(ctx, w, h, scene.background)

  const pitch = 34
  const placed = []
  const margin = 40

  const bgColor = { white: '#f7f6f2', table: '#ddd7cc', dark: '#24282f' }[scene.background]

  for (const p of scene.pieces) {
    // une pièce presque de la couleur du fond serait indétectable : on l'écarte
    if (contrast(p.color, bgColor) < 90) continue
    const pw = p.fx * pitch
    const ph = p.fy * pitch
    let x = 0
    let y = 0
    let ok = false
    for (let attempt = 0; attempt < 260 && !ok; attempt += 1) {
      x = margin + Math.random() * (w - pw - margin * 2)
      y = margin + Math.random() * (h - ph - margin * 2)
      ok = placed.every(
        (q) => x + pw + 18 < q.x || q.x + q.w + 18 < x || y + ph + 18 < q.y || q.y + q.h + 18 < y,
      )
    }
    placed.push({ x, y, w: pw, h: ph })
    drawPiece(ctx, { x: Math.round(x), y: Math.round(y), fx: p.fx, fy: p.fy, color: p.color, studs: p.studs, pitch })
  }

  return canvas.toDataURL('image/jpeg', 0.9)
}

function contrast(colorName, bgHex) {
  const a = hexOf(colorName).replace('#', '')
  const b = bgHex.replace('#', '')
  const d = (i) => Math.abs(parseInt(a.slice(i, i + 2), 16) - parseInt(b.slice(i, i + 2), 16))
  return d(0) + d(2) + d(4)
}

export const DEMO_COLORS = PALETTE
