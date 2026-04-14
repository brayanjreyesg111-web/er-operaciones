import type { CatalogoResponse } from '../types/catalogos.types'

const API = 'http://localhost:3001/api'

async function fetchCatalogo(url: string) {
  const res = await fetch(`${API}${url}`)
  const raw = await res.text()

  if (!res.ok) {
    throw new Error(raw || `Error HTTP ${res.status}`)
  }

  const json: CatalogoResponse = JSON.parse(raw)

  if (!json.ok || !Array.isArray(json.data)) {
    throw new Error('Respuesta inválida de catálogo.')
  }

  return json.data
}

export async function obtenerTiposUnidad() {
  return fetchCatalogo('/catalogos/tipos-unidad')
}

export async function obtenerMarcas() {
  return fetchCatalogo('/catalogos/marcas')
}

export async function obtenerRefrigerantes() {
  return fetchCatalogo('/catalogos/refrigerantes')
}

export async function obtenerUnidadesMedidaCarga() {
  return fetchCatalogo('/catalogos/unidades-medida-carga')
}

export async function obtenerDepartamentos() {
  return fetchCatalogo('/catalogos/departamentos')
}

export async function obtenerCiudadesPorDepartamento(departamentoId: number) {
  return fetchCatalogo(`/catalogos/departamentos/${departamentoId}/ciudades`)
}
