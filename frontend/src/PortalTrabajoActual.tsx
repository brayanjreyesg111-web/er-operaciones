import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import './App.css'
import logoEr from './assets/logo_er.png'

import RegistroClienteForm from './components/clientes/RegistroClienteForm'
import RegistroMaquinaForm from './components/maquinas/RegistroMaquinaForm'
import DetalleReporte from './components/reportes/DetalleReporte'
import FormularioReporte from './components/reportes/FormularioReporte'
import PortalNoticeModal from './components/ui/PortalNoticeModal'

import { useAuth } from './auth/AuthContext'
import { obtenerClientes, obtenerClienteDetalle, crearCliente } from './services/clientes.service'
import {
  obtenerCiudadesPorDepartamento,
  obtenerDepartamentos,
  obtenerHallazgos,
  obtenerMarcas,
  obtenerProcedimientos,
  obtenerRefrigerantes,
  obtenerTecnicos,
  obtenerTiposUnidad,
  obtenerUnidadesMedidaCarga,
} from './services/catalogos.service'
import { crearMaquina } from './services/maquinas.service'
import { cerrarReportePosterior, crearReporteDesdeFormulario, obtenerReportePorId } from './services/reportes.service'
import {
  asociarMaquinasAVisita,
  crearVisita,
  obtenerVisitas,
  type VisitaOperativa,
} from './services/visitas.service'

import type { CatalogoItem } from './types/catalogos.types'
import type { ClienteOption, FormCliente, MaquinaOption } from './types/clientes.types'
import { FORM_CLIENTE_INICIAL } from './types/clientes.types'
import type { FormMaquina } from './types/maquinas.types'
import { FORM_MAQUINA_INICIAL } from './types/maquinas.types'
import type {
  CierreReporteFormState,
  FormReporte,
  HallazgoOption,
  ProcedimientoOption,
  ReporteDetalle,
  TecnicoOption,
  VistaActual,
} from './types/reportes.types'
import { CIERRE_REPORTE_INICIAL, FORM_REPORTE_INICIAL } from './types/reportes.types'

type NoticeState = {
  open: boolean
  tone: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
}

type OpenContext = 'dashboard' | 'reportes'

type Props = {
  modoDirecto?: boolean
  initialVista?: VistaActual
  initialContext?: OpenContext
  returnPath?: string
  initialVisitaId?: string | null
  initialReporteId?: string | null
}

const NOTICE_INICIAL: NoticeState = {
  open: false,
  tone: 'info',
  title: '',
  message: '',
}

function resolverRutaDashboardPorRol(role?: string) {
  if (role === 'ADMINISTRADOR') return '/portal/admin'
  if (role === 'SUPERVISOR') return '/portal/supervisor'
  if (role === 'ADMINISTRATIVO_FINANZAS') return '/portal/administrativo'
  if (role === 'CLIENTE') return '/portal/cliente'
  return '/portal/tecnico'
}

function obtenerMaquinaPrincipalVisita(visita: VisitaOperativa) {
  return visita.maquinas?.[0]?.maquina || null
}

function obtenerTecnicoPrincipalVisita(visita: VisitaOperativa, fallback?: string | number | null) {
  const tecnicoDirecto = visita.tecnicoId || visita.tecnico?.id
  const tecnicoAsignado = visita.asignados?.find((asignado) =>
    String(asignado.rolEnVisita || '').toUpperCase().includes('RESPONSABLE')
  )?.usuario?.id || visita.asignados?.[0]?.usuario?.id || visita.asignados?.[0]?.usuarioId

  return String(tecnicoDirecto || tecnicoAsignado || fallback || '')
}

function obtenerUsuarioActualId(user?: { id?: number | string | null } | null) {
  return user?.id ? String(user.id) : ''
}

type VisitaDetalleOperativa = VisitaOperativa & {
  cliente?: {
    id?: number
    nombre?: string | null
    telefono?: string | null
    correo?: string | null
    direccion?: string | null
    ubicacion?: string | null
  } | null
  ordenServicio?: {
    id?: number
    numeroOrden?: string | null
    contactoNombre?: string | null
    telefonoContacto?: string | null
    correoContacto?: string | null
    ubicacionServicio?: string | null
    tipoSolicitud?: string | null
    descripcionProblema?: string | null
  } | null
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
      direccionExacta?: string | null
    } | null
  }>
  reportes?: Array<{
    id: number
    numeroReporte?: string | null
    estado?: string | null
    fechaReporte?: string | null
  }>
}

