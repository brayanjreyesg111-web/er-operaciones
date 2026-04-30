const API = (import.meta.env.VITE_API_URL || "http://localhost:3001") + "/api";

export type DashboardCliente = {
  id: number
  nombre: string
  rtn?: string | null
  contactoNombre?: string | null
  telefono?: string | null
  correo?: string | null
  direccion?: string | null
  ubicacion?: string | null
  departamentoId?: number | null
  ciudadId?: number | null
  departamento?: { id?: number; nombre?: string } | null
  ciudad?: { id?: number; nombre?: string } | null
}

export type DashboardSolicitud = {
  id: number
  clienteId?: number | null
  departamentoId?: number | null
  ciudadId?: number | null
  direccionExacta?: string | null
  estado?: string | null
  nombreSolicitante: string
  telefono?: string | null
  correo?: string | null
  empresa?: string | null
  tipoServicio?: string | null
  descripcion?: string | null
  fechaDeseada?: string | null
  createdAt?: string
  departamento?: { id?: number; nombre?: string } | null
  ciudad?: { id?: number; nombre?: string } | null
  asignadoA?: { id?: number; nombre?: string } | null
}

export type DashboardVisita = {
  id: number
  numeroVisita?: string | null
  estado?: string | null
  fechaVisita?: string
  tipoVisita?: string | null
  motivoVisita?: string | null
  observaciones?: string | null
  requiereCotizacion?: boolean
  esVisitaLibre?: boolean
  cliente?: { id?: number; nombre?: string; telefono?: string | null; correo?: string | null; direccion?: string | null; ubicacion?: string | null; departamento?: { nombre?: string } | null; ciudad?: { nombre?: string } | null } | null
  tecnico?: { id?: number; nombre?: string; email?: string } | null
  ordenServicio?: { id?: number; numeroOrden?: string | null; prioridad?: string | null; estado?: string | null; tipoSolicitud?: string | null; descripcionProblema?: string | null; ubicacionServicio?: string | null; contactoNombre?: string | null; telefonoContacto?: string | null; correoContacto?: string | null } | null
  actividad?: {
    id?: number
    codigoActividad?: string | null
    titulo?: string
    categoriaActividad?: string
    estado?: string
  } | null
  maquinas?: Array<{
    id: number
    maquina?: {
      id?: number
      codigoInterno?: string | null
      marca?: string | null
      modelo?: string | null
      serie?: string | null
      area?: string | null
      direccionExacta?: string | null
      tipoEquipo?: string | null
      tipoUnidad?: { id?: number; nombre?: string } | null
      marcaCatalogo?: { id?: number; nombre?: string } | null
      refrigeranteCatalogo?: { id?: number; codigo?: string | null; nombre?: string } | null
      departamento?: { id?: number; nombre?: string } | null
      ciudad?: { id?: number; nombre?: string } | null
    } | null
  }>
  asignados?: Array<{
    id: number
    rolEnVisita?: string
    usuario?: { id?: number; nombre?: string; email?: string } | null
  }>
  reportes?: Array<{
    id: number
    numeroReporte?: string | null
    estado?: string | null
    fechaReporte?: string
  }>
}

export type DashboardActividad = {
  id: number
  codigoActividad: string
  titulo: string
  descripcion?: string | null
  categoriaActividad?: string | null
  tipoOrigen?: string | null
  prioridad?: string | null
  estado?: string | null
  fechaProgramada?: string | null
  progresoPorcentaje?: number
  requiereReporte?: boolean
  requiereVisita?: boolean
  cliente?: { id?: number; nombre?: string } | null
  ordenServicio?: { id?: number; numeroOrden?: string | null } | null
  solicitud?: { id?: number; nombreSolicitante?: string | null; tipoServicio?: string | null } | null
  asignados?: Array<{
    id?: number
    usuarioId?: number
    usuario?: { id?: number; nombre?: string; email?: string } | null
  }>
  pasos?: Array<{
    id: number
    orden: number
    tituloPaso: string
    descripcionPaso?: string | null
    estadoPaso?: string | null
    porcentajePaso?: number
  }>
  mensajes?: Array<{
    id: number
    asunto?: string | null
    mensaje: string
    prioridad?: string | null
    createdAt?: string
    usuario?: { id?: number; nombre?: string; email?: string } | null
  }>
}

