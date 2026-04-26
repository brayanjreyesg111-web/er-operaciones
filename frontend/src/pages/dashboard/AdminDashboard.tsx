import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '../../auth/AuthContext'
import RoleActionBar from '../../components/layout/RoleActionBar'
import SearchableSelect from '../../components/ui/SearchableSelect'
import {
  obtenerHallazgos,
  obtenerMarcas,
  obtenerProcedimientos,
  obtenerRefrigerantes,
  obtenerUsuariosOperativos,
  obtenerTiposUnidad,
} from '../../services/catalogos.service'
import {
  construirDashboardAdmin,
  obtenerDashboardBaseData,
  textoSolicitudUbicacion,
  textoVisitaPrincipal,
  type DashboardAdminData,
  type DashboardSolicitud,
} from '../../services/dashboard.service'
import { obtenerMaquinas, type MaquinaResumen } from '../../services/maquinas.service'
import {
  crearOrdenServicio,
  obtenerOrdenesServicio,
  type OrdenServicio,
} from '../../services/ordenes.service'
import {
  asociarMaquinasAVisita,
  crearComentarioVisita,
  crearVisita,
  obtenerVisitas,
  actualizarEstadoVisita,
  type VisitaComentario,
  type VisitaOperativa,
} from '../../services/visitas.service'
import {
  obtenerCiudadesPublicas,
  obtenerDepartamentosPublicos,
  type CatalogoUbicacionItem,
  actualizarEstadoSolicitudPublica,
} from '../../services/solicitudes.service'
import { actualizarPasoActividad, crearActividad } from '../../services/actividades.service'
import type { CatalogoItem } from '../../types/catalogos.types'
import type { TecnicoOption } from '../../types/reportes.types'

type TablaGestion = {
  value: string
  label: string
  grupo: string
  descripcion: string
}

type PanelOperativo = 'orden' | 'visita' | 'actividad' | null

type FiltroSolicitud = 'TODAS' | 'NUEVAS' | 'EN_REVISION' | 'CONVERTIDAS' | 'CANCELADAS'
type FiltroVisita = 'TODAS' | 'PENDIENTES' | 'EN_PROCESO' | 'FINALIZADAS'
type FiltroReporte = 'TODOS' | 'SIN_CIERRE' | 'CERRADOS'

const filtrosSolicitudes: Array<{ value: FiltroSolicitud; label: string }> = [
  { value: 'TODAS', label: 'Todas' },
  { value: 'NUEVAS', label: 'Nuevas' },
  { value: 'EN_REVISION', label: 'En revisión' },
  { value: 'CONVERTIDAS', label: 'Convertidas' },
  { value: 'CANCELADAS', label: 'Canceladas' },
]

const filtrosVisitas: Array<{ value: FiltroVisita; label: string }> = [
  { value: 'TODAS', label: 'Todas' },
  { value: 'PENDIENTES', label: 'Pendientes' },
  { value: 'EN_PROCESO', label: 'En proceso' },
  { value: 'FINALIZADAS', label: 'Finalizadas' },
]

const filtrosReportes: Array<{ value: FiltroReporte; label: string }> = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'SIN_CIERRE', label: 'Sin cierre' },
  { value: 'CERRADOS', label: 'Cerrados' },
]


type OrdenForm = {
  solicitudId: string
  clienteId: string
  maquinaId: string
  contactoNombre: string
  telefonoContacto: string
  correoContacto: string
  departamentoId: string
  ciudadId: string
  direccionExacta: string
  prioridad: string
  tipoSolicitud: string
  origenSolicitud: string
  descripcionProblema: string
}

type VisitaForm = {
  ordenServicioId: string
  clienteId: string
  maquinaId: string
  tecnicoId: string
  fechaProgramada: string
  horaProgramada: string
  minutoProgramado: string
  periodoProgramado: 'AM' | 'PM'
  tipoVisita: string
  motivo: string
  observaciones: string
  requiereCotizacion: boolean
}

type ActividadForm = {
  tipoActividad: 'INTERNA' | 'ORDEN'
  ordenServicioId: string
  clienteId: string
  asignadoAUserId: string
  titulo: string
  categoriaActividad: string
  prioridad: string
  fechaProgramada: string
  descripcion: string
  pasosTexto: string
  requiereReporte: boolean
  requiereVisita: boolean
}

type CatalogosAdmin = {
  tecnicos: TecnicoOption[]
  tiposUnidad: CatalogoItem[]
  marcas: CatalogoItem[]
  refrigerantes: CatalogoItem[]
  procedimientos: CatalogoItem[]
  hallazgos: CatalogoItem[]
}

type MensajeOperativo = {
  key: string
  visitaId: number
  numeroVisita?: string | null
  clienteNombre: string
  tecnicoNombre: string
  asunto?: string | null
  mensaje: string
  prioridad?: string | null
  createdAt?: string
  usuarioNombre?: string | null
  archivos?: VisitaComentario['archivos']
}

const ORDEN_FORM_INICIAL: OrdenForm = {
  solicitudId: '',
  clienteId: '',
  maquinaId: '',
  contactoNombre: '',
  telefonoContacto: '',
  correoContacto: '',
  departamentoId: '',
  ciudadId: '',
  direccionExacta: '',
  prioridad: 'media',
  tipoSolicitud: 'Mantenimiento',
  origenSolicitud: 'MANUAL_ADMIN',
  descripcionProblema: '',
}

const VISITA_FORM_INICIAL: VisitaForm = {
  ordenServicioId: '',
  clienteId: '',
  maquinaId: '',
  tecnicoId: '',
  fechaProgramada: '',
  horaProgramada: '08',
  minutoProgramado: '00',
  periodoProgramado: 'AM',
  tipoVisita: 'Mantenimiento',
  motivo: '',
  observaciones: '',
  requiereCotizacion: false,
}

const ACTIVIDAD_FORM_INICIAL: ActividadForm = {
  tipoActividad: 'INTERNA',
  ordenServicioId: '',
  clienteId: '',
  asignadoAUserId: '',
  titulo: '',
  categoriaActividad: 'TALLER',
  prioridad: 'MEDIA',
  fechaProgramada: '',
  descripcion: '',
  pasosTexto: 'Preparar ejecución\nRealizar trabajo asignado\nReportar avance\nCerrar actividad',
  requiereReporte: false,
  requiereVisita: false,
}

const CATALOGOS_INICIALES: CatalogosAdmin = {
  tecnicos: [],
  tiposUnidad: [],
  marcas: [],
  refrigerantes: [],
  procedimientos: [],
  hallazgos: [],
}

const tiposVisita = ['Mantenimiento', 'Diagnóstico', 'Reparación', 'Emergencia', 'Seguimiento']

function normalizarTipoSolicitud(valor?: string | null) {
  const limpio = String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()

  if (limpio.includes('DIAGN')) return 'Diagnóstico'
  if (limpio.includes('CORRECT')) return 'Reparación'
  if (limpio.includes('REPAR')) return 'Reparación'
  if (limpio.includes('INSTAL')) return 'Seguimiento'
  if (limpio.includes('EMER')) return 'Emergencia'
  if (limpio.includes('MANT')) return 'Mantenimiento'

  return valor && String(valor).trim() ? String(valor).trim() : 'Mantenimiento'
}

function textoUsuarioOperativo(usuario: TecnicoOption) {
  return usuario.label || (usuario.roleLabel ? usuario.nombre + ' · ' + usuario.roleLabel : usuario.nombre)
}
const horas12 = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'))
const minutos = ['00', '15', '30', '45']

