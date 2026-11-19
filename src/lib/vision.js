// Reconnaissance de pièces LEGO sur photo.
//
// Principe : sur un fond uni (feuille blanche, bac, table), chaque pièce se
// détecte comme une zone de couleur nettement différente du fond. On obtient
// ainsi le nombre de pièces, leur couleur et leur emprise ; la géométrie de
// chaque zone est ensuite confrontée au référentiel LEGO (nombre de tenons,
// hauteur) pour proposer une référence.
//
// L'ensemble est volontairement prudent : les propositions sont affichées avec
// un indice de confiance et restent modifiables avant comptabilisation.

import { COLORS, colorHex } from './lego'
import { PIECE_CATALOG, findCatalogEntry } from './catalog'

/* ------------------------------------------------------------------ */
/*  Utilitaires couleur                                                */
/* ------------------------------------------------------------------ */

export function hexToRgb(hex) {
  const h = String(hex).replace('#', '')
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

export function rgbToHex(r, g, b) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

function hexToHsv(hex) {
  const { r, g, b } = hexToRgb(hex)
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const d = max - min
  let h = 0
  if (d) {
    if (max === rn) h = ((gn - bn) / d) % 6
    else if (max === gn) h = (bn - rn) / d + 2
    else h = (rn - gn) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s: max === 0 ? 0 : d / max, v: max }
}

function hexToLab(hex) {
  const { r, g, b } = hexToRgb(hex)
  const lin = (v) => {
    const c = v / 255
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  const R = lin(r)
  const G = lin(g)
  const B = lin(b)
  const x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047
  const y = R * 0.2126 + G * 0.7152 + B * 0.0722
  const z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  return { L: 116 * f(y) - 16, a: 500 * (f(x) - f(y)), b: 200 * (f(y) - f(z)) }
}

function deltaE(hexA, hexB) {
  const A = hexToLab(hexA)
  const B = hexToLab(hexB)
  return Math.sqrt((A.L - B.L) ** 2 + (A.a - B.a) ** 2 + (A.b - B.b) ** 2)
}

const REFERENCE_COLORS = COLORS.map((c) => ({ ...c, lab: hexToLab(c.hex) }))

/**
 * Couleur LEGO la plus proche d'une couleur moyenne mesurée.
 * Les pièces translucides photographiées sur fond clair donnent une teinte
 * délavée : on pénalise donc les couleurs transparentes quand la mesure est
 * très claire et très peu saturée.
 */
export function nearestLegoColor(hex) {
  const hsv = hexToHsv(hex)
  const washed = hsv.s < 0.32 && hsv.v > 0.55

  let best = { name: 'Inconnue', distance: Infinity, hex: colorHex('Inconnue') }
  let bestOpaque = { name: 'Inconnue', distance: Infinity, hex: colorHex('Inconnue') }

  for (const ref of REFERENCE_COLORS) {
    const d = deltaE(hex, ref.hex)
    const isTransparent = ref.group === 'Transparent'
    if (isTransparent) {
      // une pièce transparente photographiée sur fond blanc paraît plus claire
      const penalty = washed ? 0 : 26
      const adjusted = d + penalty
      if (adjusted < best.distance) best = { name: ref.name, distance: adjusted, hex: ref.hex }
    } else {
      if (d < bestOpaque.distance) bestOpaque = { ...ref, distance: d }
      if (d + 8 < best.distance) best = { name: ref.name, distance: d + 8, hex: ref.hex }
    }
  }

  // Une teinte très sombre est presque toujours du noir.
  if (hsv.v < 0.14 && best.distance > 12) return { name: 'Noir', distance: 12, hex: colorHex('Noir') }
  // teinte claire et délavée : on préfère la version opaque (blanc / gris clair)
  if (washed && bestOpaque.distance < 26) return { ...bestOpaque, hex: colorHex(bestOpaque.name) }
  // à distance comparable, une pièce opaque est bien plus fréquente qu'une translucide
  if (bestOpaque.distance < 26 && best.distance > bestOpaque.distance - 8) {
    return { ...bestOpaque, hex: colorHex(bestOpaque.name) }
  }
  return best
}

/* ------------------------------------------------------------------ */
/*  Segmentation                                                       */
/* ------------------------------------------------------------------ */

/**
 * Analyse une image et renvoie les pièces détectées.
 * @param {HTMLImageElement|HTMLCanvasElement} source
 * @param {{ tolerance?: number, minAreaRatio?: number, analyzeStuds?: boolean }} options
 *   tolerance     : écart de couleur toléré avec le fond (0–100, plus haut = plus permissif)
 *   minAreaRatio  : surface minimale d'une pièce, en proportion de l'image
 */
export function detectPieces(source, options = {}) {
  const { tolerance = 42, minAreaRatio = 0.0012, analyzeStuds = true } = options
  const maxSide = 720
  const sw = source.naturalWidth || source.width
  const sh = source.naturalHeight || source.height
  if (!sw || !sh) return { pieces: [], width: 0, height: 0, error: 'Image illisible.' }

  const scale = Math.min(1, maxSide / Math.max(sw, sh))
  const w = Math.max(1, Math.round(sw * scale))
  const h = Math.max(1, Math.round(sh * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(source, 0, 0, w, h)
  const { data } = ctx.getImageData(0, 0, w, h)

  // 1. couleur du fond : médiane d'un cadre de 6 % autour des bords
  const border = Math.max(2, Math.round(Math.min(w, h) * 0.06))
  const rs = []
  const gs = []
  const bs = []
  const sample = (x, y) => {
    const i = (y * w + x) * 4
    rs.push(data[i])
    gs.push(data[i + 1])
    bs.push(data[i + 2])
  }
  const step = Math.max(1, Math.round(Math.max(w, h) / 160))
  for (let x = 0; x < w; x += step) {
    for (let d = 0; d < border; d += Math.max(1, Math.round(border / 6))) {
      sample(x, d)
      sample(x, h - 1 - d)
    }
  }
  for (let y = 0; y < h; y += step) {
    for (let d = 0; d < border; d += Math.max(1, Math.round(border / 6))) {
      sample(d, y)
      sample(w - 1 - d, y)
    }
  }
  const median = (arr) => {
    const a = [...arr].sort((x, y) => x - y)
    return a[Math.floor(a.length / 2)] ?? 255
  }
  const bg = { r: median(rs), g: median(gs), b: median(bs) }
  const bgHex = rgbToHex(bg.r, bg.g, bg.b)

  // 2. masque « pièce » = couleur suffisamment éloignée du fond
  const total = w * h
  const mask = new Uint8Array(total)
  const dist = new Float32Array(total)
  const tol = Math.max(10, tolerance) * 2.0 // échelle perceptuelle Lab
  const hsv = new Float32Array(total * 2) // saturation, valeur
  const bgHsv = hexToHsv(bgHex)
  for (let i = 0; i < total; i += 1) {
    const o = i * 4
    const r = data[o]
    const g = data[o + 1]
    const b = data[o + 2]
    const max = r > g ? (r > b ? r : b) : g > b ? g : b
    const min = r < g ? (r < b ? r : b) : g < b ? g : b
    const v = max / 255
    const sat = max === 0 ? 0 : (max - min) / max
    hsv[i * 2] = sat
    hsv[i * 2 + 1] = v

    // un blanc n'est distinguable d'un fond clair que s'il est franc et que
    // le fond est lui-même peu saturé : on abaisse alors le seuil
    const isWhiteOutlier = sat < 0.06 && v > 0.82 && bgHsv.v < 0.92 && bgHsv.s < 0.14
    const threshold = isWhiteOutlier ? tol * 0.45 : tol

    const d = Math.abs(r - bg.r) + Math.abs(g - bg.g) + Math.abs(b - bg.b)
    dist[i] = d
    if (d > threshold) mask[i] = 1
  }

  // 3. étiquetage des composantes connexes (4-voisins, file d'attente)
  const labels = new Int32Array(total).fill(-1)
  const blobs = []
  const minArea = Math.max(60, total * minAreaRatio)
  const stack = new Int32Array(total)
  let next = 0

  for (let start = 0; start < total; start += 1) {
    if (!mask[start] || labels[start] !== -1) continue
    let sp = 0
    stack[sp++] = start
    labels[start] = next
    let area = 0
    let minX = w
    let maxX = 0
    let minY = h
    let maxY = 0
    let sumR = 0
    let sumG = 0
    let sumB = 0

    while (sp > 0) {
      const p = stack[--sp]
      const x = p % w
      const y = (p - x) / w
      area += 1
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
      const o = p * 4
      sumR += data[o]
      sumG += data[o + 1]
      sumB += data[o + 2]
      if (x > 0 && mask[p - 1] && labels[p - 1] === -1) {
        labels[p - 1] = next
        stack[sp++] = p - 1
      }
      if (x < w - 1 && mask[p + 1] && labels[p + 1] === -1) {
        labels[p + 1] = next
        stack[sp++] = p + 1
      }
      if (y > 0 && mask[p - w] && labels[p - w] === -1) {
        labels[p - w] = next
        stack[sp++] = p - w
      }
      if (y < h - 1 && mask[p + w] && labels[p + w] === -1) {
        labels[p + w] = next
        stack[sp++] = p + w
      }
    }

    if (area >= minArea) {
      blobs.push({
        id: `blob-${next}`,
        area,
        minX,
        maxX,
        minY,
        maxY,
        width: maxX - minX + 1,
        height: maxY - minY + 1,
        avgHex: rgbToHex(sumR / area, sumG / area, sumB / area),
        label: next,
      })
    }
    next += 1
  }

  // 4. nettoyage : fusion des morceaux d'une même pièce séparés par un reflet,
  //    et suppression des poussières / ombres très allongées.
  const merged = mergeFragments(blobs, w * h)
  // 4bis. séparation des pièces qui se touchent : d'abord par différence de
  // couleur (deux briques de couleurs différentes), puis par la ligne de
  // jonction sombre (deux pièces de même couleur).
  const ctxBlob = { w, data, mask, labels }
  const splitted = []
  for (const b of merged) {
    for (const byColor of splitOnColor(b, ctxBlob)) {
      splitted.push(...splitOnSeams(byColor, ctxBlob))
    }
  }

  const pieces = splitted.map((b) => describeBlob(b, { w, h, bgHex, analyzeStuds, data, mask }))

  // 5. ordre de lecture (haut → bas, gauche → droite)
  pieces.sort((a, b) => {
    const rowA = Math.floor(a.cy / Math.max(1, h / 8))
    const rowB = Math.floor(b.cy / Math.max(1, h / 8))
    return rowA === rowB ? a.cx - b.cx : rowA - rowB
  })
  pieces.forEach((p, i) => {
    p.index = i + 1
  })

  return {
    pieces,
    width: w,
    height: h,
    bgHex,
    background: nearestLegoColor(bgHex),
    mask,
    analyzedAt: Date.now(),
  }
}

function mergeFragments(blobs, imageArea) {
  const out = []
  const used = new Array(blobs.length).fill(false)
  const gap = Math.max(3, Math.round(Math.sqrt(imageArea) * 0.012))

  for (let i = 0; i < blobs.length; i += 1) {
    if (used[i]) continue
    let cur = { ...blobs[i] }
    used[i] = true
    let changed = true
    while (changed) {
      changed = false
      for (let j = 0; j < blobs.length; j += 1) {
        if (used[j]) continue
        const b = blobs[j]
        const nearX = b.minX - gap <= cur.maxX && b.maxX + gap >= cur.minX
        const nearY = b.minY - gap <= cur.maxY && b.maxY + gap >= cur.minY
        const colorClose = deltaE(b.avgHex, cur.avgHex) < 18
        const small = b.area < cur.area * 0.6
        if (nearX && nearY && colorClose && small) {
          const areaSum = cur.area + b.area
          cur = {
            ...cur,
            area: areaSum,
            minX: Math.min(cur.minX, b.minX),
            maxX: Math.max(cur.maxX, b.maxX),
            minY: Math.min(cur.minY, b.minY),
            maxY: Math.max(cur.maxY, b.maxY),
            width: Math.max(cur.maxX, b.maxX) - Math.min(cur.minX, b.minX) + 1,
            height: Math.max(cur.maxY, b.maxY) - Math.min(cur.minY, b.minY) + 1,
            avgHex: mixHex(cur.avgHex, b.avgHex, b.area / areaSum),
          }
          used[j] = true
          changed = true
        }
      }
    }
    out.push(cur)
  }
  return out.filter((b) => {
    const ratio = b.width / b.height
    const fill = b.area / (b.width * b.height)
    if (ratio > 9 || ratio < 1 / 9) return false
    if (fill < 0.35) return false
    return true
  })
}

function mixHex(a, b, t) {
  const A = hexToRgb(a)
  const B = hexToRgb(b)
  return rgbToHex(A.r * (1 - t) + B.r * t, A.g * (1 - t) + B.g * t, A.b * (1 - t) + B.b * t)
}

/** Compte les « bosses » de tenons visibles à l'intérieur d'une pièce. */
function countStuds({ w, data, mask, minX, maxX, minY, maxY }) {
  // l'ombre portée autour de la pièce est incluse dans le masque : on rentre
  // dans la boîte pour ne garder que la surface de la pièce elle-même
  const shorter = Math.min(maxX - minX + 1, maxY - minY + 1)
  const inset = Math.max(1, Math.round(shorter * 0.12))
  const width = maxX - minX + 1 - 2 * inset
  const height = maxY - minY + 1 - 2 * inset
  if (width < 6 || height < 6) return { studs: 0, contrast: 0 }

  const size = width * height
  const light = new Float32Array(size)
  const inside = new Uint8Array(size)
  const values = []
  let k = 0
  for (let y = minY + inset; y <= maxY - inset; y += 1) {
    for (let x = minX + inset; x <= maxX - inset; x += 1) {
      const p = y * w + x
      if (mask[p]) {
        const o = p * 4
        const v = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2]
        light[k] = v
        inside[k] = 1
        values.push(v)
      }
      k += 1
    }
  }
  if (values.length < 140) return { studs: 0, contrast: 0 }

  // contraste local : un tenon éclairé crée une zone plus claire que la surface plate
  let mean = 0
  for (const v of values) mean += v
  mean /= values.length
  let variance = 0
  for (const v of values) variance += (v - mean) ** 2
  const std = Math.sqrt(variance / values.length)
  if (std < 4.5) return { studs: 0, contrast: std } // pièce lisse ou éclairage trop doux

  const threshold = mean + std * 0.7
  const bright = new Uint8Array(size)
  for (let i = 0; i < size; i += 1) if (inside[i] && light[i] >= threshold) bright[i] = 1

  const seen = new Uint8Array(size)
  const stack = []
  // plus la surface est bruitée, plus on exige des bosses franches
  const minStudArea = Math.max(5, size / (std > 24 ? 400 : 1000))
  const blobs = []

  for (let i = 0; i < size; i += 1) {
    if (!bright[i] || seen[i]) continue
    let area = 0
    let sx = 0
    let sy = 0
    let minIx = width
    let maxIx = 0
    let minIy = height
    let maxIy = 0
    stack.length = 0
    stack.push(i)
    seen[i] = 1
    while (stack.length) {
      const q = stack.pop()
      const qx = q % width
      const qy = (q - qx) / width
      area += 1
      sx += qx
      sy += qy
      if (qx < minIx) minIx = qx
      if (qx > maxIx) maxIx = qx
      if (qy < minIy) minIy = qy
      if (qy > maxIy) maxIy = qy
      const neighbours = [
        qx > 0 ? q - 1 : -1,
        qx < width - 1 ? q + 1 : -1,
        qy > 0 ? q - width : -1,
        qy < height - 1 ? q + width : -1,
      ]
      for (const n of neighbours) {
        if (n >= 0 && bright[n] && !seen[n]) {
          seen[n] = 1
          stack.push(n)
        }
      }
    }
    if (area < minStudArea) continue
    // un tenon est compact, plutôt rond et détaché du bord de la pièce
    const bw = maxIx - minIx + 1
    const bh = maxIy - minIy + 1
    const roundness = Math.min(bw, bh) / Math.max(bw, bh)
    const relative = Math.max(bw / width, bh / height)
    if (roundness < 0.45) continue
    if (relative > 0.5) continue
    const cx = sx / area
    const cy = sy / area
    if (cx < 1 || cy < 1 || cx > width - 2 || cy > height - 2) continue
    blobs.push({ area, cx, cy })
  }

  // les bosses d'une même pièce ont des tailles comparables : on écarte les
  // petits accidents (grain, reflets) en se calant sur la taille médiane
  if (blobs.length > 2) {
    const sorted = blobs.map((b) => b.area).sort((a, b) => a - b)
    const medianArea = sorted[Math.floor(sorted.length / 2)]
    const kept = blobs.filter((b) => b.area >= medianArea * 0.32)
    return { studs: kept.length, contrast: std }
  }

  return { studs: blobs.length, contrast: std }
}

/* ------------------------------------------------------------------ */
/*  Séparation des pièces accolées                                      */
/* ------------------------------------------------------------------ */

/**
 * Deux pièces de couleurs différentes qui se touchent n'ont pas de ligne de
 * jonction sombre : on cherche alors une rupture de teinte (clustering des
 * pixels en deux groupes, séparation par la luminance).
 */
function splitOnColor(blob, ctx, depth = 0) {
  if (depth >= 2) return [blob]
  const { minX, maxX, minY, maxY } = blob
  const { w, data, mask } = ctx
  const W = maxX - minX + 1
  const H = maxY - minY + 1

  // 1. teintes des pixels colorés (les pièces grises/noires/blanches sont
  //    traitées par la détection de jonction, pas ici)
  const hues = []
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const p = y * w + x
      if (!mask[p]) continue
      const o = p * 4
      const r = data[o]
      const g = data[o + 1]
      const b = data[o + 2]
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      const sat = max === 0 ? 0 : (max - min) / max
      if (sat < 0.22 || max < 40) continue
      let h
      const d = max - min
      if (max === r) h = ((g - b) / d) % 6
      else if (max === g) h = (b - r) / d + 2
      else h = (r - g) / d + 4
      h *= 60
      if (h < 0) h += 360
      hues.push(h)
    }
  }
  const chromatic = hues.length
  if (chromatic < 45 || chromatic < (W * H) * 0.2) return [blob]

  // 2. plus grand « trou » dans le cercle des teintes = frontière entre deux couleurs
  hues.sort((a, b) => a - b)
  let gap = 360 - hues[hues.length - 1] + hues[0]
  let split = (hues[0] + 360 + hues[hues.length - 1]) / 2
  for (let i = 1; i < hues.length; i += 1) {
    const g2 = hues[i] - hues[i - 1]
    if (g2 > gap) {
      gap = g2
      split = (hues[i - 1] + hues[i]) / 2
    }
  }
  if (gap < 60) return [blob] // une seule teinte : reflets uniquement
  // chaque couleur doit représenter une part significative de la pièce
  let below = 0
  for (const h of hues) if (h < split) below += 1
  const ratio = below / hues.length
  if (ratio < 0.18 || ratio > 0.82) return [blob]

  // 3. affectation des pixels aux deux groupes
  const assign = new Uint8Array(W * H)
  const boxA = { minX: Infinity, maxX: -1, minY: Infinity, maxY: -1 }
  const boxB = { minX: Infinity, maxX: -1, minY: Infinity, maxY: -1 }
  let countA = 0
  let countB = 0
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const p = y * w + x
      if (!mask[p]) continue
      const o = p * 4
      const r = data[o]
      const g = data[o + 1]
      const b = data[o + 2]
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      const sat = max === 0 ? 0 : (max - min) / max
      let h = 0
      if (sat >= 0.22) {
        const d = max - min
        if (max === r) h = ((g - b) / d) % 6
        else if (max === g) h = (b - r) / d + 2
        else h = (r - g) / d + 4
        h *= 60
        if (h < 0) h += 360
      } else {
        // pixel peu saturé (reflet, ombre) : on l'associe au groupe dominant alentour
        h = split
      }
      const inA = h < split
      assign[(y - minY) * W + (x - minX)] = inA ? 1 : 2
      if (inA) {
        countA += 1
        if (x < boxA.minX) boxA.minX = x
        if (x > boxA.maxX) boxA.maxX = x
        if (y < boxA.minY) boxA.minY = y
        if (y > boxA.maxY) boxA.maxY = y
      } else {
        countB += 1
        if (x < boxB.minX) boxB.minX = x
        if (x > boxB.maxX) boxB.maxX = x
        if (y < boxB.minY) boxB.minY = y
        if (y > boxB.maxY) boxB.maxY = y
      }
    }
  }
  if (countA < 60 || countB < 60) return [blob]
  if (countA / (countA + countB) < 0.2 || countB / (countA + countB) < 0.2) return [blob]

  // 4. deux pièces côte à côte donnent deux blocs compacts et disjoints ;
  //    un reflet donne une tache dispersée au milieu de la pièce
  const areaA = (boxA.maxX - boxA.minX + 1) * (boxA.maxY - boxA.minY + 1)
  const areaB = (boxB.maxX - boxB.minX + 1) * (boxB.maxY - boxB.minY + 1)
  const overlapX = Math.min(boxA.maxX, boxB.maxX) - Math.max(boxA.minX, boxB.minX)
  const overlapY = Math.min(boxA.maxY, boxB.maxY) - Math.max(boxA.minY, boxB.minY)
  const overlapRatio = (Math.max(0, overlapX) * Math.max(0, overlapY)) / (W * H)
  if (overlapRatio > 0.1) return [blob]
  if (Math.min(areaA, areaB) < W * H * 0.1) return [blob]

  const parts = []
  for (const [value, box] of [
    [1, boxA],
    [2, boxB],
  ]) {
    const rebuilt = rebuildBlob(
      { ...blob, ...box },
      {
        ...ctx,
        accept: (x, y) => assign[(y - minY) * W + (x - minX)] === value,
      },
    )
    if (!rebuilt || rebuilt.area < 50) continue
    parts.push(...splitOnColor(rebuilt, ctx, depth + 1))
  }
  return parts.length >= 2 ? parts : [blob]
}