export type DashboardReporte = {
  id: number
  numeroReporte: string
  estado?: string | null
  fechaReporte?: string
  cliente?: { id?: number; nombre?: string } | null
  tecnico?: { id?: number; nombre?: string; email?: string } | null
  visita?: { id?: number; fechaVisita?: string; estado?: string | null } | null
  maquina?: {
    id?: number
    codigoInterno?: string | null
    marca?: string | null
    modelo?: string | null
    serie?: string | null
    area?: string | null
  } | null
  procedimiento?: { id?: number; nombre?: string; codigo?: string | null } | null
  cierre?: {
    fechaCierre?: string | null
    nombreRecibe?: string | null
    motivoNoRecepcion?: string | null
  } | null
  acciones?: {
    verPdf?: string | null
    descargarPdf?: string | null
    whatsappTexto?: string | null
    correoAsunto?: string | null
    correoCuerpo?: string | null
  }
}

export type DashboardBaseData = {
  clientes: DashboardCliente[]
  solicitudes: DashboardSolicitud[]
  visitas: DashboardVisita[]
  actividades: DashboardActividad[]
  reportes: DashboardReporte[]
}

export type DashboardMetric = {
  label: string
  value: string
  hint: string
}

export type DashboardAdminData = DashboardBaseData & {
  metrics: DashboardMetric[]
  solicitudesRecientes: DashboardSolicitud[]
  visitasRecientes: DashboardVisita[]
  reportesRecientes: DashboardReporte[]
}

export type DashboardSupervisorData = DashboardBaseData & {
  metrics: DashboardMetric[]
  solicitudesPorGestionar: DashboardSolicitud[]
  visitasPendientes: DashboardVisita[]
  reportesSinCierre: DashboardReporte[]
}

export type DashboardTecnicoData = DashboardBaseData & {
  metrics: DashboardMetric[]
  misVisitas: DashboardVisita[]
  misActividades: DashboardActividad[]
  misReportes: DashboardReporte[]
}

function ordenarDescPorFecha<T>(items: T[], selector: (item: T) => string | null | undefined) {
  return [...items].sort((a, b) => {
    const fa = new Date(selector(a) || 0).getTime()
    const fb = new Date(selector(b) || 0).getTime()
    return fb - fa
  })
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  })

  const raw = await res.text()
  const json = raw ? JSON.parse(raw) : {}

  if (!res.ok || !json?.ok) {
    throw new Error(json?.mensaje || `Error HTTP ${res.status}`)
  }

  return (json.data ?? json) as T
}

async function fetchSafe<T>(url: string, fallback: T): Promise<T> {
  try {
    return await fetchJson<T>(url)
  } catch (error) {
    console.error(`Error cargando ${url}:`, error)
    return fallback
  }
}

function asegurarArray<T>(valor: unknown): T[] {
  return Array.isArray(valor) ? (valor as T[]) : []
}

function normalizarEstado(valor?: string | null) {
  return String(valor || '').trim().toUpperCase()
}

function fechaEsHoy(valor?: string | null) {
  if (!valor) return false

  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return false

  const hoy = new Date()

  return (
    fecha.getFullYear() === hoy.getFullYear() &&
    fecha.getMonth() === hoy.getMonth() &&
    fecha.getDate() === hoy.getDate()
  )
}

function visitaSigueActiva(visita: DashboardVisita) {
  const estado = normalizarEstado(visita.estado)
  return !['FINALIZADA', 'ATENDIDA', 'COMPLETADA', 'CERRADA'].includes(estado)
}

function solicitudRequiereGestion(solicitud: DashboardSolicitud) {
  const estado = normalizarEstado(solicitud.estado)
  return ['NUEVA', 'EN_REVISION', 'PENDIENTE', 'PROGRAMADA'].includes(estado)
}

function reporteSinCierre(reporte: DashboardReporte) {
  const estado = normalizarEstado(reporte.estado)
  if (['CERRADO', 'CERRADA', 'RECIBIDO', 'RECIBIDO_EN_SITIO', 'RECIBIDO_DIGITAL', 'SIN_RECEPCION'].includes(estado)) return false
  return !reporte.cierre?.fechaCierre && !reporte.cierre?.nombreRecibe && !reporte.cierre?.motivoNoRecepcion
}

