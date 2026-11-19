import { useMemo } from 'react'
import {
  Blocks,
  Package,
  AlertTriangle,
  Layers,
  Plus,
  ArrowRight,
  TrendingDown,
  CircleSlash,
  Boxes,
} from 'lucide-react'
import { CATEGORY_META, colorHex } from '../lib/lego'
import { fmt, relDate } from '../lib/format'
import { Empty } from '../components/ui'

function Stat({ label, value, foot, icon, accent }) {
  return (
    <div className={`stat ${accent ? 'accent' : ''}`}>
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        <span className="stat-icon">{icon}</span>
      </div>
      <div className="stat-value">{value}</div>
      {foot && <div className="stat-foot">{foot}</div>}
    </div>
  )
}

export default function Dashboard({ store, onNavigate, onQuickAdd }) {
  const { parts, sets, locations, transactions, stats } = store

  const topCategories = useMemo(() => {
    const entries = Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1])
    const max = Math.max(1, ...entries.map((e) => e[1]))
    return entries.slice(0, 7).map(([name, qty]) => ({
      name,
      qty,
      pct: (qty / max) * 100,
      meta: CATEGORY_META[name] || CATEGORY_META.Autre,
    }))
  }, [stats.byCategory])

  const topColors = useMemo(() => {
    const entries = Object.entries(stats.byColor).sort((a, b) => b[1] - a[1])
    const total = entries.reduce((a, e) => a + e[1], 0) || 1
    return entries.slice(0, 8).map(([name, qty]) => ({
      name,
      qty,
      pct: (qty / total) * 100,
      hex: colorHex(name),
    }))
  }, [stats.byColor])

  const recent = transactions.slice(0, 6)
  const partById = useMemo(() => Object.fromEntries(parts.map((p) => [p.id, p])), [parts])
  const locById = useMemo(() => Object.fromEntries(locations.map((l) => [l.id, l])), [locations])

  const inProgress = sets.filter((s) => s.status === 'En construction' || s.status === 'Incomplet')

  if (!parts.length && !sets.length) {
    return (
      <div className="card">
        <Empty
          emoji="🧱"
          title="Votre collection est vide"
          message="Ajoutez votre première pièce LEGO pour commencer à suivre votre inventaire, ou chargez les données de démonstration depuis les réglages."
          action={
            <button className="btn btn-accent" onClick={() => onQuickAdd('part')}>
              <Plus size={15} /> Ajouter une pièce
            </button>
          }
        />
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="stat-grid">
        <Stat
          label="Pièces en stock"
          value={fmt(stats.totalParts)}
          foot={`${fmt(stats.totalRefs)} références distinctes`}
          icon={<Blocks size={16} />}
          accent
        />
        <Stat
          label="Sets suivis"
          value={fmt(stats.totalSets)}
          foot={`${fmt(stats.totalSetPieces)} pièces au catalogue`}
          icon={<Package size={16} />}
        />
        <Stat
          label="Stock bas"
          value={fmt(stats.lowStock.length)}
          foot={`Seuil ≤ ${stats.threshold} pièces`}
          icon={<AlertTriangle size={16} />}
        />
        <Stat
          label="Rangement"
          value={fmt(stats.locationsUsed)}
          foot={locations.length ? `sur ${fmt(locations.length)} emplacements` : 'Aucun emplacement'}
          icon={<Boxes size={16} />}
        />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <Layers size={15} />
            <h2>Répartition par catégorie</h2>
            <span className="hint" style={{ marginLeft: 'auto' }}>
              en nombre de pièces
            </span>
          </div>
          <div className="card-body">
            {topCategories.length === 0 ? (
              <p className="cell-muted" style={{ margin: 0 }}>
                Aucune pièce enregistrée.
              </p>
            ) : (
              <div className="bars">
                {topCategories.map((c) => (
                  <div className="bar-row" key={c.name}>
                    <span className="lbl">
                      <span aria-hidden>{c.meta.icon}</span>
                      {c.name}
                    </span>
                    <span className="bar-track">
                      <span
                        className="bar-fill"
                        style={{ width: `${Math.max(2, c.pct)}%`, background: c.meta.color }}
                      />
                    </span>
                    <span className="val">{fmt(c.qty)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <AlertTriangle size={15} style={{ color: 'var(--amber)' }} />
            <h2>À réapprovisionner</h2>
            <button
              className="btn btn-ghost btn-sm"
              style={{ marginLeft: 'auto' }}
              onClick={() => onNavigate('parts', { filter: 'low' })}
            >
              Tout voir <ArrowRight size={13} />
            </button>
          </div>
          <div style={{ maxHeight: 322, overflowY: 'auto' }}>
            {stats.lowStock.length === 0 ? (
              <div style={{ padding: 20 }}>
                <p className="cell-muted" style={{ margin: 0, fontSize: 13 }}>
                  Tous vos stocks sont confortables.
                </p>
              </div>
            ) : (
              <div className="list">
                {[...stats.lowStock]
                  .sort((a, b) => a.quantity - b.quantity)
                  .slice(0, 8)
                  .map((p) => (
                    <div className="list-row" key={p.id}>
                      <span className="swatch" style={{ background: colorHex(p.color) }} />
                      <div className="list-main">
                        <div className="list-title">{p.name}</div>
                        <div className="list-sub">
                          {p.color} · {locById[p.locationId]?.name || 'Non rangé'}
                        </div>
                      </div>
                      <span className={`badge ${p.quantity === 0 ? 'red' : 'amber'}`}>
                        {p.quantity === 0 ? <CircleSlash size={11} /> : <TrendingDown size={11} />}
                        {p.quantity}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <Blocks size={15} />
            <h2>Derniers mouvements</h2>
            <button
              className="btn btn-ghost btn-sm"
              style={{ marginLeft: 'auto' }}
              onClick={() => onNavigate('movements')}
            >
              Historique <ArrowRight size={13} />
            </button>
          </div>
          {recent.length === 0 ? (
            <div style={{ padding: 20 }}>
              <p className="cell-muted" style={{ margin: 0, fontSize: 13 }}>
                Aucun mouvement enregistré.
              </p>
            </div>
          ) : (
            <div className="list">
              {recent.map((t) => {
                const p = partById[t.partId]
                return (
                  <div className="list-row" key={t.id}>
                    <span className={`badge ${t.type === 'in' ? 'green' : 'red'}`} style={{ minWidth: 56, justifyContent: 'center' }}>
                      {t.type === 'in' ? '+' : '−'}
                      {t.quantity}
                    </span>
                    <div className="list-main">
                      <div className="list-title">{p ? p.name : 'Pièce supprimée'}</div>
                      <div className="list-sub">{t.reason}</div>
                    </div>
                    <span className="cell-muted" style={{ fontSize: 11.5 }}>
                      {relDate(t.date)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <span aria-hidden style={{ fontSize: 15 }}>🎨</span>
            <h2>Palette dominante</h2>
            <span className="hint" style={{ marginLeft: 'auto' }}>
              top couleurs
            </span>
          </div>
          <div className="card-body">
            {topColors.length === 0 ? (
              <p className="cell-muted" style={{ margin: 0 }}>
                Aucune donnée.
              </p>
            ) : (
              <>
                <div style={{ display: 'flex', height: 14, borderRadius: 7, overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 16 }}>
                  {topColors.map((c) => (
                    <span key={c.name} style={{ width: `${c.pct}%`, background: c.hex }} title={`${c.name} — ${fmt(c.qty)}`} />
                  ))}
                </div>
                <div className="chips">
                  {topColors.map((c) => (
                    <span className="chip" key={c.name}>
                      <span className="swatch" style={{ width: 12, height: 12, borderRadius: 4, background: c.hex }} />
                      {c.name}
                      <strong style={{ color: 'var(--text)' }}>{fmt(c.qty)}</strong>
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {inProgress.length > 0 && (
        <div className="card">
          <div className="card-head">
            <Package size={15} />
            <h2>Chantiers en cours</h2>
            <button
              className="btn btn-ghost btn-sm"
              style={{ marginLeft: 'auto' }}
              onClick={() => onNavigate('sets')}
            >
              Voir les sets <ArrowRight size={13} />
            </button>
          </div>
          <div className="card-body" style={{ display: 'grid', gap: 14 }}>
            {inProgress.map((s) => {
              const pct = s.pieces ? Math.min(100, Math.round((s.builtPieces / s.pieces) * 100)) : 0
              return (
                <div key={s.id} style={{ display: 'grid', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <strong style={{ fontSize: 13 }}>
                      {s.number} · {s.name}
                    </strong>
                    <span className={`badge ${s.status === 'Incomplet' ? 'red' : 'blue'}`} style={{ marginLeft: 'auto' }}>
                      {s.status}
                    </span>
                  </div>
                  <div className="progress">
                    <i style={{ width: `${pct}%` }} />
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                    {fmt(s.builtPieces)} / {fmt(s.pieces)} pièces assemblées ({pct}%)
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
