import type { ChangeEvent } from 'react'
import type { ClienteOption, MaquinaOption } from '../../types/clientes.types'
import type {
  FormReporte,
  HallazgoOption,
  ProcedimientoOption,
  TecnicoOption,
} from '../../types/reportes.types'

type VisitaReporteOption = {
  id: number
  numeroVisita?: string | null
  clienteId: number
  tecnicoId: number
  estado?: string | null
  fechaVisita?: string | null
  cliente?: { nombre?: string | null } | null
  tecnico?: { nombre?: string | null } | null
  maquinas?: Array<{
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
}

type Props = {
  form: FormReporte
  clientes: ClienteOption[]
  maquinasCliente: MaquinaOption[]
  tecnicos: TecnicoOption[]
  procedimientos: ProcedimientoOption[]
  hallazgosAgrupados: Record<string, HallazgoOption[]>
  visitasReporte?: VisitaReporteOption[]
  usuarioActual?: { id?: number; nombre?: string; email?: string | null } | null
  loadingVisitasReporte?: boolean
  modoLibreReporte?: boolean
  hallazgosSeleccionados: number[]
  categoriasAbiertas: string[]
  anexos: File[]
  loadingClientes: boolean
  loadingMaquinas: boolean
  loadingCatalogos?: boolean
  saving?: boolean
  canOpenCliente?: boolean
  onChange: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void
  onToggleCategoria: (categoria: string) => void
  onToggleHallazgo: (id: number) => void
  onChangeAnexos: (e: ChangeEvent<HTMLInputElement>) => void
  onOpenCliente: () => void
  onOpenMaquina: () => void
  onBack: () => void
  onClear: () => void
  onSave: () => void
  backLabel?: string
  showMenuButton?: boolean
  onGoMenu?: () => void
}

function textoVisita(visita: VisitaReporteOption) {
  const numero = visita.numeroVisita || `Visita #${visita.id}`
  const cliente = visita.cliente?.nombre || `Cliente #${visita.clienteId}`
  const estado = visita.estado || 'PENDIENTE'
  return `${numero} · ${cliente} · ${estado}`
}

function textoMaquina(maq: MaquinaOption) {
  if (maq.codigoInterno && String(maq.codigoInterno).trim()) return maq.codigoInterno

  const partes = [maq.modelo, maq.serie].filter(
    (valor) => valor && String(valor).trim() !== ''
  )

  return partes.length ? partes.join(' | ') : `Máquina ${maq.id}`
}

export default function FormularioReporte({
  form,
  clientes,
  maquinasCliente,
  tecnicos,
  procedimientos,
  hallazgosAgrupados,
  visitasReporte = [],
  usuarioActual = null,
  loadingVisitasReporte = false,
  modoLibreReporte = false,
  hallazgosSeleccionados,
  categoriasAbiertas,
  anexos,
  loadingClientes,
  loadingMaquinas,
  loadingCatalogos = false,
  saving = false,
  canOpenCliente = false,
  onChange,
  onToggleCategoria,
  onToggleHallazgo,
  onChangeAnexos,
  onOpenCliente,
  onOpenMaquina,
  onBack,
  onClear,
  onSave,
  backLabel = 'Regresar',
  showMenuButton = false,
  onGoMenu,
}: Props) {
  const contextoBloqueadoPorVisita = Boolean(form.visitaId && form.visitaId !== 'LIBRE')
  const visitaSeleccionada = visitasReporte.find((visita) => String(visita.id) === form.visitaId)
  const tecnicoActualEnLista = tecnicos.some((tecnico) => String(tecnico.id) === String(form.tecnicoId))
  const tecnicoDelLogin = usuarioActual?.id && String(usuarioActual.id) === String(form.tecnicoId)
  const tecnicoAsignadoTexto =
    (tecnicoDelLogin ? usuarioActual?.nombre : '') ||
    visitaSeleccionada?.tecnico?.nombre ||
    (form.tecnicoId ? `Usuario #${form.tecnicoId}` : 'Usuario actual')
  const tecnicoBloqueadoPorLogin = Boolean(form.tecnicoId)

  return (
    <section className="panel compactFormPanel compactFormPanelResponsive">
      <div className="bloqueFormulario compactOnlyFormBlock">
        <div className="sectionHeaderSplit">
          <div>
            <h3>1. Contexto del reporte</h3>
          </div>
        </div>

        <div className="formGrid">
          <div className="campo campoCompleto reportVisitSelector">
            <label htmlFor="visitaId">Visita relacionada</label>
            <select
              id="visitaId"
              name="visitaId"
              value={form.visitaId}
              onChange={onChange}
              disabled={loadingVisitasReporte}
            >
              <option value="">
                {loadingVisitasReporte ? 'Cargando visitas asignadas...' : 'Seleccione una visita asignada'}
              </option>
              <option value="LIBRE">Modo libre / sin visita previa</option>
              {visitasReporte.map((visita) => (
                <option key={visita.id} value={visita.id}>
                  {textoVisita(visita)}
                </option>
              ))}
            </select>
            <p className="formFieldHint">
              {modoLibreReporte
                ? 'Modo libre activo: selecciona cliente y máquina manualmente; el sistema creará la visita libre al guardar el reporte.'
                : 'El técnico solo debe usar visitas asignadas a su usuario. Usa modo libre solo para emergencias o visitas sin asignación previa.'}
            </p>
          </div>

          <div className="campo">
            <label htmlFor="clienteId">Cliente</label>
            <select
              id="clienteId"
              name="clienteId"
              value={form.clienteId}
              onChange={onChange}
              disabled={contextoBloqueadoPorVisita}
            >
              <option value="">
                {loadingClientes ? 'Cargando clientes...' : 'Seleccione cliente'}
              </option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombre}
                </option>
              ))}
            </select>
            {canOpenCliente ? (
              <button
                type="button"
                className="miniActionButton miniActionPrimary"
                onClick={onOpenCliente}
              >
                + Agregar cliente
              </button>
            ) : null}
          </div>

          <div className="campo">
            <label htmlFor="maquinaId">Máquina a trabajar</label>
            <select
              id="maquinaId"
              name="maquinaId"
              value={form.maquinaId}
              onChange={onChange}
              disabled={!form.clienteId || loadingMaquinas}
            >
              <option value="">
                {!form.clienteId
                  ? 'Seleccione primero un cliente'
                  : loadingMaquinas
                    ? 'Cargando máquinas...'
                    : maquinasCliente.length
                      ? 'Seleccione máquina'
                      : 'Este cliente no tiene máquinas registradas'}
              </option>

              {maquinasCliente.map((maq) => (
                <option key={maq.id} value={maq.id}>
                  {textoMaquina(maq)}
                </option>
              ))}
            </select>

            <button
              type="button"
              className={`miniActionButton ${form.clienteId ? 'miniActionPrimary' : 'miniActionSecondary'}`}
              onClick={onOpenMaquina}
            >
              + Agregar máquina
            </button>
          </div>

          <div className="campo">
            <label htmlFor="tecnicoId">Técnico / usuario que genera el reporte</label>
            <select
              id="tecnicoId"
              name="tecnicoId"
              value={form.tecnicoId}
              onChange={onChange}
              disabled={tecnicoBloqueadoPorLogin}
            >
              <option value="">Usuario no identificado</option>
              {form.tecnicoId && (!tecnicoActualEnLista || tecnicoDelLogin) && (
                <option value={form.tecnicoId}>{tecnicoAsignadoTexto}</option>
              )}
              {tecnicos.map((tecnico) => (
                <option key={tecnico.id} value={tecnico.id}>
                  {tecnico.nombre}
                </option>
              ))}
            </select>
            <p className="formFieldHint">
              Este dato se toma del login actual y queda bloqueado para mantener la trazabilidad del reporte.
              {contextoBloqueadoPorVisita ? ' La visita solo aporta cliente y máquina relacionada.' : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="bloqueFormulario compactOnlyFormBlock">
        <div className="sectionHeaderSplit">
          <div>
            <h3>2. Actividad y parámetros</h3>
          </div>
        </div>

        <div className="formGrid">
          <div className="campo campoCompleto">
            <label htmlFor="procedimientoId">Actividad / procedimiento</label>
            <select
              id="procedimientoId"
              name="procedimientoId"
              value={form.procedimientoId}
              onChange={onChange}
              disabled={loadingCatalogos}
            >
              <option value="">
                {loadingCatalogos ? 'Cargando actividades...' : 'Seleccione actividad'}
              </option>
              {procedimientos.map((procedimiento) => (
                <option key={procedimiento.id} value={procedimiento.id}>
                  {procedimiento.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="campo">
            <label htmlFor="psi">PSI</label>
            <input
              id="psi"
              name="psi"
              value={form.psi}
              onChange={onChange}
              placeholder="Ej. 65"
            />
          </div>

          <div className="campo">
            <label htmlFor="amperaje">Amperaje</label>
            <input
              id="amperaje"
              name="amperaje"
              value={form.amperaje}
              onChange={onChange}
              placeholder="Ej. 3.5"
            />
          </div>
        </div>
      </div>

      <div className="bloqueFormulario compactOnlyFormBlock reportStepBlock">
        <div className="sectionHeaderSplit reportStepHeader">
          <div>
            <span className="sectionCaption">Checklist técnico</span>
            <h3>3. Hallazgos</h3>
            <p className="sectionMiniHelp">
              Abre una categoría y marca los hallazgos que aplican al trabajo realizado.
            </p>
          </div>
          <span className="hallazgoCountPill">
            {hallazgosSeleccionados.length} seleccionado(s)
          </span>
        </div>

        {Object.keys(hallazgosAgrupados).length === 0 ? (
          <p className="textoAyuda emptyBlock">No hay hallazgos disponibles.</p>
        ) : (
          <div className="hallazgosWrap">
            {Object.entries(hallazgosAgrupados).map(([categoria, hallazgos]) => {
              const abierta = categoriasAbiertas.includes(categoria)
              const totalSeleccionados = hallazgos.filter((hallazgo) =>
                hallazgosSeleccionados.includes(hallazgo.id)
              ).length

              return (
                <div key={categoria} className="hallazgoCategoriaCard">
                  <button
                    type="button"
                    className={`hallazgoCategoriaHeader ${abierta ? 'isOpen' : ''}`}
                    onClick={() => onToggleCategoria(categoria)}
                    title={abierta ? 'Cerrar categoría de hallazgos' : 'Abrir categoría de hallazgos'}
                  >
                    <span className="hallazgoCategoriaTitulo">{categoria}</span>
                    <span className="hallazgoCategoriaMeta">
                      {totalSeleccionados}/{hallazgos.length} · {abierta ? 'Cerrar' : 'Abrir'}
                    </span>
                  </button>

                  {abierta && (
                    <div className="hallazgoCategoriaBody">
                      {hallazgos.map((hallazgo) => {
                        const activo = hallazgosSeleccionados.includes(hallazgo.id)

                        return (
                          <label
                            key={hallazgo.id}
                            className={activo ? 'hallazgoCheck hallazgoCheckActive' : 'hallazgoCheck'}
                          >
                            <input
                              type="checkbox"
                              checked={activo}
                              onChange={() => onToggleHallazgo(hallazgo.id)}
                            />
                            <span>
                              <strong>{hallazgo.codigo}</strong> - {hallazgo.descripcion}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="bloqueFormulario compactOnlyFormBlock">
        <div className="sectionHeaderSplit">
          <div>
            <span className="sectionCaption">Evidencia</span>
            <h3>4. Observaciones, conclusiones y anexos</h3>
          </div>
        </div>

        <div className="formGrid">
          <div className="campo campoCompleto">
            <label htmlFor="conclusiones">Conclusiones técnicas</label>
            <textarea
              id="conclusiones"
              name="conclusiones"
              value={form.conclusiones}
              onChange={onChange}
              rows={4}
              placeholder="Escribe la conclusión técnica del trabajo realizado, estado final y recomendaciones principales"
            />
          </div>

          <div className="campo campoCompleto">
            <label htmlFor="observaciones">Observaciones del servicio</label>
            <textarea
              id="observaciones"
              name="observaciones"
              value={form.observaciones}
              onChange={onChange}
              rows={4}
              placeholder="Describe observaciones relevantes del servicio"
            />
          </div>

          <div className="campo campoCompleto evidenceFileField">
            <label htmlFor="anexos">Anexos</label>
            <div className="fileUploadBox">
              <input
                id="anexos"
                className="fileUploadInput"
                type="file"
                multiple
                onChange={onChangeAnexos}
              />
              <p className="fileUploadHint">
                {anexos.length
                  ? `${anexos.length} archivo(s) seleccionados.`
                  : 'Puedes adjuntar fotos o documentos de apoyo.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="barraAcciones barraAccionesResponsive">
        <button className="btn btnGhost" onClick={onBack} type="button">
          {backLabel}
        </button>
        <button className="btn btnSecundario" onClick={onClear} type="button">
          Limpiar reporte
        </button>
        {showMenuButton && onGoMenu && (
          <button className="btn btnGhost" onClick={onGoMenu} type="button">
            Volver al panel
          </button>
        )}
        <button className="btn btnPrimario" onClick={onSave} disabled={saving} type="button">
          {saving ? 'Guardando reporte...' : 'Guardar reporte'}
        </button>
      </div>
    </section>
  )
}