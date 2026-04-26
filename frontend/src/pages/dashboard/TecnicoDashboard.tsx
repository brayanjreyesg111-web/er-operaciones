import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import RoleActionBar from '../../components/layout/RoleActionBar'
import {
  construirDashboardTecnico,
  obtenerDashboardBaseData,
  textoMaquinaVisita,
  textoVisitaPrincipal,
  type DashboardActividad,
  type DashboardTecnicoData,
  type DashboardVisita,
} from '../../services/dashboard.service'
import {
  actualizarPasoActividad,
  crearMensajeActividad,
} from '../../services/actividades.service'
import {
  crearComentarioVisita,
  finalizarVisita,
  obtenerComentariosVisita,
  type VisitaComentario,
} from '../../services/visitas.service'

type FiltroEstado = 'TODAS' | 'PENDIENTES' | 'EN_PROCESO' | 'PAUSADAS' | 'FINALIZADAS'
type FiltroReporte = 'TODOS' | 'SIN_CIERRE' | 'CERRADOS' | 'CON_FIRMA' | 'SIN_FIRMA'

type ComentarioForm = {
  asunto: string
  mensaje: string
  prioridad: string
  archivos: File[]
}

type ComentarioActividadForm = {
  asunto: string
  mensaje: string
  prioridad: string
}

const COMENTARIO_FORM_INICIAL: ComentarioForm = {
  asunto: '',
  mensaje: '',
  prioridad: 'MEDIA',
  archivos: [],
}

const COMENTARIO_ACTIVIDAD_INICIAL: ComentarioActividadForm = {
  asunto: '',
  mensaje: '',
  prioridad: 'MEDIA',
}

const filtrosEstado: Array<{ value: FiltroEstado; label: string }> = [
  { value: 'TODAS', label: 'Todas' },
  { value: 'PENDIENTES', label: 'Pendientes' },
  { value: 'EN_PROCESO', label: 'En proceso' },
  { value: 'PAUSADAS', label: 'Pausadas' },
  { value: 'FINALIZADAS', label: 'Finalizadas' },
]

const filtrosReportes: Array<{ value: FiltroReporte; label: string }> = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'SIN_CIERRE', label: 'Sin cierre' },
  { value: 'CERRADOS', label: 'Cerrados' },
  { value: 'CON_FIRMA', label: 'Con firma' },
  { value: 'SIN_FIRMA', label: 'Sin firma' },
]

function normalizarEstado(valor?: string | null) {
  return String(valor || '').trim().toUpperCase()
}

function visitaFinalizada(visita: DashboardVisita) {
  return ['FINALIZADA', 'ATENDIDA', 'COMPLETADA', 'CERRADA'].includes(normalizarEstado(visita.estado))
}

function actividadFinalizada(actividad: DashboardActividad) {
  return ['COMPLETADA', 'FINALIZADA', 'CERRADA'].includes(normalizarEstado(actividad.estado))
}

function reporteCerrado(reporte: DashboardTecnicoData['misReportes'][number]) {
  const estado = normalizarEstado(reporte.estado)
  return Boolean(reporte.cierre?.fechaCierre || reporte.cierre?.nombreRecibe || reporte.cierre?.motivoNoRecepcion) ||
    ['CERRADO', 'CERRADA', 'RECIBIDO', 'RECIBIDO_EN_SITIO', 'SIN_RECEPCION'].includes(estado)
}

function reporteConFirma(reporte: DashboardTecnicoData['misReportes'][number]) {
  return Boolean(reporte.cierre?.nombreRecibe)
}

function cumpleFiltroReporte(reporte: DashboardTecnicoData['misReportes'][number], filtro: FiltroReporte) {
  if (filtro === 'TODOS') return true
  if (filtro === 'SIN_CIERRE') return !reporteCerrado(reporte)
  if (filtro === 'CERRADOS') return reporteCerrado(reporte)
  if (filtro === 'CON_FIRMA') return reporteConFirma(reporte)
  if (filtro === 'SIN_FIRMA') return !reporteConFirma(reporte)
  return true
}

