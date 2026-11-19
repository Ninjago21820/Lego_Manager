// Référentiel de poids et de prix estimés.
// Les poids sont les masses officielles ou mesurées des pièces les plus courantes (en grammes).
// Les prix sont des ordres de grandeur indicatifs « neuf » en euros, destinés à donner une
// estimation du stock : ils restent modifiables pièce par pièce dans l'inventaire.

export const PIECE_CATALOG = [
  // Briques
  { name: 'Brique 1x1', category: 'Brique', weightG: 0.32, price: 0.04, top: 1, height: 3 },
  { name: 'Brique 1x2', category: 'Brique', weightG: 0.57, price: 0.05, top: 2, height: 3 },
  { name: 'Brique 1x3', category: 'Brique', weightG: 0.86, price: 0.07, top: 3, height: 3 },
  { name: 'Brique 1x4', category: 'Brique', weightG: 1.15, price: 0.09, top: 4, height: 3 },
  { name: 'Brique 1x6', category: 'Brique', weightG: 1.72, price: 0.12, top: 6, height: 3 },
  { name: 'Brique 1x8', category: 'Brique', weightG: 2.3, price: 0.15, top: 8, height: 3 },
  { name: 'Brique 2x2', category: 'Brique', weightG: 1.15, price: 0.08, top: 4, height: 3 },
  { name: 'Brique 2x3', category: 'Brique', weightG: 1.72, price: 0.11, top: 6, height: 3 },
  { name: 'Brique 2x4', category: 'Brique', weightG: 2.32, price: 0.18, top: 8, height: 3 },
  { name: 'Brique 2x6', category: 'Brique', weightG: 3.45, price: 0.26, top: 12, height: 3 },
  { name: 'Brique 2x8', category: 'Brique', weightG: 4.6, price: 0.34, top: 16, height: 3 },
  // Plaques
  { name: 'Plaque 1x1', category: 'Plaque', weightG: 0.18, price: 0.02, top: 1, height: 1 },
  { name: 'Plaque 1x2', category: 'Plaque', weightG: 0.29, price: 0.03, top: 2, height: 1 },
  { name: 'Plaque 1x4', category: 'Plaque', weightG: 0.55, price: 0.05, top: 4, height: 1 },
  { name: 'Plaque 1x6', category: 'Plaque', weightG: 0.83, price: 0.07, top: 6, height: 1 },
  { name: 'Plaque 2x2', category: 'Plaque', weightG: 0.58, price: 0.05, top: 4, height: 1 },
  { name: 'Plaque 2x3', category: 'Plaque', weightG: 0.86, price: 0.07, top: 6, height: 1 },
  { name: 'Plaque 2x4', category: 'Plaque', weightG: 1.15, price: 0.09, top: 8, height: 1 },
  { name: 'Plaque 2x6', category: 'Plaque', weightG: 1.72, price: 0.13, top: 12, height: 1 },
  { name: 'Plaque 2x8', category: 'Plaque', weightG: 2.3, price: 0.17, top: 16, height: 1 },
  { name: 'Plaque 4x4', category: 'Plaque', weightG: 2.3, price: 0.17, top: 16, height: 1 },
  // Tuiles
  { name: 'Tuile lisse 1x2', category: 'Tuile', weightG: 0.52, price: 0.07, top: 2, height: 1 },
  { name: 'Tuile lisse 1x4', category: 'Tuile', weightG: 1.04, price: 0.12, top: 4, height: 1 },
  { name: 'Tuile lisse 2x2', category: 'Tuile', weightG: 1.02, price: 0.13, top: 4, height: 1 },
  { name: 'Tuile lisse 2x4', category: 'Tuile', weightG: 2.05, price: 0.24, top: 8, height: 1 },
  { name: 'Tuile arrondie 1x2', category: 'Tuile', weightG: 0.5, price: 0.08, top: 2, height: 1 },
  // Slopes
  { name: 'Slope 45° 2x1', category: 'Slope', weightG: 0.62, price: 0.06, top: 2, height: 3 },
  { name: 'Slope 45° 2x2', category: 'Slope', weightG: 1.32, price: 0.13, top: 4, height: 3 },
  { name: 'Slope 45° 2x4', category: 'Slope', weightG: 2.55, price: 0.24, top: 8, height: 3 },
  { name: 'Slope 33° 2x4', category: 'Slope', weightG: 2.6, price: 0.22, top: 8, height: 3 },
  // Ronds
  { name: 'Brique ronde 1x1', category: 'Rond', weightG: 0.26, price: 0.03, top: 1, height: 3 },
  { name: 'Brique ronde 2x2', category: 'Rond', weightG: 1.0, price: 0.09, top: 1, height: 3 },
  { name: 'Plaque ronde 1x1', category: 'Rond', weightG: 0.13, price: 0.02, top: 1, height: 1 },
  // Technic
  { name: 'Poutre Technic 1x3', category: 'Technic', weightG: 0.5, price: 0.06, top: 3, height: 1 },
  { name: 'Poutre Technic 1x5', category: 'Technic', weightG: 0.75, price: 0.08, top: 5, height: 1 },
  { name: 'Poutre Technic 1x7', category: 'Technic', weightG: 1.05, price: 0.1, top: 7, height: 1 },
  { name: 'Axe Technic 3L', category: 'Technic', weightG: 0.6, price: 0.06, top: 0, height: 0 },
  { name: 'Axe Technic 4L', category: 'Technic', weightG: 0.78, price: 0.07, top: 0, height: 0 },
  { name: 'Axe Technic 6L', category: 'Technic', weightG: 1.5, price: 0.1, top: 0, height: 0 },
  { name: 'Axe Technic 8L', category: 'Technic', weightG: 2.0, price: 0.13, top: 0, height: 0 },
  { name: 'Connecteur Technic 3L', category: 'Technic', weightG: 0.5, price: 0.05, top: 0, height: 1 },
  { name: 'Pignon 12 dents', category: 'Technic', weightG: 0.45, price: 0.06, top: 0, height: 1 },
  { name: 'Pignon 24 dents', category: 'Technic', weightG: 0.9, price: 0.09, top: 0, height: 1 },
  // Minifigs
  { name: 'Minifig complète', category: 'Minifig', weightG: 4.0, price: 2.5, top: 0, height: 12 },
  { name: 'Tête minifig', category: 'Minifig', weightG: 0.72, price: 0.4, top: 1, height: 1 },
  { name: 'Torse minifig', category: 'Minifig', weightG: 2.1, price: 1.2, top: 2, height: 3 },
  { name: 'Jambes minifig', category: 'Minifig', weightG: 1.0, price: 0.55, top: 2, height: 3 },
  { name: 'Cheveux minifig', category: 'Minifig', weightG: 0.35, price: 0.3, top: 1, height: 1 },
  // Accessoires
  { name: 'Épée', category: 'Accessoire', weightG: 0.7, price: 0.12, top: 0, height: 0 },
  { name: 'Casque pompier', category: 'Accessoire', weightG: 0.6, price: 0.15, top: 1, height: 1 },
  { name: 'Outillage', category: 'Accessoire', weightG: 0.5, price: 0.1, top: 0, height: 0 },
  // Fenêtres / portes
  { name: 'Fenêtre 1x2x2', category: 'Fenêtre / Porte', weightG: 0.95, price: 0.12, top: 2, height: 6 },
  { name: 'Porte 1x4x6', category: 'Fenêtre / Porte', weightG: 3.2, price: 0.3, top: 4, height: 18 },
  // Végétation
  { name: 'Feuille palmier', category: 'Végétation', weightG: 0.55, price: 0.08, top: 1, height: 1 },
  { name: 'Arbre sapin', category: 'Végétation', weightG: 3.5, price: 0.35, top: 4, height: 12 },
  { name: 'Brique feuille', category: 'Végétation', weightG: 0.4, price: 0.06, top: 2, height: 1 },
  // Roues
  { name: 'Pneu 43,2 x 22', category: 'Roue / Essieu', weightG: 8.6, price: 0.45, top: 0, height: 2 },
  { name: 'Jante 30,4', category: 'Roue / Essieu', weightG: 2.2, price: 0.2, top: 1, height: 2 },
  { name: 'Pneu 30,4 x 14', category: 'Roue / Essieu', weightG: 3.4, price: 0.22, top: 0, height: 1 },
  // Baseplates
  { name: 'Baseplate 16x16', category: 'Baseplate', weightG: 27, price: 1.8, top: 256, height: 1 },
  { name: 'Baseplate 32x32', category: 'Baseplate', weightG: 95, price: 4.5, top: 1024, height: 1 },
  { name: 'Baseplate 48x48', category: 'Baseplate', weightG: 280, price: 15, top: 2304, height: 1 },
]

