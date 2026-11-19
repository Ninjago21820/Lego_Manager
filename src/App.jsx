import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  LayoutDashboard,
  Blocks,
  Package,
  Boxes,
  History,
  PieChart,
  Settings as SettingsIcon,
  Plus,
  Menu,
  X,
  Moon,
  Sun,
} from 'lucide-react'
import { useStore } from './lib/store'
import { Toasts } from './components/ui'
import Dashboard from './views/Dashboard'
import Parts from './views/Parts'
import Sets from './views/Sets'
import Locations from './views/Locations'
import Movements from './views/Movements'
import Reports from './views/Reports'
import Settings from './views/Settings'
import { fmt } from './lib/format'

const NAV = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, group: 'Vue d’ensemble' },
  { id: 'parts', label: 'Pièces', icon: Blocks, group: 'Inventaire' },
  { id: 'sets', label: 'Sets', icon: Package, group: 'Inventaire' },
  { id: 'locations', label: 'Emplacements', icon: Boxes, group: 'Inventaire' },
  { id: 'movements', label: 'Mouvements', icon: History, group: 'Suivi' },
  { id: 'reports', label: 'Rapports', icon: PieChart, group: 'Suivi' },
  { id: 'settings', label: 'Réglages', icon: SettingsIcon, group: 'Système' },
]

const TITLES = {
  dashboard: ['Tableau de bord', 'Vue d’ensemble de votre collection LEGO'],
  parts: ['Pièces', 'Inventaire détaillé de vos pièces'],
  sets: ['Sets', 'Votre collection de sets et leur progression'],
  locations: ['Emplacements', 'Où ranger et retrouver vos pièces'],
  movements: ['Mouvements', 'Historique des entrées et sorties de stock'],
  reports: ['Rapports', 'Analyse de votre inventaire'],
  settings: ['Réglages', 'Préférences, sauvegarde et données'],
}

