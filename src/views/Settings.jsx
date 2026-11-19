import { useRef, useState } from 'react'
import { Download, Upload, RotateCcw, Trash2, Save, Moon, Sun, Info, Scale } from 'lucide-react'
import { Field, Confirm } from '../components/ui'
import { download } from '../lib/format'

export default function Settings({ store, theme, setTheme, onConsume }) {
  const { settings, updateSettings, parts, sets, locations, transactions, resetDemo, clearAll, importData } = store
  const [threshold, setThreshold] = useState(settings.lowStockThreshold ?? 10)
  const [usedFactor, setUsedFactor] = useState(Math.round((settings.usedPriceFactor ?? 0.7) * 100))
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [confirmDemo, setConfirmDemo] = useState(false)
  const fileRef = useRef(null)

  function exportJson() {
    const payload = { version: 1, exportedAt: new Date().toISOString(), parts, sets, locations, transactions, settings }
    download(`lego-manager-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(payload, null, 2))
    onConsume('Sauvegarde JSON téléchargée')
  }

  function onFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result))
        importData(data)
        onConsume(`Données importées : ${data.parts?.length ?? 0} pièces`)
      } catch (err) {
        onConsume(`Import impossible : ${err.message}`)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const totalEntries = parts.length + sets.length + locations.length + transactions.length

  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 860 }}>
      <div className="card">
        <div className="card-head">
          <Save size={15} />
          <h2>Préférences</h2>
        </div>
        <div className="card-body">
          <div className="form-grid">
            <Field label="Seuil de stock bas" hint="Une pièce est signalée quand sa quantité est inférieure ou égale à ce seuil.">
              <div className="field-row">
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                />
                <button
                  className="btn"
                  onClick={() => {
                    updateSettings({ lowStockThreshold: Math.max(0, Number(threshold) || 0) })
                    onConsume(`Seuil défini à ${threshold} pièces`)
                  }}
                >
                  Appliquer
                </button>
              </div>
            </Field>
            <Field
              label="Décote des pièces d'occasion"
              hint={`Les pièces marquées « Occasion » sont valorisées à ${usedFactor} % du prix neuf ; « Abîmé » à ${Math.round(usedFactor * 0.6)} %.`}
            >
              <div className="field-row">
                <input
                  className="input"
                  type="number"
                  min={0}
                  max={100}
                  value={usedFactor}
                  onChange={(e) => setUsedFactor(e.target.value)}
                />
                <span className="cell-muted">%</span>
                <button
                  className="btn"
                  onClick={() => {
                    const v = Math.min(100, Math.max(0, Number(usedFactor) || 0)) / 100
                    updateSettings({ usedPriceFactor: v })
                    onConsume(`Décote occasion définie à ${Math.round(v * 100)} %`)
                  }}
                >
                  Appliquer
                </button>
              </div>
            </Field>
            <Field label="Apparence">
              <div className="segmented" style={{ alignSelf: 'flex-start' }}>
                <button className={theme === 'light' ? 'on' : ''} onClick={() => setTheme('light')}>
                  <Sun size={13} style={{ marginRight: 4, verticalAlign: -2 }} /> Clair
                </button>
                <button className={theme === 'dark' ? 'on' : ''} onClick={() => setTheme('dark')}>
                  <Moon size={13} style={{ marginRight: 4, verticalAlign: -2 }} /> Sombre
                </button>
              </div>
            </Field>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <Scale size={15} />
          <h2>Comment sont calculés le poids et la valeur</h2>
        </div>
        <div className="card-body">
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, lineHeight: 1.7, color: 'var(--muted)' }}>
            <li>
              <strong style={{ color: 'var(--text)' }}>Poids</strong> : masse unitaire de la pièce (g) × quantité.
              L’application propose une estimation issue d’un référentiel de 60 pièces courantes ; vous pouvez la
              remplacer par votre propre pesée dans la fiche de chaque pièce.
            </li>
            <li>
              <strong style={{ color: 'var(--text)' }}>Valeur</strong> : prix unitaire (€) × quantité, avec décote
              éventuelle selon l’état. Le prix par défaut vient du même référentiel (ordre de grandeur du neuf) et
              peut être personnalisé pièce par pièce.
            </li>
            <li>
              Les sets peuvent aussi porter un <strong style={{ color: 'var(--text)' }}>poids</strong> et une{' '}
              <strong style={{ color: 'var(--text)' }}>valeur</strong> globale, additionnés au total de la collection
              dans les rapports.
            </li>
          </ul>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <Download size={15} />
          <h2>Sauvegarde et restauration</h2>
        </div>
        <div className="card-body" style={{ display: 'grid', gap: 14 }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', lineHeight: 1.55 }}>
            Vos données sont enregistrées localement dans ce navigateur ({totalEntries} enregistrements
            actuellement). Exportez régulièrement une sauvegarde JSON pour les conserver ou les transférer
            sur un autre appareil.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn" onClick={exportJson}>
              <Download size={14} /> Exporter tout (JSON)
            </button>
            <button className="btn" onClick={() => fileRef.current?.click()}>
              <Upload size={14} /> Importer une sauvegarde
            </button>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onFile} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <RotateCcw size={15} />
          <h2>Données</h2>
        </div>
        <div className="card-body" style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div style={{ maxWidth: 460 }}>
              <div style={{ fontWeight: 650, fontSize: 13 }}>Charger la collection de démonstration</div>
              <div className="cell-muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                36 références de pièces, 5 sets, 3 emplacements et un historique de mouvements. Remplace les données actuelles.
              </div>
            </div>
            <button className="btn" onClick={() => setConfirmDemo(true)}>
              <RotateCcw size={14} /> Charger la démo
            </button>
          </div>
          <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: '2px 0' }} />
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div style={{ maxWidth: 460 }}>
              <div style={{ fontWeight: 650, fontSize: 13 }}>Tout effacer</div>
              <div className="cell-muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                Supprime définitivement l’ensemble de l’inventaire. Pensez à exporter une sauvegarde avant.
              </div>
            </div>
            <button className="btn btn-danger" onClick={() => setConfirmClear(true)}>
              <Trash2 size={14} /> Effacer l’inventaire
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <Info size={15} />
          <h2>À propos</h2>
        </div>
        <div className="card-body">
          <dl className="kv">
            <dt>Application</dt>
            <dd>Lego Manager · v1.0</dd>
            <dt>Stockage</dt>
            <dd>localStorage du navigateur — aucune donnée envoyée sur Internet</dd>
            <dt>Référentiel</dt>
            <dd>20 couleurs LEGO officielles, 13 catégories de pièces</dd>
          </dl>
        </div>
      </div>

      <Confirm
        open={confirmDemo}
        title="Charger la collection de démonstration ?"
        message="Toutes les données actuelles seront remplacées par un jeu d’exemple complet."
        confirmLabel="Charger la démo"
        danger={false}
        onCancel={() => setConfirmDemo(false)}
        onConfirm={() => {
          resetDemo()
          setConfirmDemo(false)
          onConsume('Collection de démonstration chargée')
        }}
      />
      <Confirm
        open={confirmClear}
        title="Effacer tout l’inventaire ?"
        message="Cette action est irréversible. Toutes les pièces, sets, emplacements et mouvements seront supprimés de ce navigateur."
        confirmLabel="Tout effacer"
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          clearAll()
          setConfirmClear(false)
          onConsume('Inventaire effacé')
        }}
      />
    </div>
  )
}
