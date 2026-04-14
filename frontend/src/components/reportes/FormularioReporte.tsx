import type { ClienteOption, MaquinaOption } from '../../types/clientes.types'
import type {
  FormReporte,
  HallazgoOption,
  ProcedimientoOption,
  TecnicoOption,
} from '../../types/reportes.types'

type Props = {
  logoEr: string
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
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  onToggleCategoria: (categoria: string) => void
  onToggleHallazgo: (id: number) => void
  onChangeAnexos: (e: React.ChangeEvent<HTMLInputElement>) => void
  onOpenCliente: () => void
  onOpenMaquina: () => void
  onBack: () => void
  onClear: () => void
  onSave: () => void
}

export default function FormularioReporte({
  logoEr,
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
  onChange,
  onToggleCategoria,
  onToggleHallazgo,
  onChangeAnexos,
  onOpenCliente,
  onOpenMaquina,
  onBack,
  onClear,
  onSave,
}: Props) {
  return (
    <section className="panel">
      <div className="formTopBar">
        <div className="formBrand">
          <img src={logoEr} alt="Logo Expertos en Refrigeración" className="logoMini" />
          <div>
            <h2>Formulario de reporte técnico</h2>
            <p>Base reconstruida conforme al flujo operativo real.</p>
          </div>
        </div>

        <button className="btn btnGhost" onClick={onBack}>
          Volver
        </button>
      </div>

      <div className="bloqueFormulario">
        <h3>1. Datos principales</h3>

        <div className="formGrid">
          <div className="campo">
            <label htmlFor="clienteId">Cliente</label>
            <select
              id="clienteId"
              name="clienteId"
              value={form.clienteId}
              onChange={onChange}
              title="Seleccione un cliente"
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

            <button
              type="button"
              className="miniActionButton miniActionPrimary"
              onClick={onOpenCliente}
            >
              + Agregar cliente
            </button>
          </div>

          <div className="campo">
            <label htmlFor="maquinaId">Máquina a trabajar</label>
            <select
              id="maquinaId"
              name="maquinaId"
              value={form.maquinaId}
              onChange={onChange}
              disabled={!form.clienteId || loadingMaquinas}
              title="Seleccione una máquina"
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
                  {(maq.codigoInterno || 'N/D')} | {maq.modelo || 'N/D'} | {maq.serie || 'N/D'}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="miniActionButton"
              onClick={onOpenMaquina}
              disabled={!form.clienteId}
              title={!form.clienteId ? 'Seleccione primero un cliente' : 'Agregar máquina'}
            >
              + Agregar máquina
            </button>
          </div>

          <div className="campo">
            <label htmlFor="tecnicoId">Técnico</label>
            <select
              id="tecnicoId"
              name="tecnicoId"
              value={form.tecnicoId}
              onChange={onChange}
              title="Seleccione un técnico"
            >
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

      <div className="bloqueFormulario">
        <h3>2. Actividad a realizar</h3>

        <div className="formGrid">
          <div className="campo campoCompleto">
            <label htmlFor="procedimientoId">Procedimiento / actividad</label>
            <select
              id="procedimientoId"
              name="procedimientoId"
              value={form.procedimientoId}
              onChange={onChange}
              title="Seleccione un procedimiento"
            >
              <option value="">Seleccione procedimiento</option>
              {procedimientos.map((proc) => (
                <option key={proc.id} value={proc.id}>
                  {proc.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bloqueFormulario">
        <h3>3. Hallazgos</h3>

        <div className="accordionCategorias">
          {Object.entries(hallazgosAgrupados).map(([categoria, items]) => {
            const abierta = categoriasAbiertas.includes(categoria)

            return (
              <div key={categoria} className="categoriaBox">
                <button
                  type="button"
                  className="categoriaHeader"
                  onClick={() => onToggleCategoria(categoria)}
                >
                  <span>Categoría: {categoria}</span>
                  <span>{abierta ? '−' : '+'}</span>
                </button>

                {abierta && (
                  <div className="categoriaContenido">
                    <div className="checkGrid">
                      {items.map((hallazgo) => {
                        const inputId = `hallazgo-${hallazgo.id}`

                        return (
                          <label key={hallazgo.id} htmlFor={inputId} className="checkCard">
                            <input
                              id={inputId}
                              type="checkbox"
                              checked={hallazgosSeleccionados.includes(hallazgo.id)}
                              onChange={() => onToggleHallazgo(hallazgo.id)}
                            />
                            <div>
                              <p>{hallazgo.descripcion}</p>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="bloqueFormulario">
        <h3>4. Parámetros encontrados</h3>

        <div className="formGrid">
          <div className="campo">
            <label htmlFor="psi">PSI</label>
            <input
              id="psi"
              name="psi"
              value={form.psi}
              onChange={onChange}
              placeholder="Ej. 68"
            />
          </div>

          <div className="campo">
            <label htmlFor="amperaje">Amperaje</label>
            <input
              id="amperaje"
              name="amperaje"
              value={form.amperaje}
              onChange={onChange}
              placeholder="Ej. 12.5"
            />
          </div>
        </div>
      </div>

      <div className="bloqueFormulario">
        <h3>5. Conclusiones</h3>

        <div className="formGrid">
          <div className="campo campoCompleto">
            <label htmlFor="conclusiones">Conclusiones del técnico</label>
            <textarea
              id="conclusiones"
              name="conclusiones"
              value={form.conclusiones}
              onChange={onChange}
              rows={4}
              placeholder="Conclusiones del trabajo realizado"
            />
          </div>
        </div>
      </div>

      <div className="bloqueFormulario">
        <h3>6. Observaciones</h3>

        <div className="formGrid">
          <div className="campo campoCompleto">
            <label htmlFor="observaciones">Observaciones adicionales</label>
            <textarea
              id="observaciones"
              name="observaciones"
              value={form.observaciones}
              onChange={onChange}
              rows={4}
              placeholder="Observaciones adicionales del técnico"
            />
          </div>
        </div>
      </div>

      <div className="bloqueFormulario">
        <h3>7. Evidencias / anexos</h3>

        <div className="formGrid">
          <div className="campo campoCompleto">
            <label htmlFor="anexos">Adjuntar archivos</label>
            <input id="anexos" type="file" multiple onChange={onChangeAnexos} />
            <small className="textoAuxiliar">
              Aquí irán fotos, PDF, documentos u otros archivos de evidencia.
            </small>

            {!!anexos.length && (
              <ul className="listaArchivos">
                {anexos.map((archivo, index) => (
                  <li key={`${archivo.name}-${index}`}>{archivo.name}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="barraAcciones">
        <button className="btn btnGhost" onClick={onBack}>
          Volver al inicio
        </button>

        <button className="btn btnSecundario" onClick={onClear}>
          Limpiar formulario
        </button>

        <button className="btn btnPrimario" onClick={onSave}>
          Guardar reporte
        </button>
      </div>
    </section>
  )
}