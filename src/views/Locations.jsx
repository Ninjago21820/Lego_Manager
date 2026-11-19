import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { LOCATION_TYPES, LOCATION_ICONS, colorHex } from '../lib/lego'
import { fmt } from '../lib/format'
import { Modal, Confirm, Field, Empty } from '../components/ui'

const emptyForm = { name: '', type: 'Boîte', place: '', note: '' }

export default function Locations({ store, addRequest, onAddHandled, onConsume, onNavigate }) {
  const { locations, parts, sets, addLocation, updateLocation, removeLocation } = store
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [toDelete, setToDelete] = useState(null)

  useEffect(() => {
    if (!addRequest) return
    openForm(null)
    onAddHandled?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addRequest])

  function openForm(loc) {
    setEditing(loc)
    setForm(loc ? { ...emptyForm, ...loc } : { ...emptyForm })
    setErrors({})
    setOpen(true)
  }

  function save() {
    if (!form.name.trim()) {
      setErrors({ name: 'Le nom est obligatoire.' })
      return
    }
    const payload = { ...form, name: form.name.trim() }
    if (editing) {
      updateLocation(editing.id, payload)
      onConsume(`Emplacement « ${payload.name} » mis à jour`)
    } else {
      addLocation(payload)
      onConsume(`Emplacement « ${payload.name} » créé`)
    }
    setOpen(false)
  }

  const enriched = useMemo(() => {
    const byLoc = {}
    for (const p of parts) {
      const k = p.locationId || '__none__'
      if (!byLoc[k]) byLoc[k] = { qty: 0, refs: 0, colors: new Set(), topParts: [] }
      byLoc[k].qty += Number(p.quantity || 0)
      byLoc[k].refs += 1
      byLoc[k].colors.add(p.color)
      byLoc[k].topParts.push(p)
    }
    const rows = locations.map((l) => ({
      ...l,
      qty: byLoc[l.id]?.qty || 0,
      refs: byLoc[l.id]?.refs || 0,
      colors: [...(byLoc[l.id]?.colors || [])].slice(0, 6),
      sets: sets.filter((s) => s.locationId === l.id).length,
      topParts: (byLoc[l.id]?.topParts || [])
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 4),
    }))
    const needle = q.trim().toLowerCase()
    return rows
      .filter((r) => !needle || `${r.name} ${r.place} ${r.note}`.toLowerCase().includes(needle))
      .sort((a, b) => b.qty - a.qty)
  }, [locations, parts, sets, q])

  const unassigned = parts.filter((p) => !p.locationId)
  const maxQty = Math.max(1, ...enriched.map((l) => l.qty))

  return (
    <>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="toolbar">
          <div className="search">
            <Search size={15} />
            <input className="input" placeholder="Rechercher un emplacement…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={() => openForm(null)}>
            <Plus size={15} /> Nouvel emplacement
          </button>
        </div>

        {enriched.length === 0 ? (
          <Empty
            emoji={locations.length ? '🔍' : '📦'}
            title={locations.length ? 'Aucun résultat' : 'Aucun emplacement'}
            message="Créez des boîtes, tiroirs ou bacs pour savoir où se trouve chaque pièce."
            action={
              <button className="btn btn-accent" onClick={() => openForm(null)}>
                <Plus size={15} /> Créer un emplacement
              </button>
            }
          />
        ) : (
          <div className="card-body" style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {enriched.map((l) => (
              <div
                key={l.id}
                className="card"
                style={{ padding: 14, boxShadow: 'none', background: 'var(--surface-2)' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span className="loc-icon">{LOCATION_ICONS[l.type] || '📦'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {l.name}
                    </div>
                    <div className="cell-muted" style={{ fontSize: 11.5 }}>
                      {l.type}
                      {l.place ? ` · ${l.place}` : ''}
                    </div>
                  </div>
                  <div className="row-actions" style={{ opacity: 1 }}>
                    <button className="btn btn-ghost btn-icon" title="Modifier" onClick={() => openForm(l)}>
                      <Pencil size={13} />
                    </button>
                    <button
                      className="btn btn-ghost btn-icon"
                      style={{ color: 'var(--red)' }}
                      title="Supprimer"
                      onClick={() => setToDelete(l)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 14, margin: '12px 0 10px', fontSize: 12 }}>
                  <span>
                    <strong style={{ fontSize: 15 }}>{fmt(l.qty)}</strong>{' '}
                    <span className="cell-muted">pièces</span>
                  </span>
                  <span>
                    <strong style={{ fontSize: 15 }}>{fmt(l.refs)}</strong>{' '}
                    <span className="cell-muted">réf.</span>
                  </span>
                  {l.sets > 0 && (
                    <span>
                      <strong style={{ fontSize: 15 }}>{l.sets}</strong>{' '}
                      <span className="cell-muted">set(s)</span>
                    </span>
                  )}
                </div>

                <div className="bar-track" style={{ marginBottom: 10 }}>
                  <div
                    className="bar-fill"
                    style={{ width: `${Math.max(2, (l.qty / maxQty) * 100)}%`, background: 'var(--yellow)' }}
                  />
                </div>

                {l.refs > 0 && (
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ padding: 0, height: 'auto', color: 'var(--muted)' }}
                    onClick={() => onNavigate('parts', { location: l.id })}
                  >
                    Voir le contenu →
                  </button>
                )}
                {l.note && (
                  <div className="cell-muted" style={{ fontSize: 11.5, marginTop: 8, fontStyle: 'italic' }}>
                    {l.note}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {unassigned.length > 0 && (
        <div className="card">
          <div className="card-head">
            <span aria-hidden>📍</span>
            <h2>Pièces non rangées</h2>
            <span className="hint" style={{ marginLeft: 'auto' }}>
              {fmt(unassigned.reduce((a, p) => a + Number(p.quantity || 0), 0))} pièces · {unassigned.length} réf.
            </span>
          </div>
          <div className="list">
            {unassigned.slice(0, 6).map((p) => (
              <div className="list-row" key={p.id}>
                <span className="swatch" style={{ background: colorHex(p.color) }} />
                <div className="list-main">
                  <div className="list-title">{p.name}</div>
                  <div className="list-sub">{p.color} · {p.category}</div>
                </div>
                <span className="badge grey">{fmt(p.quantity)}</span>
              </div>
            ))}
            {unassigned.length > 6 && (
              <div className="list-row">
                <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('parts')}>
                  + {unassigned.length - 6} autres références
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Modifier l’emplacement' : 'Nouvel emplacement'}
        subtitle="Boîte, tiroir, bac… indiquez où ranger vos pièces."
        footer={
          <>
            <button className="btn" onClick={() => setOpen(false)}>Annuler</button>
            <button className="btn btn-primary" onClick={save}>
              {editing ? 'Enregistrer' : 'Créer'}
            </button>
          </>
        }
      >
        <div className="form-grid">
          <Field label="Nom *" span={2}>
            <input
              className="input"
              value={form.name}
              autoFocus
              placeholder="Tiroir Technic 2"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={errors.name ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.name && <span className="help" style={{ color: 'var(--red)' }}>{errors.name}</span>}
          </Field>
          <Field label="Type">
            <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {LOCATION_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Localisation">
            <input
              className="input"
              value={form.place}
              placeholder="Garage, bureau, chambre…"
              onChange={(e) => setForm({ ...form, place: e.target.value })}
            />
          </Field>
          <Field label="Note" span={2}>
            <textarea
              className="input"
              rows={2}
              value={form.note}
              placeholder="Repère de rangement, contenu principal…"
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </Field>
        </div>
      </Modal>

      <Confirm
        open={!!toDelete}
        title="Supprimer cet emplacement ?"
        message={
          toDelete
            ? `« ${toDelete.name} » sera supprimé. Les pièces et sets qui y sont rangés passeront en « non rangé » et ne seront pas supprimés.`
            : ''
        }
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          removeLocation(toDelete.id)
          onConsume(`Emplacement « ${toDelete.name} » supprimé`)
          setToDelete(null)
        }}
      />
    </>
  )
}