// Empreinte (nombre de tenons en largeur x en longueur), déduite du nom :
// « Brique 2x4 » -> 2 x 4, « Poutre Technic 1x5 » -> 1 x 5.
for (const entry of PIECE_CATALOG) {
  const m = /(\d+)\s*x\s*(\d+)/.exec(entry.name)
  if (m) {
    entry.fx = Number(m[1])
    entry.fy = Number(m[2])
  } else {
    const side = Math.max(1, Math.round(Math.sqrt(entry.top || 1)))
    entry.fx = side
    entry.fy = side
  }
}

// Valeurs par défaut lorsqu'une pièce n'est pas dans le catalogue.
export const CATEGORY_DEFAULTS = {
  Brique: { weightG: 1.2, price: 0.08 },
  Plaque: { weightG: 0.6, price: 0.05 },
  Tuile: { weightG: 0.7, price: 0.08 },
  Slope: { weightG: 1.5, price: 0.12 },
  Rond: { weightG: 0.3, price: 0.03 },
  Technic: { weightG: 0.9, price: 0.08 },
  Minifig: { weightG: 2.5, price: 1.5 },
  Accessoire: { weightG: 0.6, price: 0.12 },
  'Fenêtre / Porte': { weightG: 1.5, price: 0.15 },
  Végétation: { weightG: 1.2, price: 0.1 },
  'Roue / Essieu': { weightG: 4.0, price: 0.3 },
  Baseplate: { weightG: 60, price: 4.0 },
  Autre: { weightG: 1.0, price: 0.08 },
}

