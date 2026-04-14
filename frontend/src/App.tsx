import { useEffect, useMemo, useState } from 'react'
import './App.css'
import logoEr from './assets/logo_er.png'

import RegistroClienteForm from './components/clientes/RegistroClienteForm'
import RegistroMaquinaForm from './components/maquinas/RegistroMaquinaForm'
import DetalleReporte from './components/reportes/DetalleReporte'
import FormularioReporte from './components/reportes/FormularioReporte'

import { obtenerClientes, obtenerClienteDetalle, crearCliente } from './services/clientes.service'
import {
  obtenerDepartamentos,
  obtenerCiudadesPorDepartamento,
  obtenerMarcas,
  obtenerRefrigerantes,
  obtenerTiposUnidad,
  obtenerUnidadesMedidaCarga,
} from './services/catalogos.service'
import { crearMaquina } from './services/maquinas.service'

import type { CatalogoItem } from './types/catalogos.types'
import type { ClienteOption, FormCliente, MaquinaOption } from './types/clientes.types'
import { FORM_CLIENTE_INICIAL } from './types/clientes.types'
import type { FormMaquina } from './types/maquinas.types'
import { FORM_MAQUINA_INICIAL } from './types/maquinas.types'
import type { FormReporte, ReporteResponse, VistaActual } from './types/reportes.types'
import {
  FORM_REPORTE_INICIAL,
  HALLAZGOS_DEMO,
  PROCEDIMIENTOS_DEMO,
  TECNICOS_DEMO,
} from './types/reportes.types'

