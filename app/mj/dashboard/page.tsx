'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { Enigme, Equipe, EquipeEnigmeStat } from '../../../lib/types'

function Timer({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const start = new Date(startedAt).getTime()
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [startedAt])

  const min = Math.floor(elapsed / 60).toString().padStart(2, '0')
  const sec = (elapsed % 60).toString().padStart(2, '0')
  const alerte = elapsed > 300 // rouge après 5 min

  return (
    <span className="text-xs font-mono font-bold" style={{ color: alerte ? '#C9908A' : '#8A9E7E' }}>
      ⏱ {min}:{sec}
    </span>
  )
}

export default function MJDashboard() {
  const [enigmes, setEnigmes] = useState<Enigme[]>([])
  const [equipes, setEquipes] = useState<Equipe[]>([])
  const [stats, setStats] = useState<EquipeEnigmeStat[]>([])
  const [chargement, setChargement] = useState(true)
  const [resetEnCours, setResetEnCours] = useState(false)
  const [ajoutEnCours, setAjoutEnCours] = useState(false)
  const [suppressionId, setSuppressionId] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    charger()

    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipes' }, () => chargerEquipes())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipe_enigme_stats' }, () => chargerStats())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function charger() {
    await Promise.all([chargerEnigmes(), chargerEquipes(), chargerStats()])
    setChargement(false)
  }

  async function chargerEnigmes() {
    const { data } = await supabase.from('enigmes').select('*').order('ordre')
    setEnigmes(data || [])
  }

  async function chargerEquipes() {
    const { data } = await supabase.from('equipes').select('*').order('score_total', { ascending: false })
    setEquipes(data || [])
  }

  async function chargerStats() {
    const { data } = await supabase.from('equipe_enigme_stats').select('*')
    setStats(data || [])
  }

  function getStatActuelle(equipe: Equipe) {
    return stats.find(
      s => s.equipe_id === equipe.id && s.enigme_id === equipe.enigme_active_id && !s.finished_at
    )
  }

  function getEnigme(id: number) {
    return enigmes.find(e => e.id === id)
  }

  async function supprimerEquipe(id: number) {
    await supabase.from('equipe_enigme_stats').delete().eq('equipe_id', id)
    await supabase.from('equipes').delete().eq('id', id)
  }

  async function reinitialiserTout() {
    setResetEnCours(true)
    await supabase.from('equipe_enigme_stats').delete().neq('id', 0)
    await supabase.from('equipes').delete().neq('id', 0)
    setResetEnCours(false)
  }

  async function ajouterEnigme() {
    setAjoutEnCours(true)
    const prochainOrdre = enigmes.length > 0 ? Math.max(...enigmes.map(e => e.ordre)) + 1 : 1
    const { data, error } = await supabase.from('enigmes').insert({
      ordre: prochainOrdre,
      titre: `Énigme ${prochainOrdre}`,
      texte: 'Texte de l\'énigme à modifier...',
      mot_de_passe: 'motdepasse',
      points_max: 100,
      penalite_indice: 20,
      nb_indices: 0,
    }).select().single()

    if (!error && data) router.push(`/mj/enigme/${data.id}`)
    setAjoutEnCours(false)
  }

  async function supprimerEnigme(enigme: Enigme) {
    if (!window.confirm(`Supprimer "${enigme.titre}" ?`)) return
    setSuppressionId(enigme.id)
    if (enigme.image_url) {
      const nom = enigme.image_url.split('/').pop()
      if (nom) await supabase.storage.from('enigmes-images').remove([nom])
    }
    await supabase.from('enigmes').delete().eq('id', enigme.id)
    await chargerEnigmes()
    setSuppressionId(null)
  }

  if (chargement) return (
    <main className="bg-champetre min-h-screen flex items-center justify-center">
      <p style={{ color: 'var(--sauge)' }}>Chargement...</p>
    </main>
  )

  return (
    <main className="bg-champetre min-h-screen p-8">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--brun)' }}>
            🎮 Dashboard MJ
          </h1>
          <div className="flex items-center gap-3">
            <a
              href="/classement"
              target="_blank"
              className="btn-secondaire"
            >
              <span>🏆 Voir le classement</span>
            </a>
            <button
              onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/mj') }}
              className="text-sm transition" style={{ color: 'var(--sauge)' }}
            >
              Se déconnecter
            </button>
          </div>
        </div>

        {/* Suivi des équipes */}
        <div className="carte p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--brun)' }}>
              👥 Équipes ({equipes.length})
            </h2>
            <button
              onClick={reinitialiserTout}
              disabled={resetEnCours || equipes.length === 0}
              className="text-sm font-semibold px-4 py-2 rounded-lg text-white transition disabled:opacity-50"
              style={{ background: 'var(--rose)' }}
            >
              {resetEnCours ? 'Reset...' : '🗑️ Effacer tout'}
            </button>
          </div>

          {equipes.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: 'var(--sauge)' }}>
              Aucune équipe — les joueurs s'inscrivent sur la page d'accueil
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {equipes.map((equipe, index) => {
                const enigmeActuelle = getEnigme(equipe.enigme_active_id)
                const statActuelle = getStatActuelle(equipe)
                const progression = equipe.partie_terminee ? enigmes.length : (enigmeActuelle?.ordre ?? 1) - 1

                return (
                  <div key={equipe.id} className="rounded-xl p-4 flex items-center justify-between"
                    style={{ background: 'rgba(255,255,255,0.7)', border: '1.5px solid rgba(196,164,90,0.25)' }}>
                    <div className="flex-1">

                      {/* Nom + badge */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold" style={{ color: 'var(--or)' }}>
                          #{index + 1}
                        </span>
                        <span className="font-semibold" style={{ color: 'var(--brun)' }}>
                          {equipe.nom}
                        </span>
                        {equipe.partie_terminee && (
                          <span className="text-xs px-2 py-0.5 rounded-full text-white"
                            style={{ background: 'var(--sauge)' }}>
                            Terminé 🏆
                          </span>
                        )}
                      </div>

                      {/* Score + timer */}
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-bold" style={{ color: 'var(--or)' }}>
                          ⭐ {equipe.score_total ?? 0} pts
                        </span>
                        {statActuelle && !equipe.partie_terminee && (
                          <Timer startedAt={statActuelle.started_at} />
                        )}
                        {statActuelle && statActuelle.indices_utilises > 0 && (
                          <span className="text-xs" style={{ color: 'var(--rose)' }}>
                            💡 {statActuelle.indices_utilises} indice{statActuelle.indices_utilises > 1 ? 's' : ''} utilisé{statActuelle.indices_utilises > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {/* Barre de progression */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 rounded-full h-1.5" style={{ background: 'rgba(138,158,126,0.2)' }}>
                          <div
                            className="h-1.5 rounded-full transition-all"
                            style={{
                              width: `${(progression / Math.max(enigmes.length, 1)) * 100}%`,
                              background: 'var(--sauge)'
                            }}
                          />
                        </div>
                        <span className="text-xs" style={{ color: 'var(--sauge)' }}>
                          {equipe.partie_terminee ? 'Fini !' : `${enigmeActuelle?.ordre ?? '?'} / ${enigmes.length}`}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => supprimerEquipe(equipe.id)}
                      className="btn-danger ml-4"
                    >
                      ✕ Retirer
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Liste des énigmes */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--brun)' }}>
            📋 Énigmes ({enigmes.length})
          </h2>
          <button
            onClick={ajouterEnigme}
            disabled={ajoutEnCours}
            className="btn-principal text-sm font-semibold px-4 py-2 rounded-lg"
          >
            {ajoutEnCours ? 'Création...' : '+ Ajouter'}
          </button>
        </div>

       <div className="flex flex-col gap-2">
          {enigmes.map((enigme) => (
            <div
              key={enigme.id}
              className="carte cliquable px-4 py-3 flex items-center justify-between w-fit min-w-[400px]"
              onClick={() => router.push(`/mj/enigme/${enigme.id}`)}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: 'rgba(138,158,126,0.15)', color: 'var(--sauge-fonce)' }}>
                  #{enigme.ordre}
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--brun)', fontFamily: 'var(--font-playfair)' }}>
                    {enigme.titre}
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--or)' }}>
                    ⭐ {enigme.points_max} pts
                    {enigme.nb_indices > 0 && ` · 💡 ${enigme.nb_indices} indice${enigme.nb_indices > 1 ? 's' : ''}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-3 flex-shrink-0" onClick={e => e.stopPropagation()}>
                <button
                  className="btn-secondaire"
                  onClick={() => router.push(`/mj/enigme/${enigme.id}`)}
                >
                  ✏️ Éditer
                </button>
                <button
                  className="btn-danger"
                  onClick={() => supprimerEnigme(enigme)}
                  disabled={suppressionId === enigme.id}
                >
                  {suppressionId === enigme.id ? '...' : '🗑️'}
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  )
}