/**
 * Deux pièces posées côte à côte se touchent souvent : l'arête commune forme
 * une ligne plus sombre. On cherche donc, dans la boîte d'une pièce, une ligne
 * (verticale ou horizontale) nettement plus sombre que la surface, et on coupe
 * à cet endroit — récursivement, jusqu'à 3 niveaux.
 */
function splitOnSeams(blob, ctx, depth = 0) {
  if (depth >= 3) return [blob]
  const seam = findSeam(blob, ctx, 'v') ?? findSeam(blob, ctx, 'h')
  if (!seam) return [blob]

  const { axis, at } = seam
  const a = axis === 'v' ? { ...blob, maxX: at - 1 } : { ...blob, maxY: at - 1 }
  const b = axis === 'v' ? { ...blob, minX: at + 1 } : { ...blob, minY: at + 1 }
  const parts = []
  for (const part of [a, b]) {
    const rebuilt = rebuildBlob(part, ctx)
    if (!rebuilt || rebuilt.area < 40) continue
    parts.push(...splitOnSeams(rebuilt, ctx, depth + 1))
  }
  return parts.length >= 2 ? parts : [blob]
}

function rebuildBlob(part, { w, data, mask, accept }) {
  let area = 0
  let sumR = 0
  let sumG = 0
  let sumB = 0
  for (let y = part.minY; y <= part.maxY; y += 1) {
    for (let x = part.minX; x <= part.maxX; x += 1) {
      const p = y * w + x
      if (!mask[p]) continue
      if (accept && !accept(x, y)) continue
      area += 1
      const o = p * 4
      sumR += data[o]
      sumG += data[o + 1]
      sumB += data[o + 2]
    }
  }
  if (!area) return null
  const width = part.maxX - part.minX + 1
  const height = part.maxY - part.minY + 1
  return {
    ...part,
    area,
    width,
    height,
    avgHex: rgbToHex(sumR / area, sumG / area, sumB / area),
  }
}