function cumpleFiltro(estadoOriginal: string | null | undefined, finalizada: boolean, filtro: FiltroEstado) {
  const estado = normalizarEstado(estadoOriginal)

  if (filtro === 'TODAS') return true
  if (filtro === 'PENDIENTES') return ['PENDIENTE', 'ASIGNADA', 'NUEVA'].includes(estado)
  if (filtro === 'EN_PROCESO') return ['EN_PROCESO', 'PROCESO', 'INICIADA'].includes(estado)
  if (filtro === 'PAUSADAS') return ['PAUSADA', 'PAUSADO', 'EN_ESPERA'].includes(estado)
  if (filtro === 'FINALIZADAS') return finalizada

  return true
}

function textoFecha(valor?: string | null) {
  if (!valor) return 'Fecha pendiente'
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return 'Fecha pendiente'
  return fecha.toLocaleString()
}

function claseProgresoActividad(valor?: number | null) {
  const numero = Number(valor || 0)
  const limitado = Math.min(100, Math.max(0, Number.isFinite(numero) ? numero : 0))
  const redondeado = Math.round(limitado)
  return `progressFillP${redondeado}`
}

function obtenerComentarioForm(
  forms: Record<number, ComentarioForm>,
  visitaId: number
): ComentarioForm {
  return forms[visitaId] || COMENTARIO_FORM_INICIAL
}

function obtenerComentarioActividadForm(
  forms: Record<number, ComentarioActividadForm>,
  actividadId: number
): ComentarioActividadForm {
  return forms[actividadId] || COMENTARIO_ACTIVIDAD_INICIAL
}