const tablasGestion: TablaGestion[] = [
  { value: 'clientes', label: 'Clientes', grupo: 'Operación', descripcion: 'Base maestra de empresas y personas atendidas por el sistema.' },
  { value: 'maquinas', label: 'Máquinas', grupo: 'Operación', descripcion: 'Equipos registrados para historial técnico, visitas y reportes.' },
  { value: 'ordenes_trabajo', label: 'Órdenes de trabajo', grupo: 'Operación', descripcion: 'Órdenes manuales creadas por administración.' },
  { value: 'visitas', label: 'Visitas', grupo: 'Operación', descripcion: 'Trabajo operativo ligado a cliente, orden, técnico y reporte.' },
  { value: 'actividades', label: 'Actividades internas', grupo: 'Operación', descripcion: 'Tareas de taller, materiales, limpieza y apoyo operativo.' },
  { value: 'refrigerantes', label: 'Tipos de refrigerante', grupo: 'Catálogos', descripcion: 'Catálogo para máquinas y formularios técnicos.' },
  { value: 'marcas', label: 'Marcas', grupo: 'Catálogos', descripcion: 'Catálogo de marcas disponibles.' },
  { value: 'tipos_maquina', label: 'Tipos de máquina', grupo: 'Catálogos', descripcion: 'Familias o tipos de equipo.' },
  { value: 'procedimientos', label: 'Procedimientos', grupo: 'Catálogos', descripcion: 'Procedimientos usados en reportes.' },
  { value: 'hallazgos', label: 'Hallazgos', grupo: 'Catálogos', descripcion: 'Checklist de hallazgos técnicos.' },
  { value: 'usuarios_roles', label: 'Usuarios y roles', grupo: 'Control', descripcion: 'Usuarios disponibles para asignación operativa.' },
]


