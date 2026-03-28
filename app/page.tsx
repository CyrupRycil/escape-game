'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'

export default function Accueil() {
  const [nomEquipe, setNomEquipe] = useState('')
  const [erreur, setErreur] = useState('')
  const [chargement, setChargement] = useState(false)
  const router = useRouter()

  async function rejoindre(e: React.FormEvent) {
    e.preventDefault()
    if (!nomEquipe.trim()) return
    setChargement(true)
    setErreur('')

    const { data: equipeExistante } = await supabase
      .from('equipes')
      .select('*')
      .eq('nom', nomEquipe.trim())
      .single()

    if (equipeExistante) {
      router.push(`/jouer/${encodeURIComponent(nomEquipe.trim())}`)
      return
    }

    const { data: premiereEnigme } = await supabase
      .from('enigmes')
      .select('id')
      .order('ordre')
      .limit(1)
      .single()

    if (!premiereEnigme) {
      setErreur('Aucune énigme disponible pour le moment.')
      setChargement(false)
      return
    }

    const { error } = await supabase.from('equipes').insert({
      nom: nomEquipe.trim(),
      enigme_active_id: premiereEnigme.id,
      partie_terminee: false,
    })

    if (error) {
      setErreur("Erreur lors de la création de l'équipe.")
      setChargement(false)
      return
    }

    router.push(`/jouer/${encodeURIComponent(nomEquipe.trim())}`)
  }

  return (
    <main className="bg-champetre min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">

        {/* Fleurs décoratives */}
        <div className="text-5xl mb-2 tracking-widest">🌸 🌿 🌸</div>

        {/* Initiales */}
        <div className="flex items-center justify-center gap-4 mb-2">
          <span className="text-4xl font-serif" style={{ color: 'var(--or)', fontFamily: 'var(--font-playfair)' }}>A</span>
          <span className="text-2xl" style={{ color: 'var(--rose)' }}>💍</span>
          <span className="text-4xl font-serif" style={{ color: 'var(--or)', fontFamily: 'var(--font-playfair)' }}>B</span>
        </div>

        <h1 className="text-4xl mb-1" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--brun)' }}>
          Escape Game
        </h1>
        <p className="text-sm tracking-widest uppercase mb-2" style={{ color: 'var(--sauge)' }}>
          Le grand jour
        </p>

        <div className="separateur flex justify-center mb-8" />

        <div className="carte p-8 shadow-lg">
          <p className="mb-6 text-sm leading-relaxed" style={{ color: 'var(--brun-clair)' }}>
            Bienvenue dans l'aventure !<br />
            Entrez le nom de votre équipe pour commencer.
          </p>

          <form onSubmit={rejoindre} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Nom de votre équipe..."
              value={nomEquipe}
              onChange={(e) => setNomEquipe(e.target.value)}
              className="input-champetre w-full px-4 py-3 text-center text-lg"
            />

            {erreur && (
              <p className="text-sm" style={{ color: 'var(--rose)' }}>{erreur}</p>
            )}

            <button
              type="submit"
              disabled={chargement || !nomEquipe.trim()}
              className="btn-principal w-full py-3 rounded-xl"
            >
              {chargement ? 'Chargement...' : 'Commencer l\'aventure →'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-xs" style={{ color: 'var(--sauge)' }}>🌿 Bonne chance à tous ! 🌿</p>
      </div>
    </main>
  )
}
