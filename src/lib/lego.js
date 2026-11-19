// Référentiel LEGO : couleurs officielles, catégories, types d'emplacements.

export const COLORS = [
  { name: 'Rouge', hex: '#C4281B', group: 'Solide' },
  { name: 'Bleu', hex: '#0055BF', group: 'Solide' },
  { name: 'Jaune', hex: '#F5CD2F', group: 'Solide' },
  { name: 'Vert', hex: '#237841', group: 'Solide' },
  { name: 'Vert clair', hex: '#4B9F4A', group: 'Solide' },
  { name: 'Noir', hex: '#1B1B1B', group: 'Solide' },
  { name: 'Blanc', hex: '#F4F4F4', group: 'Solide' },
  { name: 'Gris clair', hex: '#A0A5A9', group: 'Solide' },
  { name: 'Gris foncé', hex: '#6C6E68', group: 'Solide' },
  { name: 'Orange', hex: '#FE8A18', group: 'Solide' },
  { name: 'Marron', hex: '#7A3B21', group: 'Solide' },
  { name: 'Tan', hex: '#E4CD9E', group: 'Solide' },
  { name: 'Rose', hex: '#E4ADC8', group: 'Solide' },
  { name: 'Violet', hex: '#81007B', group: 'Solide' },
  { name: 'Cyan', hex: '#4DA6DB', group: 'Solide' },
  { name: 'Lime', hex: '#BBE90B', group: 'Solide' },
  { name: 'Transparent', hex: '#E8F1F8', group: 'Transparent' },
  { name: 'Trans-Jaune', hex: '#F7E07A', group: 'Transparent' },
  { name: 'Trans-Rouge', hex: '#D9352B', group: 'Transparent' },
  { name: 'Chrome argent', hex: '#C8CDD2', group: 'Spécial' },
]

export const CATEGORIES = [
  'Brique',
  'Plaque',
  'Tuile',
  'Slope',
  'Rond',
  'Technic',
  'Minifig',
  'Accessoire',
  'Fenêtre / Porte',
  'Végétation',
  'Roue / Essieu',
  'Baseplate',
  'Autre',
]

export const CATEGORY_META = {
  Brique: { icon: '🧱', color: '#C4281B' },
  Plaque: { icon: '▭', color: '#0055BF' },
  Tuile: { icon: '◧', color: '#237841' },
  Slope: { icon: '◺', color: '#FE8A18' },
  Rond: { icon: '⬤', color: '#4DA6DB' },
  Technic: { icon: '⚙️', color: '#6C6E68' },
  Minifig: { icon: '🧍', color: '#F5CD2F' },
  Accessoire: { icon: '🗡️', color: '#81007B' },
  'Fenêtre / Porte': { icon: '🪟', color: '#A0A5A9' },
  Végétation: { icon: '🌿', color: '#4B9F4A' },
  'Roue / Essieu': { icon: '🛞', color: '#7A3B21' },
  Baseplate: { icon: '⬛', color: '#6C6E68' },
  Autre: { icon: '❓', color: '#A0A5A9' },
}

export const LOCATION_TYPES = ['Boîte', 'Tiroir', 'Bac', 'Étagère', 'Sachet']

export const LOCATION_ICONS = {
  Boîte: '📦',
  Tiroir: '🗄️',
  Bac: '🧺',
  Étagère: '🗃️',
  Sachet: '🛍️',
}

export const SET_STATUSES = ['Complet', 'Incomplet', 'Démonté', 'En construction', 'À vendre']

export const STATUS_META = {
  Complet: { tone: 'green' },
  Incomplet: { tone: 'red' },
  Démonté: { tone: 'grey' },
  'En construction': { tone: 'blue' },
  'À vendre': { tone: 'amber' },
}

export const THEMES = [
  'Icons',
  'Star Wars',
  'Technic',
  'City',
  'Creator',
  'Harry Potter',
  'Architecture',
  'Ideas',
  'Friends',
  'Ninjago',
  'Autre',
]

export function colorHex(name) {
  return COLORS.find((c) => c.name === name)?.hex ?? '#C9CDD4'
}

export function isLightColor(hex) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 165
}
