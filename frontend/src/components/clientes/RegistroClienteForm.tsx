import type { ChangeEvent } from 'react'
import type { CatalogoItem } from '../../types/catalogos.types'
import type { FormCliente } from '../../types/clientes.types'

type Props = {
  formCliente: FormCliente
  guardandoCliente: boolean
  loadingCatalogos: boolean
  departamentos: CatalogoItem[]
  ciudades: CatalogoItem[]
  onChange: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void
  onBack: () => void
  onClear: () => void
  onSave: () => void
  backLabel?: string
}

export default function RegistroClienteForm({
  formCliente,
  guardandoCliente,
  loadingCatalogos,
  departamentos,
  ciudades,
  onChange,
  onBack,
  onClear,
  onSave,
  backLabel = 'Regresar',
}: Props) {
  return (
    <section className="panel compactFormPanel">
      <div className="compactFormHeader">
        <span className="sectionCaption">Catálogo base</span>
        <h2>Registro de cliente</h2>
        <p className="textoIntroCompacto">
          Crea el cliente una sola vez y úsalo después en máquinas, visitas y reportes.
        </p>
      </div>

      <div className="bloqueFormulario compactOnlyFormBlock">
        <h3>Datos generales</h3>
        <p className="subtleFormText">
          Completa primero la información principal del cliente. Los campos marcados con <span className="requiredDot">*</span> son obligatorios.
        </p>

        <div className="formGrid">
          <div className="campo">
            <label htmlFor="clienteNombre">
              Nombre del cliente <span className="requiredDot">*</span>
            </label>
            <input
              id="clienteNombre"
              name="nombre"
              value={formCliente.nombre}
              onChange={onChange}
              placeholder="Nombre del cliente o empresa"
            />
          </div>

          <div className="campo">
            <label htmlFor="clienteRtn">RTN</label>
            <input
              id="clienteRtn"
              name="rtn"
              value={formCliente.rtn}
              onChange={onChange}
              placeholder="RTN del cliente"
            />
          </div>

          <div className="campo">
            <label htmlFor="clienteContacto">Nombre de contacto</label>
            <input
              id="clienteContacto"
              name="contactoNombre"
              value={formCliente.contactoNombre}
              onChange={onChange}
              placeholder="Persona de contacto"
            />
          </div>

          <div className="campo">
            <label htmlFor="clienteTelefono">Teléfono</label>
            <input
              id="clienteTelefono"
              name="telefono"
              value={formCliente.telefono}
              onChange={onChange}
              placeholder="Teléfono"
            />
          </div>

          <div className="campo">
            <label htmlFor="clienteCorreo">Correo</label>
            <input
              id="clienteCorreo"
              name="correo"
              type="email"
              value={formCliente.correo}
              onChange={onChange}
              placeholder="Correo electrónico"
            />
          </div>

          <div className="campo">
            <label htmlFor="clienteDepartamentoId">
              Departamento <span className="requiredDot">*</span>
            </label>
            <select
              id="clienteDepartamentoId"
              name="departamentoId"
              value={formCliente.departamentoId}
              onChange={onChange}
              disabled={loadingCatalogos}
            >
              <option value="">
                {loadingCatalogos ? 'Cargando departamentos...' : 'Seleccione departamento'}
              </option>
              {departamentos.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="campo">
            <label htmlFor="clienteCiudadId">
              Ciudad <span className="requiredDot">*</span>
            </label>
            <select
              id="clienteCiudadId"
              name="ciudadId"
              value={formCliente.ciudadId}
              onChange={onChange}
              disabled={!formCliente.departamentoId}
            >
              <option value="">
                {!formCliente.departamentoId
                  ? 'Seleccione primero departamento'
                  : 'Seleccione ciudad'}
              </option>
              {ciudades.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="campo campoCompleto">
            <label htmlFor="clienteDireccion">Dirección</label>
            <textarea
              id="clienteDireccion"
              name="direccion"
              value={formCliente.direccion}
              onChange={onChange}
              rows={4}
              placeholder="Dirección del cliente"
            />
          </div>
        </div>
      </div>

      <div className="barraAcciones">
        <button className="btn btnGhost" onClick={onBack} type="button">
          {backLabel}
        </button>
        <button className="btn btnSecundario" onClick={onClear} type="button">
          Limpiar cliente
        </button>
        <button className="btn btnPrimario" onClick={onSave} disabled={guardandoCliente} type="button">
          {guardandoCliente ? 'Guardando cliente...' : 'Guardar cliente'}
        </button>
      </div>
    </section>
  )
}

