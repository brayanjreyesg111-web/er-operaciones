export type CatalogoItem = {
  id: number
  nombre: string
  codigo?: string | null
  descripcion?: string | null
  departamentoId?: number
}

export type CatalogoResponse = {
  ok: boolean
  data: CatalogoItem[]
}