// Certaines couleurs sont plus rares donc plus chères à l'unité.
export const COLOR_PRICE_FACTOR = {
  'Chrome argent': 3,
  Violet: 1.25,
  Rose: 1.15,
  Tan: 1.1,
  Lime: 1.1,
  Transparent: 1.15,
  'Trans-Jaune': 1.15,
  'Trans-Rouge': 1.15,
}

const normalize = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

export function findCatalogEntry(name) {
  const n = normalize(name)
  if (!n) return null
  return (
    PIECE_CATALOG.find((e) => normalize(e.name) === n) ||
    PIECE_CATALOG.find((e) => n.includes(normalize(e.name))) ||
    PIECE_CATALOG.find((e) => normalize(e.name).includes(n)) ||
    null
  )
}

export function guessWeight(name, category) {
  const entry = findCatalogEntry(name)
  if (entry) return entry.weightG
  return CATEGORY_DEFAULTS[category]?.weightG ?? CATEGORY_DEFAULTS.Autre.weightG
}

export function guessPrice(name, category, color) {
  const entry = findCatalogEntry(name)
  const base = entry ? entry.price : CATEGORY_DEFAULTS[category]?.price ?? CATEGORY_DEFAULTS.Autre.price
  const factor = COLOR_PRICE_FACTOR[color] ?? 1
  return Math.round(base * factor * 100) / 100
}