function findSeam(blob, { w, data, mask }, axis) {
  const { minX, maxX, minY, maxY } = blob
  const W = maxX - minX + 1
  const H = maxY - minY + 1
  const along = axis === 'v' ? W : H
  const across = axis === 'v' ? H : W
  if (along < 26 || across < 12) return null

  const sum = new Float64Array(along)
  const cnt = new Int32Array(along)
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const p = y * w + x
      if (!mask[p]) continue
      const idx = axis === 'v' ? x - minX : y - minY
      const o = p * 4
      sum[idx] += 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2]
      cnt[idx] += 1
    }
  }

  const need = across * 0.6
  const profile = []
  let mean = 0
  for (let i = 0; i < along; i += 1) {
    const v = cnt[i] >= need ? sum[i] / cnt[i] : NaN
    profile.push(v)
    if (!Number.isNaN(v)) mean += v
  }
  const n = profile.filter((v) => !Number.isNaN(v)).length
  if (n < 10) return null
  mean /= n

  let variance = 0
  for (const v of profile) if (!Number.isNaN(v)) variance += (v - mean) ** 2
  const std = Math.sqrt(variance / n)
  // une surface de pièce est déjà très irrégulière (tenons) : on exige une
  // ligne nettement plus sombre que cette irrégularité naturelle
  const threshold = Math.min(mean * 0.86, mean - Math.max(9, std * 2.4))

  const from = Math.floor(along * 0.2)
  const to = Math.ceil(along * 0.8)
  let bestI = -1
  let bestV = Infinity
  for (let i = from; i <= to; i += 1) {
    const v = profile[i]
    if (Number.isNaN(v)) continue
    if (v < bestV) {
      bestV = v
      bestI = i
    }
  }
  if (bestI < 0 || !Number.isFinite(bestV)) return null
  if (bestV > threshold) return null

  // une jonction est une vallée : nettement plus clair de part et d'autre
  const leftMax = Math.max(...profile.slice(Math.max(0, bestI - 6), bestI).filter((v) => !Number.isNaN(v)))
  const rightMax = Math.max(...profile.slice(bestI + 1, bestI + 7).filter((v) => !Number.isNaN(v)))
  if (!Number.isFinite(leftMax) || !Number.isFinite(rightMax)) return null
  if (leftMax < bestV * 1.2 || rightMax < bestV * 1.2) return null

  // les deux moitiés doivent être de tailles comparables
  const leftCount = from
  const rightCount = along - to
  if (Math.min(leftCount, rightCount) < along * 0.15) return null

  return { axis, at: (axis === 'v' ? minX : minY) + bestI }
}

