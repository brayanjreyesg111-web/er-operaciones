import type { CrearMaquinaResponse } from '../types/maquinas.types'

const API = 'http://localhost:3001/api'

export async function crearMaquina(payload: {
  clienteId: number
  tipoUnidadId: number
  marcaId: number
  refrigeranteId: number
  unidadMedidaCargaId?: number
  departamentoId: number
  ciudadId: number
  modelo?: string
  serie?: string
  cargaRefrigeranteCantidad?: number
  direccionExacta?: string
  area?: string
  observaciones?: string
}) {
  const res = await fetch(`${API}/maquinas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const raw = await res.text()
  const json: CrearMaquinaResponse = JSON.parse(raw)

  if (!res.ok || !json.ok || !json.data) {
    throw new Error(json?.mensaje || `Error HTTP ${res.status}`)
  }

  return json.data
}