/** Poids unitaire effectif (g) : valeur saisie sinon estimation du référentiel. */
export function effectiveWeight(part) {
  const raw = part?.weightG
  if (raw === null || raw === undefined || raw === '') return guessWeight(part?.name, part?.category)
  const w = Number(raw)
  return Number.isFinite(w) && w > 0 ? w : guessWeight(part?.name, part?.category)
}

/** Prix unitaire effectif (€) : valeur saisie sinon estimation du référentiel. */
export function effectivePrice(part) {
  const raw = part?.pricePerPiece
  if (raw === null || raw === undefined || raw === '') {
    return guessPrice(part?.name, part?.category, part?.color)
  }
  const p = Number(raw)
  return Number.isFinite(p) && p >= 0 ? p : guessPrice(part?.name, part?.category, part?.color)
}

/** Décote appliquée aux pièces d'occasion (facteur 0–1, 1 = prix neuf). */
export function priceFactor(part, usedFactor = 1) {
  if (!part) return 1
  if (part.condition === 'Neuf' || !part.condition) return 1
  if (part.condition === 'Abîmé') return usedFactor * 0.6
  return usedFactor
}

export function partWeight(part) {
  return Math.max(0, Number(part?.quantity) || 0) * effectiveWeight(part)
}

export function partValue(part, usedFactor = 1) {
  return Math.max(0, Number(part?.quantity) || 0) * effectivePrice(part) * priceFactor(part, usedFactor)
}

/** Complète une pièce avec son poids et son prix de référence. */
export function withEstimate(part) {
  return {
    ...part,
    weightG: part.weightG ?? guessWeight(part.name, part.category),
    pricePerPiece: part.pricePerPiece ?? guessPrice(part.name, part.category, part.color),
  }
}


/* ------------------------------------------------------------------ */
/*  Géométrie des pièces (utilisée par la reconnaissance photo)        */
/* ------------------------------------------------------------------ */

// Diamètre d'un tenon LEGO (mm) : référence de toutes les dimensions.
export const STUD_MM = 8
// Hauteur d'une plaque LEGO (mm) ; une brique fait 3 plaques de haut.
export const PLATE_MM = 3.2
// Surface d'une baseplate, sert à la reconnaissance des grandes plaques.
export const BASEPLATE_NAMES = ['Baseplate 16x16', 'Baseplate 32x32', 'Baseplate 48x48']

const CATEGORY_GEOMETRY = {
  Brique: { top: 4, height: 3 },
  Plaque: { top: 4, height: 1 },
  Tuile: { top: 4, height: 1 },
  Slope: { top: 4, height: 3 },
  Rond: { top: 1, height: 3 },
  Technic: { top: 0, height: 1 },
  Minifig: { top: 0, height: 3 },
  Accessoire: { top: 0, height: 1 },
  'Fenêtre / Porte': { top: 2, height: 6 },
  Végétation: { top: 1, height: 1 },
  'Roue / Essieu': { top: 0, height: 2 },
  Baseplate: { top: 16, height: 1 },
  Autre: { top: 4, height: 3 },
}

/** Nombre de tenons (studs), empreinte et hauteur en plaques d'une référence. */
export function pieceGeometry(name, category) {
  const entry = findCatalogEntry(name)
  if (entry) return { top: entry.top, height: entry.height, fx: entry.fx, fy: entry.fy }
  const fallback = CATEGORY_GEOMETRY[category] ?? CATEGORY_GEOMETRY.Autre
  return { ...fallback, fx: 2, fy: 2 }
}

/** Dimensions physiques estimées d'une pièce (mm) d'après son nombre de tenons. */
export function pieceSizeMm(name, category) {
  const { top, height } = pieceGeometry(name, category)
  if (!top) return null
  const side = Math.sqrt(top) * STUD_MM
  return { widthMm: side, depthMm: side, heightMm: height * PLATE_MM, top }
}