function describeBlob(blob, { w, h, analyzeStuds, data, mask }) {
  const color = nearestLegoColor(blob.avgHex)
  const studInfo = analyzeStuds
    ? countStuds({
        w,
        data,
        mask,
        minX: blob.minX,
        maxX: blob.maxX,
        minY: blob.minY,
        maxY: blob.maxY,
      })
    : { studs: 0, contrast: 0 }

  const fill = blob.area / (blob.width * blob.height)
  const aspect = blob.width / blob.height
  const candidates = rankCandidates({
    studs: studInfo.studs,
    width: blob.width,
    height: blob.height,
    fill,
    aspect,
    colorName: color.name,
    colorDistance: color.distance,
    colorName: color.name,
    contrast: studInfo.contrast,
    imageArea: w * h,
    blobArea: blob.area,
  })

  return {
    id: `${blob.id}-${blob.minX}-${blob.minY}`,
    index: 0,
    box: { x: blob.minX, y: blob.minY, w: blob.width, h: blob.height },
    cx: blob.minX + blob.width / 2,
    cy: blob.minY + blob.height / 2,
    area: blob.area,
    fill,
    aspect,
    avgHex: blob.avgHex,
    color: color.name,
    colorHex: color.hex,
    colorDistance: color.distance,
    studs: studInfo.studs,
    contrast: studInfo.contrast,
    candidates,
    match: candidates[0] || null,
    confidence: candidates[0]?.confidence ?? 0,
    ambiguous: isAmbiguous(candidates),
    status: 'pending', // pending | accepted | rejected
    quantity: 1,
  }
}