function App() {
  const [vista, setVista] = useState<VistaActual>('inicio')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reporte, setReporte] = useState<ReporteResponse['data'] | null>(null)

  const [form, setForm] = useState<FormReporte>(FORM_REPORTE_INICIAL)
  const [formCliente, setFormCliente] = useState<FormCliente>(FORM_CLIENTE_INICIAL)
  const [formMaquina, setFormMaquina] = useState<FormMaquina>(FORM_MAQUINA_INICIAL)

  const [hallazgosSeleccionados, setHallazgosSeleccionados] = useState<number[]>([])
  const [anexos, setAnexos] = useState<File[]>([])
  const [categoriasAbiertas, setCategoriasAbiertas] = useState<string[]>([])

  const [clientes, setClientes] = useState<ClienteOption[]>([])
  const [maquinasCliente, setMaquinasCliente] = useState<MaquinaOption[]>([])
  const [loadingClientes, setLoadingClientes] = useState(false)
  const [loadingMaquinas, setLoadingMaquinas] = useState(false)
  const [guardandoCliente, setGuardandoCliente] = useState(false)
  const [guardandoMaquina, setGuardandoMaquina] = useState(false)

  const [tiposUnidad, setTiposUnidad] = useState<CatalogoItem[]>([])
  const [marcasCatalogo, setMarcasCatalogo] = useState<CatalogoItem[]>([])
  const [refrigerantesCatalogo, setRefrigerantesCatalogo] = useState<CatalogoItem[]>([])
  const [unidadesMedidaCarga, setUnidadesMedidaCarga] = useState<CatalogoItem[]>([])
  const [departamentos, setDepartamentos] = useState<CatalogoItem[]>([])
  const [ciudades, setCiudades] = useState<CatalogoItem[]>([])
  const [loadingCatalogos, setLoadingCatalogos] = useState(false)

  const detalle = useMemo(() => reporte?.detallesMaquinas?.[0], [reporte])

  const hallazgosAgrupados = useMemo(() => {
    const grupos: Record<string, typeof HALLAZGOS_DEMO> = {} as Record<string, typeof HALLAZGOS_DEMO>

    HALLAZGOS_DEMO.forEach((hallazgo) => {
      const categoria = hallazgo.categoria || 'General'
      if (!grupos[categoria]) grupos[categoria] = []
      grupos[categoria].push(hallazgo)
    })

    return grupos
  }, [])

  const clienteSeleccionadoNombre = useMemo(() => {
    const id = Number(form.clienteId)
    if (!id) return ''
    return clientes.find((cliente) => cliente.id === id)?.nombre || ''
  }, [form.clienteId, clientes])

  useEffect(() => {
    if ((vista === 'crear' || vista === 'cliente' || vista === 'maquina') && !clientes.length) {
      cargarClientes()
    }
  }, [vista, clientes.length])

  useEffect(() => {
    if (!form.clienteId) {
      setMaquinasCliente([])
      return
    }

    cargarMaquinasPorCliente(form.clienteId)
  }, [form.clienteId])

  useEffect(() => {
    if (
      vista === 'maquina' &&
      (!tiposUnidad.length ||
        !marcasCatalogo.length ||
        !refrigerantesCatalogo.length ||
        !unidadesMedidaCarga.length ||
        !departamentos.length)
    ) {
      cargarCatalogosMaquina()
    }
  }, [
    vista,
    tiposUnidad.length,
    marcasCatalogo.length,
    refrigerantesCatalogo.length,
    unidadesMedidaCarga.length,
    departamentos.length,
  ])

  useEffect(() => {
    if (vista !== 'maquina') return

    if (!formMaquina.departamentoId) {
      setCiudades([])
      setFormMaquina((prev) => ({
        ...prev,
        ciudadId: '',
      }))
      return
    }

    cargarCiudades(Number(formMaquina.departamentoId))
  }, [vista, formMaquina.departamentoId])

  async function cargarClientes() {
    try {
      setLoadingClientes(true)
      const data = await obtenerClientes()
      setClientes(data)
    } catch (err) {
      console.error(err)
      alert('No se pudieron cargar los clientes.')
    } finally {
      setLoadingClientes(false)
    }
  }

  async function cargarMaquinasPorCliente(clienteId: string) {
    try {
      setLoadingMaquinas(true)

      const data = await obtenerClienteDetalle(clienteId)

      setMaquinasCliente(
        (data.maquinas || [])
          .filter((maquina) => maquina.activo !== false)
          .map((maquina) => ({
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
      alert('No se pudieron cargar las máquinas del cliente seleccionado.')
    } finally {
      setLoadingMaquinas(false)
    }
  }

  async function cargarCatalogosMaquina() {
    try {
      setLoadingCatalogos(true)

      const [tipos, marcas, refris, unidades, deps] = await Promise.all([
        obtenerTiposUnidad(),
        obtenerMarcas(),
        obtenerRefrigerantes(),
        obtenerUnidadesMedidaCarga(),
        obtenerDepartamentos(),
      ])

      setTiposUnidad(tipos)
      setMarcasCatalogo(marcas)
      setRefrigerantesCatalogo(refris)
      setUnidadesMedidaCarga(unidades)
      setDepartamentos(deps)
    } catch (err) {
      console.error(err)
      alert('No se pudieron cargar los catálogos de máquina.')
    } finally {
      setLoadingCatalogos(false)
    }
  }

  async function cargarCiudades(departamentoId: number) {
    try {
      const data = await obtenerCiudadesPorDepartamento(departamentoId)
      setCiudades(data)
    } catch (err) {
      console.error(err)
      setCiudades([])
      alert('No se pudieron cargar las ciudades del departamento.')
    }
  }

  async function cargarReportePrueba() {
    try {
      setLoading(true)
      setError('')

      const res = await fetch('http://localhost:3001/api/reportes/30')
      const raw = await res.text()

      if (!res.ok) throw new Error(`Error HTTP ${res.status} - ${raw}`)

      const data: ReporteResponse = JSON.parse(raw)
      if (!data.ok || !data.data) throw new Error('Respuesta sin datos de reporte')

      setReporte(data.data)
      setVista('detalle')
    } catch (err) {
      console.error(err)
      setError('No se pudo cargar el reporte de prueba.')
      setVista('detalle')
    } finally {
      setLoading(false)
    }
  }

  function actualizarCampo(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target

    if (name === 'clienteId') {
      setForm((prev) => ({
        ...prev,
        clienteId: value,
        maquinaId: '',
      }))
      return
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  function actualizarCampoCliente(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target
    setFormCliente((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  function actualizarCampoMaquina(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target

    if (name === 'departamentoId') {
      setFormMaquina((prev) => ({
        ...prev,
        departamentoId: value,
        ciudadId: '',
      }))
      return
    }

    setFormMaquina((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  function cambiarHallazgo(id: number) {
    setHallazgosSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  function toggleCategoria(categoria: string) {
    setCategoriasAbiertas((prev) =>
      prev.includes(categoria)
        ? prev.filter((item) => item !== categoria)
        : [...prev, categoria]
    )
  }

  function cambiarAnexos(e: React.ChangeEvent<HTMLInputElement>) {
    setAnexos(Array.from(e.target.files || []))
  }

  function limpiarFormulario() {
    setForm(FORM_REPORTE_INICIAL)
    setHallazgosSeleccionados([])
    setAnexos([])
    setCategoriasAbiertas([])
    setMaquinasCliente([])
  }

  function limpiarFormularioCliente() {
    setFormCliente(FORM_CLIENTE_INICIAL)
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

  function abrirRegistroCliente() {
    limpiarFormularioCliente()
    setVista('cliente')
  }

  function volverDesdeCliente() {
    setVista('crear')
  }

  function abrirRegistroMaquina() {
    if (!form.clienteId) {
      alert('Primero debes seleccionar un cliente para registrar una máquina asociada.')
      return
    }

    limpiarFormularioMaquina()
    setVista('maquina')
  }

  function volverDesdeMaquina() {
    setVista('crear')
  }

  async function guardarClienteFrontend() {
    if (!formCliente.nombre.trim()) {
      alert('El nombre del cliente es obligatorio.')
      return
    }

    try {
      setGuardandoCliente(true)

      const nuevoCliente = await crearCliente({
        nombre: formCliente.nombre.trim(),
        rtn: formCliente.rtn.trim() || undefined,
        contactoNombre: formCliente.contactoNombre.trim() || undefined,
        telefono: formCliente.telefono.trim() || undefined,
        correo: formCliente.correo.trim() || undefined,
        direccion: formCliente.direccion.trim() || undefined,
        ubicacion: formCliente.ubicacion.trim() || undefined,
      })

      await cargarClientes()

      setForm((prev) => ({
        ...prev,
        clienteId: String(nuevoCliente.id),
        maquinaId: '',
      }))

      setMaquinasCliente([])
      limpiarFormularioCliente()
      setVista('crear')

      alert(`Cliente creado correctamente: ${nuevoCliente.nombre}`)
    } catch (err: unknown) {
      console.error(err)
      const mensajeError =
        err instanceof Error ? err.message : 'No se pudo crear el cliente.'
      alert(mensajeError)
    } finally {
      setGuardandoCliente(false)
    }
  }

  async function guardarMaquinaFrontend() {
    if (!form.clienteId) {
      alert('Primero debes seleccionar un cliente.')
      return
    }

    if (!formMaquina.tipoUnidadId) {
      alert('Debes seleccionar un tipo de unidad desde el catálogo.')
      return
    }

    if (!formMaquina.marcaId) {
      alert('Debes seleccionar una marca desde el catálogo.')
      return
    }

    if (!formMaquina.refrigeranteId) {
      alert('Debes seleccionar un refrigerante desde el catálogo.')
      return
    }

    if (!formMaquina.departamentoId) {
      alert('Debes seleccionar un departamento.')
      return
    }

    if (!formMaquina.ciudadId) {
      alert('Debes seleccionar una ciudad.')
      return
    }

    try {
      setGuardandoMaquina(true)

      const nuevaMaquina = await crearMaquina({
        clienteId: Number(form.clienteId),
        tipoUnidadId: Number(formMaquina.tipoUnidadId),
        marcaId: Number(formMaquina.marcaId),
        refrigeranteId: Number(formMaquina.refrigeranteId),
        unidadMedidaCargaId:
          formMaquina.unidadMedidaCargaId.trim() !== ''
            ? Number(formMaquina.unidadMedidaCargaId)
            : undefined,
        departamentoId: Number(formMaquina.departamentoId),
        ciudadId: Number(formMaquina.ciudadId),
        modelo: formMaquina.modelo.trim() || undefined,
        serie: formMaquina.serie.trim() || undefined,
        cargaRefrigeranteCantidad:
          formMaquina.cargaRefrigeranteCantidad.trim() !== ''
            ? Number(formMaquina.cargaRefrigeranteCantidad)
            : undefined,
        direccionExacta: formMaquina.direccionExacta.trim() || undefined,
        area: formMaquina.area.trim() || undefined,
        observaciones: formMaquina.observaciones.trim() || undefined,
      })

      await cargarMaquinasPorCliente(form.clienteId)

      setForm((prev) => ({
        ...prev,
        maquinaId: String(nuevaMaquina.id),
      }))

      limpiarFormularioMaquina()
      setVista('crear')

      alert(`Máquina creada correctamente. Código interno: ${nuevaMaquina.codigoInterno || 'N/D'}`)
    } catch (err: unknown) {
      console.error(err)
      const mensajeError =
        err instanceof Error ? err.message : 'No se pudo crear la máquina.'
      alert(mensajeError)
    } finally {
      setGuardandoMaquina(false)
    }
  }

  function guardarReporteTemporal() {
    alert('Siguiente paso: conectar este formulario real al POST /api/reportes con body mínimo funcional.')
  }

  function renderInicio() {
    return (
      <section className="panel heroPanel">
        <div className="heroContent">
          <img src={logoEr} alt="Logo Expertos en Refrigeración" className="logoEmpresa" />

          <div>
            <h1 className="tituloPrincipal">Expertos en Refrigeración</h1>
            <p className="subtituloPrincipal">Sistema operativo de reportes técnicos</p>
            <p className="textoIntro">
              Flujo operativo priorizado: formulario de creación, evidencias, cierre,
              PDF y acciones de envío antes del módulo administrativo de listado.
            </p>
          </div>
        </div>

        <div className="accionesInicio">
          <button className="btn btnPrimario" onClick={() => setVista('crear')}>
            Crear reporte
          </button>

          <button className="btn btnSecundario" onClick={cargarReportePrueba}>
            Ver reporte de prueba
          </button>
        </div>
      </section>
    )
  }

  return (
    <div className="page">
      <div className="container">
        {vista === 'inicio' && renderInicio()}

        {vista === 'crear' && (
          <FormularioReporte
            logoEr={logoEr}
            form={form}
            clientes={clientes}
            maquinasCliente={maquinasCliente}
            tecnicos={TECNICOS_DEMO}
            procedimientos={PROCEDIMIENTOS_DEMO}
            hallazgosAgrupados={hallazgosAgrupados}
            hallazgosSeleccionados={hallazgosSeleccionados}
            categoriasAbiertas={categoriasAbiertas}
            anexos={anexos}
            loadingClientes={loadingClientes}
            loadingMaquinas={loadingMaquinas}
            onChange={actualizarCampo}
            onToggleCategoria={toggleCategoria}
            onToggleHallazgo={cambiarHallazgo}
            onChangeAnexos={cambiarAnexos}
            onOpenCliente={abrirRegistroCliente}
            onOpenMaquina={abrirRegistroMaquina}
            onBack={() => setVista('inicio')}
            onClear={limpiarFormulario}
            onSave={guardarReporteTemporal}
          />
        )}

        {vista === 'cliente' && (
          <RegistroClienteForm
            logoEr={logoEr}
            formCliente={formCliente}
            guardandoCliente={guardandoCliente}
            onChange={actualizarCampoCliente}
            onBack={volverDesdeCliente}
            onClear={limpiarFormularioCliente}
            onSave={guardarClienteFrontend}
          />
        )}

        {vista === 'maquina' && (
          <RegistroMaquinaForm
            logoEr={logoEr}
            formMaquina={formMaquina}
            loadingCatalogos={loadingCatalogos}
            guardandoMaquina={guardandoMaquina}
            clienteSeleccionadoNombre={clienteSeleccionadoNombre}
            tiposUnidad={tiposUnidad}
            marcasCatalogo={marcasCatalogo}
            refrigerantesCatalogo={refrigerantesCatalogo}
            unidadesMedidaCarga={unidadesMedidaCarga}
            departamentos={departamentos}
            ciudades={ciudades}
            onChange={actualizarCampoMaquina}
            onBack={volverDesdeMaquina}
            onClear={limpiarFormularioMaquina}
            onSave={guardarMaquinaFrontend}
          />
        )}

        {vista === 'detalle' && (
          <DetalleReporte
            logoEr={logoEr}
            reporte={reporte}
            detalle={detalle}
            loading={loading}
            error={error}
            onBack={() => setVista('inicio')}
            onWhatsApp={abrirWhatsApp}
            onCorreo={abrirCorreo}
          />
        )}
      </div>
    </div>
  )
}

export default App

