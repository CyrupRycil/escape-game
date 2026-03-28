'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Enigme, Equipe, EquipeEnigmeStat } from '@/lib/types'
// ─── Fonctions utilitaires ───────────────────────────────────────

function duree(started_at: string, finished_at: string | null): string {
  if (!finished_at) return '—'
  const sec = Math.floor((new Date(finished_at).getTime() - new Date(started_at).getTime()) / 1000)
  const min = Math.floor(sec / 60).toString().padStart(2, '0')
  const s = (sec % 60).toString().padStart(2, '0')
  return `${min}:${s}`
}

function dureeEnSecondes(started_at: string, finished_at: string | null): number {
  if (!finished_at) return 99999
  return Math.floor((new Date(finished_at).getTime() - new Date(started_at).getTime()) / 1000)
}

function tempsTotal(stats: EquipeEnigmeStat[]): string {
  const total = stats.reduce((acc, s) => acc + dureeEnSecondes(s.started_at, s.finished_at), 0)
  const min = Math.floor(total / 60).toString().padStart(2, '0')
  const sec = (total % 60).toString().padStart(2, '0')
  return `${min}:${sec}`
}

function scoreMedaille(score: number, max: number): { emoji: string; label: string; color: string } {
  const pct = max > 0 ? score / max : 0
  if (pct >= 0.9) return { emoji: '🥇', label: 'Excellent !', color: 'var(--or)' }
  if (pct >= 0.7) return { emoji: '🥈', label: 'Très bien !', color: '#A8A8A8' }
  if (pct >= 0.5) return { emoji: '🥉', label: 'Bien joué !', color: '#C4905A' }
  return { emoji: '🌿', label: 'Bonne tentative !', color: 'var(--sauge)' }
}

// ─── Page résultats ──────────────────────────────────────────────