export default function PortalTrabajoActual({
  modoDirecto = false,
  initialVista,
  initialContext = 'reportes',
  returnPath,
  initialVisitaId,
  initialReporteId,
}: Props) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [vista, setVista] = useState<VistaActual>(initialVista || (modoDirecto ? 'crear' : 'inicio'))
  const [reporte, setReporte] = useState<ReporteDetalle | null>(null)
  const [notice, setNotice] = useState<NoticeState>(NOTICE_INICIAL)

  const [form, setForm] = useState<FormReporte>(FORM_REPORTE_INICIAL)
  const [formCliente, setFormCliente] = useState<FormCliente>(FORM_CLIENTE_INICIAL)
  const [formMaquina, setFormMaquina] = useState<FormMaquina>(FORM_MAQUINA_INICIAL)
  const [formCierre, setFormCierre] = useState<CierreReporteFormState>(CIERRE_REPORTE_INICIAL)

  const [hallazgosSeleccionados, setHallazgosSeleccionados] = useState<number[]>([])
  const [anexos, setAnexos] = useState<File[]>([])
  const [categoriasAbiertas, setCategoriasAbiertas] = useState<string[]>([])
  const [mostrarFormularioCierre, setMostrarFormularioCierre] = useState(false)

  const [clientes, setClientes] = useState<ClienteOption[]>([])
  const [maquinasCliente, setMaquinasCliente] = useState<MaquinaOption[]>([])
  const [loadingClientes, setLoadingClientes] = useState(false)
  const [loadingMaquinas, setLoadingMaquinas] = useState(false)
  const [guardandoCliente, setGuardandoCliente] = useState(false)
  const [guardandoMaquina, setGuardandoMaquina] = useState(false)
  const [guardandoReporte, setGuardandoReporte] = useState(false)
  const [guardandoCierre, setGuardandoCierre] = useState(false)

  const [tiposUnidad, setTiposUnidad] = useState<CatalogoItem[]>([])
  const [marcasCatalogo, setMarcasCatalogo] = useState<CatalogoItem[]>([])
  const [refrigerantesCatalogo, setRefrigerantesCatalogo] = useState<CatalogoItem[]>([])
  const [unidadesMedidaCarga, setUnidadesMedidaCarga] = useState<CatalogoItem[]>([])
  const [departamentos, setDepartamentos] = useState<CatalogoItem[]>([])
  const [ciudades, setCiudades] = useState<CatalogoItem[]>([])
  const [loadingCatalogos, setLoadingCatalogos] = useState(false)

  const [tecnicos, setTecnicos] = useState<TecnicoOption[]>([])
  const [procedimientos, setProcedimientos] = useState<ProcedimientoOption[]>([])
  const [hallazgosCatalogo, setHallazgosCatalogo] = useState<HallazgoOption[]>([])
  const [loadingCatalogosReporte, setLoadingCatalogosReporte] = useState(false)
  const [visitasReporte, setVisitasReporte] = useState<VisitaOperativa[]>([])
  const [visitaDetalle, setVisitaDetalle] = useState<VisitaOperativa | null>(null)
  const visitasReporteRef = useRef<VisitaOperativa[]>([])
  const [loadingVisitasReporte, setLoadingVisitasReporte] = useState(false)
  const [modoLibreReporte, setModoLibreReporte] = useState(false)
  const visitaLibreTemporalRef = useRef<{ key: string; visitaId: string } | null>(null)

  const [clienteContexto, setClienteContexto] = useState<OpenContext>(
    initialVista === 'cliente' ? initialContext : 'reportes'
  )
  const [maquinaContexto, setMaquinaContexto] = useState<OpenContext>(
    initialVista === 'maquina' ? initialContext : 'reportes'
  )

  const dashboardPath = returnPath || resolverRutaDashboardPorRol(user?.role)

  const mostrarAviso = useCallback(
    (tone: NoticeState['tone'], title: string, message: string) => {
      setNotice({ open: true, tone, title, message })
    },
    []
  )

  const cerrarAviso = useCallback(() => setNotice(NOTICE_INICIAL), [])

  useEffect(() => {
    if (!initialVista) return
    setVista(initialVista)
    if (initialVista === 'cliente') setClienteContexto(initialContext)
    if (initialVista === 'maquina') setMaquinaContexto(initialContext)
  }, [initialVista, initialContext])

  useEffect(() => {
    async function cargarReporteInicial() {
      const id = Number(initialReporteId || 0)
      if (!id || Number.isNaN(id)) return

      try {
        const data = await obtenerReportePorId(id)
        setReporte(data)
        setVista('detalle')
        setMostrarFormularioCierre(initialVista === 'detalle')
      } catch (err) {
        console.error(err)
        mostrarAviso('error', 'Reporte', 'No se pudo cargar el reporte indicado para cierre o detalle.')
      }
    }

    void cargarReporteInicial()
  }, [initialReporteId, initialVista, mostrarAviso])

  const detalle = useMemo(() => reporte?.detallesMaquinas?.[0], [reporte])

  const hallazgosAgrupados = useMemo(() => {
    const grupos: Record<string, HallazgoOption[]> = {}

    hallazgosCatalogo.forEach((hallazgo) => {
      const categoria = hallazgo.categoria || 'General'
      if (!grupos[categoria]) grupos[categoria] = []
      grupos[categoria].push(hallazgo)
    })

    return grupos
  }, [hallazgosCatalogo])

  const esTecnico = user?.role === 'TECNICO'

  const clienteSeleccionadoNombre = useMemo(() => {
    const id = Number(form.clienteId)
    if (!id) return ''
    return clientes.find((cliente) => cliente.id === id)?.nombre || ''
  }, [form.clienteId, clientes])

  const cargarClientes = useCallback(async () => {
    try {
      setLoadingClientes(true)
      const data = await obtenerClientes()
      setClientes(data)
    } catch (err) {
      console.error(err)
      mostrarAviso('error', 'Clientes', 'No se pudieron cargar los clientes.')
    } finally {
      setLoadingClientes(false)
    }
  }, [mostrarAviso])

  const cargarMaquinasPorCliente = useCallback(
    async (clienteId: string) => {
      try {
        setLoadingMaquinas(true)

        const data = await obtenerClienteDetalle(clienteId)

        setMaquinasCliente(
          (data.maquinas || [])
            .filter((maquina: MaquinaOption) => maquina.activo !== false)
            .map((maquina: MaquinaOption) => ({
              id: maquina.id,
              clienteId: data.id,
              codigoInterno: maquina.codigoInterno,
              modelo: maquina.modelo,
              serie: maquina.serie,
              activo: maquina.activo,
            }))
        )
      } catch (err) {
        console.error(err)
        setMaquinasCliente([])
        mostrarAviso('error', 'Máquinas', 'No se pudieron cargar las máquinas del cliente seleccionado.')
      } finally {
        setLoadingMaquinas(false)
      }
    },
    [mostrarAviso]
  )

  const cargarCiudades = useCallback(
    async (departamentoId: number) => {
      try {
        const data = await obtenerCiudadesPorDepartamento(departamentoId)
        setCiudades(data)
      } catch (err) {
        console.error(err)
        setCiudades([])
        mostrarAviso('error', 'Ciudades', 'No se pudieron cargar las ciudades del departamento.')
      }
    },
    [mostrarAviso]
  )

  const cargarCatalogosBase = useCallback(async () => {
    try {
      setLoadingCatalogos(true)
      const depsPromise = obtenerDepartamentos()

      if (vista === 'cliente') {
        const deps = await depsPromise
        setDepartamentos(deps)
        return
      }

      const [tipos, marcas, refris, unidades, deps] = await Promise.all([
        obtenerTiposUnidad(),
        obtenerMarcas(),
        obtenerRefrigerantes(),
        obtenerUnidadesMedidaCarga(),
        depsPromise,
      ])

      setTiposUnidad(tipos)
      setMarcasCatalogo(marcas)
      setRefrigerantesCatalogo(refris)
      setUnidadesMedidaCarga(unidades)
      setDepartamentos(deps)
    } catch (err) {
      console.error(err)
      mostrarAviso('error', 'Catálogos', 'No se pudieron cargar los catálogos requeridos.')
    } finally {
      setLoadingCatalogos(false)
    }
  }, [mostrarAviso, vista])

  const cargarCatalogosReporte = useCallback(async () => {
    try {
      setLoadingCatalogosReporte(true)

      const [tecnicosData, procedimientosData, hallazgosData] = await Promise.all([
        obtenerTecnicos(),
        obtenerProcedimientos(),
        obtenerHallazgos(),
      ])

      setTecnicos(tecnicosData)
      setProcedimientos(procedimientosData)
      setHallazgosCatalogo(hallazgosData)
    } catch (err) {
      console.error(err)
      mostrarAviso('error', 'Reporte', 'No se pudieron cargar técnicos, procedimientos o hallazgos.')
    } finally {
      setLoadingCatalogosReporte(false)
    }
  }, [mostrarAviso])

  const seleccionarVisitaReporte = useCallback((visitaId: string, listado?: VisitaOperativa[]) => {
    const listaTrabajo = listado ?? visitasReporteRef.current

    if (visitaId === 'LIBRE') {
      setModoLibreReporte(true)
      setForm((prev) => ({
        ...prev,
        visitaId: 'LIBRE',
        tecnicoId: obtenerUsuarioActualId(user) || prev.tecnicoId || '',
      }))
      return
    }

    setModoLibreReporte(false)

    const visita = listaTrabajo.find((item) => String(item.id) === visitaId)

    if (!visita) {
      setForm((prev) => ({ ...prev, visitaId }))
      return
    }

    const maquina = obtenerMaquinaPrincipalVisita(visita)

    setForm((prev) => ({
      ...prev,
      visitaId: String(visita.id),
      clienteId: String(visita.clienteId),
      tecnicoId: obtenerUsuarioActualId(user) || obtenerTecnicoPrincipalVisita(visita, prev.tecnicoId),
      maquinaId: maquina?.id ? String(maquina.id) : '',
    }))
  }, [user])

  const cargarVisitasReporte = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoadingVisitasReporte(true)
      const filtrosBase = esTecnico ? { tecnicoId: user.id, sinReporte: true } : { sinReporte: true }
      const [pendientes, enProceso] = await Promise.all([
        obtenerVisitas({ ...filtrosBase, estado: 'PENDIENTE' }),
        obtenerVisitas({ ...filtrosBase, estado: 'EN_PROCESO' }),
      ])
      const mapa = new Map<number, VisitaOperativa>()
      ;[...pendientes, ...enProceso].forEach((visita) => mapa.set(visita.id, visita))
      const data = Array.from(mapa.values())
      setVisitasReporte(data)
      visitasReporteRef.current = data

      if (initialVisitaId) {
        seleccionarVisitaReporte(initialVisitaId, data)
      }
    } catch (err) {
      console.error(err)
      mostrarAviso('error', 'Visitas', 'No se pudieron cargar las visitas para el reporte.')
    } finally {
      setLoadingVisitasReporte(false)
    }
  }, [esTecnico, initialVisitaId, mostrarAviso, seleccionarVisitaReporte, user?.id])

  useEffect(() => {
    if ((vista === 'crear' || vista === 'cliente' || vista === 'maquina') && !clientes.length) {
      void cargarClientes()
    }
  }, [vista, clientes.length, cargarClientes])

  useEffect(() => {
    if (!form.clienteId) {
      setMaquinasCliente([])
      return
    }

    void cargarMaquinasPorCliente(form.clienteId)
  }, [form.clienteId, cargarMaquinasPorCliente])

  useEffect(() => {
    if (
      (vista === 'maquina' || vista === 'cliente') &&
      (!departamentos.length ||
        (vista === 'maquina' &&
          (!tiposUnidad.length ||
            !marcasCatalogo.length ||
            !refrigerantesCatalogo.length ||
            !unidadesMedidaCarga.length)))
    ) {
      void cargarCatalogosBase()
    }
  }, [
    vista,
    tiposUnidad.length,
    marcasCatalogo.length,
    refrigerantesCatalogo.length,
    unidadesMedidaCarga.length,
    departamentos.length,
    cargarCatalogosBase,
  ])

  useEffect(() => {
    if (vista === 'crear' && (!tecnicos.length || !procedimientos.length || !hallazgosCatalogo.length)) {
      void cargarCatalogosReporte()
    }
  }, [vista, tecnicos.length, procedimientos.length, hallazgosCatalogo.length, cargarCatalogosReporte])

  useEffect(() => {
    if (vista === 'crear') {
      void cargarVisitasReporte()
    }
  }, [vista, cargarVisitasReporte])


  useEffect(() => {
    async function cargarDetalleVisitaInicial() {
      if (vista !== 'detalle-visita' || !initialVisitaId) return

      try {
        const visitas = await obtenerVisitas()
        const encontrada = visitas.find((item) => String(item.id) === String(initialVisitaId)) || null
        setVisitaDetalle(encontrada)
      } catch (err) {
        console.error(err)
        mostrarAviso('error', 'Visita', 'No se pudo cargar el detalle de la visita.')
      }
    }

    void cargarDetalleVisitaInicial()
  }, [vista, initialVisitaId, mostrarAviso])

  useEffect(function revalidarTecnicoDesdeLogin() {
    if (vista !== 'crear') return
    const usuarioActualId = obtenerUsuarioActualId(user)
    if (!usuarioActualId) return

    setForm((prev) => (prev.tecnicoId === usuarioActualId ? prev : {
      ...prev,
      tecnicoId: usuarioActualId,
    }))
 }, [vista, user])
  useEffect(() => {
    const usuarioActualId = obtenerUsuarioActualId(user)
    if (!usuarioActualId) return

    setForm((prev) => ({
      ...prev,
      tecnicoId: usuarioActualId,
    }))
  }, [user])

  useEffect(() => {
    if (vista !== 'maquina') return

    if (!formMaquina.departamentoId) {
      setCiudades([])
      setFormMaquina((prev) => ({ ...prev, ciudadId: '' }))
      return
    }

    void cargarCiudades(Number(formMaquina.departamentoId))
  }, [vista, formMaquina.departamentoId, cargarCiudades])

  useEffect(() => {
    if (vista !== 'cliente') return

    if (!formCliente.departamentoId) {
      setCiudades([])
      setFormCliente((prev) => ({ ...prev, ciudadId: '' }))
      return
    }

    void cargarCiudades(Number(formCliente.departamentoId))
  }, [vista, formCliente.departamentoId, cargarCiudades])

  function actualizarCampo(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target

    if (name === 'visitaId') {
      seleccionarVisitaReporte(value)
      return
    }

    if (name === 'clienteId') {
      setForm((prev) => ({
        ...prev,
        clienteId: value,
        maquinaId: '',
        visitaId: prev.visitaId === 'LIBRE' ? 'LIBRE' : '',
      }))
      return
    }

    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function actualizarCampoCliente(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target

    if (name === 'departamentoId') {
      setFormCliente((prev) => ({ ...prev, departamentoId: value, ciudadId: '' }))
      return
    }

    setFormCliente((prev) => ({ ...prev, [name]: value }))
  }

  function actualizarCampoMaquina(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target

    if (name === 'departamentoId') {
      setFormMaquina((prev) => ({ ...prev, departamentoId: value, ciudadId: '' }))
      return
    }

    setFormMaquina((prev) => ({ ...prev, [name]: value }))
  }

  function actualizarClienteMaquina(e: ChangeEvent<HTMLSelectElement>) {
    const { value } = e.target
    setForm((prev) => ({ ...prev, clienteId: value, maquinaId: '', visitaId: '' }))
  }

  function cambiarHallazgo(id: number) {
    setHallazgosSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  function toggleCategoria(categoria: string) {
    setCategoriasAbiertas((prev) =>
      prev.includes(categoria) ? prev.filter((item) => item !== categoria) : [...prev, categoria]
    )
  }

  function cambiarAnexos(e: ChangeEvent<HTMLInputElement>) {
    setAnexos(Array.from(e.target.files || []))
  }

  function limpiarFormulario() {
    setModoLibreReporte(false)
    setForm({
  ...FORM_REPORTE_INICIAL,
  tecnicoId: obtenerUsuarioActualId(user),
})
    setHallazgosSeleccionados([])
    setAnexos([])
    setCategoriasAbiertas([])
    setMaquinasCliente([])
    visitaLibreTemporalRef.current = null
  }

  function limpiarFormularioCliente() {
    setFormCliente(FORM_CLIENTE_INICIAL)
    setCiudades([])
  }

  function limpiarFormularioMaquina() {
    setFormMaquina(FORM_MAQUINA_INICIAL)
    setCiudades([])
  }

  function abrirWhatsApp() {
    if (!reporte?.acciones?.whatsappTexto) return
    const texto = encodeURIComponent(reporte.acciones.whatsappTexto)
    window.open(`https://wa.me/?text=${texto}`, '_blank')
  }

  function abrirCorreo() {
    const asunto = encodeURIComponent(reporte?.acciones?.correoAsunto || '')
    const cuerpo = encodeURIComponent(reporte?.acciones?.correoCuerpo || '')
    window.location.href = `mailto:?subject=${asunto}&body=${cuerpo}`
  }

  function irAlMenu() {
    navigate(dashboardPath)
  }

  function regresarSegunContexto(contexto: OpenContext) {
    if (contexto === 'dashboard') {
      navigate(dashboardPath)
      return
    }
    setVista('crear')
  }

  function regresarDesdeReporte() {
    if (!modoDirecto) {
      setVista('inicio')
      return
    }
    regresarSegunContexto(initialContext)
  }

  function abrirRegistroCliente() {
    limpiarFormularioCliente()
    setClienteContexto('reportes')
    setVista('cliente')
  }

  function volverDesdeCliente() {
    regresarSegunContexto(clienteContexto)
  }

  function abrirRegistroMaquina() {
    limpiarFormularioMaquina()
    setMaquinaContexto('reportes')
    setVista('maquina')
  }

  function volverDesdeMaquina() {
    regresarSegunContexto(maquinaContexto)
  }

  async function guardarClienteFrontend() {
    try {
      if (!formCliente.nombre.trim()) throw new Error('Debes ingresar el nombre del cliente.')
      if (!formCliente.departamentoId) throw new Error('Debes seleccionar un departamento.')
      if (!formCliente.ciudadId) throw new Error('Debes seleccionar una ciudad.')

      setGuardandoCliente(true)

      const nuevoCliente = await crearCliente({
        nombre: formCliente.nombre.trim(),
        rtn: formCliente.rtn.trim() || undefined,
        contactoNombre: formCliente.contactoNombre.trim() || undefined,
        telefono: formCliente.telefono.trim() || undefined,
        correo: formCliente.correo.trim() || undefined,
        direccion: formCliente.direccion.trim() || undefined,
        departamentoId: Number(formCliente.departamentoId),
        ciudadId: Number(formCliente.ciudadId),
      })

      await cargarClientes()
      setForm((prev) => ({ ...prev, clienteId: String(nuevoCliente.id), maquinaId: '', visitaId: '' }))
      setMaquinasCliente([])
      limpiarFormularioCliente()

      if (clienteContexto === 'dashboard') {
        navigate(dashboardPath)
      } else {
        setVista('crear')
      }

      mostrarAviso('success', 'Cliente creado', `Cliente creado correctamente: ${nuevoCliente.nombre}`)
    } catch (err) {
      console.error(err)
      const mensaje = err instanceof Error ? err.message : 'No se pudo guardar el cliente.'
      mostrarAviso('error', 'Cliente', mensaje)
    } finally {
      setGuardandoCliente(false)
    }
  }

  async function guardarMaquinaFrontend() {
    try {
      const clienteIdFinal = Number(form.clienteId)

      if (!clienteIdFinal) throw new Error('Debes seleccionar un cliente.')
      if (!formMaquina.tipoUnidadId) throw new Error('Debes seleccionar el tipo de unidad.')
      if (!formMaquina.marcaId) throw new Error('Debes seleccionar la marca.')
      if (!formMaquina.refrigeranteId) throw new Error('Debes seleccionar el refrigerante.')
      if (!formMaquina.departamentoId) throw new Error('Debes seleccionar el departamento.')
      if (!formMaquina.ciudadId) throw new Error('Debes seleccionar la ciudad.')

      setGuardandoMaquina(true)

      const nuevaMaquina = await crearMaquina({
        clienteId: clienteIdFinal,
        tipoUnidadId: Number(formMaquina.tipoUnidadId),
        marcaId: Number(formMaquina.marcaId),
        refrigeranteId: Number(formMaquina.refrigeranteId),
        unidadMedidaCargaId: formMaquina.unidadMedidaCargaId
          ? Number(formMaquina.unidadMedidaCargaId)
          : undefined,
        departamentoId: Number(formMaquina.departamentoId),
        ciudadId: Number(formMaquina.ciudadId),
        modelo: formMaquina.modelo.trim() || undefined,
        serie: formMaquina.serie.trim() || undefined,
        cargaRefrigeranteCantidad: formMaquina.cargaRefrigeranteCantidad
          ? Number(formMaquina.cargaRefrigeranteCantidad)
          : undefined,
        direccionExacta: formMaquina.direccionExacta.trim() || undefined,
        area: formMaquina.area.trim() || undefined,
        observaciones: formMaquina.observaciones.trim() || undefined,
      })

      if (!nuevaMaquina?.id) {
        throw new Error('La máquina se guardó, pero no se recibió el ID para actualizar el formulario.')
      }

      if (form.clienteId) {
        await cargarMaquinasPorCliente(form.clienteId)
      }

      setForm((prev) => ({ ...prev, maquinaId: String(nuevaMaquina.id), visitaId: '' }))
      limpiarFormularioMaquina()

      if (maquinaContexto === 'dashboard') {
        navigate(dashboardPath)
      } else {
        setVista('crear')
      }

      mostrarAviso(
        'success',
        'Máquina creada',
        `Máquina registrada correctamente${nuevaMaquina.codigoInterno ? `: ${nuevaMaquina.codigoInterno}` : '.'}`
      )
    } catch (err) {
      console.error(err)
      const mensaje = err instanceof Error ? err.message : 'No se pudo guardar la máquina.'
      mostrarAviso('error', 'Máquina', mensaje)
    } finally {
      setGuardandoMaquina(false)
    }
  }

  async function guardarReporteFrontend() {
    try {
      if (!form.visitaId) throw new Error('Debes seleccionar una visita asignada o usar modo libre.')
      if (!form.clienteId) throw new Error('Debes seleccionar el cliente.')
      if (!form.maquinaId) throw new Error('Debes seleccionar la máquina.')
      const tecnicoIdActual = obtenerUsuarioActualId(user) || form.tecnicoId
      if (!tecnicoIdActual) throw new Error('No se pudo identificar el usuario que genera el reporte.')
      if (!form.procedimientoId) throw new Error('Debes seleccionar la actividad.')

      if (esTecnico && form.visitaId !== 'LIBRE') {
        const visitaAsignada = visitasReporte.some((visita) => String(visita.id) === form.visitaId)
        if (!visitaAsignada) {
          throw new Error('Solo puedes generar reportes desde visitas asignadas a tu usuario o usar modo libre.')
        }
      }

      setGuardandoReporte(true)

      let formFinal: FormReporte = { ...form, tecnicoId: tecnicoIdActual, hallazgosSeleccionados, anexos }

      if (form.visitaId === 'LIBRE') {
        const llaveVisitaLibre = `${form.clienteId}-${form.maquinaId}-${tecnicoIdActual}`
        let visitaIdLibre = visitaLibreTemporalRef.current?.key === llaveVisitaLibre
          ? visitaLibreTemporalRef.current.visitaId
          : ''

        if (!visitaIdLibre) {
          const visitaLibre = await crearVisita({
            clienteId: Number(form.clienteId),
            tecnicoId: Number(tecnicoIdActual),
            tipoVisita: 'Visita libre',
            motivo: 'Reporte técnico generado en modo libre.',
            fechaProgramada: new Date().toISOString(),
            observaciones: 'Visita libre creada automáticamente desde el formulario de reporte.',
            requiereCotizacion: false,
          })

          await asociarMaquinasAVisita(visitaLibre.id, [{ maquinaId: Number(form.maquinaId) }])
          visitaIdLibre = String(visitaLibre.id)
          visitaLibreTemporalRef.current = { key: llaveVisitaLibre, visitaId: visitaIdLibre }
        }

        formFinal = { ...formFinal, visitaId: visitaIdLibre }
      }

      const respuesta = await crearReporteDesdeFormulario({
        form: formFinal,
        procedimientos,
        hallazgosCatalogo,
      })

      setReporte(respuesta)
      setFormCierre(CIERRE_REPORTE_INICIAL)
      setMostrarFormularioCierre(false)
      setVista('detalle')
      visitaLibreTemporalRef.current = null
      void cargarVisitasReporte()
      mostrarAviso('success', 'Reporte creado', `Reporte guardado correctamente. Reporte #${respuesta.numeroReporte}`)
    } catch (err) {
      console.error(err)
      const mensaje = err instanceof Error ? err.message : 'No se pudo guardar el reporte.'
      mostrarAviso('error', 'Reporte', mensaje)
    } finally {
      setGuardandoReporte(false)
    }
  }

  async function guardarCierrePosteriorFrontend() {
    try {
      if (!reporte?.id) throw new Error('No se encontró el reporte para cerrar.')
      if (!formCierre.tipoCierre) throw new Error('Debes seleccionar el tipo de cierre.')

      if (formCierre.tipoCierre === 'RECIBIDO_EN_SITIO') {
        if (!formCierre.nombreRecibe.trim()) throw new Error('Debes indicar quién recibe.')
        if (!formCierre.firmaBase64.trim()) throw new Error('Debes capturar la firma del cliente.')
      }

      if (formCierre.tipoCierre === 'SIN_RECEPCION' && !formCierre.motivoSinRecepcion.trim()) {
        throw new Error('Debes seleccionar un motivo de no recepción.')
      }

      setGuardandoCierre(true)

      const respuesta = await cerrarReportePosterior({ reporteId: reporte.id, cierre: formCierre })

      setReporte(respuesta)
      setFormCierre(CIERRE_REPORTE_INICIAL)
      setMostrarFormularioCierre(false)
      void cargarVisitasReporte()
      mostrarAviso('success', 'Cierre guardado', 'El cierre del reporte se guardó correctamente.')
    } catch (err) {
      console.error(err)
      const mensaje = err instanceof Error ? err.message : 'No se pudo guardar el cierre.'
      mostrarAviso('error', 'Cierre del reporte', mensaje)
    } finally {
      setGuardandoCierre(false)
    }
  }

  function valorDetalleVisita(valor?: string | number | null) {
    return valor === null || valor === undefined || String(valor).trim() === '' ? 'Sin dato' : String(valor)
  }

  function fechaDetalleVisita(valor?: string | null) {
    if (!valor) return 'Fecha pendiente'
    const fecha = new Date(valor)
    return Number.isNaN(fecha.getTime()) ? 'Fecha pendiente' : fecha.toLocaleString()
  }

  function textoMaquinaDetalleVisita(visita: VisitaOperativa | null) {
    const maquina = visita?.maquinas?.[0]?.maquina
    if (!maquina) return 'Sin máquina asociada'
    return [maquina.codigoInterno, maquina.marca, maquina.modelo, maquina.serie, maquina.area]
      .filter((item) => item && String(item).trim())
      .join(' · ') || `Máquina #${maquina.id || ''}`
  }

  function renderDetalleVisita() {
    if (!visitaDetalle) {
      return (
        <section className="panel compactFormPanel">
          <h2>Detalle de visita</h2>
          <p className="textoIntroCompacto">Cargando información de la visita...</p>
          <div className="barraAcciones">
            <button className="btn btnGhost" type="button" onClick={irAlMenu}>Volver al panel</button>
          </div>
        </section>
      )
    }

    const visitaConDetalle = visitaDetalle as VisitaDetalleOperativa
    const orden = visitaConDetalle.ordenServicio || {}
    const cliente = visitaConDetalle.cliente || {}
    const maquina = visitaConDetalle.maquinas?.[0]?.maquina || {}
    const reportesVisita = visitaConDetalle.reportes || []

    return (
      <section className="panel compactFormPanel">
        <div className="compactFormHeader">
          <h2>{visitaDetalle.numeroVisita || `Visita #${visitaDetalle.id}`}</h2>
          <p className="textoIntroCompacto">Detalle operativo para revisar cliente, dirección, máquina, técnico, estado y reporte relacionado.</p>
        </div>

        <div className="visitDetailBox">
          <div className="visitDetailHeader">
            <strong>Datos de visita</strong>
            <span className="statusPill">{valorDetalleVisita(visitaDetalle.estado || 'PENDIENTE')}</span>
          </div>
          <div className="visitDetailGrid">
            <div><span>Cliente</span><strong>{valorDetalleVisita(cliente.nombre)}</strong></div>
            <div><span>Técnico</span><strong>{valorDetalleVisita(visitaDetalle.tecnico?.nombre)}</strong></div>
            <div><span>Contacto</span><strong>{valorDetalleVisita(orden.contactoNombre)}</strong></div>
            <div><span>Teléfono</span><strong>{valorDetalleVisita(orden.telefonoContacto || cliente.telefono)}</strong></div>
            <div><span>Correo</span><strong>{valorDetalleVisita(orden.correoContacto || cliente.correo)}</strong></div>
            <div><span>Fecha / hora</span><strong>{fechaDetalleVisita(visitaDetalle.fechaVisita)}</strong></div>
            <div><span>Tipo</span><strong>{valorDetalleVisita(visitaDetalle.tipoVisita || orden.tipoSolicitud)}</strong></div>
            <div><span>Máquina</span><strong>{textoMaquinaDetalleVisita(visitaDetalle)}</strong></div>
            <div className="visitDetailFull"><span>Dirección</span><strong>{valorDetalleVisita(orden.ubicacionServicio || cliente.direccion || cliente.ubicacion || maquina.direccionExacta)}</strong></div>
            <div className="visitDetailFull"><span>Motivo / descripción</span><strong>{valorDetalleVisita(visitaDetalle.motivoVisita || orden.descripcionProblema)}</strong></div>
            <div className="visitDetailFull"><span>Observaciones</span><strong>{valorDetalleVisita(visitaDetalle.observaciones)}</strong></div>
          </div>
        </div>

        <div className="barraAcciones barraAccionesResponsive">
          <button className="btn btnGhost" type="button" onClick={irAlMenu}>Volver al panel</button>
          {reportesVisita.length ? (
            <button className="btn btnPrimario" type="button" onClick={() => { navigate(`/portal/reportes?abrir=detalle&context=dashboard&reporteId=${reportesVisita[0]?.id}`) }}>Ver reporte</button>
          ) : (
            <button className="btn btnPrimario" type="button" onClick={() => { navigate(`/portal/reportes?abrir=crear&context=dashboard&visitaId=${visitaDetalle.id}`) }}>Crear reporte</button>
          )}
        </div>
      </section>
    )
  }

  function renderInicio() {
    return (
      <section className="panel heroPanel reportLandingPanel">
        <div className="heroContent reportLandingContent">
          <div>
            <span className="heroBadge">Crear reporte</span>
            <h1 className="tituloPrincipal">Ingreso directo al formulario</h1>
            <p className="textoIntro">
              Desde aquí se crea el reporte, luego se revisa el detalle y finalmente se hace el cierre.
            </p>
          </div>
        </div>

        <div className="accionesInicio">
          <button className="btn btnPrimario" onClick={() => setVista('crear')} type="button">
            Crear reporte
          </button>
        </div>
      </section>
    )
  }

  function renderDirectHeader() {
    const titulo =
      vista === 'cliente'
        ? 'Registrar cliente'
        : vista === 'maquina'
          ? 'Registrar máquina'
          : vista === 'detalle'
            ? `Reporte #${reporte?.numeroReporte || ''}`.trim()
            : vista === 'detalle-visita'
              ? 'Detalle de visita'
              : 'Crear reporte'

    return (
      <section className="panel directFlowHeader directFlowHeaderSimple">
        <div className="directFlowHeaderBrand">
          <img src={logoEr} alt="ER" className="directFlowLogo" />
          <div>
            <h2>{titulo}</h2>
          </div>
        </div>
      </section>
    )
  }

  function renderContenido() {
    return (
      <>
        {modoDirecto && renderDirectHeader()}

        {vista === 'inicio' && renderInicio()}

        {vista === 'detalle-visita' && renderDetalleVisita()}

        {vista === 'crear' && (
          <FormularioReporte
            form={form}
            tecnicos={tecnicos}
            usuarioActual={user}
            clientes={clientes}
            maquinasCliente={maquinasCliente}
            procedimientos={procedimientos}
            hallazgosAgrupados={hallazgosAgrupados}
            visitasReporte={visitasReporte}
            loadingVisitasReporte={loadingVisitasReporte}
            modoLibreReporte={modoLibreReporte}
            hallazgosSeleccionados={hallazgosSeleccionados}
            categoriasAbiertas={categoriasAbiertas}
            anexos={anexos}
            loadingClientes={loadingClientes}
            loadingMaquinas={loadingMaquinas}
            loadingCatalogos={loadingCatalogosReporte}
            saving={guardandoReporte}
            canOpenCliente={modoLibreReporte || user?.role !== 'TECNICO'}
            onChange={actualizarCampo}
            onToggleHallazgo={cambiarHallazgo}
            onToggleCategoria={toggleCategoria}
            onChangeAnexos={cambiarAnexos}
            onOpenCliente={abrirRegistroCliente}
            onOpenMaquina={abrirRegistroMaquina}
            onBack={regresarDesdeReporte}
            backLabel="Regresar"
            showMenuButton
            onGoMenu={irAlMenu}
            onClear={limpiarFormulario}
            onSave={guardarReporteFrontend}
          />
        )}

        {vista === 'cliente' && (
          <RegistroClienteForm
            formCliente={formCliente}
            guardandoCliente={guardandoCliente}
            loadingCatalogos={loadingCatalogos}
            departamentos={departamentos}
            ciudades={ciudades}
            onChange={actualizarCampoCliente}
            onBack={volverDesdeCliente}
            backLabel="Regresar"
            onClear={limpiarFormularioCliente}
            onSave={guardarClienteFrontend}
          />
        )}

        {vista === 'maquina' && (
          <RegistroMaquinaForm
            formMaquina={formMaquina}
            loadingCatalogos={loadingCatalogos}
            guardandoMaquina={guardandoMaquina}
            clienteSeleccionadoNombre={clienteSeleccionadoNombre}
            clientes={clientes}
            selectedClienteId={form.clienteId}
            allowClientSelection={maquinaContexto === 'dashboard' || !form.clienteId}
            tiposUnidad={tiposUnidad}
            marcasCatalogo={marcasCatalogo}
            refrigerantesCatalogo={refrigerantesCatalogo}
            unidadesMedidaCarga={unidadesMedidaCarga}
            departamentos={departamentos}
            ciudades={ciudades}
            onChange={actualizarCampoMaquina}
            onSelectCliente={actualizarClienteMaquina}
            onBack={volverDesdeMaquina}
            backLabel="Regresar"
            onClear={limpiarFormularioMaquina}
            onSave={guardarMaquinaFrontend}
          />
        )}

        {vista === 'detalle' && reporte && (
          <DetalleReporte
            logoEr={logoEr}
            reporte={reporte}
            detalle={detalle}
            loading={false}
            error={''}
            mostrarFormularioCierre={Boolean(mostrarFormularioCierre)}
            cierreForm={formCierre}
            guardandoCierre={guardandoCierre}
            onBack={regresarDesdeReporte}
            onWhatsApp={abrirWhatsApp}
            onCorreo={abrirCorreo}
            onMostrarCierre={() => setMostrarFormularioCierre(true)}
            onOcultarCierre={() => setMostrarFormularioCierre(false)}
            onChangeCierre={setFormCierre}
            onSaveCierre={guardarCierrePosteriorFrontend}
          />
        )}
      </>
    )
  }

  return (
    <div className="page">
      <div className={modoDirecto ? 'appShell appShellDirect' : 'appShell'}>
        {!modoDirecto && (
          <aside className="sidebar">
            <div className="brandBox">
              <img src={logoEr} alt="ER" className="brandLogo" />
              <div>
                <div className="brandTitle">Expertos en Refrigeración</div>
                <div className="brandSubtitle">Portal de reportes</div>
              </div>
            </div>

            <div className="sidebarSectionLabel">Navegación</div>

            <button
              className={`navButton ${vista === 'inicio' ? 'active' : ''}`}
              onClick={() => setVista('inicio')}
              type="button"
            >
              Inicio
            </button>
            <button
              className={`navButton ${vista === 'crear' ? 'active' : ''}`}
              onClick={() => setVista('crear')}
              type="button"
            >
              Crear reporte
            </button>
            <button
              className={`navButton ${vista === 'cliente' ? 'active' : ''}`}
              onClick={abrirRegistroCliente}
              type="button"
            >
              Agregar cliente
            </button>
            <button
              className={`navButton ${vista === 'maquina' ? 'active' : ''}`}
              onClick={abrirRegistroMaquina}
              type="button"
            >
              Agregar máquina
            </button>
            {reporte && (
              <button
                className={`navButton ${vista === 'detalle' ? 'active' : ''}`}
                onClick={() => setVista('detalle')}
                type="button"
              >
                Detalle del reporte
              </button>
            )}
          </aside>
        )}

        <main className={modoDirecto ? 'content contentDirect' : 'content'}>{renderContenido()}</main>
      </div>

      <PortalNoticeModal
        open={notice.open}
        tone={notice.tone}
        title={notice.title}
        message={notice.message}
        onClose={cerrarAviso}
      />
    </div>
  )
}