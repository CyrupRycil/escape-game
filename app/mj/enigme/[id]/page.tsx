'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '../../../../lib/supabase'
import { Enigme } from '../../../../lib/types'

export default function MJEditEnigme() {
  const { id } = useParams()
  const router = useRouter()
  const [enigme, setEnigme] = useState<Enigme | null>(null)
  const [chargement, setChargement] = useState(true)
  const [sauvegarde, setSauvegarde] = useState(false)
  const [succes, setSucces] = useState(false)
  const [uploadEnCours, setUploadEnCours] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    async function charger() {
      const { data } = await supabase
        .from('enigmes').select('*').eq('id', id).single()
      if (data) {
        setEnigme(data)
        setPreviewUrl(data.image_url || null)
      }
      setChargement(false)
    }
    charger()
  }, [id])

  async function uploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !enigme) return
    setUploadEnCours(true)

    if (enigme.image_url) {
      const ancienNom = enigme.image_url.split('/').pop()
      if (ancienNom) await supabase.storage.from('enigmes-images').remove([ancienNom])
    }

    const nomFichier = `enigme-${enigme.id}-${Date.now()}.${file.name.split('.').pop()}`
    await supabase.storage.from('enigmes-images').upload(nomFichier, file, { upsert: true })
    const { data: urlData } = supabase.storage.from('enigmes-images').getPublicUrl(nomFichier)

    await supabase.from('enigmes').update({ image_url: urlData.publicUrl }).eq('id', enigme.id)
    setEnigme({ ...enigme, image_url: urlData.publicUrl })
    setPreviewUrl(urlData.publicUrl)
    setUploadEnCours(false)
  }

  async function supprimerImage() {
    if (!enigme?.image_url) return
    const nomFichier = enigme.image_url.split('/').pop()
    if (nomFichier) await supabase.storage.from('enigmes-images').remove([nomFichier])
    await supabase.from('enigmes').update({ image_url: null }).eq('id', enigme.id)
    setEnigme({ ...enigme, image_url: null })
    setPreviewUrl(null)
  }

  async function sauvegarder() {
    if (!enigme) return
    setSauvegarde(true)
    setSucces(false)

    const { error } = await supabase.from('enigmes').update({
      titre: enigme.titre,
      texte: enigme.texte,
      mot_de_passe: enigme.mot_de_passe,
      nb_indices: enigme.nb_indices,
      indice_1: enigme.indice_1 || null,
      indice_2: enigme.indice_2 || null,
      indice_3: enigme.indice_3 || null,
      points_max: enigme.points_max,
      penalite_indice: enigme.penalite_indice,
    }).eq('id', enigme.id)

    if (!error) {
      setSucces(true)
      setTimeout(() => setSucces(false), 3000)
    }
    setSauvegarde(false)
  }

  if (chargement) return (
    <main className="bg-champetre min-h-screen flex items-center justify-center">
      <p style={{ color: 'var(--sauge)' }}>Chargement...</p>
    </main>
  )

  if (!enigme) return (
    <main className="bg-champetre min-h-screen flex items-center justify-center">
      <p style={{ color: 'var(--rose)' }}>Énigme introuvable.</p>
    </main>
  )

  const indices = [
    { key: 'indice_1', label: 'Indice 1', visible: enigme.nb_indices >= 1 },
    { key: 'indice_2', label: 'Indice 2', visible: enigme.nb_indices >= 2 },
    { key: 'indice_3', label: 'Indice 3', visible: enigme.nb_indices >= 3 },
  ] as const

  return (
    <main className="bg-champetre min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.push('/mj/dashboard')}
          className="text-sm mb-6 inline-block transition"
          style={{ color: 'var(--sauge)' }}
        >
          ← Retour au dashboard
        </button>

        <h1 className="text-3xl font-bold mb-8" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--brun)' }}>
          ✏️ Énigme {enigme.ordre}
        </h1>

        <div className="flex flex-col gap-6">

          {/* Titre */}
          <div>
            <label className="text-sm mb-2 block" style={{ color: 'var(--brun-clair)' }}>
              Titre (visible MJ uniquement)
            </label>
            <input
              type="text"
              value={enigme.titre}
              onChange={(e) => setEnigme({ ...enigme, titre: e.target.value })}
              className="input-champetre w-full px-4 py-3"
            />
          </div>

          {/* Texte joueur */}
          <div>
            <label className="text-sm mb-2 block" style={{ color: 'var(--brun-clair)' }}>
              Texte affiché au joueur
            </label>
            <textarea
              value={enigme.texte}
              onChange={(e) => setEnigme({ ...enigme, texte: e.target.value })}
              rows={5}
              className="input-champetre w-full px-4 py-3 resize-none"
            />
          </div>

          {/* Image */}
          <div>
            <label className="text-sm mb-2 block" style={{ color: 'var(--brun-clair)' }}>
              Image (optionnelle)
            </label>
            {previewUrl ? (
              <div className="relative">
                <img src={previewUrl} alt="Image" className="w-full rounded-xl object-cover max-h-64" />
                <button
                  onClick={supprimerImage}
                  className="absolute top-2 right-2 text-white text-xs px-3 py-1 rounded-lg"
                  style={{ background: 'var(--rose)' }}
                >
                  Supprimer
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-36 rounded-xl cursor-pointer border-2 border-dashed transition"
                style={{ borderColor: 'var(--or)', background: 'rgba(196,164,90,0.05)' }}>
                {uploadEnCours ? (
                  <p className="text-sm" style={{ color: 'var(--sauge)' }}>Upload en cours...</p>
                ) : (
                  <>
                    <span className="text-3xl mb-2">🖼️</span>
                    <p className="text-sm" style={{ color: 'var(--brun-clair)' }}>Clique pour ajouter une image</p>
                  </>
                )}
                <input type="file" accept="image/*" onChange={uploadImage} className="hidden" />
              </label>
            )}
          </div>

          {/* Mot de passe */}
          <div>
            <label className="text-sm mb-2 block" style={{ color: 'var(--brun-clair)' }}>
              Mot de passe pour passer à la suivante
            </label>
            <input
              type="text"
              value={enigme.mot_de_passe}
              onChange={(e) => setEnigme({ ...enigme, mot_de_passe: e.target.value })}
              className="input-champetre w-full px-4 py-3"
            />
          </div>

          {/* Points */}
          <div className="carte p-5">
            <h3 className="font-semibold mb-4" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--brun)' }}>
              🏆 Système de points
            </h3>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm mb-2 block" style={{ color: 'var(--brun-clair)' }}>
                  Points max
                </label>
                <input
                  type="number"
                  min={0}
                  value={enigme.points_max}
                  onChange={(e) => setEnigme({ ...enigme, points_max: parseInt(e.target.value) || 0 })}
                  className="input-champetre w-full px-4 py-3 text-center"
                />
              </div>
              <div className="flex-1">
                <label className="text-sm mb-2 block" style={{ color: 'var(--brun-clair)' }}>
                  Pénalité par indice
                </label>
                <input
                  type="number"
                  min={0}
                  value={enigme.penalite_indice}
                  onChange={(e) => setEnigme({ ...enigme, penalite_indice: parseInt(e.target.value) || 0 })}
                  className="input-champetre w-full px-4 py-3 text-center"
                />
              </div>
            </div>
            <p className="text-xs mt-3" style={{ color: 'var(--sauge)' }}>
              Ex : 100 pts max, −20 pts par indice → après 2 indices il reste 60 pts
            </p>
          </div>

          {/* Indices */}
          <div className="carte p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--brun)' }}>
                💡 Indices
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-sm" style={{ color: 'var(--brun-clair)' }}>Nombre d'indices :</span>
                <select
                  value={enigme.nb_indices}
                  onChange={(e) => setEnigme({ ...enigme, nb_indices: parseInt(e.target.value) })}
                  className="input-champetre px-3 py-2"
                >
                  <option value={0}>0</option>
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                </select>
              </div>
            </div>

            {enigme.nb_indices === 0 && (
              <p className="text-sm text-center py-2" style={{ color: 'var(--sauge)' }}>
                Aucun indice pour cette énigme
              </p>
            )}

            <div className="flex flex-col gap-3">
              {indices.filter(i => i.visible).map(({ key, label }) => (
                <div key={key}>
                  <label className="text-sm mb-1 block" style={{ color: 'var(--brun-clair)' }}>
                    {label} <span className="text-xs" style={{ color: 'var(--rose)' }}>
                      (−{enigme.penalite_indice} pts)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={enigme[key] || ''}
                    onChange={(e) => setEnigme({ ...enigme, [key]: e.target.value })}
                    className="input-champetre w-full px-4 py-3"
                    placeholder={`Texte de l'${label.toLowerCase()}...`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Bouton sauvegarder */}
          <button
            onClick={sauvegarder}
            disabled={sauvegarde}
            className="btn-principal w-full py-3 rounded-xl"
          >
            {sauvegarde ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>

          {succes && (
            <p className="text-center text-sm" style={{ color: 'var(--sauge)' }}>
              ✅ Énigme sauvegardée !
            </p>
          )}
        </div>
      </div>
    </main>
  )
}