function extraerUrls(texto: string) {
  return texto
    .split(/\s+/)
    .filter((parte) => /^https?:\/\//i.test(parte.trim()))
    .map((parte) => parte.trim())
}

function limpiarMensajeSinUrls(texto: string) {
  return texto
    .split('\n')
    .filter((linea) => !/^https?:\/\//i.test(linea.trim()) && !linea.includes('http://') && !linea.includes('https://'))
    .join('\n')
    .trim()
}

function formatearFecha(valor?: string | null) {
  if (!valor) return 'Fecha pendiente'
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return 'Fecha pendiente'
  return fecha.toLocaleString()
}



function normalizarEstado(valor?: string | null) {
  return String(valor || '').trim().toUpperCase()
}

function cumpleFiltroSolicitud(estadoOriginal: string | null | undefined, filtro: FiltroSolicitud) {
  const estado = normalizarEstado(estadoOriginal || 'NUEVA')
  if (filtro === 'TODAS') return true
  if (filtro === 'NUEVAS') return ['NUEVA', 'PENDIENTE'].includes(estado)
  if (filtro === 'EN_REVISION') return ['EN_REVISION', 'REVISION', 'PROGRAMADA', 'EN_PROCESO'].includes(estado)
  if (filtro === 'CONVERTIDAS') return ['CONVERTIDA', 'CONVERTIDA_ORDEN', 'GESTIONADA', 'ORDEN_GENERADA', 'ATENDIDA'].includes(estado)
  if (filtro === 'CANCELADAS') return ['CANCELADA', 'ANULADA', 'RECHAZADA'].includes(estado)
  return true
}

function cumpleFiltroVisita(estadoOriginal: string | null | undefined, filtro: FiltroVisita) {
  const estado = normalizarEstado(estadoOriginal || 'PENDIENTE')
  if (filtro === 'TODAS') return true
  if (filtro === 'PENDIENTES') return ['PENDIENTE', 'ASIGNADA', 'NUEVA'].includes(estado)
  if (filtro === 'EN_PROCESO') return ['EN_PROCESO', 'PROCESO', 'INICIADA', 'MOVILIZACION'].includes(estado)
  if (filtro === 'FINALIZADAS') return ['FINALIZADA', 'ATENDIDA', 'COMPLETADA', 'CERRADA'].includes(estado)
  return true
}

function reporteCerrado(reporte: { estado?: string | null; cierre?: { fechaCierre?: string | null; nombreRecibe?: string | null; motivoNoRecepcion?: string | null } | null }) {
  const estado = normalizarEstado(reporte.estado)
  return Boolean(reporte.cierre?.fechaCierre || reporte.cierre?.nombreRecibe || reporte.cierre?.motivoNoRecepcion) || ['CERRADO', 'CERRADA', 'RECIBIDO', 'RECIBIDO_EN_SITIO', 'SIN_RECEPCION'].includes(estado)
}

function cumpleFiltroReporte(reporte: { estado?: string | null; cierre?: { fechaCierre?: string | null; nombreRecibe?: string | null; motivoNoRecepcion?: string | null } | null }, filtro: FiltroReporte) {
  if (filtro === 'TODOS') return true
  if (filtro === 'SIN_CIERRE') return !reporteCerrado(reporte)
  if (filtro === 'CERRADOS') return reporteCerrado(reporte)
  return true
}

function valorTexto(valor?: string | null) {
  return valor && valor.trim() ? valor : 'Sin dato'
}

function textoOrden(orden: OrdenServicio) {
  return `${orden.numeroOrden} · ${orden.cliente?.nombre || `Cliente #${orden.clienteId}`}`
}

function textoMaquina(maquina: MaquinaResumen) {
  const partes = [maquina.codigoInterno, maquina.marca, maquina.modelo, maquina.serie, maquina.area]
    .filter((item) => item && String(item).trim())
    .map((item) => String(item))

  return partes.length ? partes.join(' · ') : `Máquina #${maquina.id}`
}

function convertirHora12A24(hora: string, minuto: string, periodo: 'AM' | 'PM') {
  let hh = Number(hora)
  if (!Number.isInteger(hh) || hh < 1 || hh > 12) hh = 8
  if (periodo === 'AM' && hh === 12) hh = 0
  if (periodo === 'PM' && hh !== 12) hh += 12
  return `${String(hh).padStart(2, '0')}:${minuto || '00'}`
}

function construirFechaProgramada(form: VisitaForm) {
  if (!form.fechaProgramada) return undefined
  const hora24 = convertirHora12A24(form.horaProgramada, form.minutoProgramado, form.periodoProgramado)
  return `${form.fechaProgramada}T${hora24}`
}

function normalizarMaquinaSeleccionada(valor: string, maquinas: MaquinaResumen[]) {
  if (!valor) return ''
  if (valor === 'NO_REGISTRADA') return 'Máquina no registrada por el cliente.'
  if (valor === 'PENDIENTE_IDENTIFICAR') return 'Máquina pendiente por identificar en campo.'
  const maquina = maquinas.find((item) => String(item.id) === valor)
  return maquina ? textoMaquina(maquina) : ''
}

function agregarLineaSiExiste(textoBase: string, titulo: string, valor: string) {
  const limpio = valor.trim()
  if (!limpio) return textoBase.trim()
  return [textoBase.trim(), `${titulo}: ${limpio}`].filter(Boolean).join('\n')
}

function construirMensajesOperativos(visitas: VisitaOperativa[]): MensajeOperativo[] {
  return visitas
    .flatMap((visita) =>
      (visita.mensajes || []).map((mensaje) => ({
        key: `${visita.id}-${mensaje.id}`,
        visitaId: visita.id,
        numeroVisita: visita.numeroVisita,
        clienteNombre: visita.cliente?.nombre || `Cliente #${visita.clienteId}`,
        tecnicoNombre: visita.tecnico?.nombre || `Técnico #${visita.tecnicoId}`,
        asunto: mensaje.asunto,
        mensaje: mensaje.mensaje,
        prioridad: mensaje.prioridad,
        createdAt: mensaje.createdAt,
        usuarioNombre: mensaje.usuario?.nombre,
        archivos: mensaje.archivos,
      }))
    )
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 10)
}

function construirPasos(texto: string) {
  return texto
    .split('\n')
    .map((linea) => linea.trim())
    .filter(Boolean)
    .map((tituloPaso) => ({ tituloPaso }))
}

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [panelActivo, setPanelActivo] = useState<PanelOperativo>(null)
  const [dashboard, setDashboard] = useState<DashboardAdminData | null>(null)
  const [mensajesOperativos, setMensajesOperativos] = useState<MensajeOperativo[]>([])
  const [replyForms, setReplyForms] = useState<Record<string, string>>({})
  const [ordenes, setOrdenes] = useState<OrdenServicio[]>([])
  const [maquinas, setMaquinas] = useState<MaquinaResumen[]>([])
  const [departamentos, setDepartamentos] = useState<CatalogoUbicacionItem[]>([])
  const [ciudadesOrden, setCiudadesOrden] = useState<CatalogoUbicacionItem[]>([])
  const [catalogos, setCatalogos] = useState<CatalogosAdmin>(CATALOGOS_INICIALES)
  const [tablaSeleccionada, setTablaSeleccionada] = useState('clientes')
  const [ordenForm, setOrdenForm] = useState<OrdenForm>(ORDEN_FORM_INICIAL)
  const [visitaForm, setVisitaForm] = useState<VisitaForm>(VISITA_FORM_INICIAL)
  const [actividadForm, setActividadForm] = useState<ActividadForm>(ACTIVIDAD_FORM_INICIAL)
  const [filtroSolicitudes, setFiltroSolicitudes] = useState<FiltroSolicitud>('NUEVAS')
  const [filtroVisitas, setFiltroVisitas] = useState<FiltroVisita>('PENDIENTES')
  const [filtroReportes, setFiltroReportes] = useState<FiltroReporte>('SIN_CIERRE')

  async function cargarDatos() {
    setError('')
    const [
      base,
      ordenesData,
      maquinasData,
      visitasMensajesData,
      departamentosData,
      tecnicos,
      tiposUnidad,
      marcas,
      refrigerantes,
      procedimientos,
      hallazgos,
    ] = await Promise.all([
      obtenerDashboardBaseData(),
      obtenerOrdenesServicio(),
      obtenerMaquinas(),
      obtenerVisitas(),
      obtenerDepartamentosPublicos(),
      obtenerUsuariosOperativos(),
      obtenerTiposUnidad(),
      obtenerMarcas(),
      obtenerRefrigerantes(),
      obtenerProcedimientos(),
      obtenerHallazgos(),
    ])

    setDashboard(construirDashboardAdmin(base))
    setOrdenes(ordenesData)
    setMaquinas(maquinasData)
    setMensajesOperativos(construirMensajesOperativos(visitasMensajesData))
    setDepartamentos(departamentosData)
    setCatalogos({
      tecnicos,
      tiposUnidad,
      marcas,
      refrigerantes,
      procedimientos: procedimientos as unknown as CatalogoItem[],
      hallazgos: hallazgos as unknown as CatalogoItem[],
    })
  }

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        await cargarDatos()
      } catch (err) {
        console.error(err)
        setError('No se pudo cargar el dashboard administrativo.')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  useEffect(() => {
    async function cargarCiudades() {
      if (!ordenForm.departamentoId) {
        setCiudadesOrden([])
        return
      }

      try {
        const data = await obtenerCiudadesPublicas(Number(ordenForm.departamentoId))
        setCiudadesOrden(data)
      } catch (err) {
        console.error(err)
        setCiudadesOrden([])
      }
    }

    void cargarCiudades()
  }, [ordenForm.departamentoId])

  const actionItems = useMemo(
    () => [
      { label: 'Crear orden', targetId: 'admin-orden-manual', tone: 'primary' as const },
      { label: 'Asignar visita', targetId: 'admin-crear-visita', tone: 'primary' as const },
      { label: 'Crear actividad', targetId: 'admin-crear-actividad', tone: 'primary' as const },
      { label: 'Nuevo cliente', href: '/portal/reportes?abrir=cliente&context=dashboard&from=admin' },
      { label: 'Nueva máquina', href: '/portal/reportes?abrir=maquina&context=dashboard&from=admin' },
      { label: 'Solicitudes', targetId: 'admin-solicitudes' },
      { label: 'Visitas', targetId: 'admin-visitas' },
      { label: 'Mensajes', targetId: 'admin-mensajes' },
      { label: 'Reportes', targetId: 'admin-reportes' },
      { label: 'Administrar BD', targetId: 'admin-bd' },
    ],
    []
  )

  const tablaActiva = tablasGestion.find((item) => item.value === tablaSeleccionada) ?? tablasGestion[0]

  const maquinasOrdenCliente = useMemo(
    () => maquinas.filter((maquina) => String(maquina.clienteId) === ordenForm.clienteId),
    [maquinas, ordenForm.clienteId]
  )

  const maquinasVisitaCliente = useMemo(
    () => maquinas.filter((maquina) => String(maquina.clienteId) === visitaForm.clienteId),
    [maquinas, visitaForm.clienteId]
  )

  const solicitudesParaGestion = useMemo(
    () => (dashboard?.solicitudes || []).filter((solicitud) =>
      ['NUEVA', 'PENDIENTE', 'EN_REVISION', 'PROGRAMADA'].includes(normalizarEstado(solicitud.estado))
    ),
    [dashboard?.solicitudes]
  )

  const ordenesParaVisita = useMemo(
    () => ordenes.filter((orden) => {
      const estado = normalizarEstado(orden.estado || 'nueva')
      const tieneVisita = (orden.visitas || []).some((visita) =>
        !['FINALIZADA', 'ATENDIDA', 'COMPLETADA', 'CERRADA', 'CANCELADA'].includes(normalizarEstado(visita.estado))
      )
      return !tieneVisita && !['CERRADA', 'CERRADO', 'CANCELADA', 'ANULADA'].includes(estado)
    }),
    [ordenes]
  )

  function cerrarPanelYSubir() {
    setPanelActivo(null)
    window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 40)
  }

  async function cancelarSolicitud(solicitud: DashboardSolicitud) {
    setMensaje('')
    setError('')
    try {
      setSaving(true)
      await actualizarEstadoSolicitudPublica(solicitud.id, {
        estado: 'CANCELADA',
        motivoEstado: 'Solicitud cancelada desde dashboard operativo.',
      })
      setMensaje(`Solicitud #${solicitud.id} cancelada correctamente.`)
      await cargarDatos()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'No se pudo cancelar la solicitud.')
    } finally {
      setSaving(false)
    }
  }

  const itemsGestion = useMemo(() => {
    if (tablaSeleccionada === 'clientes') {
      return (dashboard?.clientes || []).map((cliente) => ({
        id: cliente.id,
        titulo: cliente.nombre,
        detalle: `Cliente #${cliente.id}`,
      }))
    }

    if (tablaSeleccionada === 'maquinas') {
      return maquinas.map((maquina) => ({
        id: maquina.id,
        titulo: textoMaquina(maquina),
        detalle: maquina.cliente?.nombre || 'Cliente pendiente',
      }))
    }

    if (tablaSeleccionada === 'ordenes_trabajo') {
      return ordenes.map((orden) => ({
        id: orden.id,
        titulo: textoOrden(orden),
        detalle: `${orden.estado || 'nueva'} · ${valorTexto(orden.tipoSolicitud)}`,
      }))
    }

    if (tablaSeleccionada === 'visitas') {
      return (dashboard?.visitas || []).map((visita) => ({
        id: visita.id,
        titulo: textoVisitaPrincipal(visita),
        detalle: `${visita.cliente?.nombre || 'Cliente'} · ${visita.tecnico?.nombre || 'Técnico pendiente'}`,
      }))
    }

    if (tablaSeleccionada === 'actividades') {
      return (dashboard?.actividades || []).map((actividad) => ({
        id: actividad.id,
        titulo: `${actividad.codigoActividad} · ${actividad.titulo}`,
        detalle: `${actividad.estado || 'pendiente'} · ${actividad.progresoPorcentaje || 0}%`,
      }))
    }

    if (tablaSeleccionada === 'usuarios_roles') {
      return catalogos.tecnicos.map((tecnico) => ({
        id: tecnico.id,
        titulo: tecnico.nombre,
        detalle: tecnico.email || 'Usuario técnico / supervisor',
      }))
    }

    const catalogoMap: Record<string, CatalogoItem[]> = {
      refrigerantes: catalogos.refrigerantes,
      marcas: catalogos.marcas,
      tipos_maquina: catalogos.tiposUnidad,
      procedimientos: catalogos.procedimientos,
      hallazgos: catalogos.hallazgos,
    }

    return (catalogoMap[tablaSeleccionada] || []).map((item) => ({
      id: item.id,
      titulo: item.codigo ? `${item.codigo} · ${item.nombre || item.descripcion}` : item.nombre || item.descripcion || `Ítem #${item.id}`,
      detalle: item.descripcion || `Registro #${item.id}`,
    }))
  }, [catalogos, dashboard, maquinas, ordenes, tablaSeleccionada])


  function completarOrdenConDatosCliente(prev: OrdenForm, clienteId: string): OrdenForm {
    const cliente = dashboard?.clientes?.find((item) => String(item.id) === clienteId)

    if (!cliente) {
      return {
        ...prev,
        clienteId,
        maquinaId: '',
      }
    }

    return {
      ...prev,
      clienteId,
      maquinaId: '',
      contactoNombre: cliente.contactoNombre || prev.contactoNombre || cliente.nombre || '',
      telefonoContacto: cliente.telefono || prev.telefonoContacto || '',
      correoContacto: cliente.correo || prev.correoContacto || '',
      departamentoId: cliente.departamentoId ? String(cliente.departamentoId) : prev.departamentoId,
      ciudadId: cliente.ciudadId ? String(cliente.ciudadId) : prev.ciudadId,
      direccionExacta: cliente.direccion || cliente.ubicacion || prev.direccionExacta || '',
    }
  }

  const solicitudesFiltradas = useMemo(() => solicitudesParaGestion.filter((solicitud) => cumpleFiltroSolicitud(solicitud.estado, filtroSolicitudes)), [solicitudesParaGestion, filtroSolicitudes])
  const visitasFiltradas = useMemo(() => (dashboard?.visitasRecientes || []).filter((visita) => cumpleFiltroVisita(visita.estado, filtroVisitas)), [dashboard?.visitasRecientes, filtroVisitas])
  const reportesFiltrados = useMemo(() => (dashboard?.reportes || []).filter((reporte) => cumpleFiltroReporte(reporte, filtroReportes)), [dashboard?.reportes, filtroReportes])

  function actualizarOrdenForm(campo: keyof OrdenForm, valor: string) {
    setOrdenForm((prev) => {
      if (campo === 'clienteId') {
        return completarOrdenConDatosCliente(prev, valor)
      }

      return {
        ...prev,
        [campo]: valor,
        ...(campo === 'departamentoId' ? { ciudadId: '' } : {}),
      }
    })
  }

  function actualizarVisitaForm(campo: keyof VisitaForm, valor: string | boolean) {
    setVisitaForm((prev) => ({
      ...prev,
      [campo]: valor,
      ...(campo === 'clienteId' ? { maquinaId: '' } : {}),
    }))
  }

  function llenarActividadDesdeOrden(prev: ActividadForm, ordenId: string) {
    const orden = ordenes.find((item) => String(item.id) === ordenId)
    if (!orden) return { clienteId: prev.clienteId }
    return {
      clienteId: String(orden.clienteId),
      titulo: prev.titulo || orden.tipoSolicitud || 'Actividad operativa',
      descripcion: prev.descripcion || orden.descripcionProblema,
    }
  }

  function actualizarActividadForm(campo: keyof ActividadForm, valor: string | boolean) {
    setActividadForm((prev) => ({
      ...prev,
      [campo]: valor,
      ...(campo === 'ordenServicioId' && typeof valor === 'string' ? llenarActividadDesdeOrden(prev, valor) : {}),

    }))
  }

  function seleccionarSolicitudParaOrden(solicitudId: string) {
    const solicitud = dashboard?.solicitudes.find((item) => String(item.id) === solicitudId)
    if (!solicitud) {
      setOrdenForm((prev) => ({ ...prev, solicitudId }))
      return
    }

    setOrdenForm((prev) => {
      const baseCliente = solicitud.clienteId
        ? completarOrdenConDatosCliente(prev, String(solicitud.clienteId))
        : prev

      return {
        ...baseCliente,
        solicitudId,
        clienteId: solicitud.clienteId ? String(solicitud.clienteId) : baseCliente.clienteId,
        contactoNombre: solicitud.nombreSolicitante || baseCliente.contactoNombre,
        telefonoContacto: solicitud.telefono || baseCliente.telefonoContacto,
        correoContacto: solicitud.correo || baseCliente.correoContacto,
        departamentoId: solicitud.departamentoId ? String(solicitud.departamentoId) : baseCliente.departamentoId,
        ciudadId: solicitud.ciudadId ? String(solicitud.ciudadId) : baseCliente.ciudadId,
        direccionExacta: solicitud.direccionExacta || baseCliente.direccionExacta,
        tipoSolicitud: normalizarTipoSolicitud(solicitud.tipoServicio || baseCliente.tipoSolicitud),
        origenSolicitud: 'PORTAL_PUBLICO',
        descripcionProblema: solicitud.descripcion || baseCliente.descripcionProblema,
      }
    })
  }

  function seleccionarOrdenParaVisita(ordenId: string) {
    const orden = ordenes.find((item) => String(item.id) === ordenId)
    setVisitaForm((prev) => ({
      ...prev,
      ordenServicioId: ordenId,
      clienteId: orden ? String(orden.clienteId) : prev.clienteId,
      maquinaId: '',
      tipoVisita: normalizarTipoSolicitud(orden?.tipoSolicitud || prev.tipoVisita),
      motivo: orden?.descripcionProblema || prev.motivo,
    }))
  }

  function construirUbicacionOrden() {
    const departamento = departamentos.find((item) => String(item.id) === ordenForm.departamentoId)?.nombre || ''
    const ciudad = ciudadesOrden.find((item) => String(item.id) === ordenForm.ciudadId)?.nombre || ''
    return [ciudad, departamento, ordenForm.direccionExacta].filter((item) => item && item.trim()).join(' · ')
  }

  async function enviarOrdenManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMensaje('')
    setError('')

    try {
      setSaving(true)
      const maquinaTexto = normalizarMaquinaSeleccionada(ordenForm.maquinaId, maquinasOrdenCliente)
      let descripcionFinal = agregarLineaSiExiste(ordenForm.descripcionProblema, 'Máquina relacionada', maquinaTexto)
      descripcionFinal = agregarLineaSiExiste(descripcionFinal, 'Solicitud pública relacionada', ordenForm.solicitudId ? `Solicitud #${ordenForm.solicitudId}` : '')

      const orden = await crearOrdenServicio({
        clienteId: Number(ordenForm.clienteId),
        contactoNombre: ordenForm.contactoNombre || undefined,
        telefonoContacto: ordenForm.telefonoContacto || undefined,
        correoContacto: ordenForm.correoContacto || undefined,
        ubicacionServicio: construirUbicacionOrden() || undefined,
        prioridad: ordenForm.prioridad || 'media',
        tipoSolicitud: normalizarTipoSolicitud(ordenForm.tipoSolicitud),
        origenSolicitud: ordenForm.origenSolicitud || 'MANUAL_ADMIN',
        descripcionProblema: descripcionFinal,
        solicitudId: ordenForm.solicitudId ? Number(ordenForm.solicitudId) : undefined,
      })

      setMensaje(`Orden ${orden.numeroOrden} creada correctamente.`)
      setOrdenForm(ORDEN_FORM_INICIAL)
      setPanelActivo(null)
      await cargarDatos()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'No se pudo crear la orden de trabajo.')
    } finally {
      setSaving(false)
    }
  }

  async function enviarVisita(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMensaje('')
    setError('')

    try {
      setSaving(true)
      const maquinaTexto = normalizarMaquinaSeleccionada(visitaForm.maquinaId, maquinasVisitaCliente)
      const observacionesConMaquina = agregarLineaSiExiste(
        visitaForm.observaciones,
        'Máquina indicada para la visita',
        visitaForm.maquinaId && Number.isNaN(Number(visitaForm.maquinaId)) ? maquinaTexto : ''
      )

      const visita = await crearVisita({
        clienteId: Number(visitaForm.clienteId),
        ordenServicioId: visitaForm.ordenServicioId ? Number(visitaForm.ordenServicioId) : null,
        tecnicoId: Number(visitaForm.tecnicoId),
        tipoVisita: visitaForm.tipoVisita || undefined,
        motivo: visitaForm.motivo || undefined,
        fechaProgramada: construirFechaProgramada(visitaForm),
        observaciones: observacionesConMaquina || undefined,
        requiereCotizacion: visitaForm.requiereCotizacion,
      })

      if (visitaForm.maquinaId && !Number.isNaN(Number(visitaForm.maquinaId))) {
        await asociarMaquinasAVisita(visita.id, [{ maquinaId: Number(visitaForm.maquinaId) }])
      }

      setMensaje(`${visita.numeroVisita || `Visita #${visita.id}`} creada y asignada correctamente.`)
      setVisitaForm(VISITA_FORM_INICIAL)
      setPanelActivo(null)
      await cargarDatos()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'No se pudo asignar la visita.')
    } finally {
      setSaving(false)
    }
  }

  async function enviarActividad(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user?.id) return
    setMensaje('')
    setError('')

    try {
      setSaving(true)
      const actividad = await crearActividad({
        titulo: actividadForm.titulo,
        descripcion: actividadForm.descripcion || undefined,
        categoriaActividad: actividadForm.categoriaActividad || 'TALLER',
        tipoOrigen: actividadForm.tipoActividad === 'ORDEN' ? 'ORDEN' : 'INTERNA',
        clienteId: actividadForm.tipoActividad === 'ORDEN' && actividadForm.clienteId ? Number(actividadForm.clienteId) : null,
        ordenServicioId: actividadForm.tipoActividad === 'ORDEN' && actividadForm.ordenServicioId ? Number(actividadForm.ordenServicioId) : null,
        solicitudId: null,
        prioridad: actividadForm.prioridad || 'MEDIA',
        fechaProgramada: actividadForm.fechaProgramada || undefined,
        requiereReporte: actividadForm.requiereReporte,
        requiereVisita: actividadForm.requiereVisita,
        creadoPorId: user.id,
        observaciones: actividadForm.descripcion || undefined,
        asignadoAUserId: Number(actividadForm.asignadoAUserId),
        pasos: construirPasos(actividadForm.pasosTexto),
      })

      setMensaje(`${actividad.codigoActividad} creada y asignada correctamente.`)
      setActividadForm(ACTIVIDAD_FORM_INICIAL)
      setPanelActivo(null)
      await cargarDatos()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'No se pudo crear la actividad.')
    } finally {
      setSaving(false)
    }
  }

  async function cambiarEstadoPasoDashboard(actividadId: number, pasoId: number, estadoActual?: string | null) {
    if (!user?.id) return
    const estadoNuevo = normalizarEstado(estadoActual) === 'HECHO' ? 'PENDIENTE' : 'HECHO'
    try {
      setSaving(true)
      await actualizarPasoActividad(actividadId, pasoId, { estadoPaso: estadoNuevo, realizadoPorId: user.id })
      setMensaje('Avance de actividad actualizado.')
      await cargarDatos()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la actividad.')
    } finally {
      setSaving(false)
    }
  }

  async function marcarVisitaEnProceso(visitaId: number) {
    try {
      setSaving(true)
      await actualizarEstadoVisita(visitaId, { estado: 'EN_PROCESO', motivoEstado: 'Trabajo iniciado desde dashboard' })
      setMensaje('Visita marcada en proceso.')
      await cargarDatos()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la visita.')
    } finally {
      setSaving(false)
    }
  }

  async function finalizarVisitaDashboard(visitaId: number) {
    try {
      setSaving(true)
      await actualizarEstadoVisita(visitaId, { estado: 'FINALIZADA', motivoEstado: 'Trabajo finalizado desde dashboard' })
      setMensaje('Visita finalizada correctamente.')
      await cargarDatos()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'No se pudo finalizar la visita.')
    } finally {
      setSaving(false)
    }
  }

  const misActividadesAsignadas = useMemo(() => {
    if (!user?.id) return []
    return (dashboard?.actividades || []).filter((actividad) =>
      (actividad.asignados || []).some((asignado) => asignado.usuario?.id === user.id || asignado.usuarioId === user.id)
    )
  }, [dashboard?.actividades, user?.id])

  async function responderMensaje(mensajeOperativo: MensajeOperativo) {
    if (!user?.id) return

    const respuesta = (replyForms[mensajeOperativo.key] || '').trim()
    if (!respuesta) {
      setError('Debes escribir una respuesta.')
      return
    }

    try {
      await crearComentarioVisita(mensajeOperativo.visitaId, {
        usuarioId: user.id,
        tipoMensaje: 'RESPUESTA_ADMIN',
        asunto: `Respuesta: ${mensajeOperativo.asunto || 'mensaje operativo'}`,
        mensaje: respuesta,
        prioridad: 'MEDIA',
      })
      setReplyForms((prev) => ({ ...prev, [mensajeOperativo.key]: '' }))
      setMensaje('Respuesta enviada correctamente.')
      await cargarDatos()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'No se pudo responder el mensaje.')
    }
  }

  function renderMensaje(mensajeOperativo: MensajeOperativo) {
    const urls = extraerUrls(mensajeOperativo.mensaje)
    const textoLimpio = limpiarMensajeSinUrls(mensajeOperativo.mensaje)

    return (
      <article key={mensajeOperativo.key} className="messageCard">
        <div className="messageCardHeader">
          <div>
            <strong>{mensajeOperativo.asunto || 'Mensaje operativo'}</strong>
            <p>{mensajeOperativo.usuarioNombre || mensajeOperativo.tecnicoNombre} · {formatearFecha(mensajeOperativo.createdAt)}</p>
          </div>
          <span className="messagePriorityPill">{mensajeOperativo.prioridad || 'MEDIA'}</span>
        </div>

        <p className="messageBodyText">{textoLimpio || 'Mensaje sin texto principal.'}</p>

        <div className="messageMetaPills">
          <span>{mensajeOperativo.numeroVisita || `Visita #${mensajeOperativo.visitaId}`}</span>
          <span>{mensajeOperativo.clienteNombre}</span>
          <span>{mensajeOperativo.tecnicoNombre}</span>
        </div>

        {(mensajeOperativo.archivos?.length || urls.length) ? (
          <div className="evidenceGrid">
            {mensajeOperativo.archivos?.map((archivo) => (
              <a key={archivo.nombreGuardado} className="evidenceButton" href={archivo.urlLocal || '#'} target="_blank" rel="noreferrer">
                Ver evidencia · {archivo.nombreArchivo}
              </a>
            ))}
            {urls.map((url) => (
              <a key={url} className="evidenceButton" href={url} target="_blank" rel="noreferrer">
                Abrir evidencia
              </a>
            ))}
          </div>
        ) : null}

        <div className="messageReplyBox">
          <textarea
            rows={2}
            value={replyForms[mensajeOperativo.key] || ''}
            onChange={(event) => setReplyForms((prev) => ({ ...prev, [mensajeOperativo.key]: event.target.value }))}
            placeholder="Responder al técnico..."
          />
          <button className="miniActionButton miniActionPrimary" type="button" onClick={() => responderMensaje(mensajeOperativo)}>
            Responder
          </button>
        </div>
      </article>
    )
  }

  void marcarVisitaEnProceso
  void finalizarVisitaDashboard

  return (
    <div className="portalShell roleShell">
      <header className="dashboardTopbar dashboardTopbarCompact dashboardTopbarTitleOnly">
        <div>
          <h1>Centro administrativo</h1>
        </div>
      </header>

      <div className="dashboardContainer roleDashboardContainer">
        <div className="roleActionRow">
          <RoleActionBar items={actionItems} />
          <button className="powerLogoutButton powerLogoutInline" type="button" onClick={logout}>
            <span className="powerIcon">⏻</span>
            <span>Cerrar sesión</span>
          </button>
        </div>

        <section className="dashboardHero roleHeroCard" id="admin-resumen">
          <div className="dashboardHeroText">
            <h2>Control operativo, órdenes manuales y administración de contenido</h2>
            <p>{loading ? 'Cargando métricas del sistema...' : 'Base funcional para crear órdenes, generar visitas, asignar técnicos y controlar actividades internas.'}</p>
          </div>

          <div className="dashboardUserCard">
            <strong>{user?.nombre}</strong>
            <span>{user?.email}</span>
            <div className="userRolePill">{user?.roleLabel}</div>
          </div>
        </section>

        {error && <div className="errorBox">{error}</div>}
        {mensaje && <div className="mensajeSolicitud">{mensaje}</div>}

        <section className="kpiGrid">
          {(dashboard?.metrics || []).map((metric) => (
            <article key={metric.label} className="kpiCard">
              <span className="kpiLabel">{metric.label}</span>
              <strong className="kpiValue">{metric.value}</strong>
              <p>{metric.hint}</p>
            </article>
          ))}
        </section>

        <section className="dashboardGrid roleDashboardGrid">
          <details className="moduleCard moduleCardFullRow operationAccordion" id="admin-orden-manual" open={panelActivo === 'orden'}>
            <summary
              className="operationAccordionHeader"
              onClick={(event) => {
                event.preventDefault()
                setPanelActivo((prev) => (prev === 'orden' ? null : 'orden'))
              }}
            >
              <span>
                <strong>Crear orden de trabajo</strong>
                <small>Puede partir de una solicitud pública o de atención manual.</small>
              </span>
              <span>{panelActivo === 'orden' ? 'Cerrar formulario' : 'Abrir formulario'}</span>
            </summary>

            <form className="operationForm operationAccordionBody" onSubmit={enviarOrdenManual}>
              <div className="formGrid formGridThree">
                <label className="campo campoCompleto">
                  Solicitud pública relacionada
                  <select value={ordenForm.solicitudId} onChange={(e) => seleccionarSolicitudParaOrden(e.target.value)}>
                    <option value="">Sin solicitud pública</option>
                    {solicitudesParaGestion.map((solicitud: DashboardSolicitud) => (
                      <option key={solicitud.id} value={solicitud.id}>
                        Solicitud #{solicitud.id} · {solicitud.nombreSolicitante} · {solicitud.tipoServicio || 'Servicio'}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="campo">
                  Cliente
                  <select required value={ordenForm.clienteId} onChange={(e) => actualizarOrdenForm('clienteId', e.target.value)}>
                    <option value="">Seleccionar cliente</option>
                    {(dashboard?.clientes || []).map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>
                    ))}
                  </select>
                </label>

                <label className="campo">
                  Máquina o equipo relacionado
                  <select value={ordenForm.maquinaId} onChange={(e) => actualizarOrdenForm('maquinaId', e.target.value)} disabled={!ordenForm.clienteId}>
                    <option value="PENDIENTE_IDENTIFICAR">Pendiente por identificar en campo</option>
                    <option value="NO_REGISTRADA">Máquina no registrada</option>
                    {maquinasOrdenCliente.map((maquina) => (
                      <option key={maquina.id} value={maquina.id}>{textoMaquina(maquina)}</option>
                    ))}
                  </select>
                </label>

                <label className="campo">
                  Prioridad
                  <select value={ordenForm.prioridad} onChange={(e) => actualizarOrdenForm('prioridad', e.target.value)}>
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="emergencia">Emergencia</option>
                  </select>
                </label>

                <label className="campo">
                  Tipo de solicitud
                  <select value={ordenForm.tipoSolicitud} onChange={(e) => actualizarOrdenForm('tipoSolicitud', e.target.value)}>
                    {tiposVisita.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
                  </select>
                </label>

                <label className="campo">
                  Contacto
                  <input value={ordenForm.contactoNombre} onChange={(e) => actualizarOrdenForm('contactoNombre', e.target.value)} placeholder="Persona que solicitó" />
                </label>

                <label className="campo">
                  Teléfono
                  <input value={ordenForm.telefonoContacto} onChange={(e) => actualizarOrdenForm('telefonoContacto', e.target.value)} placeholder="Número de contacto" />
                </label>

                <label className="campo">
                  Correo
                  <input value={ordenForm.correoContacto} onChange={(e) => actualizarOrdenForm('correoContacto', e.target.value)} placeholder="correo@cliente.com" />
                </label>

                <label className="campo">
                  Departamento
                  <select value={ordenForm.departamentoId} onChange={(e) => actualizarOrdenForm('departamentoId', e.target.value)}>
                    <option value="">Seleccionar departamento</option>
                    {departamentos.map((departamento) => <option key={departamento.id} value={departamento.id}>{departamento.nombre}</option>)}
                  </select>
                </label>

                <label className="campo">
                  Ciudad / municipio
                  <select value={ordenForm.ciudadId} onChange={(e) => actualizarOrdenForm('ciudadId', e.target.value)} disabled={!ordenForm.departamentoId}>
                    <option value="">{!ordenForm.departamentoId ? 'Seleccione departamento primero' : 'Seleccionar ciudad'}</option>
                    {ciudadesOrden.map((ciudad) => <option key={ciudad.id} value={ciudad.id}>{ciudad.nombre}</option>)}
                  </select>
                </label>

                <label className="campo campoCompleto">
                  Dirección detallada
                  <input value={ordenForm.direccionExacta} onChange={(e) => actualizarOrdenForm('direccionExacta', e.target.value)} placeholder="Planta, área, referencia o dirección exacta" />
                </label>

                <label className="campo campoCompleto">
                  Descripción del problema o trabajo solicitado
                  <textarea required rows={4} value={ordenForm.descripcionProblema} onChange={(e) => actualizarOrdenForm('descripcionProblema', e.target.value)} placeholder="Detalle operativo recibido por administración" />
                </label>
              </div>

              <div className="formActionsWide">
                <button className="btnPortalPrincipal" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar orden'}</button>
                <button className="btnPortalSecundario" type="button" onClick={() => setOrdenForm(ORDEN_FORM_INICIAL)}>Limpiar orden</button>
                <button className="btnPortalSecundario" type="button" onClick={cerrarPanelYSubir}>Volver al inicio</button>
              </div>
            </form>
          </details>

          <details className="moduleCard moduleCardFullRow operationAccordion" id="admin-crear-visita" open={panelActivo === 'visita'}>
            <summary
              className="operationAccordionHeader"
              onClick={(event) => {
                event.preventDefault()
                setPanelActivo((prev) => (prev === 'visita' ? null : 'visita'))
              }}
            >
              <span>
                <strong>Asignar visita</strong>
                <small>Programa una visita libre o relacionada con una orden existente.</small>
              </span>
              <span>{panelActivo === 'visita' ? 'Cerrar formulario' : 'Abrir formulario'}</span>
            </summary>

            <form className="operationForm operationAccordionBody" onSubmit={enviarVisita}>
              <div className="formGrid formGridThree">
                <label className="campo">
                  Orden de trabajo
                  <select value={visitaForm.ordenServicioId} onChange={(e) => seleccionarOrdenParaVisita(e.target.value)}>
                    <option value="">Visita libre / sin orden</option>
                    {ordenesParaVisita.map((orden) => <option key={orden.id} value={orden.id}>{textoOrden(orden)}</option>)}
                  </select>
                </label>

                <label className="campo">
                  Cliente
                  <select required value={visitaForm.clienteId} onChange={(e) => actualizarVisitaForm('clienteId', e.target.value)}>
                    <option value="">Seleccionar cliente</option>
                    {(dashboard?.clientes || []).map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>)}
                  </select>
                </label>

                <label className="campo">
                  Máquina o equipo a visitar
                  <select value={visitaForm.maquinaId} onChange={(e) => actualizarVisitaForm('maquinaId', e.target.value)} disabled={!visitaForm.clienteId}>
                    <option value="PENDIENTE_IDENTIFICAR">Pendiente por identificar en campo</option>
                    <option value="NO_REGISTRADA">Máquina no registrada</option>
                    {maquinasVisitaCliente.map((maquina) => <option key={maquina.id} value={maquina.id}>{textoMaquina(maquina)}</option>)}
                  </select>
                </label>

                <label className="campo">
                  Técnico responsable
                  <SearchableSelect
                    value={visitaForm.tecnicoId}
                    required
                    placeholder="Escribe para buscar técnico o supervisor..."
                    options={catalogos.tecnicos.map((tecnico) => ({ value: tecnico.id, label: textoUsuarioOperativo(tecnico), helper: tecnico.email }))}
                    onChangeValue={(value) => actualizarVisitaForm('tecnicoId', value)}
                  />
                </label>

                <label className="campo">
                  Fecha programada
                  <input type="date" value={visitaForm.fechaProgramada} onChange={(e) => actualizarVisitaForm('fechaProgramada', e.target.value)} />
                </label>

                <div className="campo">
                  <label>Hora programada</label>
                  <div className="timeSelectGrid">
                    <select aria-label="Hora programada" title="Hora programada" value={visitaForm.horaProgramada} onChange={(e) => actualizarVisitaForm('horaProgramada', e.target.value)}>
                      {horas12.map((hora) => <option key={hora} value={hora}>{hora}</option>)}
                    </select>
                    <select aria-label="Minuto programado" title="Minuto programado" value={visitaForm.minutoProgramado} onChange={(e) => actualizarVisitaForm('minutoProgramado', e.target.value)}>
                      {minutos.map((minuto) => <option key={minuto} value={minuto}>{minuto}</option>)}
                    </select>
                    <select aria-label="Periodo AM o PM" title="Periodo AM o PM" value={visitaForm.periodoProgramado} onChange={(e) => actualizarVisitaForm('periodoProgramado', e.target.value as 'AM' | 'PM')}>
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                  <p className="formFieldHint">Formato 12 horas.</p>
                </div>

                <label className="campo">
                  Tipo de visita
                  <select value={visitaForm.tipoVisita} onChange={(e) => actualizarVisitaForm('tipoVisita', e.target.value)}>
                    {tiposVisita.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
                  </select>
                </label>

                <label className="campo checkboxField">
                  <input type="checkbox" checked={visitaForm.requiereCotizacion} onChange={(e) => actualizarVisitaForm('requiereCotizacion', e.target.checked)} />
                  Requiere cotización
                </label>

                <label className="campo campoCompleto">
                  Motivo de visita
                  <textarea rows={3} value={visitaForm.motivo} onChange={(e) => actualizarVisitaForm('motivo', e.target.value)} placeholder="Trabajo que debe atender el técnico" />
                </label>

                <label className="campo campoCompleto">
                  Observaciones internas
                  <textarea rows={3} value={visitaForm.observaciones} onChange={(e) => actualizarVisitaForm('observaciones', e.target.value)} placeholder="Indicaciones para la ejecución" />
                </label>
              </div>

              <div className="formActionsWide">
                <button className="btnPortalPrincipal" type="submit" disabled={saving}>{saving ? 'Asignando...' : 'Guardar visita'}</button>
                <button className="btnPortalSecundario" type="button" onClick={() => setVisitaForm(VISITA_FORM_INICIAL)}>Limpiar visita</button>
                <button className="btnPortalSecundario" type="button" onClick={cerrarPanelYSubir}>Volver al inicio</button>
              </div>
            </form>
          </details>

          <details className="moduleCard moduleCardFullRow operationAccordion" id="admin-crear-actividad" open={panelActivo === 'actividad'}>
            <summary
              className="operationAccordionHeader"
              onClick={(event) => {
                event.preventDefault()
                setPanelActivo((prev) => (prev === 'actividad' ? null : 'actividad'))
              }}
            >
              <span>
                <strong>Crear actividad interna</strong>
                <small>Tareas como ordenar taller, preparar materiales, limpiar herramientas o seguimiento operativo.</small>
              </span>
              <span>{panelActivo === 'actividad' ? 'Cerrar formulario' : 'Abrir formulario'}</span>
            </summary>

            <form className="operationForm operationAccordionBody" onSubmit={enviarActividad}>
              <div className="formGrid formGridThree">
                <label className="campo">
                  Tipo de actividad
                  <select value={actividadForm.tipoActividad} onChange={(e) => actualizarActividadForm('tipoActividad', e.target.value as 'INTERNA' | 'ORDEN')}>
                    <option value="INTERNA">Actividad interna empresa / taller</option>
                    <option value="ORDEN">Actividad relacionada con orden</option>
                  </select>
                </label>

                <label className="campo">
                  Orden relacionada
                  <select value={actividadForm.ordenServicioId} onChange={(e) => actualizarActividadForm('ordenServicioId', e.target.value)} disabled={actividadForm.tipoActividad !== 'ORDEN'}>
                    <option value="">Sin orden</option>
                    {ordenesParaVisita.map((orden) => <option key={orden.id} value={orden.id}>{textoOrden(orden)}</option>)}
                  </select>
                </label>

                <label className="campo">
                  Cliente
                  <select value={actividadForm.clienteId} onChange={(e) => actualizarActividadForm('clienteId', e.target.value)} disabled={actividadForm.tipoActividad !== 'ORDEN'}>
                    <option value="">Sin cliente específico</option>
                    {(dashboard?.clientes || []).map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>)}
                  </select>
                </label>

                <label className="campo">
                  Responsable
                  <SearchableSelect
                    value={actividadForm.asignadoAUserId}
                    required
                    placeholder="Escribe para buscar usuario operativo..."
                    options={catalogos.tecnicos.map((tecnico) => ({ value: tecnico.id, label: textoUsuarioOperativo(tecnico), helper: tecnico.email }))}
                    onChangeValue={(value) => actualizarActividadForm('asignadoAUserId', value)}
                  />
                </label>

                <label className="campo">
                  Categoría
                  <select value={actividadForm.categoriaActividad} onChange={(e) => actualizarActividadForm('categoriaActividad', e.target.value)}>
                    <option value="TALLER">Taller</option>
                    <option value="MATERIALES">Materiales</option>
                    <option value="ADMINISTRATIVA">Administrativa</option>
                    <option value="SEGUIMIENTO">Seguimiento</option>
                    <option value="CLIENTE">Cliente</option>
                  </select>
                </label>

                <label className="campo">
                  Prioridad
                  <select value={actividadForm.prioridad} onChange={(e) => actualizarActividadForm('prioridad', e.target.value)}>
                    <option value="BAJA">Baja</option>
                    <option value="MEDIA">Media</option>
                    <option value="ALTA">Alta</option>
                    <option value="URGENTE">Urgente</option>
                  </select>
                </label>

                <label className="campo">
                  Fecha programada
                  <input type="date" value={actividadForm.fechaProgramada} onChange={(e) => actualizarActividadForm('fechaProgramada', e.target.value)} />
                </label>

                <label className="campo checkboxField">
                  <input type="checkbox" checked={actividadForm.requiereVisita} onChange={(e) => actualizarActividadForm('requiereVisita', e.target.checked)} />
                  Requiere visita
                </label>

                <label className="campo checkboxField">
                  <input type="checkbox" checked={actividadForm.requiereReporte} onChange={(e) => actualizarActividadForm('requiereReporte', e.target.checked)} />
                  Requiere reporte
                </label>

                <label className="campo campoCompleto">
                  Título de la actividad
                  <input required value={actividadForm.titulo} onChange={(e) => actualizarActividadForm('titulo', e.target.value)} placeholder="Ej. Ordenar taller y revisar caja de herramientas" />
                </label>

                <label className="campo campoCompleto">
                  Descripción
                  <textarea rows={3} value={actividadForm.descripcion} onChange={(e) => actualizarActividadForm('descripcion', e.target.value)} placeholder="Detalle de lo que debe realizarse" />
                </label>

                <label className="campo campoCompleto">
                  Subactividades / pasos
                  <textarea rows={5} value={actividadForm.pasosTexto} onChange={(e) => actualizarActividadForm('pasosTexto', e.target.value)} placeholder="Un paso por línea" />
                </label>
              </div>

              <div className="formActionsWide">
                <button className="btnPortalPrincipal" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar actividad'}</button>
                <button className="btnPortalSecundario" type="button" onClick={() => setActividadForm(ACTIVIDAD_FORM_INICIAL)}>Limpiar actividad</button>
                <button className="btnPortalSecundario" type="button" onClick={cerrarPanelYSubir}>Volver al inicio</button>
              </div>
            </form>
          </details>

          <details className="moduleCard moduleCardFullRow operationAccordion" id="admin-solicitudes">
            <summary className="operationAccordionHeader">
              <span>
                <strong>Solicitudes recientes</strong>
                <small>Entradas del portal público pendientes o recientes.</small>
              </span>
              <span>Pendientes</span>
            </summary>
            <div className="operationAccordionBody">
              <div className="filtersRow sectionFiltersRow">
                {filtrosSolicitudes.map((filtro) => (
                  <button
                    key={filtro.value}
                    type="button"
                    className={`filterChip ${filtroSolicitudes === filtro.value ? 'active' : ''}`}
                    onClick={() => setFiltroSolicitudes(filtro.value)}
                  >
                    {filtro.label}
                  </button>
                ))}
              </div>
              {solicitudesFiltradas.length > 0 ? (
                <div className="dataList scrollArea scrollAreaWide">
                  {solicitudesFiltradas.map((solicitud) => (
                    <article key={solicitud.id} className="dataListItem">
                      <div>
                        <strong>Solicitud #{solicitud.id} · {solicitud.nombreSolicitante}</strong>
                        <p>{textoSolicitudUbicacion(solicitud) || 'Ubicación pendiente'} · {solicitud.tipoServicio || 'Servicio'} · {formatearFecha(solicitud.createdAt)}</p>
                      </div>
                      <div className="inlineActionRow">
                        <span className="statusPill">{solicitud.estado || 'NUEVA'}</span>
                        <button
                          type="button"
                          className="miniActionButton miniActionPrimary"
                          onClick={() => {
                            seleccionarSolicitudParaOrden(String(solicitud.id))
                            setPanelActivo('orden')
                            window.setTimeout(() => document.getElementById('admin-orden-manual')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
                          }}
                        >
                          Elaborar orden
                        </button>
                        <button type="button" className="miniActionButton" onClick={() => cancelarSolicitud(solicitud)} disabled={saving}>
                          Cancelar
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="emptyBlock">No hay solicitudes recientes.</div>
              )}
            </div>
          </details>

          <details className="moduleCard moduleCardFullRow operationAccordion" id="admin-visitas">
            <summary className="operationAccordionHeader">
              <span>
                <strong>Visitas recientes</strong>
                <small>Seguimiento operativo con acceso a datos generales.</small>
              </span>
              <span>Activas</span>
            </summary>
            <div className="operationAccordionBody">
              <div className="filtersRow sectionFiltersRow">
                {filtrosVisitas.map((filtro) => (
                  <button
                    key={filtro.value}
                    type="button"
                    className={`filterChip ${filtroVisitas === filtro.value ? 'active' : ''}`}
                    onClick={() => setFiltroVisitas(filtro.value)}
                  >
                    {filtro.label}
                  </button>
                ))}
              </div>
              {visitasFiltradas.length > 0 ? (
                <div className="dataList scrollArea scrollAreaWide">
                  {visitasFiltradas.map((visita) => (
                    <article key={visita.id} className="dataListItem dataListItemStack">
                      <div>
                        <strong>{textoVisitaPrincipal(visita)}</strong>
                        <p>{visita.cliente?.nombre || 'Cliente'} · {visita.tecnico?.nombre || 'Técnico'} · {visita.estado || 'pendiente'}</p>
                      </div>
                      <div className="inlineActionRow">
                        <a className="miniActionButton" href={`/portal/reportes?abrir=detalle-visita&context=dashboard&from=admin&visitaId=${visita.id}`}>Ver detalle</a>
                        {(visita.reportes || []).length ? (
                          <a className="miniActionButton" href={`/portal/reportes?abrir=detalle&context=dashboard&from=admin&reporteId=${visita.reportes?.[0]?.id}`}>Ver reporte</a>
                        ) : (
                          <a className="miniActionButton miniActionPrimary" href={`/portal/reportes?abrir=crear&context=dashboard&from=admin&visitaId=${visita.id}`}>Crear reporte</a>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="emptyBlock">No hay visitas recientes.</div>
              )}
            </div>
          </details>

          <details className="moduleCard moduleCardFullRow operationAccordion" id="admin-mensajes">
            <summary className="operationAccordionHeader">
              <span>
                <strong>Mensajes operativos recientes</strong>
                <small>Solicitudes de material, alertas o comentarios enviados desde campo.</small>
              </span>
              <span>{mensajesOperativos.length} mensaje(s)</span>
            </summary>
            <div className="operationAccordionBody">
              {mensajesOperativos.length ? (
                <div className="messageGrid">
                  {mensajesOperativos.map((mensajeItem) => renderMensaje(mensajeItem))}
                </div>
              ) : (
                <div className="emptyBlock">No hay mensajes operativos recientes.</div>
              )}
            </div>
          </details>

          <details className="moduleCard moduleCardFullRow operationAccordion" id="admin-mis-actividades">
            <summary className="operationAccordionHeader"><span><strong>Mis actividades asignadas</strong><small>Tareas propias del usuario actual, con pasos y avance.</small></span><span>{misActividadesAsignadas.length} actividad(es)</span></summary>
            <div className="operationAccordionBody">
              {misActividadesAsignadas.length ? <div className="dataList scrollArea scrollAreaWide">{misActividadesAsignadas.map((actividad) => <article key={actividad.id} className="dataListItem dataListItemStack"><div><strong>{actividad.codigoActividad} · {actividad.titulo}</strong><p>{actividad.categoriaActividad || 'General'} · {actividad.estado || 'PENDIENTE'} · {actividad.progresoPorcentaje || 0}%</p></div><div className="progressWrap"><div className="progressMeta"><span>Avance</span><strong>{actividad.progresoPorcentaje || 0}%</strong></div><div className="progressTrack"><div className={`progressFill progressFillP${Math.min(100, Math.max(0, actividad.progresoPorcentaje || 0))}`} /></div></div><div className="activityStepsGrid">{(actividad.pasos || []).length ? actividad.pasos?.map((paso) => <button key={paso.id} type="button" className={`activityStepChip ${normalizarEstado(paso.estadoPaso) === 'HECHO' ? 'done' : ''}`} disabled={saving} onClick={() => cambiarEstadoPasoDashboard(actividad.id, paso.id, paso.estadoPaso)}><span>{normalizarEstado(paso.estadoPaso) === 'HECHO' ? '✓' : '○'}</span>{paso.tituloPaso}</button>) : <div className="emptyBlock">Esta actividad no tiene subactividades.</div>}</div></article>)}</div> : <div className="emptyBlock">No tienes actividades asignadas actualmente.</div>}
            </div>
          </details>

          <details className="moduleCard moduleCardFullRow operationAccordion" id="admin-reportes">
            <summary className="operationAccordionHeader"><span><strong>Reportes recientes</strong><small>Consulta documental con filtros y cierre directo.</small></span><span>Gestión</span></summary>
            <div className="operationAccordionBody">
              <div className="filtersRow sectionFiltersRow">{filtrosReportes.map((filtro) => <button key={filtro.value} type="button" className={`filterChip ${filtroReportes === filtro.value ? 'active' : ''}`} onClick={() => setFiltroReportes(filtro.value)}>{filtro.label}</button>)}</div>
              {reportesFiltrados.length ? <div className="reportGridTwo">{reportesFiltrados.map((reporte) => <article key={reporte.id} className="dataListItem dataListItemStack"><div><strong>{reporte.numeroReporte}</strong><p>{reporte.cliente?.nombre || 'Cliente'} · {formatearFecha(reporte.fechaReporte)}</p></div><div className="dataTags"><span className="statusPill">{reporteCerrado(reporte) ? 'CERRADO' : 'SIN CIERRE'}</span><span className="statusPill">{reporte.estado || 'EMITIDO'}</span></div><div className="inlineActionRow"><a className="miniActionButton" href={reporte.acciones?.verPdf || `/portal/reportes?abrir=detalle&context=dashboard&from=admin&reporteId=${reporte.id}`} target={reporte.acciones?.verPdf ? '_blank' : undefined} rel="noreferrer">Ver reporte</a><a className="miniActionButton miniActionPrimary" href={`/portal/reportes?abrir=detalle&context=dashboard&from=admin&reporteId=${reporte.id}`}>Gestionar cierre</a></div></article>)}</div> : <div className="emptyBlock">No hay reportes para el filtro seleccionado.</div>}
            </div>
          </details>

          <details className="moduleCard moduleCardFullRow operationAccordion adminDbWide" id="admin-bd">
            <summary className="operationAccordionHeader">
              <span>
                <strong>Administrar base de datos</strong>
                <small>Consulta de catálogos y registros. El CRUD completo se implementará por formulario específico.</small>
              </span>
              <span>{itemsGestion.length} registro(s)</span>
            </summary>

            <div className="operationAccordionBody">
              <div className="adminDbComboLayout">
                <div className="adminDbToolbar">
                  <label>
                    Tabla o catálogo
                    <select value={tablaSeleccionada} onChange={(e) => setTablaSeleccionada(e.target.value)}>
                      {tablasGestion.map((tabla) => (
                        <option key={tabla.value} value={tabla.value}>{tabla.grupo} · {tabla.label}</option>
                      ))}
                    </select>
                  </label>

                  <div className="adminDbActions">
                    <button className="btnPortalPrincipal" type="button">Agregar registro</button>
                    <button className="btnPortalSecundario" type="button">Editar seleccionado</button>
                    <button className="btnPortalSecundario" type="button">Eliminar / desactivar</button>
                  </div>
                </div>

                <div className="adminDbSurface">
                  <div className="adminDbSurfaceHeader">
                    <div>
                      <h4>{tablaActiva.label}</h4>
                      <p>{tablaActiva.descripcion}</p>
                    </div>
                    <span className="statusPill">{itemsGestion.length} visibles</span>
                  </div>

                  {itemsGestion.length ? (
                    <div className="adminDbList">
                      {itemsGestion.slice(0, 12).map((item) => (
                        <article key={`${tablaSeleccionada}-${item.id}`} className="adminDbListItem">
                          <strong>{item.titulo}</strong>
                          <p>{item.detalle}</p>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="emptyBlock">No hay registros visibles para esta selección.</div>
                  )}
                </div>
              </div>
            </div>
          </details>
        </section>
      </div>
    </div>
  )
}
