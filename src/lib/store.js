import { useCallback, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'lego-manager:v1'

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

/* ------------------------------------------------------------------ */
/*  Données de démonstration                                           */
/* ------------------------------------------------------------------ */

function seed() {
  const locChaos = uid()
  const locTech = uid()
  const locMinifig = uid()
  const locations = [
    { id: locChaos, name: 'Bac à briques vrac', type: 'Bac', place: 'Garage', note: 'Le gros bac bleu sous l’établi' },
    { id: locTech, name: 'Tiroir Technic 1', type: 'Tiroir', place: 'Étagère bureau', note: 'Axes et poutres' },
    { id: locMinifig, name: 'Boîte minifigs', type: 'Boîte', place: 'Armoire chambre', note: 'Têtes, torsos, jambes' },
  ]

  const n = (name, category, color, qty, locationId, extra = {}) => ({
    id: uid(),
    name,
    category,
    color,
    quantity: qty,
    locationId,
    condition: 'Neuf',
    note: '',
    createdAt: Date.now(),
    ...extra,
  })

  const parts = [
    n('Brique 2x4', 'Brique', 'Rouge', 320, locChaos),
    n('Brique 2x4', 'Brique', 'Bleu', 210, locChaos),
    n('Brique 2x2', 'Brique', 'Jaune', 185, locChaos),
    n('Brique 2x4', 'Brique', 'Blanc', 96, locChaos),
    n('Brique 1x2', 'Brique', 'Noir', 142, locChaos),
    n('Brique 2x6', 'Brique', 'Gris clair', 64, locChaos),
    n('Plaque 2x4', 'Plaque', 'Gris foncé', 240, locChaos),
    n('Plaque 1x4', 'Plaque', 'Tan', 130, locChaos),
    n('Plaque 2x8', 'Plaque', 'Vert', 58, locChaos),
    n('Tuile lisse 1x2', 'Tuile', 'Blanc', 175, locChaos),
    n('Tuile lisse 2x2', 'Tuile', 'Noir', 88, locChaos),
    n('Slope 45° 2x2', 'Slope', 'Rouge', 74, locChaos),
    n('Slope 33° 2x4', 'Slope', 'Bleu', 41, locChaos),
    n('Brique ronde 1x1', 'Rond', 'Transparent', 310, locChaos),
    n('Plaque ronde 1x1', 'Rond', 'Lime', 122, locChaos),
    n('Brique ronde 1x1', 'Rond', 'Trans-Jaune', 78, locChaos, { condition: 'Occasion' }),
    n('Poutre Technic 1x5', 'Technic', 'Gris clair', 96, locTech),
    n('Axe Technic 4L', 'Technic', 'Noir', 180, locTech),
    n('Axe Technic 6L', 'Technic', 'Noir', 74, locTech),
    n('Connecteur Technic 3L', 'Technic', 'Bleu', 68, locTech),
    n('Pignon 12 dents', 'Technic', 'Gris foncé', 34, locTech),
    n('Pneu 43,2 x 22', 'Roue / Essieu', 'Noir', 16, locTech),
    n('Jante 30,4', 'Roue / Essieu', 'Chrome argent', 16, locTech),
    n('Minifig astronaute', 'Minifig', 'Blanc', 3, locMinifig),
    n('Minifig chevalier', 'Minifig', 'Gris foncé', 2, locMinifig),
    n('Tête minifig', 'Minifig', 'Jaune', 27, locMinifig),
    n('Torse minifig ville', 'Minifig', 'Bleu', 9, locMinifig),
    n('Jambes minifig', 'Minifig', 'Noir', 14, locMinifig),
    n('Feuille palmier', 'Végétation', 'Vert clair', 24, locChaos),
    n('Arbre sapin', 'Végétation', 'Vert', 8, locChaos),
    n('Épée', 'Accessoire', 'Gris clair', 11, locMinifig),
    n('Casque pompier', 'Accessoire', 'Rouge', 4, locMinifig, { condition: 'Occasion' }),
    n('Fenêtre 1x2x2', 'Fenêtre / Porte', 'Transparent', 30, locChaos),
    n('Porte 1x4x6', 'Fenêtre / Porte', 'Marron', 6, locChaos),
    n('Baseplate 32x32', 'Baseplate', 'Vert', 4, locChaos),
    n('Baseplate 16x16', 'Baseplate', 'Gris clair', 6, locChaos),
  ]

  // Marque quelques pièces en stock bas pour la démo
  parts[8].quantity = 3
  parts[19].quantity = 5
  parts[24].quantity = 0

  const sets = [
    {
      id: uid(),
      number: '10294',
      name: 'Titanic',
      theme: 'Icons',
      year: 2021,
      pieces: 9090,
      builtPieces: 9090,
      status: 'Complet',
      locationId: '',
      note: 'Vitrine salon',
      createdAt: Date.now(),
    },
    {
      id: uid(),
      number: '42115',
      name: 'Lamborghini Sián FKP 37',
      theme: 'Technic',
      year: 2020,
      pieces: 3696,
      builtPieces: 2400,
      status: 'En construction',
      locationId: locTech,
      note: 'Manque 2 pignons 12 dents',
      createdAt: Date.now(),
    },
    {
      id: uid(),
      number: '75192',
      name: 'Faucon Millennium',
      theme: 'Star Wars',
      year: 2017,
      pieces: 7541,
      builtPieces: 7541,
      status: 'Complet',
      locationId: '',
      note: '',
      createdAt: Date.now(),
    },
    {
      id: uid(),
      number: '21318',
      name: 'Maison de l’arbre',
      theme: 'Ideas',
      year: 2019,
      pieces: 3036,
      builtPieces: 0,
      status: 'Démonté',
      locationId: locChaos,
      note: 'À remonter avec les enfants',
      createdAt: Date.now(),
    },
    {
      id: uid(),
      number: '71043',
      name: 'Poudlard',
      theme: 'Harry Potter',
      year: 2018,
      pieces: 6020,
      builtPieces: 5400,
      status: 'Incomplet',
      locationId: '',
      note: 'Cherche 6 pièces',
      createdAt: Date.now(),
    },
  ]

  const transactions = [
    { id: uid(), type: 'in', partId: parts[0].id, quantity: 100, reason: 'Achat lot Leboncoin', date: Date.now() - 86400000 * 12 },
    { id: uid(), type: 'out', partId: parts[16].id, quantity: 20, reason: 'Set Lamborghini', date: Date.now() - 86400000 * 5 },
    { id: uid(), type: 'out', partId: parts[8].id, quantity: 12, reason: 'MOC maison', date: Date.now() - 86400000 * 3 },
    { id: uid(), type: 'in', partId: parts[3].id, quantity: 50, reason: 'Pick-a-Brick', date: Date.now() - 86400000 * 2 },
    { id: uid(), type: 'out', partId: parts[0].id, quantity: 30, reason: 'MOC château', date: Date.now() - 3600000 * 7 },
  ]

  return {
    parts,
    sets,
    locations,
    transactions,
    settings: { lowStockThreshold: 10, currency: 'EUR' },
  }
}

/* ------------------------------------------------------------------ */
/*  Hook de stockage                                                   */
/* ------------------------------------------------------------------ */

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seed()
    const data = JSON.parse(raw)
    if (!data.parts || !data.sets || !data.locations) return seed()
    data.transactions ??= []
    data.settings ??= { lowStockThreshold: 10, currency: 'EUR' }
    return data
  } catch {
    return seed()
  }
}