function visitaPerteneceATecnico(visita: DashboardVisita, tecnicoId: number) {
  const id = Number(tecnicoId)
  if (!id) return false
  if (Number(visita.tecnico?.id) === id) return true

  return (visita.asignados || []).some((asignado) =>
    Number(asignado.usuario?.id) === id
  )
}

function reportePerteneceATecnico(reporte: DashboardReporte, tecnicoId: number) {
  const id = Number(tecnicoId)
  if (!id) return false
  return Number(reporte.tecnico?.id) === id
}

function actividadSigueActiva(actividad: DashboardActividad) {
  const estado = normalizarEstado(actividad.estado)
  return !['COMPLETADA', 'FINALIZADA', 'CERRADA', 'CANCELADA'].includes(estado)
}

function actividadPerteneceATecnico(actividad: DashboardActividad, tecnicoId: number) {
  const id = Number(tecnicoId)
  if (!id) return false
  return (actividad.asignados || []).some((asignado) =>
    Number(asignado.usuario?.id) === id || Number(asignado.usuarioId) === id
  )
}

export async function obtenerDashboardBaseData(): Promise<DashboardBaseData> {
  const [clientes, solicitudes, visitas, actividades, reportes] = await Promise.all([
    fetchSafe<DashboardCliente[]>(`${API}/clientes`, []),
    fetchSafe<DashboardSolicitud[]>(`${API}/solicitudes-publicas`, []),
    fetchSafe<DashboardVisita[]>(`${API}/visitas`, []),
    fetchSafe<DashboardActividad[]>(`${API}/actividades`, []),
    fetchSafe<DashboardReporte[]>(`${API}/reportes`, []),
  ])

  return {
    clientes: asegurarArray<DashboardCliente>(clientes),
    solicitudes: asegurarArray<DashboardSolicitud>(solicitudes),
    visitas: asegurarArray<DashboardVisita>(visitas),
    actividades: asegurarArray<DashboardActividad>(actividades),
    reportes: asegurarArray<DashboardReporte>(reportes),
  }
}

export function construirDashboardAdmin(base: DashboardBaseData): DashboardAdminData {
  const solicitudesRecientes = ordenarDescPorFecha(base.solicitudes.filter(solicitudRequiereGestion), (item) => item.createdAt).slice(0, 8)
  const visitasRecientes = ordenarDescPorFecha(base.visitas.filter(visitaSigueActiva), (item) => item.fechaVisita).slice(0, 8)
  const reportesRecientes = ordenarDescPorFecha(base.reportes, (item) => item.fechaReporte).slice(0, 5)

  const metrics: DashboardMetric[] = [
    {
      label: 'Clientes activos',
      value: String(base.clientes.length),
      hint: 'Base maestra actual registrada en el sistema.',
    },
    {
      label: 'Solicitudes por revisar',
      value: String(base.solicitudes.filter(solicitudRequiereGestion).length),
      hint: 'Entradas nuevas del portal pÃºblico pendientes de gestiÃ³n.',
    },
    {
      label: 'Visitas / actividades abiertas',
      value: String(base.visitas.filter(visitaSigueActiva).length + base.actividades.filter(actividadSigueActiva).length),
      hint: 'Visitas todavÃ­a no finalizadas o no atendidas por completo.',
    },
    {
      label: 'Reportes sin cierre',
      value: String(base.reportes.filter(reporteSinCierre).length),
      hint: 'Documentos emitidos que todavÃ­a requieren cierre o recepciÃ³n.',
    },
  ]

  return {
    ...base,
    metrics,
    solicitudesRecientes,
    visitasRecientes,
    reportesRecientes,
  }
}