function PageResultats({
  equipe,
  stats,
  enigmes,
}: {
  equipe: Equipe
  stats: EquipeEnigmeStat[]
  enigmes: Enigme[]
}) {
  const scoreMax = enigmes.reduce((acc, e) => acc + e.points_max, 0)
  const medaille = scoreMedaille(equipe.score_total, scoreMax)

  return (
    <main className="bg-champetre min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-xl">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">{medaille.emoji}</div>
          <div className="text-3xl mb-3 tracking-widest">🌸 🌿 🌸</div>
          <h1 className="text-4xl mb-1" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--brun)' }}>
            {medaille.label}
          </h1>
          <p className="text-lg" style={{ color: 'var(--brun-clair)', fontFamily: 'var(--font-playfair)' }}>
            {equipe.nom}
          </p>
          <div className="separateur flex justify-center my-4" />
        </div>

        {/* Score total */}
        <div className="carte p-6 mb-5 text-center shadow-md">
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--sauge)' }}>
            Score final
          </p>
          <p className="text-5xl font-bold mb-1" style={{ color: medaille.color, fontFamily: 'var(--font-playfair)' }}>
            {equipe.score_total}
            <span className="text-2xl" style={{ color: 'var(--or)' }}> pts</span>
          </p>
          <p className="text-sm" style={{ color: 'var(--brun-clair)' }}>
            sur {scoreMax} pts possibles
          </p>

          {/* Barre de score */}
          <div className="mt-4 rounded-full h-2" style={{ background: 'rgba(138,158,126,0.2)' }}>
            <div
              className="h-2 rounded-full transition-all"
              style={{
                width: `${Math.min(100, (equipe.score_total / Math.max(scoreMax, 1)) * 100)}%`,
                background: 'linear-gradient(90deg, var(--sauge), var(--or))',
              }}
            />
          </div>

          <p className="text-xs mt-3" style={{ color: 'var(--sauge)' }}>
            ⏱ Temps total : <strong>{tempsTotal(stats)}</strong>
          </p>
        </div>

        {/* Détail par énigme */}
        <div className="carte p-5 mb-6 shadow-md">
          <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--brun)' }}>
            Détail par énigme
          </h2>

          <div className="flex flex-col gap-2">
            {enigmes.map((enigme) => {
              const stat = stats.find((s) => s.enigme_id === enigme.id)
              const pts = stat?.points_gagnes ?? 0
              const indices = stat?.indices_utilises ?? 0
              const t = stat ? duree(stat.started_at, stat.finished_at) : '—'
              const pct = enigme.points_max > 0 ? pts / enigme.points_max : 0

              return (
                <div
                  key={enigme.id}
                  className="rounded-xl px-4 py-3"
                  style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(196,164,90,0.15)' }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(138,158,126,0.15)', color: 'var(--sauge-fonce)' }}
                      >
                        #{enigme.ordre}
                      </span>
                      <span className="text-sm font-semibold" style={{ color: 'var(--brun)', fontFamily: 'var(--font-playfair)' }}>
                        {enigme.titre}
                      </span>
                    </div>
                    <span
                      className="text-sm font-bold"
                      style={{ color: pct >= 0.9 ? 'var(--or)' : pct >= 0.5 ? 'var(--sauge)' : 'var(--rose)' }}
                    >
                      {pts} pts
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs" style={{ color: 'var(--sauge)' }}>⏱ {t}</span>
                      {indices > 0 ? (
                        <span className="text-xs" style={{ color: 'var(--rose)' }}>
                          💡 {indices} indice{indices > 1 ? 's' : ''} utilisé{indices > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--sauge)' }}>✨ Sans indice</span>
                      )}
                    </div>
                    <span className="text-xs" style={{ color: 'var(--brun-clair)' }}>/ {enigme.points_max} pts</span>
                  </div>

                  {/* Mini barre */}
                  <div className="mt-2 rounded-full h-1" style={{ background: 'rgba(138,158,126,0.2)' }}>
                    <div
                      className="h-1 rounded-full"
                      style={{
                        width: `${pct * 100}%`,
                        background: pct >= 0.9 ? 'var(--or)' : pct >= 0.5 ? 'var(--sauge)' : 'var(--rose)',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <p className="text-center text-sm" style={{ color: 'var(--brun-clair)', fontFamily: 'var(--font-playfair)' }}>
          Merci d'avoir participé à l'escape game du mariage de A & B ! 💍
        </p>
        <p className="text-center text-xs mt-2" style={{ color: 'var(--sauge)' }}>
          🌿 Félicitations à tous ! 🌿
        </p>
      </div>
    </main>
  )
}

// ─── Page principale joueur ──────────────────────────────────────

export default function PageJoueur() {
  const { equipe: equipeParam } = useParams()
  const nomEquipe = decodeURIComponent(equipeParam as string)

  const [equipe, setEquipe] = useState<Equipe | null>(null)
  const [enigme, setEnigme] = useState<Enigme | null>(null)
  const [stat, setStat] = useState<EquipeEnigmeStat | null>(null)
  const [statsFinales, setStatsFinales] = useState<EquipeEnigmeStat[]>([])
  const [toutesEnigmes, setToutesEnigmes] = useState<Enigme[]>([])
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState('')
  const [chargement, setChargement] = useState(true)
  const [verification, setVerification] = useState(false)
  const [indicesAffiches, setIndicesAffiches] = useState<number[]>([])
  const router = useRouter()

  useEffect(() => { charger() }, [])

  async function charger() {
    setChargement(true)

    const { data: equipeData } = await supabase
      .from('equipes').select('*').eq('nom', nomEquipe).single()

    if (!equipeData) { setChargement(false); return }

    setEquipe(equipeData)

    if (equipeData.partie_terminee) {
      const [{ data: sf }, { data: te }] = await Promise.all([
        supabase.from('equipe_enigme_stats').select('*').eq('equipe_id', equipeData.id).order('enigme_id'),
        supabase.from('enigmes').select('*').order('ordre'),
      ])
      setStatsFinales(sf || [])
      setToutesEnigmes(te || [])
    } else {
      const { data: enigmeData } = await supabase
        .from('enigmes').select('*').eq('id', equipeData.enigme_active_id).single()
      setEnigme(enigmeData)
      await chargerOuCreerStat(equipeData.id, equipeData.enigme_active_id)
    }

    setChargement(false)
  }

  async function chargerOuCreerStat(equipeId: number, enigmeId: number) {
    const { data: statExistante } = await supabase
      .from('equipe_enigme_stats')
      .select('*')
      .eq('equipe_id', equipeId)
      .eq('enigme_id', enigmeId)
      .single()

    if (statExistante) {
      setStat(statExistante)
      const indices = []
      for (let i = 1; i <= statExistante.indices_utilises; i++) indices.push(i)
      setIndicesAffiches(indices)
    } else {
      const { data: nouvelleStat } = await supabase
        .from('equipe_enigme_stats')
        .insert({ equipe_id: equipeId, enigme_id: enigmeId })
        .select().single()
      setStat(nouvelleStat)
    }
  }

  async function utiliserIndice(numero: number) {
    if (!enigme || !equipe || !stat) return
    if (indicesAffiches.includes(numero)) return

    const nouveauxIndices = [...indicesAffiches, numero]
    setIndicesAffiches(nouveauxIndices)

    await supabase.from('equipe_enigme_stats')
      .update({ indices_utilises: nouveauxIndices.length })
      .eq('id', stat.id)

    setStat({ ...stat, indices_utilises: nouveauxIndices.length })
  }

  function calculerPoints() {
    if (!enigme || !stat) return 0
    return Math.max(0, enigme.points_max - stat.indices_utilises * enigme.penalite_indice)
  }

  async function validerMotDePasse(e: React.FormEvent) {
    e.preventDefault()
    setVerification(true)
    setErreur('')

    if (motDePasse.toLowerCase() !== enigme?.mot_de_passe.toLowerCase()) {
      setErreur('Ce n\'est pas la bonne réponse... Cherchez encore ! 🌿')
      setVerification(false)
      return
    }

    const pointsGagnes = calculerPoints()

    await supabase.from('equipe_enigme_stats')
      .update({ finished_at: new Date().toISOString(), points_gagnes: pointsGagnes })
      .eq('id', stat!.id)

    const nouveauScore = (equipe!.score_total || 0) + pointsGagnes

    await supabase.from('equipes')
      .update({ score_total: nouveauScore })
      .eq('id', equipe!.id)

    const { data: prochaine } = await supabase
      .from('enigmes').select('*').eq('ordre', (enigme?.ordre ?? 0) + 1).single()

    if (!prochaine) {
      await supabase.from('equipes').update({ partie_terminee: true }).eq('id', equipe!.id)

      // Charger les stats finales
      const [{ data: sf }, { data: te }] = await Promise.all([
        supabase.from('equipe_enigme_stats').select('*').eq('equipe_id', equipe!.id).order('enigme_id'),
        supabase.from('enigmes').select('*').order('ordre'),
      ])
      setStatsFinales(sf || [])
      setToutesEnigmes(te || [])
      setEquipe({ ...equipe!, partie_terminee: true, score_total: nouveauScore })
      setTimeout(() => router.push('/classement'), 3000)
    } else {
      setEquipe({ ...equipe!, score_total: nouveauScore })
      await supabase.from('equipes').update({ enigme_active_id: prochaine.id }).eq('id', equipe!.id)
      setEnigme(prochaine)
      setMotDePasse('')
      setIndicesAffiches([])
      await chargerOuCreerStat(equipe!.id, prochaine.id)
    }

    setVerification(false)
  }

  // ─── Rendus conditionnels ──────────────────────────────────────

  if (chargement) return (
    <main className="bg-champetre min-h-screen flex items-center justify-center">
      <p style={{ color: 'var(--sauge)' }}>Chargement...</p>
    </main>
  )

  if (!equipe) return (
    <main className="bg-champetre min-h-screen flex items-center justify-center">
      <p style={{ color: 'var(--rose)' }}>Équipe introuvable.</p>
    </main>
  )

  if (equipe.partie_terminee) {
    return <PageResultats equipe={equipe} stats={statsFinales} enigmes={toutesEnigmes} />
  }

  const indicesDisponibles = [
    { num: 1, texte: enigme?.indice_1, visible: (enigme?.nb_indices ?? 0) >= 1 },
    { num: 2, texte: enigme?.indice_2, visible: (enigme?.nb_indices ?? 0) >= 2 },
    { num: 3, texte: enigme?.indice_3, visible: (enigme?.nb_indices ?? 0) >= 3 },
  ].filter((i) => i.visible)

  return (
    <main className="bg-champetre min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-xl">

        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-xs tracking-widest uppercase mb-1" style={{ color: 'var(--sauge)' }}>
            {equipe.nom}
          </p>
          <h1 className="text-3xl" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--brun)' }}>
            Énigme {enigme?.ordre}
          </h1>

          {/* Points en cours */}
          <div className="flex justify-center gap-2 items-center mt-2">
            <span className="text-sm font-semibold" style={{ color: 'var(--or)' }}>
              ⭐ {calculerPoints()} pts
            </span>
            {stat && stat.indices_utilises > 0 && (
              <span className="text-xs" style={{ color: 'var(--rose)' }}>
                (−{stat.indices_utilises * (enigme?.penalite_indice ?? 0)} pts d'indices)
              </span>
            )}
          </div>

          <div className="separateur flex justify-center mt-2" />
        </div>

        {/* Image */}
        {enigme?.image_url && (
          <div className="mb-5 rounded-2xl overflow-hidden shadow-md">
            <img src={enigme.image_url} alt="Indice visuel" className="w-full object-cover max-h-72" />
          </div>
        )}

        {/* Texte */}
        <div className="carte p-6 mb-5 shadow-md">
          <p className="leading-relaxed text-lg whitespace-pre-wrap text-center"
            style={{ color: 'var(--brun)', fontFamily: 'var(--font-playfair)' }}>
            {enigme?.texte}
          </p>
        </div>

        {/* Indices */}
        {indicesDisponibles.length > 0 && (
          <div className="mb-5 flex flex-col gap-3 items-start">
            {indicesDisponibles.map(({ num, texte }) => (
              <div key={num} className="w-full">
                {!indicesAffiches.includes(num) ? (
                  <button onClick={() => utiliserIndice(num)} className="btn-indice">
                    <span>💡</span>
                    <span>Révéler l'indice {num}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: 'rgba(201,144,138,0.15)', color: 'var(--rose)' }}>
                      −{enigme?.penalite_indice} pts
                    </span>
                  </button>
                ) : (
                  <div className="carte p-4" style={{ borderColor: 'rgba(196,164,90,0.5)', background: 'rgba(196,164,90,0.06)' }}>
                    <p className="text-sm" style={{ color: 'var(--brun)' }}>
                      💡 <strong>Indice {num} :</strong> {texte}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={validerMotDePasse} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Votre réponse..."
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            className="input-champetre w-full px-4 py-3 text-center text-lg"
          />

          {erreur && (
            <p className="text-sm text-center" style={{ color: 'var(--rose)' }}>{erreur}</p>
          )}

          <button
            type="submit"
            disabled={verification || !motDePasse}
            className="btn-principal w-full py-4 rounded-xl text-lg tracking-wide"
            style={{ boxShadow: motDePasse ? '0 4px 20px rgba(138,158,126,0.4)' : 'none' }}
          >
            {verification ? 'Vérification...' : '✓ Valider la réponse'}
          </button>
        </form>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--sauge)' }}>
          🌿 A & B — Escape Game 🌿
        </p>
      </div>
    </main>
  )
}