import type { ChangeEvent } from 'react'
import type { ClienteOption, MaquinaOption } from '../../types/clientes.types'
import type {
  FormReporte,
  HallazgoOption,
  ProcedimientoOption,
  TecnicoOption,
} from '../../types/reportes.types'

type Props = {
  form: FormReporte
  clientes: ClienteOption[]
  maquinasCliente: MaquinaOption[]
  tecnicos: TecnicoOption[]
  procedimientos: ProcedimientoOption[]
  hallazgosAgrupados: Record<string, HallazgoOption[]>
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
  return (
    <section className="panel compactFormPanel compactFormPanelResponsive">
      <div className="bloqueFormulario compactOnlyFormBlock">
        <div className="sectionHeaderSplit">
          <div>
            <span className="sectionCaption">Flujo operativo</span>
            <h3>1. Contexto del reporte</h3>
          </div>
          <p className="sectionMiniHelp">
            El técnico trabaja sobre clientes ya existentes. Si falta uno nuevo, debe solicitarlo al supervisor.
          </p>
        </div>

        <div className="formGrid">
          <div className="campo">
            <label htmlFor="visitaId">Visita relacionada</label>
            <input
              id="visitaId"
              name="visitaId"
              value={form.visitaId}
              onChange={onChange}
              placeholder="Ej. 12"
            />
            <p className="textoAyuda">
              Usa la visita ya creada o el correlativo operativo correspondiente.
            </p>
          </div>

          <div className="campo">
            <label htmlFor="clienteId">Cliente</label>
            <select id="clienteId" name="clienteId" value={form.clienteId} onChange={onChange}>
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
            ) : (
              <p className="textoAyuda">
                Si el cliente no existe en la lista, notifícalo al supervisor antes de continuar.
              </p>
            )}
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
            <p className="textoAyuda">
              {form.clienteId
                ? 'Si la máquina aún no existe, puedes crearla y volver al reporte con el cliente seleccionado.'
                : 'Si todavía no elegiste cliente, este botón abrirá el formulario de máquina con selector de cliente.'}
            </p>
          </div>

          <div className="campo">
            <label htmlFor="tecnicoId">Técnico</label>
            <select id="tecnicoId" name="tecnicoId" value={form.tecnicoId} onChange={onChange}>
              <option value="">Seleccione técnico</option>
              {tecnicos.map((tecnico) => (
                <option key={tecnico.id} value={tecnico.id}>
                  {tecnico.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bloqueFormulario compactOnlyFormBlock">
        <div className="sectionHeaderSplit">
          <div>
            <span className="sectionCaption">Datos técnicos</span>
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

      <div className="bloqueFormulario compactOnlyFormBlock">
        <div className="sectionHeaderSplit">
          <div>
            <span className="sectionCaption">Checklist técnico</span>
            <h3>3. Hallazgos</h3>
          </div>
        </div>

        {Object.keys(hallazgosAgrupados).length === 0 ? (
          <p className="textoAyuda">No hay hallazgos disponibles.</p>
        ) : (
          <div className="hallazgosWrap">
            {Object.entries(hallazgosAgrupados).map(([categoria, hallazgos]) => {
              const abierta = categoriasAbiertas.includes(categoria)

              return (
                <div key={categoria} className="hallazgoCategoriaCard">
                  <button
                    type="button"
                    className="hallazgoCategoriaHeader"
                    onClick={() => onToggleCategoria(categoria)}
                  >
                    <span>{categoria}</span>
                    <span>{abierta ? '−' : '+'}</span>
                  </button>

                  {abierta && (
                    <div className="hallazgoCategoriaBody">
                      {hallazgos.map((hallazgo) => (
                        <label key={hallazgo.id} className="hallazgoCheck">
                          <input
                            type="checkbox"
                            checked={hallazgosSeleccionados.includes(hallazgo.id)}
                            onChange={() => onToggleHallazgo(hallazgo.id)}
                          />
                          <span>
                            <strong>{hallazgo.codigo}</strong> - {hallazgo.descripcion}
                          </span>
                        </label>
                      ))}
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
            <h3>4. Observaciones y anexos</h3>
          </div>
        </div>

        <div className="formGrid">
          <div className="campo campoCompleto">
            <label htmlFor="observaciones">Observaciones</label>
            <textarea
              id="observaciones"
              name="observaciones"
              value={form.observaciones}
              onChange={onChange}
              rows={4}
              placeholder="Describe observaciones relevantes del servicio"
            />
          </div>

          <div className="campo campoCompleto">
            <label htmlFor="anexos">Anexos</label>
            <input id="anexos" type="file" multiple onChange={onChangeAnexos} />
            <p className="textoAyuda">
              {anexos.length ? `${anexos.length} archivo(s) seleccionados.` : 'Puedes adjuntar fotos o documentos de apoyo.'}
            </p>
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
