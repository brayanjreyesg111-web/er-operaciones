import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import logoEr from '../../assets/logo_er.png'
import SearchableSelect from '../../components/ui/SearchableSelect'
import {
  crearSolicitudPublica,
  obtenerCiudadesPublicas,
  obtenerDepartamentosPublicos,
  type CatalogoUbicacionItem,
} from '../../services/solicitudes.service'

type FormSolicitud = {
  nombreSolicitante: string
  telefono: string
  correo: string
  empresa: string
  departamentoId: string
  ciudadId: string
  direccionExacta: string
  tipoServicio: string
  descripcion: string
  fechaDeseada: string
}

const FORM_SOLICITUD_INICIAL: FormSolicitud = {
  nombreSolicitante: '',
  telefono: '',
  correo: '',
  empresa: '',
  departamentoId: '',
  ciudadId: '',
  direccionExacta: '',
  tipoServicio: 'MANTENIMIENTO',
  descripcion: '',
  fechaDeseada: '',
}

const lineasConfort = [
  {
    titulo: 'Residencial',
    texto:
      'Atención para confort de hogar, mini-splits, mantenimiento, diagnósticos y correcciones puntuales.',
  },
  {
    titulo: 'Comercial',
    texto:
      'Soporte técnico para negocio, oficinas, locales y equipos que requieren continuidad operativa real.',
  },
  {
    titulo: 'Industrial',
    texto:
      'Intervenciones para operación crítica, seguimiento técnico, documentación y control de historial.',
  },
]

const serviciosPrincipales = [
  'Pólizas de mantenimiento',
  'Proyectos de ingeniería',
  'Asesoría técnica',
  'Mantenimiento preventivo',
  'Mantenimiento correctivo',
  'Suministro e instalación de equipos',
]

