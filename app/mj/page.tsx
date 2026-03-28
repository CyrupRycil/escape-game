'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function MJLogin() {
  const [code, setCode] = useState('')
  const [erreur, setErreur] = useState('')
  const [chargement, setChargement] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setChargement(true)
    setErreur('')

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })

    if (res.ok) {
      router.push('/mj/dashboard')
    } else {
      setErreur('Code incorrect, réessaie.')
    }
    setChargement(false)
  }

  return (
    <main className="bg-champetre min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <div className="text-4xl mb-2">🌿</div>
        <h1 className="text-3xl mb-1" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--brun)' }}>
          Espace Maître du Jeu
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--sauge)' }}>
          Réservé à l'organisateur
        </p>

        <div className="carte p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="password"
              placeholder="Code secret..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="input-champetre w-full px-4 py-3 text-center"
            />

            {erreur && (
              <p className="text-sm" style={{ color: 'var(--rose)' }}>{erreur}</p>
            )}

            <button
              type="submit"
              disabled={chargement}
              className="btn-principal w-full py-3 rounded-xl"
            >
              {chargement ? 'Vérification...' : 'Accéder'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}