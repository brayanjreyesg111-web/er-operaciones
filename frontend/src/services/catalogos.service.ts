import type { CatalogoItem } from '../types/catalogos.types'
import type {
  HallazgoOption,
  ProcedimientoOption,
  TecnicoOption,
} from '../types/reportes.types'

const API = (import.meta.env.VITE_API_URL || "http://localhost:3001") + "/api";

async function fetchCatalogo<T>(url: string): Promise<T[]> {
  const res = await fetch(`${API}${url}`)
  const raw = await res.text()

  if (!res.ok) {
    throw new Error(raw || `Error HTTP ${res.status}`)
  }

  const json = JSON.parse(raw) as { ok: boolean; data: T[] }

  if (!json.ok || !Array.isArray(json.data)) {
    throw new Error('Respuesta invÃ¡lida de catÃ¡logo.')
  }

  return json.data
}

export async function obtenerTiposUnidad(): Promise<CatalogoItem[]> {
  return fetchCatalogo<CatalogoItem>('/catalogos/tipos-unidad')
}

export async function obtenerMarcas(): Promise<CatalogoItem[]> {
  return fetchCatalogo<CatalogoItem>('/catalogos/marcas')
}

export async function obtenerRefrigerantes(): Promise<CatalogoItem[]> {
  return fetchCatalogo<CatalogoItem>('/catalogos/refrigerantes')
}

export async function obtenerUnidadesMedidaCarga(): Promise<CatalogoItem[]> {
  return fetchCatalogo<CatalogoItem>('/catalogos/unidades-medida-carga')
}

export async function obtenerDepartamentos(): Promise<CatalogoItem[]> {
  return fetchCatalogo<CatalogoItem>('/catalogos/departamentos')
}

export async function obtenerCiudadesPorDepartamento(departamentoId: number): Promise<CatalogoItem[]> {
  return fetchCatalogo<CatalogoItem>(`/catalogos/departamentos/${departamentoId}/ciudades`)
}

export async function obtenerTecnicos(): Promise<TecnicoOption[]> {
  return fetchCatalogo<TecnicoOption>('/catalogos/tecnicos')
}

export async function obtenerProcedimientos(): Promise<ProcedimientoOption[]> {
  return fetchCatalogo<ProcedimientoOption>('/catalogos/procedimientos')
}

export async function obtenerHallazgos(): Promise<HallazgoOption[]> {
  return fetchCatalogo<HallazgoOption>('/catalogos/hallazgos')
}
export async function obtenerUsuariosOperativos(): Promise<TecnicoOption[]> {
  return fetchCatalogo<TecnicoOption>('/catalogos/usuarios-operativos')
}