/* ------------------------------------------------------------------ */
/*  Rapprochement avec le référentiel LEGO                             */
/* ------------------------------------------------------------------ */

const FAMILY_OF_CATEGORY = {
  Brique: 'brick',
  Plaque: 'plate',
  Tuile: 'tile',
  Slope: 'slope',
  Rond: 'round',
  Technic: 'technic',
  Minifig: 'minifig',
  Accessoire: 'accessory',
  'Fenêtre / Porte': 'window',
  Végétation: 'plant',
  'Roue / Essieu': 'wheel',
  Baseplate: 'baseplate',
  Autre: 'other',
}

/**
 * Note les références du catalogue pour une forme observée.
 * Le score combine : nombre de tenons, proportions, taux de remplissage,
 * couleur et contraste (une pièce lisse n'a pas de tenons).
 */
export function rankCandidates(obs) {
  const {
    studs = 0,
    width,
    height,
    fill,
    colorDistance = 20,
    contrast = 0,
    blobArea = 0,
    imageArea = 1,
    colorName = '',
  } = obs

  const observedArea = Math.max(1, blobArea || width * height)
  const aspect = width / Math.max(1, height)
  const isTransparentColor = /^Trans-|Transparent|Chrome/.test(colorName || '')

  // Échelle (px par tenon) impliquée par le nombre de tenons observé :
  // une pièce de N tenons carrés occupe une boîte de sqrt(N) tenons de côté.
  let scale = 0
  if (studs > 0) {
    scale = Math.sqrt(observedArea / studs) // px² par tenon -> côté en px
    scale = Math.sqrt(scale)
  }

  const scored = []

  for (const entry of PIECE_CATALOG) {
    if (!entry.top) continue // axes / minifigs : pas de forme détectable au sol
    const family = FAMILY_OF_CATEGORY[entry.category] || 'other'
    const fx = entry.fx || 1
    const fy = entry.fy || 1

    let score = 0

    /* ---- a) nombre de tenons ---- */
    if (studs > 0) {
      const diff = Math.abs(studs - entry.top)
      // tolérance : 1 tenon manqué (reflet, bord) ne doit pas disqualifier
      score += Math.max(0, 50 - diff * 11)
      if (diff <= 1) {
        score += diff === 0 ? 12 : 5
        // empreinte : la boîte observée doit avoir les proportions fx x fy
        const ratioModel = Math.max(fx, fy) / Math.max(1, Math.min(fx, fy))
        const ratioObs = aspect >= 1 ? aspect : 1 / aspect
        const aspectError = Math.abs(Math.log(ratioObs / Math.max(1, ratioModel)))
        score += Math.max(0, 26 - aspectError * 30)
        // taille attendue, à l'échelle déduite du nombre de tenons
        const boxErr = Math.abs(width - Math.max(fx, fy) * scale) / (Math.max(fx, fy) * scale)
        score += Math.max(0, 10 - boxErr * 14)
      }
    } else {
      // aucune bosse visible : la pièce est très probablement lisse
      // (tuile ou plaque) — une brique sans tenons visibles est rare en vue de dessus
      if (family === 'tile') score += 30
      else if (family === 'plate') score += 26
      else if (family === 'slope') score += 12
      else if (family === 'baseplate') score += 10
      else if (family === 'brick') score += 2
      if (contrast > 18) score -= 6 // beaucoup de relief mais 0 bossier : suspect
    }

    /* ---- b) forme générale ---- */
    score += 16 * Math.min(1, Math.max(0, (fill - 0.45) / 0.5))
    if (studs === 0) {
      const ratioModel = Math.max(fx, fy) / Math.max(1, Math.min(fx, fy))
      const ratioObs = aspect >= 1 ? aspect : 1 / aspect
      score += Math.max(0, 14 - Math.abs(Math.log(ratioObs / Math.max(1, ratioModel))) * 16)
    }

    /* ---- c) vraisemblance des familles ---- */
    if (family === 'baseplate' && observedArea < imageArea * 0.05) score -= 40
    if (family === 'baseplate' && fill < 0.92) score -= 20
    if (family === 'round' && (fx !== fy || fx !== 1)) score -= 12
    if (family === 'minifig' || family === 'accessory' || family === 'technic') score -= 10
    // les pièces transparentes sont souvent des tuiles / pièces rondes
    if (isTransparentColor && (family === 'tile' || family === 'round')) score += 8
    if (isTransparentColor && family === 'baseplate') score -= 20

    /* ---- d) couleur ---- */
    if (colorDistance > 34) score -= 10

    scored.push({
      name: entry.name,
      category: entry.category,
      top: entry.top,
      fx,
      fy,
      score,
      family,
      heightPlates: entry.height,
    })
  }

  // à empreinte égale, on départage par l'usage le plus courant (brique, plaque, tuile)
  const PREVALENCE = { brick: 3, plate: 2.5, tile: 2, round: 1.5, slope: 1.2, window: 0.6, plant: 0.5, baseplate: 0.2 }
  for (const c of scored) c.score += PREVALENCE[c.family] ?? 0
  scored.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
  const best = scored[0]
  const second = scored[1]
  const margin = best && second ? best.score - second.score : 0
  const normalized = Math.round(
    Math.max(8, Math.min(96, ((best?.score ?? 0) / 125) * 78 + Math.min(22, Math.max(0, margin)) * 1.0)),
  )

  return scored.slice(0, 5).map((c, i) => ({
    ...c,
    score: Math.round(c.score),
    confidence: i === 0 ? normalized : Math.round(Math.max(4, normalized - 14 - i * 8)),
  }))
}

