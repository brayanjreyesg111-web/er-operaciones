const API = 'http://localhost:3001/api'

export type ActividadPaso = {
  id: number
  actividadId?: number
  orden: number
  tituloPaso: string
  descripcionPaso?: string | null
  obligatorio?: boolean
  estadoPaso?: string | null
  porcentajePaso?: number
  realizadoPorId?: number | null
  fechaRealizacion?: string | null
}

export type ActividadOperativa = {
  id: number
  codigoActividad: string
  titulo: string
  descripcion?: string | null
  categoriaActividad?: string | null
  tipoOrigen?: string | null
  clienteId?: number | null
  ordenServicioId?: number | null
  solicitudId?: number | null
  prioridad?: string | null
  estado?: string | null
  fechaProgramada?: string | null
  fechaInicio?: string | null
  fechaFin?: string | null
  progresoPorcentaje?: number
  requiereReporte?: boolean
  requiereVisita?: boolean
  observaciones?: string | null
  cliente?: { id?: number; nombre?: string } | null
  ordenServicio?: { id?: number; numeroOrden?: string | null } | null
  solicitud?: { id?: number; nombreSolicitante?: string | null; tipoServicio?: string | null } | null
  creadoPor?: { id?: number; nombre?: string; email?: string } | null
  asignados?: Array<{
    id?: number
    usuarioId?: number
    rolEnActividad?: string | null
    estadoAsignacion?: string | null
    usuario?: { id?: number; nombre?: string; email?: string } | null
  }>
  pasos?: ActividadPaso[]
  visitas?: Array<{ id: number; numeroVisita?: string | null; estado?: string | null; fechaVisita?: string }>
  mensajes?: Array<{
    id: number
    usuarioId: number
    tipoMensaje?: string | null
    asunto?: string | null
    mensaje: string
    prioridad?: string | null
    estado?: string | null
    createdAt?: string
    usuario?: { id?: number; nombre?: string; email?: string } | null
  }>
}

export type CrearActividadPayload = {
  titulo: string
  descripcion?: string
  categoriaActividad?: string
  tipoOrigen?: string
  clienteId?: number | null
  ordenServicioId?: number | null
  solicitudId?: number | null
  prioridad?: string
  fechaProgramada?: string
  requiereReporte?: boolean
  requiereVisita?: boolean
  creadoPorId: number
  observaciones?: string
  asignadoAUserId: number
  pasos?: Array<{ tituloPaso: string; descripcionPaso?: string; obligatorio?: boolean }>
}

async function leerJson<T>(res: Response): Promise<T> {
  const raw = await res.text()
  const json = raw ? JSON.parse(raw) : {}

  if (!res.ok || !json?.ok) {
    throw new Error(json?.mensaje || `Error HTTP ${res.status}`)
  }

  return (json.data ?? json) as T
}

export async function obtenerActividades(filtros?: {
  usuarioId?: number | string
  asignadoAUserId?: number | string
  clienteId?: number | string
  ordenServicioId?: number | string
  solicitudId?: number | string
  estado?: string
}) {
  const params = new URLSearchParams()

  if (filtros?.usuarioId) params.set('usuarioId', String(filtros.usuarioId))
  if (filtros?.asignadoAUserId) params.set('asignadoAUserId', String(filtros.asignadoAUserId))
  if (filtros?.clienteId) params.set('clienteId', String(filtros.clienteId))
  if (filtros?.ordenServicioId) params.set('ordenServicioId', String(filtros.ordenServicioId))
  if (filtros?.solicitudId) params.set('solicitudId', String(filtros.solicitudId))
  if (filtros?.estado) params.set('estado', filtros.estado)

  const query = params.toString()
  const res = await fetch(`${API}/actividades${query ? `?${query}` : ''}`, {
    headers: { Accept: 'application/json' },
  })

  return leerJson<ActividadOperativa[]>(res)
}

export async function crearActividad(payload: CrearActividadPayload) {
  const res = await fetch(`${API}/actividades`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })

  return leerJson<ActividadOperativa>(res)
}

export async function actualizarPasoActividad(
  actividadId: number,
  pasoId: number,
  payload: { estadoPaso: string; realizadoPorId?: number | null }
) {
  const res = await fetch(`${API}/actividades/${actividadId}/pasos/${pasoId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })

  return leerJson<ActividadOperativa>(res)
}

export async function crearMensajeActividad(
  actividadId: number,
  payload: {
    usuarioId: number
    creadoParaUserId?: number | null
    tipoMensaje?: string
    asunto?: string
    mensaje: string
    prioridad?: string
  }
) {
  const res = await fetch(`${API}/actividades/${actividadId}/mensajes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })

  return leerJson<NonNullable<ActividadOperativa['mensajes']>[number]>(res)
}
