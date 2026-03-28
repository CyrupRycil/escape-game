export type Enigme = {
  id: number
  ordre: number
  titre: string
  texte: string
  mot_de_passe: string
  nb_indices: number
  indice_1?: string | null
  indice_2?: string | null
  indice_3?: string | null
  points_max: number
  penalite_indice: number
  image_url?: string | null
}

export type GameState = {
  id: number
  enigme_active_id: number
  partie_terminee: boolean
}

export type Equipe = {
  id: number
  nom: string
  enigme_active_id: number
  partie_terminee: boolean
  score_total: number
  created_at: string
}

export type EquipeEnigmeStat = {
  id: number
  equipe_id: number
  enigme_id: number
  started_at: string
  finished_at: string | null
  indices_utilises: number
  points_gagnes: number
}