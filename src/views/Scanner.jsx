import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Camera,
  Upload,
  ScanLine,
  Check,
  X,
  RefreshCw,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  Info,
  PackagePlus,
  Trash2,
  ArrowRight,
} from 'lucide-react'
import { detectPieces, cropThumbnails, DETECTION_PRESETS, formatConfidence, nearestLegoColor } from '../lib/vision'
import { generateDemoPhoto, DEMO_SCENES } from '../lib/demoPhoto'
import { colorHex } from '../lib/lego'
import { PIECE_CATALOG, guessWeight, guessPrice } from '../lib/catalog'
import { fmt, eur, weight } from '../lib/format'

const SESSION_KEY = 'lego-manager:scan-sessions'
const MAX_SESSIONS = 6

function loadSessions() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || '[]')
  } catch {
    return []
  }
}

export default function Scanner({ store, onConsume, onNavigate }) {
  const { parts, locations, addPart, moveStock, settings } = store

  const [image, setImage] = useState(null)
  const [imageName, setImageName] = useState('')
  const [pieces, setPieces] = useState([]) // pièces détectées et leur état
  const [busy, setBusy] = useState(false)
  const [thumbs, setThumbs] = useState({})
  const [preset, setPreset] = useState('white')
  const [tolerance, setTolerance] = useState(34)
  const [minSize, setMinSize] = useState(6)
  const [detectMeta, setDetectMeta] = useState(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [openRow, setOpenRow] = useState(null)
  const [sessions, setSessions] = useState(loadSessions)
  const [summaries, setSummaries] = useState({})
  const [lastResult, setLastResult] = useState(null)

  const imgRef = useRef(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const fileRef = useRef(null)

  useEffect(() => {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessions.slice(0, MAX_SESSIONS)))
    } catch {
      /* quota */
    }
  }, [sessions])

  /* ----------------------------- analyse ----------------------------- */
  const analyse = useCallback(
    (source) => {
      setBusy(true)
      setTimeout(() => {
        try {
          const result = detectPieces(source, {
            tolerance,
            minAreaRatio: (minSize / 100) ** 2 * 0.35,
          })
          if (result.error) {
            onConsume(result.error, '⚠️')
            setBusy(false)
            return
          }
          const withState = result.pieces.map((p) => ({
            ...p,
            name: p.match?.name || '',
            category: p.match?.category || 'Brique',
            color: p.color,
            quantity: 1,
            status: 'pending',
            inventory: p.match
              ? parts.find((x) => x.name === p.match.name && x.color === p.color)
              : parts.find((x) => x.name === p.name && x.color === p.color),
          }))
          setPieces(withState)
          setDetectMeta({ bgHex: result.bgHex, width: result.width, height: result.height })
          setThumbs(
            Object.fromEntries(
              cropThumbnails(source, result.pieces, Math.max(result.width, result.height)).map((t) => [
                t.id,
                t.dataUrl,
              ]),
            ),
          )
          setLastResult(null)
          if (!withState.length) {
            onConsume('Aucune pièce détectée — essayez un fond plus contrasté ou augmentez la tolérance.', '🔍')
          } else {
            onConsume(`${withState.length} pièce${withState.length > 1 ? 's' : ''} détectée${withState.length > 1 ? 's' : ''}`, '📸')
          }
        } catch (e) {
          console.error(e)
          onConsume(`Analyse impossible : ${e.message}`, '⚠️')
        } finally {
          setBusy(false)
        }
      }, 40)
    },
    [tolerance, minSize, parts, onConsume],
  )

  // ré-analyse (avec un léger délai) quand les réglages changent
  useEffect(() => {
    if (!image) return
    const t = setTimeout(() => {
      if (imgRef.current?.complete) analyse(imgRef.current)
    }, 280)
    return () => clearTimeout(t)
  }, [tolerance, minSize]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setTolerance(DETECTION_PRESETS.find((p) => p.id === preset)?.tolerance ?? 34)
  }, [preset])

  /* ----------------------------- sources ----------------------------- */
  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setImage(String(reader.result))
      setImageName(file.name)
      setPieces([])
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  async function startCamera() {
    setCameraError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      })
      streamRef.current = stream
      setCameraOn(true)
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
      })
    } catch (err) {
      setCameraError(
        navigator.mediaDevices
          ? "Impossible d'accéder à la caméra (autorisation refusée ou appareil indisponible). Utilisez « Importer une photo » ou une photo de démonstration."
          : "Ce navigateur ne donne pas accès à la caméra ici : utilisez l'import d'une photo.",
      )
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setCameraOn(false)
  }

  function shoot() {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    setImage(canvas.toDataURL('image/jpeg', 0.92))
    setImageName('Photo caméra')
    setPieces([])
    stopCamera()
  }

  function useDemo(sceneId) {
    const dataUrl = generateDemoPhoto(sceneId)
    setImage(dataUrl)
    setImageName(`Démo · ${DEMO_SCENES.find((s) => s.id === sceneId)?.label}`)
    setPieces([])
    stopCamera()
  }

  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), [])

  /* --------------------------- interactions --------------------------- */
  function updatePiece(id, changes) {
    setPieces((list) =>
      list.map((p) => {
        if (p.id !== id) return p
        const next = { ...p, ...changes }
        if (changes.name) {
          const cat = PIECE_CATALOG.find((c) => c.name === changes.name)
          if (cat) {
            next.category = cat.category
            next.match = { ...(p.match || {}), name: cat.name, category: cat.category }
          }
          next.inventory = parts.find((x) => x.name === next.name && x.color === next.color)
        }
        if (changes.color) {
          next.inventory = parts.find((x) => x.name === next.name && x.color === changes.color)
        }
        return next
      }),
    )
  }

  function setStatus(id, status) {
    setPieces((list) => list.map((p) => (p.id === id ? { ...p, status } : p)))
  }

  function removePiece(id) {
    setPieces((list) => list.filter((p) => p.id !== id))
  }

  function acceptAll(threshold = 55) {
    setPieces((list) =>
      list.map((p) =>
        p.status !== 'rejected' && p.status !== 'committed' && p.confidence >= threshold && p.name
          ? { ...p, status: 'accepted' }
          : p,
      ),
    )
  }

  const accepted = useMemo(() => pieces.filter((p) => p.status === 'accepted' && p.name), [pieces])
  const pending = useMemo(() => pieces.filter((p) => p.status === 'pending'), [pieces])

  const groupTotals = useMemo(() => {
    const map = new Map()
    for (const p of accepted) {
      const key = `${p.name}|${p.color}`
      if (!map.has(key)) {
        map.set(key, { name: p.name, color: p.color, category: p.category, quantity: 0 })
      }
      map.get(key).quantity += Number(p.quantity) || 0
    }
    return [...map.values()]
  }, [accepted])

  const totalUnits = groupTotals.reduce((a, g) => a + g.quantity, 0)
  const totalWeight = groupTotals.reduce((a, g) => a + g.quantity * guessWeight(g.name, g.category), 0)
  const totalValue = groupTotals.reduce(
    (a, g) => a + g.quantity * guessPrice(g.name, g.category, g.color),
    0,
  )

  /* --------------------------- validation --------------------------- */
  function commit() {
    if (!groupTotals.length) return
    const details = []
    let updated = 0
    let created = 0

    for (const g of groupTotals) {
      const existing = parts.find((p) => p.name === g.name && p.color === g.color)
      if (existing) {
        moveStock(existing.id, g.quantity, `Scanner photo · ${g.name} ${g.color}`)
        updated += 1
        details.push({ ...g, mode: 'update', target: existing.id })
      } else {
        addPart({
          name: g.name,
          category: g.category,
          color: g.color,
          quantity: g.quantity,
          locationId: locations[0]?.id || '',
          condition: 'Neuf',
          note: 'Créé par le scanner photo',
          weightG: null,
          pricePerPiece: null,
        })
        created += 1
        details.push({ ...g, mode: 'create' })
      }
    }

    const session = {
      id: `scan-${Date.now()}`,
      date: Date.now(),
      source: imageName || 'Photo',
      detected: pieces.length,
      groups: details,
      units: totalUnits,
      weightG: totalWeight,
      value: totalValue,
      thumbnail: image,
      summary: `${created} nouvelle${created > 1 ? 's' : ''} référence${created > 1 ? 's' : ''}, ${updated} mise${updated > 1 ? 's' : ''} à jour`,
    }
    setSessions((s) => [session, ...s].slice(0, MAX_SESSIONS))
    setLastResult(session)
    onConsume(
      `${totalUnits} pièce${totalUnits > 1 ? 's' : ''} ajoutée${totalUnits > 1 ? 's' : ''} à l’inventaire`,
      '✅',
    )
    setPieces((list) => list.map((p) => (p.status === 'accepted' ? { ...p, status: 'committed' } : p)))
  }

  function reset() {
    setImage(null)
    setImageName('')
    setPieces([])
    setThumbs({})
    setDetectMeta(null)
    setLastResult(null)
  }

  const renameSession = (session) => {
    const label = window.prompt('Nom de la session de comptage', session.source)
    if (!label) return
    setSessions((list) => list.map((s) => (s.id === session.id ? { ...s, source: label } : s)))
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* ---------------------------- capture ---------------------------- */}
      <div className="card">
        <div className="card-head">
          <ScanLine size={15} />
          <h2>Reconnaissance photo</h2>
          <span className="hint" style={{ marginLeft: 'auto' }}>
            {pieces.length > 0
              ? `${pieces.length} pièce(s) sur la photo`
              : 'Déposez vos pièces sur un fond uni, puis photographiez-les vues du dessus'}
          </span>
        </div>

        <div className="card-body" style={{ display: 'grid', gap: 14 }}>
          {!image && !cameraOn && (
            <div
              style={{
                border: '1.5px dashed var(--border-strong)',
                borderRadius: 14,
                padding: '26px 18px',
                textAlign: 'center',
                background: 'var(--surface-2)',
              }}
            >
              <div style={{ fontSize: 30 }}>📷</div>
              <h3 style={{ margin: '10px 0 4px', fontSize: 14.5 }}>Photographiez vos pièces</h3>
              <p style={{ margin: '0 auto 14px', maxWidth: 520, fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.55 }}>
                L’outil compte les pièces, lit leur couleur et propose une référence LEGO pour chacune.
                Pour de bons résultats : fond blanc ou uni, lumière diffuse, pièces espacées et vues du dessus.
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={startCamera}>
                  <Camera size={15} /> Ouvrir la caméra
                </button>
                <button className="btn" onClick={() => fileRef.current?.click()}>
                  <Upload size={15} /> Importer une photo
                </button>
                <button className="btn btn-accent" onClick={() => useDemo('bricks')}>
                  <Sparkles size={15} /> Photo de démonstration
                </button>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
              </div>
              {cameraError && (
                <p style={{ margin: '12px 0 0', fontSize: 12, color: 'var(--red)' }}>{cameraError}</p>
              )}
              <div style={{ marginTop: 14, display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                {DEMO_SCENES.map((s) => (
                  <button key={s.id} className="btn btn-ghost btn-sm" onClick={() => useDemo(s.id)}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {cameraOn && (
            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#000' }}>
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  style={{ width: '100%', maxHeight: 460, objectFit: 'contain', display: 'block' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: '8%',
                    border: '2px dashed rgba(255,255,255,0.55)',
                    borderRadius: 10,
                    pointerEvents: 'none',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={shoot}>
                  <Camera size={15} /> Prendre la photo
                </button>
                <button className="btn" onClick={stopCamera}>
                  Annuler
                </button>
              </div>
            </div>
          )}

          {image && (
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                <img
                  ref={imgRef}
                  src={image}
                  alt="Photo à analyser"
                  style={{ width: '100%', maxHeight: 520, objectFit: 'contain', display: 'block' }}
                  onLoad={() => analyse(imgRef.current)}
                />
                {busy && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(10,14,20,0.55)',
                      color: '#fff',
                      display: 'grid',
                      placeItems: 'center',
                      fontWeight: 600,
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'grid', justifyItems: 'center', gap: 10 }}>
                      <RefreshCw size={26} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                      Analyse de la photo…
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <button className="btn btn-sm" onClick={() => analyse(imgRef.current)} disabled={busy}>
                  <RefreshCw size={13} /> Relancer l’analyse
                </button>
                <button className="btn btn-sm" onClick={() => fileRef.current?.click()}>
                  <Upload size={13} /> Changer de photo
                </button>
                <button className="btn btn-sm" onClick={startCamera}>
                  <Camera size={13} /> Reprendre une photo
                </button>
                <button className="btn btn-sm btn-ghost" onClick={reset}>
                  <Trash2 size={13} /> Fermer
                </button>
                {detectMeta && (
                  <span className="chip" style={{ marginLeft: 'auto', fontSize: 11 }}>
                    fond détecté{' '}
                    <span className="swatch" style={{ width: 10, height: 10, borderRadius: 3, background: detectMeta.bgHex }} />
                    {nearestLegoColor(detectMeta.bgHex).name} · {fmt(pieces.length)} pièce(s)
                  </span>
                )}
              </div>

              {/* réglages */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                  gap: 14,
                  padding: 14,
                  borderRadius: 10,
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                }}
              >
                <div className="field">
                  <label>Type de fond</label>
                  <select className="select" value={preset} onChange={(e) => setPreset(e.target.value)}>
                    {DETECTION_PRESETS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  <span className="help">{DETECTION_PRESETS.find((p) => p.id === preset)?.hint}</span>
                </div>
                <div className="field">
                  <label>Contraste avec le fond : {tolerance}</label>
                  <input
                    type="range"
                    min={15}
                    max={90}
                    value={tolerance}
                    onChange={(e) => setTolerance(Number(e.target.value))}
                  />
                  <span className="help">Augmentez si des pièces ne sont pas détectées.</span>
                </div>
                <div className="field">
                  <label>Taille minimale : {minSize} % de l’image</label>
                  <input
                    type="range"
                    min={2}
                    max={20}
                    value={minSize}
                    onChange={(e) => setMinSize(Number(e.target.value))}
                  />
                  <span className="help">Ignore les poussières et les petites ombres.</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ---------------------------- résultats ---------------------------- */}
      {pieces.length > 0 && (
        <div className="card">
          <div className="card-head">
            <Layers size={15} />
            <h2>Pièces reconnues</h2>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="chip" style={{ fontSize: 11.5 }}>
                {pieces.filter((p) => p.status === 'accepted').length} validée(s)
              </span>
              <button className="btn btn-sm" onClick={() => acceptAll(55)}>
                <Check size={13} /> Tout valider (confiance ≥ 55 %)
              </button>
              <button
                className="btn btn-sm btn-ghost"
                onClick={() =>
                  setPieces((list) =>
                    list.map((p) => (p.status === 'committed' ? p : { ...p, status: 'pending' })),
                  )
                }
              >
                Réinitialiser
              </button>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 56 }}>Photo</th>
                  <th>Pièce détectée</th>
                  <th>Couleur</th>
                  <th>Indices</th>
                  <th>Confiance</th>
                  <th>Référence retenue</th>
                  <th style={{ width: 84 }}>Qté</th>
                  <th>Stock actuel</th>
                  <th style={{ width: 132 }}>Décision</th>
                </tr>
              </thead>
              <tbody>
                {pieces.map((p) => {
                  const conf = formatConfidence(p.confidence)
                  const inv = parts.find((x) => x.name === p.name && x.color === p.color)
                  const isOpen = openRow === p.id
                  return (
                    <Fragment key={p.id}>
                      <tr
                        style={{
                          opacity: p.status === 'rejected' ? 0.45 : 1,
                          background: p.status === 'committed' ? 'rgba(31,138,70,0.06)' : undefined,
                        }}
                      >
                        <td>
                          {thumbs[p.id] ? (
                            <img
                              src={thumbs[p.id]}
                              alt=""
                              style={{ width: 42, height: 42, objectFit: 'cover', borderRadius: 7, border: '1px solid var(--border)' }}
                            />
                          ) : (
                            <span className="swatch" style={{ background: p.colorHex }} />
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <span className="cell-muted num" style={{ fontSize: 11 }}>
                              #{p.index}
                            </span>
                            <select
                              className="select"
                              style={{ maxWidth: 190, fontSize: 12, padding: '4px 24px 4px 8px' }}
                              value={p.name}
                              onChange={(e) => updatePiece(p.id, { name: e.target.value })}
                            >
                              {!p.name && <option value="">— choisir —</option>}
                              {PIECE_CATALOG.map((c) => (
                                <option key={c.name} value={c.name}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="cell-muted" style={{ fontSize: 10.5, marginTop: 2 }}>
                            {p.category}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="swatch" style={{ width: 16, height: 16, borderRadius: 4, background: p.colorHex }} />
                            <select
                              className="select"
                              style={{ fontSize: 12, padding: '4px 24px 4px 8px', maxWidth: 130 }}
                              value={p.color}
                              onChange={(e) => updatePiece(p.id, { color: e.target.value })}
                            >
                              {[...new Set([p.color, ...parts.map((x) => x.color)])].map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td className="cell-muted" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                          {p.studs > 0 ? `${p.studs} tenons` : 'surface lisse'}
                          <div style={{ fontSize: 10.5 }}>
                            {p.box.w}×{p.box.h} px · remplissage {Math.round(p.fill * 100)} %
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'grid', gap: 3 }}>
                            <span className={`badge ${conf.tone}`}>{p.confidence} %</span>
                            {p.status === 'committed' && <span className="badge green" style={{ fontSize: 10 }}>comptabilisée</span>}
                            {p.ambiguous && (
                              <span className="badge grey" style={{ fontSize: 10 }} title="Empreinte identique pour plusieurs hauteurs : vérifiez brique / plaque / tuile">
                                à confirmer
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ padding: '2px 6px', fontSize: 11.5 }}
                            onClick={() => setOpenRow(isOpen ? null : p.id)}
                          >
                            {p.candidates.length} piste(s) {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>
                          {isOpen && (
                            <div style={{ display: 'grid', gap: 3, marginTop: 4 }}>
                              {p.candidates.map((c, i) => (
                                <button
                                  key={c.name}
                                  className="btn btn-ghost btn-sm"
                                  style={{
                                    justifyContent: 'space-between',
                                    fontSize: 11,
                                    fontWeight: i === 0 ? 700 : 500,
                                    padding: '2px 6px',
                                  }}
                                  onClick={() => updatePiece(p.id, { name: c.name })}
                                >
                                  <span>
                                    {i + 1}. {c.name}
                                  </span>
                                  <span className="cell-muted">{c.confidence} %</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </td>
                        <td>
                          <input
                            className="input"
                            type="number"
                            min={1}
                            value={p.quantity}
                            style={{ width: 62, padding: '4px 6px', fontSize: 12 }}
                            onChange={(e) => updatePiece(p.id, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                          />
                        </td>
                        <td className="cell-muted" style={{ fontSize: 11.5 }}>
                          {inv ? (
                            <>
                              <strong style={{ color: 'var(--text)' }}>{fmt(inv.quantity)}</strong> en stock
                            </>
                          ) : (
                            <span className="badge blue" style={{ fontSize: 10.5 }}>
                              nouveau
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 3 }}>
                            <button
                              className={`btn btn-icon btn-sm ${p.status === 'accepted' ? 'btn-primary' : ''}`}
                              title="Comptabiliser cette pièce"
                              onClick={() => setStatus(p.id, p.status === 'accepted' ? 'pending' : 'accepted')}
                              style={
                                p.status === 'accepted'
                                  ? { background: 'var(--green)', borderColor: 'var(--green)', color: '#fff' }
                                  : undefined
                              }
                            >
                              <Check size={14} />
                            </button>
                            <button
                              className="btn btn-icon btn-sm"
                              title="Ignorer"
                              onClick={() => setStatus(p.id, 'rejected')}
                              style={p.status === 'rejected' ? { background: 'var(--red)', borderColor: 'var(--red)', color: '#fff' } : undefined}
                            >
                              <X size={14} />
                            </button>
                            <button className="btn btn-ghost btn-icon btn-sm" title="Retirer de la liste" onClick={() => removePiece(p.id)}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 14,
              alignItems: 'center',
              flexWrap: 'wrap',
              padding: '12px 16px',
              borderTop: '1px solid var(--border)',
              background: 'var(--surface-2)',
              borderRadius: '0 0 var(--radius) var(--radius)',
            }}
          >
            <span style={{ fontSize: 12.5 }}>
              <strong>{fmt(totalUnits)}</strong> pièce(s) à comptabiliser sur{' '}
              <strong>{groupTotals.length}</strong> référence(s)
            </span>
            <span className="cell-muted" style={{ fontSize: 12 }}>
              ≈ {weight(totalWeight)} · {eur(totalValue)}
            </span>
            {pending.length > 0 && (
              <span className="cell-muted" style={{ fontSize: 11.5 }}>
                ({pending.length} en attente de décision)
              </span>
            )}
            <button
              className="btn btn-primary"
              style={{ marginLeft: 'auto' }}
              disabled={!groupTotals.length}
              onClick={() => commit()}
            >
              <PackagePlus size={15} /> Ajouter à l’inventaire
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------- récapitulatif ---------------------------- */}
      {lastResult && (
        <div className="card" style={{ borderColor: 'var(--green)' }}>
          <div className="card-head">
            <Check size={15} style={{ color: 'var(--green)' }} />
            <h2>Comptage enregistré</h2>
            <span className="hint" style={{ marginLeft: 'auto' }}>
              {lastResult.summary}
            </span>
          </div>
          <div className="list">
            {lastResult.groups.map((g) => (
              <div className="list-row" key={`${g.name}-${g.color}`}>
                <span className="swatch" style={{ background: colorHex(g.color) }} />
                <div className="list-main">
                  <div className="list-title">
                    {g.name} <span className="cell-muted">· {g.color}</span>
                  </div>
                  <div className="list-sub">{g.category}</div>
                </div>
                <span className="badge grey">+{g.quantity}</span>
                <span className={`badge ${g.mode === 'create' ? 'blue' : 'green'}`}>
                  {g.mode === 'create' ? 'créé' : 'ajouté au stock'}
                </span>
              </div>
            ))}
          </div>
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn" onClick={() => onNavigate('parts')}>
              Voir l’inventaire <ArrowRight size={13} />
            </button>
            <button className="btn" onClick={() => onNavigate('movements')}>
              Historique des mouvements
            </button>
            <button className="btn btn-ghost" style={{ marginLeft: 'auto' }} onClick={reset}>
              Scanner une nouvelle photo
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------- sessions ---------------------------- */}
      <div className="card">
        <div className="card-head">
          <Info size={15} />
          <h2>Sessions de comptage</h2>
          <span className="hint" style={{ marginLeft: 'auto' }}>
            {sessions.length ? 'les 6 dernières' : 'aucune pour l’instant'}
          </span>
        </div>
        {sessions.length === 0 ? (
          <div style={{ padding: 20 }}>
            <p className="cell-muted" style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>
              Chaque validation du scanner crée une session : elle conserve la photo, le nombre de pièces
              comptées, les références retenues, le poids et la valeur du lot. Utile pour retrouver
              « qu’est-ce que j’ai compté, et sur quelle base ? ».
            </p>
          </div>
        ) : (
          <div className="list">
            {sessions.map((s) => (
              <div className="list-row" key={s.id}>
                {s.thumbnail ? (
                  <img
                    src={s.thumbnail}
                    alt=""
                    style={{ width: 46, height: 46, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }}
                  />
                ) : (
                  <span className="loc-icon">📸</span>
                )}
                <div className="list-main">
                  <div className="list-title">{s.source}</div>
                  <div className="list-sub">
                    {new Date(s.date).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}{' '}
                    · {s.units} pièces · {weight(s.weightG)} · {eur(s.value)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {s.groups.slice(0, 3).map((g) => (
                    <span className="chip" key={g.name + g.color} style={{ fontSize: 10.5 }}>
                      <span className="swatch" style={{ width: 9, height: 9, borderRadius: 3, background: colorHex(g.color) }} />
                      {g.name} ×{g.quantity}
                    </span>
                  ))}
                  {s.groups.length > 3 && (
                    <span className="chip" style={{ fontSize: 10.5 }}>
                      +{s.groups.length - 3}
                    </span>
                  )}
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => renameSession(s)} title="Renommer">
                  ✎
                </button>
                <button
                  className="btn btn-ghost btn-icon btn-sm"
                  style={{ color: 'var(--red)' }}
                  title="Supprimer la session"
                  onClick={() => setSessions((list) => list.filter((x) => x.id !== s.id))}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
