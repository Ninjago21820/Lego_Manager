// Référentiel de poids et de prix estimés.
// Les poids sont les masses officielles ou mesurées des pièces les plus courantes (en grammes).
// Les prix sont des ordres de grandeur indicatifs « neuf » en euros, destinés à donner une
// estimation du stock : ils restent modifiables pièce par pièce dans l'inventaire.

export const PIECE_CATALOG = [
  // Briques
  { name: 'Brique 1x1', category: 'Brique', weightG: 0.32, price: 0.04 },
  { name: 'Brique 1x2', category: 'Brique', weightG: 0.57, price: 0.05 },
  { name: 'Brique 1x3', category: 'Brique', weightG: 0.86, price: 0.07 },
  { name: 'Brique 1x4', category: 'Brique', weightG: 1.15, price: 0.09 },
  { name: 'Brique 1x6', category: 'Brique', weightG: 1.72, price: 0.12 },
  { name: 'Brique 1x8', category: 'Brique', weightG: 2.3, price: 0.15 },
  { name: 'Brique 2x2', category: 'Brique', weightG: 1.15, price: 0.08 },
  { name: 'Brique 2x3', category: 'Brique', weightG: 1.72, price: 0.11 },
  { name: 'Brique 2x4', category: 'Brique', weightG: 2.32, price: 0.18 },
  { name: 'Brique 2x6', category: 'Brique', weightG: 3.45, price: 0.26 },
  { name: 'Brique 2x8', category: 'Brique', weightG: 4.6, price: 0.34 },
  // Plaques
  { name: 'Plaque 1x1', category: 'Plaque', weightG: 0.18, price: 0.02 },
  { name: 'Plaque 1x2', category: 'Plaque', weightG: 0.29, price: 0.03 },
  { name: 'Plaque 1x4', category: 'Plaque', weightG: 0.55, price: 0.05 },
  { name: 'Plaque 1x6', category: 'Plaque', weightG: 0.83, price: 0.07 },
  { name: 'Plaque 2x2', category: 'Plaque', weightG: 0.58, price: 0.05 },
  { name: 'Plaque 2x3', category: 'Plaque', weightG: 0.86, price: 0.07 },
  { name: 'Plaque 2x4', category: 'Plaque', weightG: 1.15, price: 0.09 },
  { name: 'Plaque 2x6', category: 'Plaque', weightG: 1.72, price: 0.13 },
  { name: 'Plaque 2x8', category: 'Plaque', weightG: 2.3, price: 0.17 },
  { name: 'Plaque 4x4', category: 'Plaque', weightG: 2.3, price: 0.17 },
  // Tuiles
  { name: 'Tuile lisse 1x2', category: 'Tuile', weightG: 0.52, price: 0.07 },
  { name: 'Tuile lisse 1x4', category: 'Tuile', weightG: 1.04, price: 0.12 },
  { name: 'Tuile lisse 2x2', category: 'Tuile', weightG: 1.02, price: 0.13 },
  { name: 'Tuile lisse 2x4', category: 'Tuile', weightG: 2.05, price: 0.24 },
  { name: 'Tuile arrondie 1x2', category: 'Tuile', weightG: 0.5, price: 0.08 },
  // Slopes
  { name: 'Slope 45° 2x1', category: 'Slope', weightG: 0.62, price: 0.06 },
  { name: 'Slope 45° 2x2', category: 'Slope', weightG: 1.32, price: 0.13 },
  { name: 'Slope 45° 2x4', category: 'Slope', weightG: 2.55, price: 0.24 },
  { name: 'Slope 33° 2x4', category: 'Slope', weightG: 2.6, price: 0.22 },
  // Ronds
  { name: 'Brique ronde 1x1', category: 'Rond', weightG: 0.26, price: 0.03 },
  { name: 'Brique ronde 2x2', category: 'Rond', weightG: 1.0, price: 0.09 },
  { name: 'Plaque ronde 1x1', category: 'Rond', weightG: 0.13, price: 0.02 },
  // Technic
  { name: 'Poutre Technic 1x3', category: 'Technic', weightG: 0.5, price: 0.06 },
  { name: 'Poutre Technic 1x5', category: 'Technic', weightG: 0.75, price: 0.08 },
  { name: 'Poutre Technic 1x7', category: 'Technic', weightG: 1.05, price: 0.1 },
  { name: 'Axe Technic 3L', category: 'Technic', weightG: 0.6, price: 0.06 },
  { name: 'Axe Technic 4L', category: 'Technic', weightG: 0.78, price: 0.07 },
  { name: 'Axe Technic 6L', category: 'Technic', weightG: 1.5, price: 0.1 },
  { name: 'Axe Technic 8L', category: 'Technic', weightG: 2.0, price: 0.13 },
  { name: 'Connecteur Technic 3L', category: 'Technic', weightG: 0.5, price: 0.05 },
  { name: 'Pignon 12 dents', category: 'Technic', weightG: 0.45, price: 0.06 },
  { name: 'Pignon 24 dents', category: 'Technic', weightG: 0.9, price: 0.09 },
  // Minifigs
  { name: 'Minifig complète', category: 'Minifig', weightG: 4.0, price: 2.5 },
  { name: 'Tête minifig', category: 'Minifig', weightG: 0.72, price: 0.4 },
  { name: 'Torse minifig', category: 'Minifig', weightG: 2.1, price: 1.2 },
  { name: 'Jambes minifig', category: 'Minifig', weightG: 1.0, price: 0.55 },
  { name: 'Cheveux minifig', category: 'Minifig', weightG: 0.35, price: 0.3 },
  // Accessoires
  { name: 'Épée', category: 'Accessoire', weightG: 0.7, price: 0.12 },
  { name: 'Casque pompier', category: 'Accessoire', weightG: 0.6, price: 0.15 },
  { name: 'Outillage', category: 'Accessoire', weightG: 0.5, price: 0.1 },
  // Fenêtres / portes
  { name: 'Fenêtre 1x2x2', category: 'Fenêtre / Porte', weightG: 0.95, price: 0.12 },
  { name: 'Porte 1x4x6', category: 'Fenêtre / Porte', weightG: 3.2, price: 0.3 },
  // Végétation
  { name: 'Feuille palmier', category: 'Végétation', weightG: 0.55, price: 0.08 },
  { name: 'Arbre sapin', category: 'Végétation', weightG: 3.5, price: 0.35 },
  { name: 'Brique feuille', category: 'Végétation', weightG: 0.4, price: 0.06 },
  // Roues
  { name: 'Pneu 43,2 x 22', category: 'Roue / Essieu', weightG: 8.6, price: 0.45 },
  { name: 'Jante 30,4', category: 'Roue / Essieu', weightG: 2.2, price: 0.2 },
  { name: 'Pneu 30,4 x 14', category: 'Roue / Essieu', weightG: 3.4, price: 0.22 },
  // Baseplates
  { name: 'Baseplate 16x16', category: 'Baseplate', weightG: 27, price: 1.8 },
  { name: 'Baseplate 32x32', category: 'Baseplate', weightG: 95, price: 4.5 },
  { name: 'Baseplate 48x48', category: 'Baseplate', weightG: 280, price: 15 },
]

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