export function construirDashboardSupervisor(base: DashboardBaseData): DashboardSupervisorData {
  const solicitudesPorGestionar = ordenarDescPorFecha(
    base.solicitudes.filter(solicitudRequiereGestion),
    (item) => item.createdAt
  ).slice(0, 6)

  const visitasPendientes = ordenarDescPorFecha(
    base.visitas.filter(visitaSigueActiva),
    (item) => item.fechaVisita
  ).slice(0, 6)

  const reportesSinCierre = ordenarDescPorFecha(
    base.reportes.filter(reporteSinCierre),
    (item) => item.fechaReporte
  ).slice(0, 6)

  const metrics: DashboardMetric[] = [
    {
      label: 'Solicitudes nuevas / revisiÃ³n',
      value: String(base.solicitudes.filter(solicitudRequiereGestion).length),
      hint: 'Bandeja inmediata para coordinaciÃ³n y asignaciÃ³n.',
    },
    {
      label: 'Visitas de hoy',
      value: String(base.visitas.filter((item) => fechaEsHoy(item.fechaVisita)).length),
      hint: 'Trabajo programado o ejecutado en la fecha actual.',
    },
    {
      label: 'Visitas pendientes',
      value: String(base.visitas.filter(visitaSigueActiva).length),
      hint: 'Casos todavÃ­a activos en operaciÃ³n.',
    },
    {
      label: 'Reportes sin cierre',
      value: String(base.reportes.filter(reporteSinCierre).length),
      hint: 'Documentos que aÃºn ocupan revisiÃ³n o cierre operativo.',
    },
  ]

  return {
    ...base,
    metrics,
    solicitudesPorGestionar,
    visitasPendientes,
    reportesSinCierre,
  }
}

export function construirDashboardTecnico(
  base: DashboardBaseData,
  tecnicoId: number
): DashboardTecnicoData {
  const misVisitas = ordenarDescPorFecha(
    base.visitas.filter((visita) => visitaPerteneceATecnico(visita, tecnicoId) && visitaSigueActiva(visita)),
    (item) => item.fechaVisita
  ).slice(0, 10)

  const misActividades = ordenarDescPorFecha(
    base.actividades.filter((actividad) => actividadPerteneceATecnico(actividad, tecnicoId) && actividadSigueActiva(actividad)),
    (item) => item.fechaProgramada || item.mensajes?.[0]?.createdAt
  ).slice(0, 8)

  const misVisitaIds = new Set(
    base.visitas
      .filter((visita) => visitaPerteneceATecnico(visita, tecnicoId))
      .map((visita) => Number(visita.id))
  )

  const reporteEsDelTecnico = (reporte: DashboardReporte) =>
    reportePerteneceATecnico(reporte, tecnicoId) ||
    (reporte.visita?.id ? misVisitaIds.has(Number(reporte.visita.id)) : false)

  const misReportes = ordenarDescPorFecha(
    base.reportes.filter(reporteEsDelTecnico),
    (item) => item.fechaReporte
  ).slice(0, 8)

  const metrics: DashboardMetric[] = [
    {
      label: 'Mis visitas activas',
      value: String(misVisitas.filter(visitaSigueActiva).length),
      hint: 'Visitas asignadas o bajo tu responsabilidad.',
    },
    {
      label: 'Actividades internas',
      value: String(misActividades.filter(actividadSigueActiva).length),
      hint: 'Tareas de taller, materiales o apoyo operativo pendientes.',
    },
    {
      label: 'Reportes sin cierre',
      value: String(base.reportes.filter((reporte) => reporteEsDelTecnico(reporte) && reporteSinCierre(reporte)).length),
      hint: 'Reportes generados por tu usuario que aÃºn requieren cierre.',
    },
    {
      label: 'Reportes con cierre',
      value: String(
        base.reportes.filter(
          (reporte) =>
            reporteEsDelTecnico(reporte) && !reporteSinCierre(reporte)
        ).length
      ),
      hint: 'Reportes que ya tienen recibido o motivo de no recepciÃ³n.',
    },
  ]

  return {
    ...base,
    metrics,
    misVisitas,
    misActividades,
    misReportes,
  }
}

export function textoSolicitudUbicacion(solicitud: DashboardSolicitud) {
  const ciudad = solicitud.ciudad?.nombre || ''
  const departamento = solicitud.departamento?.nombre || ''
  return [ciudad, departamento].filter(Boolean).join(', ')
}

export function textoMaquinaVisita(visita: DashboardVisita) {
  const primera = visita.maquinas?.[0]?.maquina
  if (!primera) return 'Sin mÃ¡quina asociada todavÃ­a'

  const partes = [primera.codigoInterno, primera.marca, primera.modelo, primera.serie]
    .filter((item) => item && String(item).trim())
    .map((item) => String(item))

  return partes.length ? partes.join(' Â· ') : `MÃ¡quina #${primera.id || ''}`
}

export function textoVisitaPrincipal(visita: DashboardVisita) {
  return visita.numeroVisita || `Visita #${visita.id}`
}