export default function PublicPortalPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [solicitudOpen, setSolicitudOpen] = useState(false)
  const [contactoOpen, setContactoOpen] = useState(false)
  const [mostrarResumenSolicitud, setMostrarResumenSolicitud] = useState(false)
  const [formSolicitud, setFormSolicitud] = useState<FormSolicitud>(FORM_SOLICITUD_INICIAL)
  const [mensajeSolicitud, setMensajeSolicitud] = useState('')
  const [errorSolicitud, setErrorSolicitud] = useState('')
  const [guardandoSolicitud, setGuardandoSolicitud] = useState(false)
  const [departamentos, setDepartamentos] = useState<CatalogoUbicacionItem[]>([])
  const [ciudades, setCiudades] = useState<CatalogoUbicacionItem[]>([])

  useEffect(() => {
    async function load() {
      try {
        const data = await obtenerDepartamentosPublicos()
        setDepartamentos(data)
      } catch (error) {
        console.error(error)
      }
    }
    void load()
  }, [])

  useEffect(() => {
    async function loadCities() {
      if (!formSolicitud.departamentoId) {
        setCiudades([])
        return
      }

      try {
        const data = await obtenerCiudadesPublicas(Number(formSolicitud.departamentoId))
        setCiudades(data)
      } catch (error) {
        console.error(error)
        setCiudades([])
      }
    }
    void loadCities()
  }, [formSolicitud.departamentoId])

  const resumenUbicacion = useMemo(() => {
    const departamento = departamentos.find((item) => String(item.id) === formSolicitud.departamentoId)
    const ciudad = ciudades.find((item) => String(item.id) === formSolicitud.ciudadId)
    return [ciudad?.nombre, departamento?.nombre].filter(Boolean).join(', ') || 'Pendiente'
  }, [ciudades, departamentos, formSolicitud.ciudadId, formSolicitud.departamentoId])

  function actualizarCampo(name: keyof FormSolicitud, value: string) {
    setMensajeSolicitud('')
    setErrorSolicitud('')

    setFormSolicitud((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'departamentoId' ? { ciudadId: '' } : {}),
    }))
  }

  function validarSolicitud() {
    if (!formSolicitud.nombreSolicitante.trim()) return 'Debes escribir el nombre completo.'
    if (!formSolicitud.telefono.trim()) return 'Debes escribir el número de teléfono.'
    if (!formSolicitud.departamentoId) return 'Debes seleccionar un departamento.'
    if (!formSolicitud.ciudadId) return 'Debes seleccionar una ciudad.'
    if (!formSolicitud.descripcion.trim()) return 'Debes describir la solicitud o problema.'
    return ''
  }

  async function enviarSolicitud() {
    setMensajeSolicitud('')
    setErrorSolicitud('')

    const error = validarSolicitud()
    if (error) {
      setErrorSolicitud(error)
      setSolicitudOpen(true)
      return
    }

    try {
      setGuardandoSolicitud(true)

      await crearSolicitudPublica({
        nombreSolicitante: formSolicitud.nombreSolicitante.trim(),
        telefono: formSolicitud.telefono.trim(),
        correo: formSolicitud.correo.trim() || undefined,
        empresa: formSolicitud.empresa.trim() || undefined,
        departamentoId: Number(formSolicitud.departamentoId),
        ciudadId: Number(formSolicitud.ciudadId),
        direccionExacta: formSolicitud.direccionExacta.trim() || undefined,
        tipoServicio: formSolicitud.tipoServicio || undefined,
        descripcion: formSolicitud.descripcion.trim(),
        fechaDeseada: formSolicitud.fechaDeseada || undefined,
      })

      setMensajeSolicitud('Solicitud enviada correctamente. Pronto nos comunicaremos contigo.')
      setFormSolicitud(FORM_SOLICITUD_INICIAL)
      setCiudades([])
      setMostrarResumenSolicitud(false)
      setSolicitudOpen(true)
    } catch (error: unknown) {
      const mensaje = error instanceof Error ? error.message : 'No se pudo enviar la solicitud.'
      setErrorSolicitud(mensaje)
      setSolicitudOpen(true)
    } finally {
      setGuardandoSolicitud(false)
    }
  }

  function abrirSolicitud() {
    setSolicitudOpen(true)
    setContactoOpen(false)
    setMenuOpen(false)
    window.setTimeout(() => {
      document.getElementById('solicitud-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 60)
  }

  function abrirContacto() {
    setContactoOpen(true)
    setSolicitudOpen(false)
    setMenuOpen(false)
    window.setTimeout(() => {
      document.getElementById('contacto-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 60)
  }

  return (
    <div className="portalPublico portalPublicoSinHero">
      <header className="publicHeader">
        <div className="publicBrand publicBrandPlain">
          <img src={logoEr} alt="Logo Expertos en Refrigeración" />
          <div>
            <h1>Expertos en Refrigeración</h1>
          </div>
        </div>

        <button
          className="portalMenuButton portalHamburger"
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Abrir menú del portal"
        >
          ☰
        </button>

        <nav className={`publicNav ${menuOpen ? 'is-open' : ''}`}>
          <a href="#lineas">Líneas</a>
          <a href="#servicios">Servicios</a>
          <button type="button" onClick={abrirSolicitud}>
            Solicitar visita
          </button>
          <button type="button" onClick={abrirContacto}>
            Contacto
          </button>
          <Link className="navPortalButton" to="/login">
            Login interno
          </Link>
        </nav>
      </header>

      <main className="publicLanding">
        <section id="lineas" className="publicSectionBlock">
          <div className="sectionTitleCenter">
            <span className="sectionCaption">Líneas de confort</span>
            <h3>Áreas de atención pensadas para una empresa real</h3>
          </div>

          <div className="comfortGrid">
            {lineasConfort.map((item) => (
              <article key={item.titulo} className="comfortCard">
                <div className="comfortImagePlaceholder" aria-hidden="true">
                  ❄️
                </div>
                <h4>{item.titulo}</h4>
                <p>{item.texto}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="servicios" className="publicExpandableArea">
          <details className="publicAccordion">
            <summary>Servicios</summary>
            <div className="publicPanel accordionInnerPanel">
              <div className="sectionTitleCenter">
                <span className="sectionCaption">Qué hacemos</span>
                <h3>Servicio para resolver distintos escenarios de climatización</h3>
              </div>

              <div className="servicesGridV2">
                {serviciosPrincipales.map((servicio) => (
                  <article key={servicio} className="serviceFeatureCard">
                    <div className="serviceFeatureIcon" aria-hidden="true">
                      ✦
                    </div>
                    <h4>{servicio}</h4>
                    <p>
                      Presentación comercial del servicio dentro del portal público, con enfoque limpio,
                      profesional y adaptado a móvil.
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </details>
        </section>

        <section className="publicExpandableArea">
          <details id="solicitud-panel" className="publicAccordion" open={solicitudOpen}>
            <summary>Solicitar visita técnica</summary>
            <div className="publicPanel accordionInnerPanel">
              <div className="publicFormGrid">
                <label>
                  Nombre completo *
                  <input
                    value={formSolicitud.nombreSolicitante}
                    onChange={(e) => actualizarCampo('nombreSolicitante', e.target.value)}
                    placeholder="Nombre del solicitante"
                  />
                </label>

                <label>
                  Teléfono *
                  <input
                    value={formSolicitud.telefono}
                    onChange={(e) => actualizarCampo('telefono', e.target.value)}
                    placeholder="Teléfono de contacto"
                  />
                </label>

                <label>
                  Correo electrónico
                  <input
                    value={formSolicitud.correo}
                    onChange={(e) => actualizarCampo('correo', e.target.value)}
                    placeholder="correo@empresa.com"
                  />
                </label>

                <label>
                  Empresa o área de atención (opcional)
                  <input
                    value={formSolicitud.empresa}
                    onChange={(e) => actualizarCampo('empresa', e.target.value)}
                    placeholder="Ej. empresa, área, departamento o atención personal"
                  />
                </label>

                <label>
                  Departamento *
                  <SearchableSelect
                    id="solicitudDepartamento"
                    name="departamentoId"
                    value={formSolicitud.departamentoId}
                    placeholder="Escribe para buscar departamento..."
                    required
                    options={departamentos.map((item) => ({ value: item.id, label: item.nombre }))}
                    onChangeValue={(value) => actualizarCampo('departamentoId', value)}
                  />
                </label>

                <label>
                  Ciudad *
                  <SearchableSelect
                    id="solicitudCiudad"
                    name="ciudadId"
                    value={formSolicitud.ciudadId}
                    placeholder={!formSolicitud.departamentoId ? 'Seleccione primero un departamento' : 'Escribe para buscar ciudad...'}
                    disabled={!formSolicitud.departamentoId}
                    required
                    options={ciudades.map((item) => ({ value: item.id, label: item.nombre }))}
                    onChangeValue={(value) => actualizarCampo('ciudadId', value)}
                  />
                </label>

                <label>
                  Tipo de servicio
                  <select
                    value={formSolicitud.tipoServicio}
                    onChange={(e) => actualizarCampo('tipoServicio', e.target.value)}
                  >
                    <option value="MANTENIMIENTO">Mantenimiento</option>
                    <option value="DIAGNOSTICO">Diagnóstico</option>
                    <option value="CORRECTIVO">Correctivo</option>
                    <option value="INSTALACION">Instalación</option>
                    <option value="EMERGENCIA">Emergencia</option>
                  </select>
                </label>

                <label>
                  Fecha deseada
                  <input
                    type="date"
                    value={formSolicitud.fechaDeseada}
                    onChange={(e) => actualizarCampo('fechaDeseada', e.target.value)}
                  />
                </label>

                <label>
                  Dirección exacta
                  <input
                    value={formSolicitud.direccionExacta}
                    onChange={(e) => actualizarCampo('direccionExacta', e.target.value)}
                    placeholder="Referencia o dirección"
                  />
                </label>

                <label className="publicFormFull">
                  Descripción de la solicitud *
                  <textarea
                    rows={5}
                    value={formSolicitud.descripcion}
                    onChange={(e) => actualizarCampo('descripcion', e.target.value)}
                    placeholder="Describe el problema, la necesidad o el tipo de atención requerida"
                  />
                </label>
              </div>

              <div className="requestSummaryTrigger">
                <button
                  className="btnPortalSecundario btnPortalSecundarioVibrant"
                  type="button"
                  onClick={() => setMostrarResumenSolicitud((prev) => !prev)}
                >
                  {mostrarResumenSolicitud ? 'Ocultar resumen' : 'Revisar resumen antes de enviar'}
                </button>
              </div>

              {mostrarResumenSolicitud && (
                <div className="requestSummaryCard">
                  <h3>Resumen de la solicitud</h3>
                  <div className="requestSummaryGrid">
                    <div>
                      <span>Solicitante</span>
                      <strong>{formSolicitud.nombreSolicitante || 'Pendiente'}</strong>
                    </div>
                    <div>
                      <span>Ubicación</span>
                      <strong>{resumenUbicacion}</strong>
                    </div>
                    <div>
                      <span>Tipo de servicio</span>
                      <strong>{formSolicitud.tipoServicio || 'Pendiente'}</strong>
                    </div>
                    <div>
                      <span>Empresa/área</span>
                      <strong>{formSolicitud.empresa || 'A título personal / Pendiente'}</strong>
                    </div>
                  </div>
                </div>
              )}

              {mensajeSolicitud && <div className="mensajeSolicitud">{mensajeSolicitud}</div>}
              {errorSolicitud && <div className="errorBox">{errorSolicitud}</div>}

              <div className="formActionsWide">
                <button className="btnPortalPrincipal" type="button" onClick={enviarSolicitud} disabled={guardandoSolicitud}>
                  {guardandoSolicitud ? 'Enviando solicitud...' : 'Enviar solicitud'}
                </button>
                <button
                  className="btnPortalSecundario btnPortalSecundarioVibrant"
                  type="button"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  Volver arriba
                </button>
              </div>
            </div>
          </details>

          <details id="contacto-panel" className="publicAccordion" open={contactoOpen}>
            <summary>Contacto y canales</summary>
            <div className="publicPanel accordionInnerPanel">
              <div className="sectionTitleCenter sectionTitleCenterLeft">
                <h3>Contacto</h3>
              </div>

              <div className="contactGrid">
                <article className="publicCard">
                  <h4>Correo</h4>
                  <p>contacto@eroperaciones.com</p>
                </article>
                <article className="publicCard">
                  <h4>WhatsApp</h4>
                  <p>+504 0000-0000</p>
                </article>
                <article className="publicCard">
                  <h4>Ubicación</h4>
                  <p>Santa Cruz de Yojoa, Cortés</p>
                </article>
              </div>
            </div>
          </details>
        </section>
      </main>
    </div>
  )
}