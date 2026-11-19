import { useMemo, useState } from 'react'
import { Search, Grid3x3, LayoutList, Download } from 'lucide-react'
import { CATEGORIES, colorHex, isLightColor } from '../lib/lego'
import { fmt, eur, weight, toCSV, download } from '../lib/format'
import { Empty } from '../components/ui'
import { partWeight } from '../lib/catalog'

/**
 * Vue « Pièces & couleurs » : pour chaque type de pièce, combien d'exemplaires
 * l'utilisateur possède et dans quelles couleurs, avec le poids et la valeur.
 */
export default function Colors({ store, onConsume, onNavigate }) {
  const { stats, parts, settings } = store
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [mode, setMode] = useState('matrix')
  const [sort, setSort] = useState('total')
  const [focusColor, setFocusColor] = useState(null)

  // Couleurs réellement présentes dans l'inventaire, triées par quantité détenue.
  const colors = useMemo(() => {
    const qtyByColor = {}
    for (const p of parts) qtyByColor[p.color] = (qtyByColor[p.color] || 0) + (Number(p.quantity) || 0)
    return Object.entries(qtyByColor)
      .sort((a, b) => b[1] - a[1])
      .map(([name, qty]) => ({ name, qty, hex: colorHex(name), light: isLightColor(colorHex(name)) }))
  }, [parts])

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    let list = stats.partVariants.filter((r) => {
      if (cat !== 'all' && r.category !== cat) return false
      if (focusColor && !(r.colors[focusColor] > 0)) return false
      if (needle && !`${r.name} ${r.category} ${Object.keys(r.colors).join(' ')}`.toLowerCase().includes(needle))
        return false
      return true
    })
    const get = (r) =>
      sort === 'name'
        ? r.name.toLowerCase()
        : sort === 'colors'
          ? r.variantCount
          : sort === 'weight'
            ? r.weightG
            : sort === 'value'
              ? r.value
              : r.total
    list = [...list].sort((a, b) =>
      typeof get(a) === 'string' ? String(get(a)).localeCompare(String(get(b)), 'fr') : get(b) - get(a),
    )
    if (sort === 'name') list.reverse().reverse()
    return list
  }, [stats.partVariants, q, cat, sort, focusColor])

  const totals = useMemo(() => {
    const qty = rows.reduce((a, r) => a + r.total, 0)
    const w = rows.reduce((a, r) => a + r.weightG, 0)
    const v = rows.reduce((a, r) => a + r.value, 0)
    const variantCount = rows.reduce((a, r) => a + r.variantCount, 0)
    return { qty, w, v, variantCount }
  }, [rows])

  // Échelle de couleur pour l'intensité des cases de la matrice.
  const maxCell = useMemo(() => {
    let max = 1
    for (const r of rows) for (const v of Object.values(r.colors)) max = Math.max(max, v)
    return max
  }, [rows])

  function exportCsv() {
    const header = ['Pièce', 'Catégorie', 'Total', ...colors.map((c) => c.name), 'Poids', 'Valeur']
    const data = rows.map((r) => [
      r.name,
      r.category,
      r.total,
      ...colors.map((c) => r.colors[c.name] || 0),
      r.weightG.toFixed(2),
      r.value.toFixed(2),
    ])
    download(
      `pieces-par-couleur-${new Date().toISOString().slice(0, 10)}.csv`,
      toCSV(data, header),
      'text/csv;charset=utf-8',
    )
    onConsume(`${rows.length} types de pièces exportés`)
  }

  if (!parts.length) {
    return (
      <div className="card">
        <Empty
          emoji="🎨"
          title="Aucune pièce à afficher"
          message="Ajoutez des pièces avec leur couleur pour voir combien d'exemplaires vous possédez de chaque variante."
          action={
            <button className="btn btn-accent" onClick={() => onNavigate('parts')}>
              Aller à l'inventaire
            </button>
          }
        />
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="stat-grid">
        <div className="stat">
          <div className="stat-top">
            <span className="stat-label">Types de pièces</span>
            <span className="stat-icon"><Grid3x3 size={15} /></span>
          </div>
          <div className="stat-value">{fmt(rows.length)}</div>
          <div className="stat-foot">{fmt(totals.variantCount)} variantes de couleur</div>
        </div>
        <div className="stat">
          <div className="stat-top">
            <span className="stat-label">Couleurs utilisées</span>
            <span className="stat-icon">🎨</span>
          </div>
          <div className="stat-value">{fmt(colors.length)}</div>
          <div className="stat-foot">
            plus fréquente : {colors[0]?.name || '—'}
          </div>
        </div>
        <div className="stat">
          <div className="stat-top">
            <span className="stat-label">Poids affiché</span>
            <span className="stat-icon">⚖️</span>
          </div>
          <div className="stat-value">{weight(totals.w)}</div>
          <div className="stat-foot">{fmt(totals.qty)} pièces</div>
        </div>
        <div className="stat accent">
          <div className="stat-top">
            <span className="stat-label">Valeur affichée</span>
            <span className="stat-icon">💶</span>
          </div>
          <div className="stat-value">{eur(totals.v)}</div>
          <div className="stat-foot">
            {totals.qty ? `${(totals.v / totals.qty).toFixed(3).replace('.', ',')} € / pièce en moyenne` : '—'}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="search">
            <Search size={15} />
            <input
              className="input"
              placeholder="Rechercher un type de pièce ou une couleur…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <select className="select" style={{ width: 'auto' }} value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="all">Toutes catégories</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select className="select" style={{ width: 'auto' }} value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="total">Tri : total détenu</option>
            <option value="value">Tri : valeur</option>
            <option value="weight">Tri : poids</option>
            <option value="colors">Tri : nombre de couleurs</option>
            <option value="name">Tri : nom</option>
          </select>
          <div className="segmented">
            <button className={mode === 'matrix' ? 'on' : ''} onClick={() => setMode('matrix')} title="Matrice pièces × couleurs">
              <Grid3x3 size={13} style={{ verticalAlign: -2, marginRight: 3 }} /> Matrice
            </button>
            <button className={mode === 'cards' ? 'on' : ''} onClick={() => setMode('cards')} title="Fiches détaillées">
              <LayoutList size={13} style={{ verticalAlign: -2, marginRight: 3 }} /> Fiches
            </button>
          </div>
          {focusColor && (
            <button
              className="btn btn-sm"
              onClick={() => setFocusColor(null)}
              title="Retirer le filtre de couleur"
              style={{ background: 'var(--yellow-soft)', borderColor: 'var(--yellow)' }}
            >
              <span className="swatch" style={{ width: 12, height: 12, borderRadius: 4, background: colorHex(focusColor) }} />
              {focusColor} ✕
            </button>
          )}
          <button className="btn" onClick={exportCsv}>
            <Download size={14} /> CSV
          </button>
        </div>

        {rows.length === 0 ? (
          <Empty emoji="🔍" title="Aucun résultat" message="Aucun type de pièce ne correspond à cette recherche." />
        ) : mode === 'matrix' ? (
          <div className="table-wrap">
            <table style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th style={{ position: 'sticky', left: 0, zIndex: 3, background: 'var(--surface-2)' }}>Pièce</th>
                  {colors.map((c) => (
                    <th
                      key={c.name}
                      onClick={() => setFocusColor((f) => (f === c.name ? null : c.name))}
                      style={{
                        textAlign: 'center',
                        padding: '8px 4px',
                        minWidth: 50,
                        cursor: 'pointer',
                        background: focusColor === c.name ? 'var(--yellow-soft)' : undefined,
                        outline: focusColor === c.name ? '2px solid var(--yellow)' : undefined,
                        outlineOffset: -2,
                      }}
                      title={`${c.name} — cliquer pour filtrer les pièces de cette couleur`}
                    >
                      <span
                        className="swatch"
                        style={{ background: c.hex, display: 'inline-block', width: 18, height: 18 }}
                      />
                      <div style={{ fontSize: 9.5, fontWeight: 600, textTransform: 'none', letterSpacing: 0, marginTop: 3, maxWidth: 56, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.name}
                      </div>
                    </th>
                  ))}
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th style={{ textAlign: 'right' }}>Poids</th>
                  <th style={{ textAlign: 'right' }}>Valeur</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.name}>
                    <td
                      style={{
                        position: 'sticky',
                        left: 0,
                        zIndex: 2,
                        background: 'var(--surface)',
                        borderRight: '1px solid var(--border)',
                      }}
                    >
                      <div className="cell-strong">{r.name}</div>
                      <div className="cell-muted" style={{ fontSize: 11 }}>
                        {r.category} · {r.variantCount} couleur{r.variantCount > 1 ? 's' : ''}
                      </div>
                    </td>
                    {colors.map((c) => {
                      const n = r.colors[c.name] || 0
                      const focused = focusColor === c.name
                      const intensity = n ? 0.12 + (n / maxCell) * 0.88 : 0
                      return (
                        <td
                          key={c.name}
                          className="num"
                          style={{
                            textAlign: 'center',
                            padding: '6px 4px',
                            fontSize: 12,
                            background: focused ? 'var(--yellow-soft)' : undefined,
                          }}
                          title={n ? `${r.name} ${c.name} : ${fmt(n)}` : undefined}
                        >
                          {n ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: 32,
                                padding: '3px 6px',
                                borderRadius: 6,
                                fontWeight: 700,
                                background: `color-mix(in srgb, ${c.hex} ${Math.round(intensity * 100)}%, transparent)`,
                                border: `1px solid ${c.hex}${n / maxCell > 0.45 ? '' : '55'}`,
                                color: isLightColor(c.hex) && n / maxCell > 0.6 ? '#14161a' : 'inherit',
                                textShadow: 'none',
                              }}
                            >
                              {fmt(n)}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--muted-2)', opacity: 0.35 }}>·</span>
                          )}
                        </td>
                      )
                    })}
                    <td className="num" style={{ textAlign: 'right', fontWeight: 700 }}>{fmt(r.total)}</td>
                    <td className="num cell-muted" style={{ textAlign: 'right' }}>{weight(r.weightG)}</td>
                    <td className="num" style={{ textAlign: 'right', fontWeight: 620 }}>{eur(r.value)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td
                    style={{
                      position: 'sticky',
                      left: 0,
                      zIndex: 2,
                      background: 'var(--surface-2)',
                      fontWeight: 700,
                      borderRight: '1px solid var(--border)',
                      borderTop: '1px solid var(--border-strong)',
                      padding: '10px 14px',
                    }}
                  >
                    Total ({rows.length} types)
                  </td>
                  {colors.map((c) => {
                    const sum = rows.reduce((a, r) => a + (r.colors[c.name] || 0), 0)
                    return (
                      <td
                        key={c.name}
                        className="num"
                        style={{
                          textAlign: 'center',
                          background: 'var(--surface-2)',
                          fontWeight: 700,
                          borderTop: '1px solid var(--border-strong)',
                          fontSize: 12,
                          padding: '10px 4px',
                        }}
                      >
                        {fmt(sum)}
                      </td>
                    )
                  })}
                  <td className="num" style={{ textAlign: 'right', background: 'var(--surface-2)', fontWeight: 800, borderTop: '1px solid var(--border-strong)' }}>
                    {fmt(totals.qty)}
                  </td>
                  <td className="num" style={{ textAlign: 'right', background: 'var(--surface-2)', fontWeight: 700, borderTop: '1px solid var(--border-strong)' }}>
                    {weight(totals.w)}
                  </td>
                  <td className="num" style={{ textAlign: 'right', background: 'var(--surface-2)', fontWeight: 800, borderTop: '1px solid var(--border-strong)' }}>
                    {eur(totals.v)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="card-body" style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {rows.map((r) => (
              <div key={r.name} className="card" style={{ padding: 14, boxShadow: 'none', background: 'var(--surface-2)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <strong style={{ fontSize: 13.5 }}>{r.name}</strong>
                  <span className="badge grey" style={{ marginLeft: 'auto' }}>{r.total}</span>
                </div>
                <div className="cell-muted" style={{ fontSize: 11.5, marginTop: 2 }}>
                  {r.category} · {r.variantCount} couleur{r.variantCount > 1 ? 's' : ''}
                </div>
                <div className="chips" style={{ marginTop: 10 }}>
                  {Object.entries(r.colors)
                    .sort((a, b) => b[1] - a[1])
                    .map(([name, qty]) => (
                      <span className="chip" key={name}>
                        <span
                          className="swatch"
                          style={{ width: 12, height: 12, borderRadius: 4, background: colorHex(name) }}
                        />
                        {name}
                        <strong style={{ color: 'var(--text)' }}>{fmt(qty)}</strong>
                      </span>
                    ))}
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 14,
                    marginTop: 12,
                    paddingTop: 10,
                    borderTop: '1px solid var(--border)',
                    fontSize: 12,
                  }}
                >
                  <span>
                    <strong>{weight(r.weightG)}</strong> <span className="cell-muted">de plastique</span>
                  </span>
                  <span>
                    <strong>{eur(r.value)}</strong> <span className="cell-muted">de valeur</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <span aria-hidden>🎨</span>
            <h2>Valeur par couleur</h2>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Couleur</th>
                  <th style={{ textAlign: 'right' }}>Pièces</th>
                  <th style={{ textAlign: 'right' }}>Valeur</th>
                  <th style={{ textAlign: 'right' }}>Poids</th>
                </tr>
              </thead>
              <tbody>
                {colors.map((c) => {
                  const qty = parts
                    .filter((p) => p.color === c.name)
                    .reduce((a, p) => a + (Number(p.quantity) || 0), 0)
                  const val = stats.valueByColor[c.name] || 0
                  return (
                    <tr key={c.name}>
                      <td>
                        <span style={{ display: 'inline-flex', gap: 7, alignItems: 'center' }}>
                          <span className="swatch" style={{ width: 14, height: 14, borderRadius: 4, background: c.hex }} />
                          {c.name}
                        </span>
                      </td>
                      <td className="num" style={{ textAlign: 'right', fontWeight: 620 }}>{fmt(qty)}</td>
                      <td className="num" style={{ textAlign: 'right' }}>{eur(val)}</td>
                      <td className="num cell-muted" style={{ textAlign: 'right' }}>
                        {weight(parts.filter((p) => p.color === c.name).reduce((a, p) => a + partWeight(p), 0))}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <span aria-hidden>💎</span>
            <h2>Les plus fortes valeurs</h2>
          </div>
          <div className="list">
            {stats.mostValuable.map(({ part, value, weightG }) => (
              <div className="list-row" key={part.id}>
                <span className="swatch" style={{ background: colorHex(part.color) }} />
                <div className="list-main">
                  <div className="list-title">{part.name}</div>
                  <div className="list-sub">
                    {part.color} · {fmt(part.quantity)} ex. · {weight(weightG)}
                  </div>
                </div>
                <strong className="num">{eur(value)}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
