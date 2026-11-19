import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ArrowUpDown,
  PlusCircle,
  MinusCircle,
  Download,
  AlertTriangle,
} from 'lucide-react'
import { CATEGORIES, COLORS, colorHex, isLightColor } from '../lib/lego'
import { fmt, toCSV, download } from '../lib/format'
import { Modal, Confirm, Field, Empty } from '../components/ui'

const CONDITIONS = ['Neuf', 'Occasion', 'Abîmé']

const emptyForm = {
  name: '',
  category: 'Brique',
  color: 'Rouge',
  quantity: 0,
  locationId: '',
  condition: 'Neuf',
  note: '',
}

function ColorPicker({ value, onChange }) {
  return (
    <div className="color-picker">
      {COLORS.map((c) => (
        <button
          type="button"
          key={c.name}
          className={`color-dot ${value === c.name ? 'on' : ''}`}
          style={{ background: c.hex }}
          title={c.name}
          aria-label={c.name}
          onClick={() => onChange(c.name)}
        >
          {value === c.name && isLightColor(c.hex) && (
            <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#111', fontSize: 11, fontWeight: 800 }}>✓</span>
          )}
        </button>
      ))}
    </div>
  )
}

export default function Parts({ store, addRequest, onAddHandled, initialFilter, onConsume }) {
  const { parts, locations, settings, addPart, updatePart, removePart, moveStock } = store

  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [color, setColor] = useState('all')
  const [loc, setLoc] = useState('all')
  const [stockFilter, setStockFilter] = useState(initialFilter?.filter === 'low' ? 'low' : 'all')
  const [sort, setSort] = useState({ key: 'createdAt', dir: 'desc' })

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [toDelete, setToDelete] = useState(null)
  const [moving, setMoving] = useState(null)
  const [moveQty, setMoveQty] = useState(1)
  const [moveReason, setMoveReason] = useState('')

  useEffect(() => {
    if (!addRequest) return
    openForm(null)
    onAddHandled?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addRequest])

  useEffect(() => {
    if (!initialFilter) return
    if (initialFilter.filter === 'low') setStockFilter('low')
    if (initialFilter.location) {
      setLoc(initialFilter.location)
      setStockFilter('all')
    }
  }, [initialFilter])

  useEffect(() => {
    if (moving) {
      setMoveQty(1)
      setMoveReason('')
    }
  }, [moving])

  function openForm(part) {
    setEditing(part)
    setForm(part ? { ...emptyForm, ...part } : { ...emptyForm, locationId: locations[0]?.id || '' })
    setErrors({})
    setFormOpen(true)
  }

  function save() {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Le nom de la pièce est obligatoire.'
    if (form.quantity === '' || Number(form.quantity) < 0) errs.quantity = 'Quantité invalide.'
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    const payload = {
      ...form,
      name: form.name.trim(),
      quantity: Math.max(0, Math.round(Number(form.quantity) || 0)),
    }
    if (editing) {
      updatePart(editing.id, payload)
      onConsume(`« ${payload.name} » mis à jour`)
    } else {
      addPart(payload)
      onConsume(`« ${payload.name} » ajouté à l'inventaire`)
    }
    setFormOpen(false)
  }

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const threshold = Number(settings.lowStockThreshold ?? 10)
    let rows = parts.filter((p) => {
      if (cat !== 'all' && p.category !== cat) return false
      if (color !== 'all' && p.color !== color) return false
      if (loc !== 'all') {
        if (loc === '__none__' ? p.locationId : p.locationId !== loc) return false
      }
      if (stockFilter === 'low' && Number(p.quantity) > threshold) return false
      if (stockFilter === 'out' && Number(p.quantity) !== 0) return false
      if (!needle) return true
      const hay = `${p.name} ${p.color} ${p.category} ${p.note || ''}`.toLowerCase()
      return hay.includes(needle)
    })

    const dir = sort.dir === 'asc' ? 1 : -1
    rows.sort((a, b) => {
      let av = a[sort.key]
      let bv = b[sort.key]
      if (sort.key === 'location') {
        av = locations.find((l) => l.id === a.locationId)?.name || ''
        bv = locations.find((l) => l.id === b.locationId)?.name || ''
      }
      if (typeof av === 'string' || typeof bv === 'string') {
        return String(av ?? '').localeCompare(String(bv ?? ''), 'fr') * dir
      }
      return ((av ?? 0) - (bv ?? 0)) * dir
    })
    return rows
  }, [parts, q, cat, color, loc, stockFilter, sort, settings.lowStockThreshold, locations])

  const totalQty = filtered.reduce((a, p) => a + Number(p.quantity || 0), 0)
  const threshold = Number(settings.lowStockThreshold ?? 10)
  const maxQty = Math.max(1, ...parts.map((p) => Number(p.quantity) || 0))
  const locName = (id) => locations.find((l) => l.id === id)?.name || '—'

  function toggleSort(key) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'name' ? 'asc' : 'desc' }))
  }

  function exportCsv() {
    const rows = filtered.map((p) => [
      p.name,
      p.category,
      p.color,
      p.quantity,
      locName(p.locationId),
      p.condition,
      p.note || '',
    ])
    download(
      `pieces-lego-${new Date().toISOString().slice(0, 10)}.csv`,
      toCSV(rows, ['Nom', 'Catégorie', 'Couleur', 'Quantité', 'Emplacement', 'État', 'Note']),
      'text/csv;charset=utf-8',
    )
    onConsume(`${filtered.length} lignes exportées en CSV`)
  }

  const SortTh = ({ label, k, style }) => (
    <th className="sortable" onClick={() => toggleSort(k)} style={style} aria-sort={sort.key === k ? sort.dir : 'none'}>
      {label}
      <ArrowUpDown size={11} className="sort-arrow" style={{ opacity: sort.key === k ? 1 : 0.3 }} />
    </th>
  )

  return (
    <>
      <div className="card">
        <div className="toolbar">
          <div className="search">
            <Search size={15} />
            <input
              className="input"
              placeholder="Rechercher une pièce, une couleur…"
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
          <select className="select" style={{ width: 'auto' }} value={color} onChange={(e) => setColor(e.target.value)}>
            <option value="all">Toutes couleurs</option>
            {COLORS.map((c) => (
              <option key={c.name}>{c.name}</option>
            ))}
          </select>
          <select className="select" style={{ width: 'auto' }} value={loc} onChange={(e) => setLoc(e.target.value)}>
            <option value="all">Tous emplacements</option>
            <option value="__none__">Non rangé</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <div className="segmented">
            <button className={stockFilter === 'all' ? 'on' : ''} onClick={() => setStockFilter('all')}>
              Tout
            </button>
            <button className={stockFilter === 'low' ? 'on' : ''} onClick={() => setStockFilter('low')}>
              Stock bas
            </button>
            <button className={stockFilter === 'out' ? 'on' : ''} onClick={() => setStockFilter('out')}>
              Épuisé
            </button>
          </div>
          <button className="btn" onClick={exportCsv} title="Exporter la sélection en CSV">
            <Download size={14} /> CSV
          </button>
          <button className="btn btn-primary" onClick={() => openForm(null)}>
            <Plus size={15} /> Nouvelle pièce
          </button>
        </div>

        {filtered.length === 0 ? (
          <Empty
            emoji={parts.length ? '🔍' : '🧱'}
            title={parts.length ? 'Aucun résultat' : 'Aucune pièce'}
            message={
              parts.length
                ? 'Aucune pièce ne correspond à ces filtres. Essayez de les réinitialiser.'
                : 'Ajoutez votre première référence de pièce pour démarrer votre inventaire.'
            }
            action={
              parts.length ? (
                <button
                  className="btn"
                  onClick={() => {
                    setQ('')
                    setCat('all')
                    setColor('all')
                    setLoc('all')
                    setStockFilter('all')
                  }}
                >
                  Réinitialiser les filtres
                </button>
              ) : (
                <button className="btn btn-accent" onClick={() => openForm(null)}>
                  <Plus size={15} /> Ajouter une pièce
                </button>
              )
            }
          />
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <SortTh label="Pièce" k="name" />
                    <SortTh label="Catégorie" k="category" />
                    <SortTh label="Couleur" k="color" />
                    <SortTh label="Quantité" k="quantity" />
                    <SortTh label="Emplacement" k="location" />
                    <th>État</th>
                    <th style={{ width: 150, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const low = Number(p.quantity) <= threshold
                    const zero = Number(p.quantity) === 0
                    const barW = Math.max(4, Math.min(100, (Number(p.quantity) / maxQty) * 100))
                    return (
                      <tr key={p.id}>
                        <td>
                          <div className="part-name">
                            <span className="swatch" style={{ background: colorHex(p.color) }} />
                            <div style={{ minWidth: 0 }}>
                              <div className="cell-strong">{p.name}</div>
                              {p.note && (
                                <div className="cell-muted" style={{ fontSize: 11.5, marginTop: 1, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {p.note}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge grey">{p.category}</span>
                        </td>
                        <td className="cell-muted">{p.color}</td>
                        <td>
                          <div className={`qty ${zero ? 'zero' : low ? 'low' : ''}`}>
                            <span style={{ minWidth: 34, textAlign: 'right' }}>{fmt(p.quantity)}</span>
                            <span className="qty-bar">
                              <i style={{ width: `${barW}%` }} />
                            </span>
                          </div>
                        </td>
                        <td className="cell-muted">{locName(p.locationId)}</td>
                        <td>
                          <span className={`badge ${p.condition === 'Neuf' ? 'green' : p.condition === 'Occasion' ? 'amber' : 'red'}`}>
                            {p.condition}
                          </span>
                        </td>
                        <td>
                          <div className="row-actions">
                            <button
                              className="btn btn-ghost btn-icon"
                              style={{ color: 'var(--green)' }}
                              title="Entrée de stock"
                              onClick={() => setMoving({ part: p, dir: 1 })}
                            >
                              <PlusCircle size={15} />
                            </button>
                            <button
                              className="btn btn-ghost btn-icon"
                              style={{ color: 'var(--red)' }}
                              title="Sortie de stock"
                              onClick={() => setMoving({ part: p, dir: -1 })}
                              disabled={Number(p.quantity) === 0}
                            >
                              <MinusCircle size={15} />
                            </button>
                            <button className="btn btn-ghost btn-icon" title="Modifier" onClick={() => openForm(p)}>
                              <Pencil size={14} />
                            </button>
                            <button
                              className="btn btn-ghost btn-icon"
                              style={{ color: 'var(--red)' }}
                              title="Supprimer"
                              onClick={() => setToDelete(p)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div
              style={{
                display: 'flex',
                gap: 16,
                padding: '11px 16px',
                borderTop: '1px solid var(--border)',
                fontSize: 12.5,
                color: 'var(--muted)',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <span>
                <strong style={{ color: 'var(--text)' }}>{fmt(filtered.length)}</strong> référence(s)
              </span>
              <span>
                <strong style={{ color: 'var(--text)' }}>{fmt(totalQty)}</strong> pièces au total
              </span>
              {stockFilter !== 'low' && filtered.some((p) => Number(p.quantity) <= threshold) && (
                <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 5, alignItems: 'center', color: 'var(--amber)' }}>
                  <AlertTriangle size={13} /> Certaines références sont sous le seuil de {threshold}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* -------- Formulaire -------- */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Modifier la pièce' : 'Nouvelle pièce'}
        subtitle={editing ? 'Mettez à jour les informations de cette référence.' : 'Ajoutez une référence à votre inventaire.'}
        footer={
          <>
            <button className="btn" onClick={() => setFormOpen(false)}>
              Annuler
            </button>
            <button className="btn btn-primary" onClick={save}>
              {editing ? 'Enregistrer' : 'Ajouter la pièce'}
            </button>
          </>
        }
      >
        <div className="form-grid">
          <Field label="Nom de la pièce *" span={2} hint={errors.name ? undefined : 'Ex. : Brique 2x4, Plaque 1x4, Axe Technic 6L'}>
            <input
              className="input"
              value={form.name}
              autoFocus
              placeholder="Brique 2x4"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={errors.name ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.name && <span className="help" style={{ color: 'var(--red)' }}>{errors.name}</span>}
          </Field>

          <Field label="Catégorie">
            <select className="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>

          <Field label="Quantité *">
            <input
              className="input"
              type="number"
              min={0}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
            {errors.quantity && <span className="help" style={{ color: 'var(--red)' }}>{errors.quantity}</span>}
          </Field>

          <Field label="Emplacement">
            <select className="select" value={form.locationId} onChange={(e) => setForm({ ...form, locationId: e.target.value })}>
              <option value="">Non rangé</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} {l.place ? `· ${l.place}` : ''}
                </option>
              ))}
            </select>
          </Field>

          <Field label="État">
            <select className="select" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
              {CONDITIONS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>

          <Field label="Couleur" span={2}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span className="swatch" style={{ width: 26, height: 26, background: colorHex(form.color) }} />
              <strong style={{ fontSize: 13 }}>{form.color}</strong>
            </div>
            <ColorPicker value={form.color} onChange={(c) => setForm({ ...form, color: c })} />
          </Field>

          <Field label="Note" span={2}>
            <textarea
              className="input"
              rows={2}
              value={form.note}
              placeholder="Origine, set d'appartenance, particularité…"
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </Field>
        </div>
      </Modal>

      {/* -------- Mouvement de stock -------- */}
      <Modal
        open={!!moving}
        onClose={() => setMoving(null)}
        title={moving?.dir === 1 ? 'Entrée de stock' : 'Sortie de stock'}
        subtitle={moving ? `${moving.part.name} · ${moving.part.color} · stock actuel : ${moving.part.quantity}` : ''}
        footer={
          <>
            <button className="btn" onClick={() => setMoving(null)}>
              Annuler
            </button>
            <button
              className={`btn ${moving?.dir === 1 ? 'btn-primary' : 'btn-danger'}`}
              onClick={() => {
                if (!moving) return
                const delta = (moving.dir === 1 ? 1 : -1) * Math.max(0, Math.round(Number(moveQty) || 0))
                if (!delta) return
                moveStock(moving.part.id, delta, moveReason.trim() || (moving.dir === 1 ? 'Réapprovisionnement' : 'Consommation'))
                onConsume(
                  `${delta > 0 ? '+' : ''}${delta} × ${moving.part.name}`,
                )
                setMoving(null)
              }}
            >
              {moving?.dir === 1 ? 'Ajouter au stock' : 'Retirer du stock'}
            </button>
          </>
        }
      >
        <div className="form-grid">
          <Field label="Quantité">
            <input
              className="input"
              type="number"
              min={1}
              value={moveQty}
              autoFocus
              onChange={(e) => setMoveQty(e.target.value)}
            />
          </Field>
          <Field label="Motif">
            <input
              className="input"
              value={moveReason}
              placeholder={moving?.dir === 1 ? 'Achat, don, Pick-a-Brick…' : 'MOC, set, casse…'}
              onChange={(e) => setMoveReason(e.target.value)}
            />
          </Field>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
          {[1, 5, 10, 25, 50, 100].map((n) => (
            <button key={n} className="btn btn-sm" onClick={() => setMoveQty(n)}>
              {n}
            </button>
          ))}
        </div>
      </Modal>

      <Confirm
        open={!!toDelete}
        title="Supprimer cette pièce ?"
        message={
          toDelete
            ? `« ${toDelete.name} » (${toDelete.color}, ${toDelete.quantity} en stock) sera définitivement retirée de votre inventaire, ainsi que son historique de mouvements.`
            : ''
        }
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          removePart(toDelete.id)
          onConsume(`« ${toDelete.name} » supprimé`)
          setToDelete(null)
        }}
      />
    </>
  )
}