export default function App() {
  const store = useStore()
  const [page, setPage] = useState('dashboard')
  const [partsFilter, setPartsFilter] = useState(null)
  const [navOpen, setNavOpen] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('lego-manager:theme') || 'light')
  const [toasts, setToasts] = useState([])
  const [addRequest, setAddRequest] = useState(null)
  const toastId = useRef(0)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('lego-manager:theme', theme)
  }, [theme])

  const notify = useCallback((text, emoji) => {
    const id = ++toastId.current
    setToasts((t) => [...t, { id, text, emoji }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800)
  }, [])

  const navigate = useCallback((target, filter = null) => {
    setPage(target)
    setNavOpen(false)
    if (target === 'parts') setPartsFilter(filter)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const quickAdd = useCallback((kind) => {
    const map = { part: 'parts', set: 'sets', location: 'locations' }
    const target = map[kind]
    setPage(target)
    setAddRequest({ target, id: ++toastId.current })
    setNavOpen(false)
  }, [])

  const clearAddRequest = useCallback(() => setAddRequest(null), [])

  const counts = useMemo(
    () => ({
      dashboard: null,
      parts: store.parts.length,
      sets: store.sets.length,
      locations: store.locations.length,
      movements: store.transactions.length,
      reports: null,
      settings: null,
    }),
    [store.parts.length, store.sets.length, store.locations.length, store.transactions.length],
  )

  const groups = useMemo(() => {
    const g = []
    for (const item of NAV) {
      const last = g[g.length - 1]
      if (!last || last.name !== item.group) g.push({ name: item.group, items: [item] })
      else last.items.push(item)
    }
    return g
  }, [])

  const [title, sub] = TITLES[page] || TITLES.dashboard
  const lowCount = store.stats.lowStock.length

  return (
    <div className="app">
      <aside className={`sidebar ${navOpen ? 'open' : ''}`}>
        <a className="brand" href="#" onClick={(e) => { e.preventDefault(); navigate('dashboard') }}>
          <span className="brand-mark" aria-hidden>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="9" width="18" height="11" rx="2" fill="#14161a" />
              <rect x="6" y="3" width="5" height="6" rx="1" fill="#14161a" />
              <rect x="13" y="3" width="5" height="6" rx="1" fill="#14161a" />
            </svg>
          </span>
          <span>
            <span className="brand-name">Lego Manager</span>
            <br />
            <span className="brand-sub">Suivi de pièces</span>
          </span>
          <button
            className="btn btn-ghost btn-icon mobile-toggle"
            style={{ marginLeft: 'auto' }}
            onClick={(e) => { e.preventDefault(); setNavOpen(false) }}
            aria-label="Fermer le menu"
          >
            <X size={16} />
          </button>
        </a>

        {groups.map((g) => (
          <div key={g.name}>
            <div className="nav-label">{g.name}</div>
            {g.items.map((item) => {
              const Icon = item.icon
              const active = page === item.id
              return (
                <button
                  key={item.id}
                  className={`nav-item ${active ? 'active' : ''}`}
                  onClick={() => navigate(item.id)}
                >
                  <Icon size={16} strokeWidth={active ? 2.3 : 2} />
                  {item.label}
                  {item.id === 'parts' && lowCount > 0 && (
                    <span className="count" style={{ color: 'var(--amber)' }} title="Références en stock bas">
                      {lowCount}
                    </span>
                  )}
                  {item.id !== 'parts' && counts[item.id] != null && (
                    <span className="count">{fmt(counts[item.id])}</span>
                  )}
                </button>
              )
            })}
          </div>
        ))}

        <div className="sidebar-footer">
          <button className="btn btn-accent" onClick={() => quickAdd('part')}>
            <Plus size={15} /> Ajouter une pièce
          </button>
          <div className="storage-hint">
            💾 Données enregistrées dans ce navigateur. Pensez à exporter une sauvegarde depuis les réglages.
          </div>
        </div>
      </aside>

      {navOpen && <div className="scrim" onClick={() => setNavOpen(false)} />}

      <div className="main">
        <header className="topbar">
          <button className="btn btn-ghost btn-icon mobile-toggle" onClick={() => setNavOpen(true)} aria-label="Ouvrir le menu">
            <Menu size={18} />
          </button>
          <div>
            <h1>{title}</h1>
            <div className="sub">{sub}</div>
          </div>
          <div className="topbar-actions">
            <span className="chip" style={{ fontSize: 11.5 }}>
              <Blocks size={12} /> {fmt(store.stats.totalParts)} pièces
            </span>
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title={theme === 'dark' ? 'Passer en clair' : 'Passer en sombre'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button className="btn btn-primary" onClick={() => quickAdd('part')}>
              <Plus size={15} /> <span className="hide-sm">Nouvelle pièce</span>
            </button>
          </div>
        </header>

        <main className="content">
          {page === 'dashboard' && <Dashboard store={store} onNavigate={navigate} onQuickAdd={quickAdd} />}
          {page === 'parts' && (
            <Parts
              store={store}
              addRequest={addRequest?.target === 'parts' ? addRequest : null}
              onAddHandled={clearAddRequest}
              initialFilter={partsFilter}
              onConsume={notify}
            />
          )}
          {page === 'sets' && (
            <Sets
              store={store}
              addRequest={addRequest?.target === 'sets' ? addRequest : null}
              onAddHandled={clearAddRequest}
              onConsume={notify}
            />
          )}
          {page === 'locations' && (
            <Locations store={store} openNewSignal={newSignal.locations} onConsume={notify} onNavigate={navigate} />
          )}
          {page === 'movements' && <Movements store={store} onConsume={notify} />}
          {page === 'reports' && <Reports store={store} />}
          {page === 'settings' && <Settings store={store} theme={theme} setTheme={setTheme} onConsume={notify} />}
        </main>
      </div>

      <Toasts items={toasts} />
    </div>
  )
}
