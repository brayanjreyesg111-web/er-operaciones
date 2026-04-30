import type { CrearMaquinaResponse } from '../types/maquinas.types'

const API = (import.meta.env.VITE_API_URL || "http://localhost:3001") + "/api";

export type MaquinaResumen = {
  id: number
  clienteId: number
  codigoInterno?: string | null
  tipoEquipo?: string | null
  marca?: string | null
  modelo?: string | null
  serie?: string | null
  area?: string | null
  direccionExacta?: string | null
  activo?: boolean | null
  cliente?: { id?: number; nombre?: string } | null
  tipoUnidad?: { id?: number; nombre?: string } | null
  marcaCatalogo?: { id?: number; nombre?: string } | null
  refrigeranteCatalogo?: { id?: number; codigo?: string | null; nombre?: string } | null
  departamento?: { id?: number; nombre?: string } | null
  ciudad?: { id?: number; nombre?: string } | null
}

async function leerJson<T>(res: Response): Promise<T> {
  const raw = await res.text()
  const json = raw ? JSON.parse(raw) : {}

  if (!res.ok || !json?.ok) {
    throw new Error(json?.mensaje || `Error HTTP ${res.status}`)
  }

  return (json.data ?? json) as T
}

export async function obtenerMaquinas(filtros?: { clienteId?: number | string }) {
  const params = new URLSearchParams()
  if (filtros?.clienteId) params.set('clienteId', String(filtros.clienteId))

  const query = params.toString()
  const res = await fetch(`${API}/maquinas${query ? `?${query}` : ''}`, {
    headers: { Accept: 'application/json' },
  })

  return leerJson<MaquinaResumen[]>(res)
}

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

  const data = await leerJson<CrearMaquinaResponse['data']>(res)
  return data
}