export function useStore() {
  const [state, setState] = useState(load)

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      } catch (e) {
        console.warn('Sauvegarde impossible', e)
      }
    }, 120)
    return () => clearTimeout(t)
  }, [state])

  const patch = useCallback((updater) => {
    setState((s) => (typeof updater === 'function' ? updater(s) : { ...s, ...updater }))
  }, [])

  /* --------------------------- Pièces --------------------------- */
  const addPart = useCallback((part) => {
    const item = { ...part, id: uid(), createdAt: Date.now() }
    setState((s) => ({ ...s, parts: [item, ...s.parts] }))
    return item
  }, [])

  const updatePart = useCallback((id, changes) => {
    setState((s) => ({ ...s, parts: s.parts.map((p) => (p.id === id ? { ...p, ...changes } : p)) }))
  }, [])

  const removePart = useCallback((id) => {
    setState((s) => ({
      ...s,
      parts: s.parts.filter((p) => p.id !== id),
      transactions: s.transactions.filter((t) => t.partId !== id),
    }))
  }, [])

  /* ------------------------- Mouvements ------------------------- */
  const moveStock = useCallback((partId, delta, reason = 'Ajustement manuel') => {
    const qty = Math.abs(delta)
    if (!qty) return
    setState((s) => {
      const part = s.parts.find((p) => p.id === partId)
      if (!part) return s
      const transac = {
        id: uid(),
        type: delta > 0 ? 'in' : 'out',
        partId,
        quantity: qty,
        reason,
        date: Date.now(),
      }
      return {
        ...s,
        parts: s.parts.map((p) =>
          p.id === partId ? { ...p, quantity: Math.max(0, p.quantity + delta) } : p,
        ),
        transactions: [transac, ...s.transactions].slice(0, 500),
      }
    })
  }, [])

  /* --------------------------- Sets ---------------------------- */
  const addSet = useCallback((set) => {
    const item = { ...set, id: uid(), createdAt: Date.now() }
    setState((s) => ({ ...s, sets: [item, ...s.sets] }))
    return item
  }, [])

  const updateSet = useCallback((id, changes) => {
    setState((s) => ({ ...s, sets: s.sets.map((x) => (x.id === id ? { ...x, ...changes } : x)) }))
  }, [])

  const removeSet = useCallback((id) => {
    setState((s) => ({ ...s, sets: s.sets.filter((x) => x.id !== id) }))
  }, [])

  /* ------------------------ Emplacements ------------------------ */
  const addLocation = useCallback((loc) => {
    const item = { ...loc, id: uid() }
    setState((s) => ({ ...s, locations: [...s.locations, item] }))
    return item
  }, [])

  const updateLocation = useCallback((id, changes) => {
    setState((s) => ({
      ...s,
      locations: s.locations.map((l) => (l.id === id ? { ...l, ...changes } : l)),
    }))
  }, [])

  const removeLocation = useCallback((id) => {
    setState((s) => ({
      ...s,
      locations: s.locations.filter((l) => l.id !== id),
      parts: s.parts.map((p) => (p.locationId === id ? { ...p, locationId: '' } : p)),
      sets: s.sets.map((x) => (x.locationId === id ? { ...x, locationId: '' } : x)),
    }))
  }, [])

  /* ------------------------ Réglages -------------------------- */
  const updateSettings = useCallback((changes) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...changes } }))
  }, [])

  const resetDemo = useCallback(() => setState(seed()), [])
  const clearAll = useCallback(
    () =>
      setState({
        parts: [],
        sets: [],
        locations: [],
        transactions: [],
        settings: { lowStockThreshold: 10, currency: 'EUR' },
      }),
    [],
  )

  const importData = useCallback((data) => {
    if (!data || !Array.isArray(data.parts)) throw new Error('Fichier invalide : clé "parts" manquante.')
    setState({
      parts: data.parts,
      sets: data.sets ?? [],
      locations: data.locations ?? [],
      transactions: data.transactions ?? [],
      settings: { lowStockThreshold: 10, currency: 'EUR', ...(data.settings ?? {}) },
    })
  }, [])

  const stats = useMemo(() => {
    const totalParts = state.parts.reduce((a, p) => a + Number(p.quantity || 0), 0)
    const totalRefs = state.parts.length
    const threshold = Number(state.settings.lowStockThreshold ?? 10)
    const lowStock = state.parts.filter((p) => Number(p.quantity) <= threshold)
    const outOfStock = state.parts.filter((p) => Number(p.quantity) === 0)
    const totalSetPieces = state.sets.reduce((a, s) => a + Number(s.pieces || 0), 0)
    const builtPieces = state.sets.reduce((a, s) => a + Number(s.builtPieces || 0), 0)

    const byCategory = {}
    for (const p of state.parts) {
      byCategory[p.category] = (byCategory[p.category] || 0) + Number(p.quantity || 0)
    }
    const byColor = {}
    for (const p of state.parts) {
      byColor[p.color] = (byColor[p.color] || 0) + Number(p.quantity || 0)
    }
    const byLocation = {}
    for (const p of state.parts) {
      const key = p.locationId || '__none__'
      byLocation[key] = (byLocation[key] || 0) + Number(p.quantity || 0)
    }

    return {
      totalParts,
      totalRefs,
      lowStock,
      outOfStock,
      threshold,
      totalSets: state.sets.length,
      totalSetPieces,
      builtPieces,
      byCategory,
      byColor,
      byLocation,
      locationsUsed: Object.keys(byLocation).filter((k) => k !== '__none__').length,
    }
  }, [state])

  return {
    ...state,
    stats,
    addPart,
    updatePart,
    removePart,
    moveStock,
    addSet,
    updateSet,
    removeSet,
    addLocation,
    updateLocation,
    removeLocation,
    updateSettings,
    resetDemo,
    clearAll,
    importData,
  }
}
