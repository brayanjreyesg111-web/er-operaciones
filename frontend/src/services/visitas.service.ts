const API = 'http://localhost:3001/api'

export type VisitaOperativa = {
  id: number
  numeroVisita?: string | null
  clienteId: number
  tecnicoId: number
  ordenServicioId?: number | null
  actividadId?: number | null
  tipoVisita?: string | null
  motivoVisita?: string | null
  resultadoBreve?: string | null
  estado?: string | null
  fechaVisita?: string
  requiereCotizacion?: boolean
  esVisitaLibre?: boolean
  observaciones?: string | null
  cliente?: { id?: number; nombre?: string } | null
  tecnico?: { id?: number; nombre?: string; email?: string } | null
  maquinas?: Array<{
    id?: number
    maquinaId?: number
    maquina?: {
      id?: number
      codigoInterno?: string | null
      marca?: string | null
      modelo?: string | null
      serie?: string | null
      area?: string | null
    } | null
  }>
  asignados?: Array<{
    id?: number
    usuarioId?: number
    rolEnVisita?: string | null
    usuario?: { id?: number; nombre?: string; email?: string } | null
  }>
  mensajes?: VisitaComentario[]
}

export type CrearVisitaPayload = {
  clienteId: number
  ordenServicioId?: number | null
  tecnicoId: number
  actividadId?: number | null
  tipoVisita?: string
  motivo?: string
  resultado?: string
  requiereCotizacion?: boolean
  fechaProgramada?: string
  observaciones?: string
}

export type AsociarMaquinaVisitaPayload = Array<{
  maquinaId: number
}>

export type ArchivoComentarioVisitaPayload = {
  nombreArchivo: string
  contenidoBase64: string
  mimeType?: string | null
}

export type VisitaComentario = {
  id: number
  visitaId?: number | null
  actividadId?: number | null
  usuarioId: number
  tipoMensaje?: string | null
  asunto?: string | null
  mensaje: string
  prioridad?: string | null
  estado?: string | null
  createdAt?: string
  usuario?: {
    id?: number
    nombre?: string
    email?: string
  } | null
  archivos?: Array<{
    nombreArchivo: string
    nombreGuardado: string
    mimeType?: string | null
    tamanoBytes?: number
    urlLocal?: string
  }>
}

async function leerJson<T>(res: Response): Promise<T> {
  const raw = await res.text()
  const json = raw ? JSON.parse(raw) : {}

  if (!res.ok || !json?.ok) {
    throw new Error(json?.mensaje || `Error HTTP ${res.status}`)
  }

  return (json.data ?? json) as T
}

function limpiarBase64(data: string): string {
  return String(data || '').replace(/^data:.*;base64,/, '')
}

async function fileToBase64(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const result = String(reader.result || '')
      resolve(limpiarBase64(result))
    }

    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function convertirArchivosComentario(files: File[]): Promise<ArchivoComentarioVisitaPayload[]> {
  return await Promise.all(
    files.map(async (file) => ({
      nombreArchivo: file.name,
      mimeType: file.type || 'application/octet-stream',
      contenidoBase64: await fileToBase64(file),
    }))
  )
}

export async function obtenerVisitas(filtros?: {
  clienteId?: number | string
  ordenServicioId?: number | string
  tecnicoId?: number | string
  estado?: string
}) {
  const params = new URLSearchParams()

  if (filtros?.clienteId) params.set('clienteId', String(filtros.clienteId))
  if (filtros?.ordenServicioId) params.set('ordenServicioId', String(filtros.ordenServicioId))
  if (filtros?.tecnicoId) params.set('tecnicoId', String(filtros.tecnicoId))
  if (filtros?.estado) params.set('estado', filtros.estado)

  const query = params.toString()
  const res = await fetch(`${API}/visitas${query ? `?${query}` : ''}`, {
    headers: { Accept: 'application/json' },
  })

  return leerJson<VisitaOperativa[]>(res)
}

export async function crearVisita(payload: CrearVisitaPayload) {
  const res = await fetch(`${API}/visitas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })

  return leerJson<VisitaOperativa>(res)
}

export async function asociarMaquinasAVisita(
  visitaId: number,
  maquinas: AsociarMaquinaVisitaPayload
) {
  const res = await fetch(`${API}/visitas/${visitaId}/maquinas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ maquinas }),
  })

  return leerJson<VisitaOperativa>(res)
}

export async function asignarTecnicoAVisita(
  visitaId: number,
  payload: { tecnicoId: number; rolEnVisita?: string; motivoEstado?: string; observaciones?: string }
) {
  const res = await fetch(`${API}/visitas/${visitaId}/asignar-tecnico`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })

  return leerJson<VisitaOperativa>(res)
}

export async function actualizarEstadoVisita(
  visitaId: number,
  payload: { estado: 'PENDIENTE' | 'EN_PROCESO' | 'FINALIZADA'; motivoEstado?: string; observaciones?: string }
) {
  const res = await fetch(`${API}/visitas/${visitaId}/estado`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })

  return leerJson<VisitaOperativa>(res)
}

export async function finalizarVisita(
  visitaId: number,
  payload?: { motivoEstado?: string; observaciones?: string }
) {
  const res = await fetch(`${API}/visitas/${visitaId}/finalizar`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload || {}),
  })

  return leerJson<VisitaOperativa>(res)
}

export async function obtenerComentariosVisita(visitaId: number) {
  const res = await fetch(`${API}/visitas/${visitaId}/comentarios`, {
    headers: { Accept: 'application/json' },
  })

  return leerJson<VisitaComentario[]>(res)
}

export async function crearComentarioVisita(
  visitaId: number,
  payload: {
    usuarioId: number
    actividadId?: number | null
    tipoMensaje?: string
    asunto?: string
    mensaje?: string
    prioridad?: string
    creadoParaUserId?: number | null
    archivos?: File[]
  }
) {
  const archivos = payload.archivos?.length
    ? await convertirArchivosComentario(payload.archivos)
    : []

  const res = await fetch(`${API}/visitas/${visitaId}/comentarios`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      usuarioId: payload.usuarioId,
      actividadId: payload.actividadId ?? null,
      tipoMensaje: payload.tipoMensaje || 'COMENTARIO_TECNICO',
      asunto: payload.asunto,
      mensaje: payload.mensaje,
      prioridad: payload.prioridad || 'MEDIA',
      creadoParaUserId: payload.creadoParaUserId ?? null,
      archivos,
    }),
  })

  return leerJson<VisitaComentario>(res)
}
