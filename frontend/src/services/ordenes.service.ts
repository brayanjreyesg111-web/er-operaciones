const API = 'http://localhost:3001/api'

export type OrdenServicio = {
  id: number
  clienteId: number
  numeroOrden: string
  contactoNombre?: string | null
  telefonoContacto?: string | null
  correoContacto?: string | null
  ubicacionServicio?: string | null
  prioridad?: string | null
  tipoSolicitud?: string | null
  origenSolicitud?: string | null
  descripcionProblema: string
  estado?: string | null
  fechaSolicitud?: string
  createdAt?: string
  cliente?: {
    id: number
    nombre: string
    telefono?: string | null
    correo?: string | null
  } | null
  visitas?: Array<{
    id: number
    estado?: string | null
    fechaVisita?: string | null
  }>
}

export type CrearOrdenServicioPayload = {
  clienteId: number
  contactoNombre?: string
  telefonoContacto?: string
  correoContacto?: string
  ubicacionServicio?: string
  prioridad?: string
  tipoSolicitud?: string
  origenSolicitud?: string
  descripcionProblema: string
  fechaSolicitud?: string
  solicitudId?: number
}

async function leerJson<T>(res: Response): Promise<T> {
  const raw = await res.text()
  const json = raw ? JSON.parse(raw) : {}

  if (!res.ok || !json?.ok) {
    throw new Error(json?.mensaje || `Error HTTP ${res.status}`)
  }

  return (json.data ?? json) as T
}

export async function obtenerOrdenesServicio(filtros?: {
  estado?: string
  clienteId?: number | string
  texto?: string
  sinVisita?: boolean
}) {
  const params = new URLSearchParams()

  if (filtros?.estado) params.set('estado', filtros.estado)
  if (filtros?.clienteId) params.set('clienteId', String(filtros.clienteId))
  if (filtros?.texto) params.set('texto', filtros.texto)
  if (filtros?.sinVisita !== undefined) params.set('sinVisita', String(filtros.sinVisita))

  const query = params.toString()
  const res = await fetch(`${API}/ordenes-servicio${query ? `?${query}` : ''}`, {
    headers: { Accept: 'application/json' },
  })

  return leerJson<OrdenServicio[]>(res)
}

export async function crearOrdenServicio(payload: CrearOrdenServicioPayload) {
  const res = await fetch(`${API}/ordenes-servicio`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })

  return leerJson<OrdenServicio>(res)
}

export async function actualizarEstadoOrdenServicio(id: number, estado: string) {
  const res = await fetch(`${API}/ordenes-servicio/${id}/estado`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ estado }),
  })

  return leerJson<OrdenServicio>(res)
}
