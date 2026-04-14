import type { FormCliente } from '../../types/clientes.types'

type Props = {
  logoEr: string
  formCliente: FormCliente
  guardandoCliente: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onBack: () => void
  onClear: () => void
  onSave: () => void
}

export default function RegistroClienteForm({
  logoEr,
  formCliente,
  guardandoCliente,
  onChange,
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
            <h2>Registrar cliente</h2>
            <p>Primero cliente; después seguiremos con máquina.</p>
          </div>
        </div>

        <button className="btn btnGhost" onClick={onBack}>
          Volver al reporte
        </button>
      </div>

      <div className="secuenciaInfoBox">
        <strong>Secuencia actual:</strong> Registrar cliente → volver al reporte → luego registrar máquina.
      </div>

      <div className="bloqueFormulario">
        <h3>Datos del cliente</h3>

        <div className="formGrid">
          <div className="campo">
            <label htmlFor="clienteNombre">Nombre del cliente *</label>
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
              value={formCliente.correo}
              onChange={onChange}
              placeholder="Correo electrónico"
            />
          </div>

          <div className="campo">
            <label htmlFor="clienteUbicacion">Ubicación</label>
            <input
              id="clienteUbicacion"
              name="ubicacion"
              value={formCliente.ubicacion}
              onChange={onChange}
              placeholder="Ciudad / departamento"
            />
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
        <button className="btn btnGhost" onClick={onBack}>
          Cancelar
        </button>

        <button className="btn btnSecundario" onClick={onClear}>
          Limpiar cliente
        </button>

        <button className="btn btnPrimario" onClick={onSave} disabled={guardandoCliente}>
          {guardandoCliente ? 'Guardando cliente...' : 'Guardar cliente'}
        </button>
      </div>
    </section>
  )
}
