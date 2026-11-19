import { useEffect, useMemo, useState } from 'react'
import { Search, Plus, Pencil, Trash2, Package, Download } from 'lucide-react'
import { SET_STATUSES, STATUS_META, THEMES } from '../lib/lego'
import { fmt, toCSV, download, eur } from '../lib/format'
import { Modal, Confirm, Field, Empty } from '../components/ui'

const emptyForm = {
  number: '',
  name: '',
  theme: 'Icons',
  year: new Date().getFullYear(),
  pieces: 0,
  builtPieces: 0,
  status: 'Complet',
  locationId: '',
  note: '',
  weightG: '',
  value: '',
}

const statusTone = (s) => STATUS_META[s]?.tone ?? 'grey'

export default function Sets({ store, addRequest, onAddHandled, onConsume }) {
  const { sets, locations, addSet, updateSet, removeSet } = store
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [theme, setTheme] = useState('all')
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

  function openForm(set) {
    setEditing(set)
    setForm(
      set
        ? {
            ...emptyForm,
            ...set,
            weightG: set.weightG ?? '',
            value: set.value ?? '',
          }
        : { ...emptyForm },
    )
    setErrors({})
    setOpen(true)
  }

  function save() {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Le nom du set est obligatoire.'
    if (!form.number.trim()) errs.number = 'Le numéro de set est obligatoire.'
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    const payload = {
      ...form,
      name: form.name.trim(),
      number: form.number.trim(),
      year: Number(form.year) || '',
      pieces: Math.max(0, Number(form.pieces) || 0),
      builtPieces: Math.max(0, Number(form.builtPieces) || 0),
      weightG: form.weightG === '' ? null : Math.max(0, Number(form.weightG) || 0),
      value: form.value === '' ? null : Math.max(0, Number(form.value) || 0),
    }
    if (editing) {
      updateSet(editing.id, payload)
      onConsume(`Set ${payload.number} mis à jour`)
    } else {
      addSet(payload)
      onConsume(`Set ${payload.number} ajouté`)
    }
    setOpen(false)
  }

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return sets.filter((s) => {
      if (status !== 'all' && s.status !== status) return false
      if (theme !== 'all' && s.theme !== theme) return false
      if (!needle) return true
      return `${s.number} ${s.name} ${s.theme} ${s.note || ''}`.toLowerCase().includes(needle)
    })
  }, [sets, q, status, theme])

  const totals = useMemo(
    () => ({
      pieces: filtered.reduce((a, s) => a + Number(s.pieces || 0), 0),
      built: filtered.reduce((a, s) => a + Number(s.builtPieces || 0), 0),
      complete: filtered.filter((s) => s.status === 'Complet').length,
    }),
    [filtered],
  )

  function exportCsv() {
    const rows = filtered.map((s) => [
      s.number,
      s.name,
      s.theme,
      s.year,
      s.pieces,
      s.builtPieces,
      s.status,
      locations.find((l) => l.id === s.locationId)?.name || '',
      s.note || '',
    ])
    download(
      `sets-lego-${new Date().toISOString().slice(0, 10)}.csv`,
      toCSV(rows, ['Numéro', 'Nom', 'Thème', 'Année', 'Pièces', 'Assemblées', 'Statut', 'Emplacement', 'Note']),
      'text/csv;charset=utf-8',
    )
    onConsume(`${filtered.length} sets exportés`)
  }

  return (
    <>
      {sets.length > 0 && (
        <div className="stat-grid" style={{ marginBottom: 16 }}>
          <div className="stat">
            <div className="stat-top">
              <span className="stat-label">Sets affichés</span>
              <span className="stat-icon"><Package size={15} /></span>
            </div>
            <div className="stat-value">{fmt(filtered.length)}</div>
            <div className="stat-foot">{totals.complete} complets</div>
          </div>
          <div className="stat">
            <div className="stat-top">
              <span className="stat-label">Pièces catalogue</span>
              <span className="stat-icon">🧮</span>
            </div>
            <div className="stat-value">{fmt(totals.pieces)}</div>
            <div className="stat-foot">d’après les notices officielles</div>
          </div>
          <div className="stat accent">
            <div className="stat-top">
              <span className="stat-label">Progression moyenne</span>
              <span className="stat-icon">🔧</span>
            </div>
            <div className="stat-value">
              {totals.pieces ? Math.round((totals.built / totals.pieces) * 100) : 0}%
            </div>
            <div className="stat-foot">
              {fmt(totals.built)} pièces assemblées
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="toolbar">
          <div className="search">
            <Search size={15} />
            <input
              className="input"
              placeholder="Rechercher un set, un numéro…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <select className="select" style={{ width: 'auto' }} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">Tous les statuts</option>
            {SET_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select className="select" style={{ width: 'auto' }} value={theme} onChange={(e) => setTheme(e.target.value)}>
            <option value="all">Tous les thèmes</option>
            {THEMES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <button className="btn" onClick={exportCsv}>
            <Download size={14} /> CSV
          </button>
          <button className="btn btn-primary" onClick={() => openForm(null)}>
            <Plus size={15} /> Nouveau set
          </button>
        </div>

        {filtered.length === 0 ? (
          <Empty
            emoji={sets.length ? '🔍' : '📦'}
            title={sets.length ? 'Aucun set trouvé' : 'Aucun set dans la collection'}
            message={
              sets.length
                ? 'Modifiez la recherche ou les filtres pour retrouver vos sets.'
                : 'Référencez vos sets pour suivre leur état, leur progression de montage et les pièces manquantes.'
            }
            action={
              <button className="btn btn-accent" onClick={() => openForm(null)}>
                <Plus size={15} /> Ajouter un set
              </button>
            }
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Set</th>
                  <th>Thème</th>
                  <th>Année</th>
                  <th>Pièces</th>
                  <th style={{ textAlign: 'right' }}>Valeur</th>
                  <th style={{ minWidth: 170 }}>Montage</th>
                  <th>Statut</th>
                  <th>Emplacement</th>
                  <th style={{ width: 90 }} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const pct = s.pieces ? Math.min(100, Math.round((s.builtPieces / s.pieces) * 100)) : 0
                  return (
                    <tr key={s.id}>
                      <td>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <span className="loc-icon" style={{ fontSize: 14, fontWeight: 800, fontFamily: 'ui-monospace, monospace', width: 52, height: 30 }}>
                            {s.number}
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <div className="cell-strong">{s.name}</div>
                            {s.note && (
                              <div className="cell-muted" style={{ fontSize: 11.5, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {s.note}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td><span className="badge grey">{s.theme}</span></td>
                      <td className="cell-muted num">{s.year || '—'}</td>
                      <td className="num">{fmt(s.pieces)}</td>
                      <td className="num" style={{ textAlign: 'right' }}>
                        {s.value ? <strong>{eur(s.value)}</strong> : <span className="cell-muted">—</span>}
                      </td>
                      <td>
                        <div style={{ display: 'grid', gap: 4 }}>
                          <div className="progress">
                            <i style={{ width: `${pct}%` }} />
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                            {fmt(s.builtPieces)} / {fmt(s.pieces)} · {pct}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${statusTone(s.status)}`}>{s.status}</span>
                      </td>
                      <td className="cell-muted">
                        {locations.find((l) => l.id === s.locationId)?.name || '—'}
                      </td>
                      <td>
                        <div className="row-actions">
                          <button className="btn btn-ghost btn-icon" title="Modifier" onClick={() => openForm(s)}>
                            <Pencil size={14} />
                          </button>
                          <button
                            className="btn btn-ghost btn-icon"
                            style={{ color: 'var(--red)' }}
                            title="Supprimer"
                            onClick={() => setToDelete(s)}
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
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Modifier le set` : 'Nouveau set'}
        subtitle={editing ? `${editing.number} · ${editing.name}` : 'Référencez un set de votre collection.'}
        footer={
          <>
            <button className="btn" onClick={() => setOpen(false)}>Annuler</button>
            <button className="btn btn-primary" onClick={save}>
              {editing ? 'Enregistrer' : 'Ajouter le set'}
            </button>
          </>
        }
      >
        <div className="form-grid">
          <Field label="Numéro *" hint="Ex. : 10294">
            <input
              className="input"
              value={form.number}
              autoFocus
              placeholder="10294"
              onChange={(e) => setForm({ ...form, number: e.target.value })}
              style={errors.number ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.number && <span className="help" style={{ color: 'var(--red)' }}>{errors.number}</span>}
          </Field>
          <Field label="Nom du set *">
            <input
              className="input"
              value={form.name}
              placeholder="Titanic"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={errors.name ? { borderColor: 'var(--red)' } : undefined}
            />
            {errors.name && <span className="help" style={{ color: 'var(--red)' }}>{errors.name}</span>}
          </Field>
          <Field label="Thème">
            <select className="select" value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value })}>
              {THEMES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Année de sortie">
            <input
              className="input"
              type="number"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
            />
          </Field>
          <Field label="Nombre de pièces">
            <input
              className="input"
              type="number"
              min={0}
              value={form.pieces}
              onChange={(e) => setForm({ ...form, pieces: e.target.value })}
            />
          </Field>
          <Field label="Pièces assemblées">
            <input
              className="input"
              type="number"
              min={0}
              value={form.builtPieces}
              onChange={(e) => setForm({ ...form, builtPieces: e.target.value })}
            />
          </Field>
          <Field label="Statut">
            <select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {SET_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Emplacement de stockage">
            <select className="select" value={form.locationId} onChange={(e) => setForm({ ...form, locationId: e.target.value })}>
              <option value="">Aucun</option>
              {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </Field>
          <Field label="Poids du set (g)" hint="Boîte comprise, si vous le connaissez.">
            <input
              className="input"
              type="number"
              min={0}
              value={form.weightG}
              placeholder="—"
              onChange={(e) => setForm({ ...form, weightG: e.target.value })}
            />
          </Field>
          <Field label="Valeur du set (€)" hint="Prix d'achat ou valeur estimée de la boîte complète.">
            <input
              className="input"
              type="number"
              min={0}
              value={form.value}
              placeholder="—"
              onChange={(e) => setForm({ ...form, value: e.target.value })}
            />
          </Field>
          <Field label="Note" span={2}>
            <textarea
              className="input"
              rows={2}
              value={form.note}
              placeholder="Pièces manquantes, état de la boîte, notice…"
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </Field>
        </div>
      </Modal>

      <Confirm
        open={!!toDelete}
        title="Supprimer ce set ?"
        message={toDelete ? `« ${toDelete.number} · ${toDelete.name} » sera retiré de votre collection.` : ''}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          removeSet(toDelete.id)
          onConsume(`Set ${toDelete.number} supprimé`)
          setToDelete(null)
        }}
      />
    </>
  )
}
