import { useMemo } from 'react'
import { Printer, PieChart, Boxes, TrendingDown, Package } from 'lucide-react'
import { CATEGORY_META, colorHex } from '../lib/lego'
import { fmt } from '../lib/format'

export default function Reports({ store }) {
  const { parts, sets, locations, stats } = store

  const catRows = useMemo(() => {
    const entries = Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1])
    const total = entries.reduce((a, e) => a + e[1], 0) || 1
    return entries.map(([name, qty]) => ({ name, qty, pct: (qty / total) * 100, meta: CATEGORY_META[name] || CATEGORY_META.Autre }))
  }, [stats.byCategory])

  const colorRows = useMemo(() => {
    const entries = Object.entries(stats.byColor).sort((a, b) => b[1] - a[1])
    const total = entries.reduce((a, e) => a + e[1], 0) || 1
    return entries.map(([name, qty]) => ({ name, qty, pct: (qty / total) * 100, hex: colorHex(name) }))
  }, [stats.byColor])

  const locRows = useMemo(() => {
    return locations
      .map((l) => {
        const items = parts.filter((p) => p.locationId === l.id)
        return {
          ...l,
          refs: items.length,
          qty: items.reduce((a, p) => a + Number(p.quantity || 0), 0),
        }
      })
      .sort((a, b) => b.qty - a.qty)
  }, [locations, parts])

  const maxLoc = Math.max(1, ...locRows.map((l) => l.qty))
  const topRefs = [...parts].sort((a, b) => b.quantity - a.quantity).slice(0, 10)

  if (!parts.length) {
    return (
      <div className="card">
        <div className="empty">
          <div className="emoji">📊</div>
          <h3>Rien à analyser pour l’instant</h3>
          <p>Ajoutez des pièces à votre inventaire pour générer des statistiques détaillées.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="card">
        <div className="card-head">
          <PieChart size={15} />
          <h2>Synthèse de l’inventaire</h2>
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => window.print()}>
            <Printer size={13} /> Imprimer
          </button>
        </div>
        <div className="card-body">
          <dl className="kv" style={{ gridTemplateColumns: 'auto 1fr auto 1fr' }}>
            <dt>Pièces en stock</dt>
            <dd>{fmt(stats.totalParts)}</dd>
            <dt>Références</dt>
            <dd>{fmt(stats.totalRefs)}</dd>
            <dt>Couleurs utilisées</dt>
            <dd>{Object.keys(stats.byColor).length}</dd>
            <dt>Catégories</dt>
            <dd>{Object.keys(stats.byCategory).length}</dd>
            <dt>Emplacements</dt>
            <dd>{locations.length}</dd>
            <dt>Sets référencés</dt>
            <dd>{sets.length}</dd>
            <dt>Sous le seuil</dt>
            <dd style={{ color: stats.lowStock.length ? 'var(--amber)' : undefined }}>{stats.lowStock.length}</dd>
            <dt>Épuisées</dt>
            <dd style={{ color: stats.outOfStock.length ? 'var(--red)' : undefined }}>{stats.outOfStock.length}</dd>
          </dl>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <Boxes size={15} />
            <h2>Répartition par catégorie</h2>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Catégorie</th>
                  <th style={{ textAlign: 'right' }}>Pièces</th>
                  <th style={{ textAlign: 'right' }}>Part</th>
                  <th style={{ width: '35%' }} />
                </tr>
              </thead>
              <tbody>
                {catRows.map((c) => (
                  <tr key={c.name}>
                    <td>
                      <span style={{ display: 'inline-flex', gap: 7, alignItems: 'center' }}>
                        <span aria-hidden>{c.meta.icon}</span> {c.name}
                      </span>
                    </td>
                    <td className="num" style={{ textAlign: 'right', fontWeight: 620 }}>{fmt(c.qty)}</td>
                    <td className="num cell-muted" style={{ textAlign: 'right' }}>{c.pct.toFixed(1)}%</td>
                    <td>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${Math.max(2, c.pct)}%`, background: c.meta.color }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <span aria-hidden>🎨</span>
            <h2>Répartition par couleur</h2>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Couleur</th>
                  <th style={{ textAlign: 'right' }}>Pièces</th>
                  <th style={{ textAlign: 'right' }}>Part</th>
                  <th style={{ width: '35%' }} />
                </tr>
              </thead>
              <tbody>
                {colorRows.map((c) => (
                  <tr key={c.name}>
                    <td>
                      <span style={{ display: 'inline-flex', gap: 7, alignItems: 'center' }}>
                        <span className="swatch" style={{ width: 14, height: 14, borderRadius: 4, background: c.hex }} />
                        {c.name}
                      </span>
                    </td>
                    <td className="num" style={{ textAlign: 'right', fontWeight: 620 }}>{fmt(c.qty)}</td>
                    <td className="num cell-muted" style={{ textAlign: 'right' }}>{c.pct.toFixed(1)}%</td>
                    <td>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${Math.max(2, c.pct)}%`, background: c.hex }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <TrendingDown size={15} />
            <h2>Top 10 des références</h2>
          </div>
          <div className="list">
            {topRefs.map((p, i) => (
              <div className="list-row" key={p.id}>
                <span className="cell-muted num" style={{ width: 18, fontSize: 11.5 }}>{i + 1}</span>
                <span className="swatch" style={{ background: colorHex(p.color) }} />
                <div className="list-main">
                  <div className="list-title">{p.name}</div>
                  <div className="list-sub">{p.color} · {locations.find((l) => l.id === p.locationId)?.name || 'Non rangé'}</div>
                </div>
                <strong className="num">{fmt(p.quantity)}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <Package size={15} />
            <h2>Occupation par emplacement</h2>
          </div>
          <div className="card-body">
            {locRows.length === 0 ? (
              <p className="cell-muted" style={{ margin: 0, fontSize: 13 }}>Aucun emplacement défini.</p>
            ) : (
              <div className="bars">
                {locRows.map((l) => (
                  <div className="bar-row" key={l.id} style={{ gridTemplateColumns: '120px 1fr 58px' }}>
                    <span className="lbl">{l.name}</span>
                    <span className="bar-track">
                      <span className="bar-fill" style={{ width: `${Math.max(2, (l.qty / maxLoc) * 100)}%`, background: 'var(--yellow)' }} />
                    </span>
                    <span className="val">{fmt(l.qty)}</span>
                  </div>
                ))}
              </div>
            )}
            {stats.byLocation.__none__ > 0 && (
              <p style={{ margin: '14px 0 0', fontSize: 12.5, color: 'var(--amber)' }}>
                {fmt(stats.byLocation.__none__)} pièces ne sont associées à aucun emplacement.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
