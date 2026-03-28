'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Equipe, EquipeEnigmeStat, Enigme } from '@/lib/types'

function tempsTotal(stats: EquipeEnigmeStat[]): number {
  return stats.reduce((acc, s) => {
    if (!s.finished_at) return acc
    return acc + Math.floor((new Date(s.finished_at).getTime() - new Date(s.started_at).getTime()) / 1000)
  }, 0)
}

function formatTemps(secondes: number): string {
  const min = Math.floor(secondes / 60).toString().padStart(2, '0')
  const sec = (secondes % 60).toString().padStart(2, '0')
  return `${min}:${sec}`
}

function medaillePlace(index: number): string {
  if (index === 0) return '🥇'
  if (index === 1) return '🥈'
  if (index === 2) return '🥉'
  return `#${index + 1}`
}

type EquipeClassee = {
  equipe: Equipe
  stats: EquipeEnigmeStat[]
  tempsTotal: number
  enigmesResolues: number
}

export default function PageClassement() {
  const [classement, setClassement] = useState<EquipeClassee[]>([])
  const [enigmes, setEnigmes] = useState<Enigme[]>([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    charger()

    const channel = supabase
      .channel('classement-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipes' }, () => charger())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'equipe_enigme_stats' }, () => charger())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function charger() {
    const [{ data: equipes }, { data: stats }, { data: enigmesData }] = await Promise.all([
      supabase.from('equipes').select('*'),
      supabase.from('equipe_enigme_stats').select('*'),
      supabase.from('enigmes').select('*').order('ordre'),
    ])

    if (!equipes || !stats || !enigmesData) return

    setEnigmes(enigmesData)

    const classees: EquipeClassee[] = equipes.map((equipe) => {
      const statsEquipe = stats.filter(s => s.equipe_id === equipe.id)
      const enigmesResolues = statsEquipe.filter(s => s.finished_at !== null).length
      return {
        equipe,
        stats: statsEquipe,
        tempsTotal: tempsTotal(statsEquipe),
        enigmesResolues,
      }
    })

    // Trier : d'abord par score décroissant, ensuite par temps croissant
    classees.sort((a, b) => {
      if (b.equipe.score_total !== a.equipe.score_total) {
        return b.equipe.score_total - a.equipe.score_total
      }
      return a.tempsTotal - b.tempsTotal
    })

    setClassement(classees)
    setChargement(false)
  }

  if (chargement) return (
    <main className="bg-champetre min-h-screen flex items-center justify-center">
      <p style={{ color: 'var(--sauge)' }}>Chargement...</p>
    </main>
  )

  const scoreMax = enigmes.reduce((acc, e) => acc + e.points_max, 0)

  return (
    <main className="bg-champetre min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-xl">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏆</div>
          <div className="text-3xl mb-3 tracking-widest">🌸 🌿 🌸</div>
          <h1 className="text-4xl mb-1" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--brun)' }}>
            Classement
          </h1>
          <p className="text-sm tracking-widest uppercase" style={{ color: 'var(--sauge)' }}>
            Mariage de A & B
          </p>
          <div className="separateur flex justify-center my-4" />
        </div>

        {/* Podium top 3 */}
        {classement.length >= 2 && (
          <div className="flex items-end justify-center gap-3 mb-8">
            {/* 2ème place */}
            {classement[1] && (
              <div className="flex flex-col items-center flex-1">
                <div className="text-3xl mb-1">🥈</div>
                <div className="carte p-3 w-full text-center"
                  style={{ height: '90px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <p className="font-semibold text-sm truncate" style={{ color: 'var(--brun)', fontFamily: 'var(--font-playfair)' }}>
                    {classement[1].equipe.nom}
                  </p>
                  <p className="text-lg font-bold" style={{ color: '#A8A8A8' }}>
                    {classement[1].equipe.score_total} pts
                  </p>
                  <p className="text-xs" style={{ color: 'var(--sauge)' }}>
                    ⏱ {formatTemps(classement[1].tempsTotal)}
                  </p>
                </div>
              </div>
            )}

            {/* 1ère place */}
            {classement[0] && (
              <div className="flex flex-col items-center flex-1">
                <div className="text-4xl mb-1">🥇</div>
                <div className="carte p-3 w-full text-center"
                  style={{ height: '110px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderColor: 'rgba(196,164,90,0.5)', background: 'rgba(196,164,90,0.08)' }}>
                  <p className="font-bold truncate" style={{ color: 'var(--brun)', fontFamily: 'var(--font-playfair)' }}>
                    {classement[0].equipe.nom}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--or)' }}>
                    {classement[0].equipe.score_total} pts
                  </p>
                  <p className="text-xs" style={{ color: 'var(--sauge)' }}>
                    ⏱ {formatTemps(classement[0].tempsTotal)}
                  </p>
                </div>
              </div>
            )}

            {/* 3ème place */}
            {classement[2] && (
              <div className="flex flex-col items-center flex-1">
                <div className="text-3xl mb-1">🥉</div>
                <div className="carte p-3 w-full text-center"
                  style={{ height: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <p className="font-semibold text-sm truncate" style={{ color: 'var(--brun)', fontFamily: 'var(--font-playfair)' }}>
                    {classement[2].equipe.nom}
                  </p>
                  <p className="text-lg font-bold" style={{ color: '#C4905A' }}>
                    {classement[2].equipe.score_total} pts
                  </p>
                  <p className="text-xs" style={{ color: 'var(--sauge)' }}>
                    ⏱ {formatTemps(classement[2].tempsTotal)}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Classement complet */}
        <div className="carte p-5 shadow-md">
          <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--brun)' }}>
            Classement complet
          </h2>

          {classement.length === 0 ? (
            <p className="text-center text-sm py-4" style={{ color: 'var(--sauge)' }}>
              Aucune équipe pour l'instant...
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {classement.map((item, index) => {
                const pct = scoreMax > 0 ? item.equipe.score_total / scoreMax : 0
                const estTerminee = item.equipe.partie_terminee

                return (
                  <div key={item.equipe.id} className="rounded-xl px-4 py-3"
                    style={{
                      background: index === 0 ? 'rgba(196,164,90,0.08)' : 'rgba(255,255,255,0.5)',
                      border: `1px solid ${index === 0 ? 'rgba(196,164,90,0.4)' : 'rgba(196,164,90,0.15)'}`,
                    }}>

                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-3">
                        <span className="text-lg w-8 text-center">{medaillePlace(index)}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm" style={{ color: 'var(--brun)', fontFamily: 'var(--font-playfair)' }}>
                              {item.equipe.nom}
                            </span>
                            {estTerminee && (
                              <span className="text-xs px-2 py-0.5 rounded-full text-white"
                                style={{ background: 'var(--sauge)' }}>
                                Terminé ✓
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs" style={{ color: 'var(--sauge)' }}>
                              ⏱ {formatTemps(item.tempsTotal)}
                            </span>
                            <span className="text-xs" style={{ color: 'var(--brun-clair)' }}>
                              📋 {item.enigmesResolues}/{enigmes.length} énigmes
                            </span>
                          </div>
                        </div>
                      </div>

                      <span className="text-lg font-bold" style={{ color: index === 0 ? 'var(--or)' : 'var(--brun-clair)', fontFamily: 'var(--font-playfair)' }}>
                        {item.equipe.score_total}
                        <span className="text-xs font-normal"> pts</span>
                      </span>
                    </div>

                    {/* Barre de progression */}
                    <div className="rounded-full h-1.5 mt-2" style={{ background: 'rgba(138,158,126,0.2)' }}>
                      <div className="h-1.5 rounded-full transition-all"
                        style={{
                          width: `${pct * 100}%`,
                          background: index === 0
                            ? 'linear-gradient(90deg, var(--sauge), var(--or))'
                            : 'var(--sauge)',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--sauge)' }}>
          🌿 Classement mis à jour en temps réel 🌿
        </p>
      </div>
    </main>
  )
}