/**
 * Une empreinte identique peut correspondre à une brique, une plaque ou une
 * tuile : la hauteur n'est pas mesurable sur une vue de dessus. On le signale
 * plutôt que de prétendre trancher.
 */
export function isAmbiguous(candidates) {
  if (!candidates || candidates.length < 2) return false
  const [a, b] = candidates
  const sameFootprint = a.top === b.top && a.fx === b.fx && a.fy === b.fy
  return sameFootprint && a.confidence - b.confidence < 12
}

/** Découpe une planche de contact en vignettes pour la galerie. */
export function cropThumbnails(source, pieces, scale, max = 400) {
  const sw = source.naturalWidth || source.width
  const sh = source.naturalHeight || source.height
  const ratio = sw / (scale || sw)
  const out = []
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  for (const p of pieces.slice(0, max)) {
    const pad = Math.round(Math.max(p.box.w, p.box.h) * 0.12)
    const sx = Math.max(0, p.box.x * ratio - pad)
    const sy = Math.max(0, p.box.y * ratio - pad)
    const sWidth = Math.min(sw - sx, p.box.w * ratio + pad * 2)
    const sHeight = Math.min(sh - sy, p.box.h * ratio + pad * 2)
    const size = 132
    canvas.width = size
    canvas.height = size
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)
    ctx.drawImage(source, sx, sy, sWidth, sHeight, 0, 0, size, size)
    out.push({ id: p.id, dataUrl: canvas.toDataURL('image/jpeg', 0.82) })
  }
  return out
}

export function formatConfidence(score) {
  if (score >= 75) return { label: 'Élevée', tone: 'green' }
  if (score >= 50) return { label: 'Moyenne', tone: 'amber' }
  return { label: 'Faible', tone: 'red' }
}

export const DETECTION_PRESETS = [
  { id: 'white', label: 'Feuille blanche', hint: 'Le plus fiable : fond blanc uni, lumière diffuse.', tolerance: 34 },
  { id: 'table', label: 'Table / bac neutre', hint: 'Fond gris ou boisé, sans motif.', tolerance: 46 },
  { id: 'dark', label: 'Fond sombre', hint: 'Tapis noir ou bleu foncé : bon contraste avec les pièces claires.', tolerance: 40 },
]