export default function TecnicoDashboard() {
  const { user, logout } = useAuth()
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [savingId, setSavingId] = useState<number | null>(null)
  const [savingComentarioId, setSavingComentarioId] = useState<number | null>(null)
  const [savingPasoId, setSavingPasoId] = useState<number | null>(null)
  const [filtroVisitas, setFiltroVisitas] = useState<FiltroEstado>('PENDIENTES')
  const [filtroActividades, setFiltroActividades] = useState<FiltroEstado>('PENDIENTES')
  const [filtroReportes, setFiltroReportes] = useState<FiltroReporte>('SIN_CIERRE')
  const [comentariosAbiertos, setComentariosAbiertos] = useState<Record<number, boolean>>({})
  const [comentariosPorVisita, setComentariosPorVisita] = useState<Record<number, VisitaComentario[]>>({})
  const [comentarioForms, setComentarioForms] = useState<Record<number, ComentarioForm>>({})
  const [comentarioActividadForms, setComentarioActividadForms] = useState<Record<number, ComentarioActividadForm>>({})
  const [dashboard, setDashboard] = useState<DashboardTecnicoData | null>(null)

  const cargarDashboard = useCallback(async () => {
    const tecnicoIdActual = Number(user?.id || 0)
    if (!tecnicoIdActual) {
      setDashboard(null)
      setError('No se pudo identificar el usuario técnico actual.')
      return
    }

    const base = await obtenerDashboardBaseData()
    setDashboard(construirDashboardTecnico(base, tecnicoIdActual))
  }, [user?.id])

  useEffect(() => {
    async function load() {
      try {
        await cargarDashboard()
      } catch (err) {
        console.error(err)
        setError('No se pudo cargar el dashboard técnico.')
      }
    }

    void load()
  }, [cargarDashboard])

  const visitasFiltradas = useMemo(
    () => (dashboard?.misVisitas || []).filter((visita) => cumpleFiltro(visita.estado, visitaFinalizada(visita), filtroVisitas)),
    [dashboard?.misVisitas, filtroVisitas]
  )

  const actividadesFiltradas = useMemo(
    () => (dashboard?.misActividades || []).filter((actividad) => cumpleFiltro(actividad.estado, actividadFinalizada(actividad), filtroActividades)),
    [dashboard?.misActividades, filtroActividades]
  )

  const reportesFiltrados = useMemo(
    () => (dashboard?.misReportes || []).filter((reporte) => cumpleFiltroReporte(reporte, filtroReportes)),
    [dashboard?.misReportes, filtroReportes]
  )

  const actionItems = useMemo(
    () => [
      {
        label: 'Registrar máquina',
        href: '/portal/reportes?abrir=maquina&context=dashboard&from=tecnico',
        tone: 'primary' as const,
      },
      {
        label: 'Crear reporte',
        href: '/portal/reportes?abrir=crear&context=dashboard&from=tecnico',
        tone: 'primary' as const,
      },
      { label: 'Visitas', targetId: 'tec-visitas' },
      { label: 'Actividades internas', targetId: 'tec-actividades' },
      { label: 'Reportes', targetId: 'tec-reportes' },
    ],
    []
  )

  function actualizarComentarioForm(
    visitaId: number,
    campo: keyof ComentarioForm,
    valor: string | File[]
  ) {
    setComentarioForms((prev) => ({
      ...prev,
      [visitaId]: {
        ...obtenerComentarioForm(prev, visitaId),
        [campo]: valor,
      },
    }))
  }

  function actualizarComentarioActividadForm(
    actividadId: number,
    campo: keyof ComentarioActividadForm,
    valor: string
  ) {
    setComentarioActividadForms((prev) => ({
      ...prev,
      [actividadId]: {
        ...obtenerComentarioActividadForm(prev, actividadId),
        [campo]: valor,
      },
    }))
  }

  async function cargarComentarios(visitaId: number) {
    const comentarios = await obtenerComentariosVisita(visitaId)
    setComentariosPorVisita((prev) => ({ ...prev, [visitaId]: comentarios }))
  }

  async function alternarComentarios(visitaId: number) {
    const abrir = !comentariosAbiertos[visitaId]
    setComentariosAbiertos((prev) => ({ ...prev, [visitaId]: abrir }))

    if (abrir && !comentariosPorVisita[visitaId]) {
      try {
        await cargarComentarios(visitaId)
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : 'No se pudieron cargar los comentarios.')
      }
    }
  }

  async function guardarComentario(visita: DashboardVisita) {
    if (!user?.id) return

    const formComentario = obtenerComentarioForm(comentarioForms, visita.id)
    const mensajeLimpio = formComentario.mensaje.trim()
    const asuntoLimpio = formComentario.asunto.trim()

    if (!mensajeLimpio && !formComentario.archivos.length) {
      setError('Debes escribir un comentario o adjuntar una imagen.')
      return
    }

    setError('')
    setMensaje('')

    try {
      setSavingComentarioId(visita.id)
      await crearComentarioVisita(visita.id, {
        usuarioId: user.id,
        actividadId: visita.actividad?.id ?? null,
        tipoMensaje: 'COMENTARIO_TECNICO',
        asunto: asuntoLimpio || undefined,
        mensaje: mensajeLimpio || undefined,
        prioridad: formComentario.prioridad,
        archivos: formComentario.archivos,
      })

      setComentarioForms((prev) => ({ ...prev, [visita.id]: COMENTARIO_FORM_INICIAL }))
      await cargarComentarios(visita.id)
      setMensaje('Comentario agregado correctamente a la visita.')
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'No se pudo guardar el comentario.')
    } finally {
      setSavingComentarioId(null)
    }
  }

  async function guardarComentarioActividad(actividad: DashboardActividad) {
    if (!user?.id) return

    const formComentario = obtenerComentarioActividadForm(comentarioActividadForms, actividad.id)
    const mensajeLimpio = formComentario.mensaje.trim()
    if (!mensajeLimpio) {
      setError('Debes escribir un comentario para la actividad.')
      return
    }

    try {
      await crearMensajeActividad(actividad.id, {
        usuarioId: user.id,
        tipoMensaje: 'COMENTARIO_ACTIVIDAD',
        asunto: formComentario.asunto.trim() || undefined,
        mensaje: mensajeLimpio,
        prioridad: formComentario.prioridad,
      })
      setComentarioActividadForms((prev) => ({ ...prev, [actividad.id]: COMENTARIO_ACTIVIDAD_INICIAL }))
      setMensaje('Comentario agregado correctamente a la actividad.')
      await cargarDashboard()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'No se pudo guardar el comentario de actividad.')
    }
  }

  async function cambiarEstadoPaso(actividad: DashboardActividad, pasoId: number, estadoActual?: string | null) {
    if (!user?.id) return

    const estadoNuevo = normalizarEstado(estadoActual) === 'HECHO' ? 'PENDIENTE' : 'HECHO'

    try {
      setSavingPasoId(pasoId)
      await actualizarPasoActividad(actividad.id, pasoId, {
        estadoPaso: estadoNuevo,
        realizadoPorId: user.id,
      })
      setMensaje('Avance de actividad actualizado.')
      await cargarDashboard()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el paso.')
    } finally {
      setSavingPasoId(null)
    }
  }

  async function marcarVisitaFinalizada(visitaId: number) {
    setError('')
    setMensaje('')

    try {
      setSavingId(visitaId)
      await finalizarVisita(visitaId, {
        motivoEstado: 'Trabajo técnico finalizado desde dashboard',
      })
      setMensaje('Visita marcada como finalizada para revisión.')
      await cargarDashboard()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'No se pudo finalizar la visita.')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="portalShell roleShell">
      <header className="dashboardTopbar dashboardTopbarCompact dashboardTopbarTitleOnly">
        <div>
          <h1>Control de actividades</h1>
        </div>
      </header>

      <main className="dashboardContainer roleDashboardContainer">
        <div className="roleActionRow">
          <RoleActionBar items={actionItems} />
          <button className="powerLogoutButton powerLogoutInline" type="button" onClick={logout}>
            <span className="powerIcon">⏻</span>
            <span>Cerrar sesión</span>
          </button>
        </div>

        <section className="dashboardHero roleHeroCard" id="tec-resumen">
          <div className="dashboardHeroText">
            <h2>Actividades técnicas, visitas y reportes asociados</h2>
            <p>Las visitas y actividades asignadas aparecen aquí como carga operativa real.</p>
          </div>

          <div className="dashboardUserCard">
            <strong>{user?.nombre}</strong>
            <span>{user?.email}</span>
            <div className="userRolePill">{user?.roleLabel}</div>
          </div>
        </section>

        {error && <div className="errorBox">{error}</div>}
        {mensaje && <div className="mensajeSolicitud">{mensaje}</div>}

        {!dashboard && !error && <div className="mensajeSolicitud">Cargando tablero técnico...</div>}

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
          <details className="moduleCard moduleCardFullRow operationAccordion" id="tec-visitas">
            <summary className="operationAccordionHeader">
              <span>
                <strong>Visitas asignadas</strong>
                <small>Trabajos de campo relacionados con cliente, máquina y reporte.</small>
              </span>
              <span>Pendientes</span>
            </summary>

            <div className="operationAccordionBody">
              <div className="filtersRow sectionFiltersRow" aria-label="Filtros de visitas asignadas">
                {filtrosEstado.map((filtro) => (
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

              {visitasFiltradas.length ? (
                <div className="dataList scrollArea scrollAreaWide">
                  {visitasFiltradas.map((visita) => (
                    <article key={visita.id} className="dataListItem dataListItemStack">
                      <div>
                        <strong>{textoVisitaPrincipal(visita)}</strong>
                        <p>{visita.cliente?.nombre || 'Cliente pendiente'} · {textoMaquinaVisita(visita)}</p>
                      </div>
                      <div className="dataTags">
                        <span className="statusPill">{visita.estado || 'PENDIENTE'}</span>
                      </div>
                      <div className="inlineActionRow">
                        <a
                          className="miniActionButton"
                          href={`/portal/reportes?abrir=detalle-visita&context=dashboard&from=tecnico&visitaId=${visita.id}`}
                        >
                          Ver detalle
                        </a>
                        <a
                          className="miniActionButton miniActionPrimary"
                          href={`/portal/reportes?abrir=crear&context=dashboard&from=tecnico&visitaId=${visita.id}`}
                        >
                          Crear reporte
                        </a>
                        <button
                          className="miniActionButton"
                          type="button"
                          disabled={savingId === visita.id || visitaFinalizada(visita)}
                          onClick={() => marcarVisitaFinalizada(visita.id)}
                        >
                          {visitaFinalizada(visita) ? 'Finalizada' : savingId === visita.id ? 'Guardando...' : 'Marcar finalizada'}
                        </button>
                        <button
                          className="miniActionButton"
                          type="button"
                          onClick={() => alternarComentarios(visita.id)}
                        >
                          {comentariosAbiertos[visita.id] ? 'Cerrar comentarios' : 'Comentarios / apoyo'}
                        </button>
                      </div>

                      {comentariosAbiertos[visita.id] && (
                        <div className="activityCommentsPanel">
                          <div className="activityCommentsHeader">
                            <strong>Comentarios internos de la visita</strong>
                            <span>{(comentariosPorVisita[visita.id] || []).length} registro(s)</span>
                          </div>

                          <div className="commentList">
                            {(comentariosPorVisita[visita.id] || []).length ? (
                              comentariosPorVisita[visita.id].map((comentario) => (
                                <article key={comentario.id} className="commentItem">
                                  <div className="commentItemHeader">
                                    <strong>{comentario.asunto || 'Comentario técnico'}</strong>
                                    <span>{comentario.prioridad || 'MEDIA'}</span>
                                  </div>
                                  <p>{comentario.mensaje}</p>
                                  <small>
                                    {comentario.usuario?.nombre || 'Usuario'} · {textoFecha(comentario.createdAt)}
                                  </small>
                                </article>
                              ))
                            ) : (
                              <div className="emptyBlock">Todavía no hay comentarios en esta visita.</div>
                            )}
                          </div>

                          <div className="commentFormGrid">
                            <label className="campo">
                              Asunto
                              <input
                                value={obtenerComentarioForm(comentarioForms, visita.id).asunto}
                                onChange={(e) => actualizarComentarioForm(visita.id, 'asunto', e.target.value)}
                                placeholder="Ej. Solicitud de material"
                              />
                            </label>

                            <label className="campo">
                              Prioridad
                              <select
                                value={obtenerComentarioForm(comentarioForms, visita.id).prioridad}
                                onChange={(e) => actualizarComentarioForm(visita.id, 'prioridad', e.target.value)}
                              >
                                <option value="BAJA">Baja</option>
                                <option value="MEDIA">Media</option>
                                <option value="ALTA">Alta</option>
                                <option value="URGENTE">Urgente</option>
                              </select>
                            </label>

                            <label className="campo campoCompleto">
                              Comentario
                              <textarea
                                rows={3}
                                value={obtenerComentarioForm(comentarioForms, visita.id).mensaje}
                                onChange={(e) => actualizarComentarioForm(visita.id, 'mensaje', e.target.value)}
                                placeholder="Escribe el comentario, solicitud o alerta operativa"
                              />
                            </label>

                            <label className="campo campoCompleto">
                              Evidencia / foto
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(e) => actualizarComentarioForm(visita.id, 'archivos', Array.from(e.target.files || []))}
                              />
                            </label>

                            <div className="formActionsWide campoCompleto">
                              <button
                                className="btnPortalPrincipal"
                                type="button"
                                disabled={savingComentarioId === visita.id}
                                onClick={() => guardarComentario(visita)}
                              >
                                {savingComentarioId === visita.id ? 'Guardando...' : 'Enviar comentario'}
                              </button>
                              <button
                                className="btnPortalSecundario"
                                type="button"
                                onClick={() => setComentarioForms((prev) => ({ ...prev, [visita.id]: COMENTARIO_FORM_INICIAL }))}
                              >
                                Limpiar comentario
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <div className="emptyBlock">No hay visitas para el filtro seleccionado.</div>
              )}
            </div>
          </details>

          <details className="moduleCard moduleCardFullRow operationAccordion" id="tec-actividades">
            <summary className="operationAccordionHeader">
              <span>
                <strong>Actividades internas / taller</strong>
                <small>Tareas asignadas que no necesariamente requieren visita a cliente.</small>
              </span>
              <span>Pendientes</span>
            </summary>

            <div className="operationAccordionBody">
              <div className="filtersRow sectionFiltersRow" aria-label="Filtros de actividades internas">
                {filtrosEstado.map((filtro) => (
                  <button
                    key={filtro.value}
                    type="button"
                    className={`filterChip ${filtroActividades === filtro.value ? 'active' : ''}`}
                    onClick={() => setFiltroActividades(filtro.value)}
                  >
                    {filtro.label}
                  </button>
                ))}
              </div>

              {actividadesFiltradas.length ? (
                <div className="dataList scrollArea scrollAreaWide">
                  {actividadesFiltradas.map((actividad) => {
                    const formActividad = obtenerComentarioActividadForm(comentarioActividadForms, actividad.id)
                    return (
                      <article key={actividad.id} className="dataListItem dataListItemStack">
                        <div className="activityHeaderLine">
                          <div>
                            <strong>{actividad.codigoActividad} · {actividad.titulo}</strong>
                            <p>
                              {actividad.categoriaActividad || 'General'} · {actividad.prioridad || 'MEDIA'} · {textoFecha(actividad.fechaProgramada)}
                            </p>
                          </div>
                          <span className="statusPill">{actividad.estado || 'PENDIENTE'}</span>
                        </div>

                        {actividad.descripcion && <p>{actividad.descripcion}</p>}

                        <div className="progressWrap">
                          <div className="progressMeta">
                            <span>Avance</span>
                            <strong>{actividad.progresoPorcentaje || 0}%</strong>
                          </div>
                          <div className="progressTrack">
                            <div className={`progressFill ${claseProgresoActividad(actividad.progresoPorcentaje)}`} />
                          </div>
                        </div>

                        <div className="activityStepsGrid">
                          {(actividad.pasos || []).length ? (
                            actividad.pasos?.map((paso) => (
                              <button
                                key={paso.id}
                                type="button"
                                className={`activityStepChip ${normalizarEstado(paso.estadoPaso) === 'HECHO' ? 'done' : ''}`}
                                disabled={savingPasoId === paso.id}
                                onClick={() => cambiarEstadoPaso(actividad, paso.id, paso.estadoPaso)}
                              >
                                <span>{normalizarEstado(paso.estadoPaso) === 'HECHO' ? '✓' : '○'}</span>
                                {paso.tituloPaso}
                              </button>
                            ))
                          ) : (
                            <div className="emptyBlock">Esta actividad no tiene subactividades definidas.</div>
                          )}
                        </div>

                        <div className="commentFormGrid">
                          <label className="campo">
                            Asunto
                            <input
                              value={formActividad.asunto}
                              onChange={(e) => actualizarComentarioActividadForm(actividad.id, 'asunto', e.target.value)}
                              placeholder="Ej. avance / apoyo / material"
                            />
                          </label>

                          <label className="campo">
                            Prioridad
                            <select
                              value={formActividad.prioridad}
                              onChange={(e) => actualizarComentarioActividadForm(actividad.id, 'prioridad', e.target.value)}
                            >
                              <option value="BAJA">Baja</option>
                              <option value="MEDIA">Media</option>
                              <option value="ALTA">Alta</option>
                              <option value="URGENTE">Urgente</option>
                            </select>
                          </label>

                          <label className="campo campoCompleto">
                            Comentario de actividad
                            <textarea
                              rows={3}
                              value={formActividad.mensaje}
                              onChange={(e) => actualizarComentarioActividadForm(actividad.id, 'mensaje', e.target.value)}
                              placeholder="Comentario sobre avance, material o bloqueo"
                            />
                          </label>

                          <button
                            type="button"
                            className="btnPortalPrincipal campoCompleto"
                            onClick={() => guardarComentarioActividad(actividad)}
                          >
                            Guardar comentario de actividad
                          </button>
                        </div>
                      </article>
                    )
                  })}
                </div>
              ) : (
                <div className="emptyBlock">No hay actividades internas para el filtro seleccionado.</div>
              )}
            </div>
          </details>

          <details className="moduleCard moduleCardFullRow operationAccordion" id="tec-reportes">
            <summary className="operationAccordionHeader">
              <span>
                <strong>Mis reportes recientes</strong>
                <small>Documentos generados desde trabajos ya ejecutados.</small>
              </span>
              <span>Gestión</span>
            </summary>

            <div className="operationAccordionBody">
              <div className="filtersRow sectionFiltersRow" aria-label="Filtros de reportes">
                {filtrosReportes.map((filtro) => (
                  <button
                    key={filtro.value}
                    type="button"
                    className={`filterChip ${filtroReportes === filtro.value ? 'active' : ''}`}
                    onClick={() => setFiltroReportes(filtro.value)}
                  >
                    {filtro.label}
                  </button>
                ))}
              </div>

              {reportesFiltrados.length ? (
                <div className="dataList">
                  {reportesFiltrados.map((reporte) => (
                    <article key={reporte.id} className="dataListItem">
                      <div>
                        <strong>{reporte.numeroReporte}</strong>
                        <p>{reporte.cliente?.nombre || 'Cliente'} · {textoFecha(reporte.fechaReporte)}</p>
                      </div>
                      <span className="statusPill">{reporte.estado || 'emitido'}</span>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="emptyBlock">No hay reportes para el filtro seleccionado.</div>
              )}
            </div>
          </details>
        </section>
      </main>
    </div>
  )
}
