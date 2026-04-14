import type {
  ClienteDetalleResponse,
  ClientesListResponse,
  CrearClienteResponse,
} from '../types/clientes.types'

const API = 'http://localhost:3001/api'

export async function obtenerClientes() {
  const res = await fetch(`${API}/clientes`)
  const raw = await res.text()

  if (!res.ok) throw new Error(raw || `Error HTTP ${res.status}`)

  const json: ClientesListResponse = JSON.parse(raw)

  if (!json.ok || !Array.isArray(json.data)) {
    throw new Error('Respuesta inválida al cargar clientes.')
  }

  return json.data.map((cliente) => ({
    id: cliente.id,
    nombre: cliente.nombre,
  }))
}

export async function obtenerClienteDetalle(clienteId: string | number) {
  const res = await fetch(`${API}/clientes/${clienteId}`)
  const raw = await res.text()

  if (!res.ok) throw new Error(raw || `Error HTTP ${res.status}`)

  const json: ClienteDetalleResponse = JSON.parse(raw)

  if (!json.ok || !json.data) {
    throw new Error('Respuesta inválida al cargar detalle del cliente.')
  }

  return json.data
}

export async function crearCliente(payload: {
  nombre: string
  rtn?: string
  contactoNombre?: string
  telefono?: string
  correo?: string
  direccion?: string
  ubicacion?: string
}) {
  const res = await fetch(`${API}/clientes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const raw = await res.text()
  const json: CrearClienteResponse = JSON.parse(raw)

  if (!res.ok || !json.ok || !json.data) {
    throw new Error(json?.mensaje || `Error HTTP ${res.status}`)
  }

  return json.data
}
