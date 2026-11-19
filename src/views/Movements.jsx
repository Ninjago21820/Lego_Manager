import { useMemo, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Search, Download, History } from 'lucide-react'
import { colorHex } from '../lib/lego'
import { fmt, fullDate, toCSV, download } from '../lib/format'
import { Empty } from '../components/ui'

export default function Movements({ store, onConsume }) {
  const { transactions, parts } = store
  const [q, setQ] = useState('')
  const [type, setType] = useState('all')

  const partById = useMemo(() => Object.fromEntries(parts.map((p) => [p.id, p])), [parts])

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return transactions.filter((t) => {
      if (type !== 'all' && t.type !== type) return false
      if (!needle) return true
      const p = partById[t.partId]
      return `${p?.name || ''} ${p?.color || ''} ${t.reason}`.toLowerCase().includes(needle)
    })
  }, [transactions, type, q, partById])

  const grouped = useMemo(() => {
    const g = {}
    for (const t of rows) {
      const day = new Date(t.date).toDateString()
      g[day] ??= []
      g[day].push(t)
    }
    return Object.entries(g).sort((a, b) => new Date(b[0]) - new Date(a[0]))
  }, [rows])

  const totals = useMemo(() => {
    const inQty = rows.filter((t) => t.type === 'in').reduce((a, t) => a + t.quantity, 0)
    const outQty = rows.filter((t) => t.type === 'out').reduce((a, t) => a + t.quantity, 0)
    return { inQty, outQty }
  }, [rows])

  function exportCsv() {
    const data = rows.map((t) => {
      const p = partById[t.partId]
      return [
        new Date(t.date).toLocaleString('fr-FR'),
        t.type === 'in' ? 'Entrée' : 'Sortie',
        p?.name || 'Pièce supprimée',
        p?.color || '',
        t.quantity,
        t.reason,
      ]
    })
    download(
      `mouvements-lego-${new Date().toISOString().slice(0, 10)}.csv`,
      toCSV(data, ['Date', 'Type', 'Pièce', 'Couleur', 'Quantité', 'Motif']),
      'text/csv;charset=utf-8',
    )
    onConsume(`${rows.length} mouvements exportés`)
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="stat-grid">
        <div className="stat">
          <div className="stat-top">
            <span className="stat-label">Entrées</span>
            <span className="stat-icon" style={{ color: 'var(--green)' }}><ArrowDownLeft size={16} /></span>
          </div>
          <div className="stat-value">{fmt(totals.inQty)}</div>
          <div className="stat-foot">{rows.filter((t) => t.type === 'in').length} mouvements</div>
        </div>
        <div className="stat">
          <div className="stat-top">
            <span className="stat-label">Sorties</span>
            <span className="stat-icon" style={{ color: 'var(--red)' }}><ArrowUpRight size={16} /></span>
          </div>
          <div className="stat-value">{fmt(totals.outQty)}</div>
          <div className="stat-foot">{rows.filter((t) => t.type === 'out').length} mouvements</div>
        </div>
        <div className="stat accent">
          <div className="stat-top">
            <span className="stat-label">Solde net</span>
            <span className="stat-icon"><History size={15} /></span>
          </div>
          <div className="stat-value">{totals.inQty - totals.outQty > 0 ? '+' : ''}{fmt(totals.inQty - totals.outQty)}</div>
          <div className="stat-foot">pièces sur la période affichée</div>
        </div>
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="search">
            <Search size={15} />
            <input className="input" placeholder="Rechercher par pièce ou motif…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="segmented">
            <button className={type === 'all' ? 'on' : ''} onClick={() => setType('all')}>Tout</button>
            <button className={type === 'in' ? 'on' : ''} onClick={() => setType('in')}>Entrées</button>
            <button className={type === 'out' ? 'on' : ''} onClick={() => setType('out')}>Sorties</button>
          </div>
          <button className="btn" onClick={exportCsv} disabled={!rows.length}>
            <Download size={14} /> CSV
          </button>
        </div>

        {rows.length === 0 ? (
          <Empty
            emoji="🕘"
            title="Aucun mouvement"
            message="Les entrées et sorties de stock que vous enregistrez apparaîtront ici, avec leur motif et leur date."
          />
        ) : (
          <div style={{ padding: '4px 0' }}>
            {grouped.map(([day, items]) => (
              <div key={day}>
                <div
                  style={{
                    padding: '10px 16px 6px',
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--muted-2)',
                    background: 'var(--surface-2)',
                    borderBottom: '1px solid var(--border)',
                    position: 'sticky',
                    top: 0,
                  }}
                >
                  {new Date(day).toDateString() === new Date().toDateString() ? "Aujourd'hui" : fullDate(items[0].date)}
                </div>
                <div className="list">
                  {items.map((t) => {
                    const p = partById[t.partId]
                    const isIn = t.type === 'in'
                    return (
                      <div className="list-row" key={t.id}>
                        <span
                          className="loc-icon"
                          style={{
                            color: isIn ? 'var(--green)' : 'var(--red)',
                            background: isIn ? '#e8f6ee' : '#fdecec',
                            borderColor: 'transparent',
                          }}
                        >
                          {isIn ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
                        </span>
                        <span className="swatch" style={{ background: colorHex(p?.color) }} />
                        <div className="list-main">
                          <div className="list-title">{p?.name || 'Pièce supprimée'}</div>
                          <div className="list-sub">
                            {p?.color || '—'} · {t.reason}
                          </div>
                        </div>
                        <span className={`badge ${isIn ? 'green' : 'red'}`} style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {isIn ? '+' : '−'}{fmt(t.quantity)}
                        </span>
                        <span className="cell-muted" style={{ fontSize: 11.5, minWidth: 52, textAlign: 'right' }}>
                          {new Date(t.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
