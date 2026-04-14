import type { CatalogoItem } from '../../types/catalogos.types'
import type { FormMaquina } from '../../types/maquinas.types'

type Props = {
  logoEr: string
  formMaquina: FormMaquina
  loadingCatalogos: boolean
  guardandoMaquina: boolean
  clienteSeleccionadoNombre: string
  tiposUnidad: CatalogoItem[]
  marcasCatalogo: CatalogoItem[]
  refrigerantesCatalogo: CatalogoItem[]
  unidadesMedidaCarga: CatalogoItem[]
  departamentos: CatalogoItem[]
  ciudades: CatalogoItem[]
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  onBack: () => void
  onClear: () => void
  onSave: () => void
}

function textoRefrigerante(item: CatalogoItem) {
  const codigo = (item.codigo || '').trim()
  const nombre = (item.nombre || '').trim()

  if (codigo && nombre && codigo.toUpperCase() === nombre.toUpperCase()) {
    return codigo
  }

  if (codigo && nombre) {
    return `${codigo} - ${nombre}`
  }

  return codigo || nombre || 'N/D'
}

export default function RegistroMaquinaForm({
  logoEr,
  formMaquina,
  loadingCatalogos,
  guardandoMaquina,
  clienteSeleccionadoNombre,
  tiposUnidad,
  marcasCatalogo,
  refrigerantesCatalogo,
  unidadesMedidaCarga,
  departamentos,
  ciudades,
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
            <h2>Registrar máquina</h2>
            <p>Los campos con catálogo se llenan desde catálogo, no libremente.</p>
          </div>
        </div>

        <button className="btn btnGhost" onClick={onBack}>
          Volver al reporte
        </button>
      </div>

      <div className="secuenciaInfoBox">
        <strong>Cliente seleccionado:</strong> {clienteSeleccionadoNombre || 'N/D'}
      </div>

      <div className="bloqueFormulario">
        <h3>Datos de la máquina</h3>

        <div className="formGrid">
          <div className="campo">
            <label htmlFor="maqCodigoInternoAuto">Código interno</label>
            <input
              id="maqCodigoInternoAuto"
              value="Se genera automáticamente"
              disabled
              readOnly
              aria-label="Código interno generado automáticamente"
            />
          </div>

          <div className="campo">
            <label htmlFor="maqTipoUnidadId">Tipo de unidad *</label>
            <select
              id="maqTipoUnidadId"
              name="tipoUnidadId"
              value={formMaquina.tipoUnidadId}
              onChange={onChange}
              disabled={loadingCatalogos}
            >
              <option value="">
                {loadingCatalogos ? 'Cargando tipos...' : 'Seleccione tipo de unidad'}
              </option>
              {tiposUnidad.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="campo">
            <label htmlFor="maqMarcaId">Marca *</label>
            <select
              id="maqMarcaId"
              name="marcaId"
              value={formMaquina.marcaId}
              onChange={onChange}
              disabled={loadingCatalogos}
            >
              <option value="">
                {loadingCatalogos ? 'Cargando marcas...' : 'Seleccione marca'}
              </option>
              {marcasCatalogo.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="campo">
            <label htmlFor="maqModelo">Modelo</label>
            <input
              id="maqModelo"
              name="modelo"
              value={formMaquina.modelo}
              onChange={onChange}
              placeholder="Modelo"
            />
          </div>

          <div className="campo">
            <label htmlFor="maqSerie">Serie</label>
            <input
              id="maqSerie"
              name="serie"
              value={formMaquina.serie}
              onChange={onChange}
              placeholder="Serie"
            />
          </div>

          <div className="campo">
            <label htmlFor="maqRefrigeranteId">Refrigerante *</label>
            <select
              id="maqRefrigeranteId"
              name="refrigeranteId"
              value={formMaquina.refrigeranteId}
              onChange={onChange}
              disabled={loadingCatalogos}
            >
              <option value="">
                {loadingCatalogos ? 'Cargando refrigerantes...' : 'Seleccione refrigerante'}
              </option>
              {refrigerantesCatalogo.map((item) => (
                <option key={item.id} value={item.id}>
                  {textoRefrigerante(item)}
                </option>
              ))}
            </select>
          </div>

          <div className="campo">
            <label htmlFor="maqUnidadMedidaCargaId">Unidad de carga</label>
            <select
              id="maqUnidadMedidaCargaId"
              name="unidadMedidaCargaId"
              value={formMaquina.unidadMedidaCargaId}
              onChange={onChange}
              disabled={loadingCatalogos}
            >
              <option value="">
                {loadingCatalogos ? 'Cargando unidades...' : 'Seleccione unidad'}
              </option>
              {unidadesMedidaCarga.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.codigo ? `${item.codigo} - ${item.nombre}` : item.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="campo">
            <label htmlFor="maqCargaCantidad">Carga de refrigerante</label>
            <input
              id="maqCargaCantidad"
              name="cargaRefrigeranteCantidad"
              value={formMaquina.cargaRefrigeranteCantidad}
              onChange={onChange}
              placeholder="Ej. 2.5"
            />
          </div>

          <div className="campo">
            <label htmlFor="maqDepartamentoId">Departamento *</label>
            <select
              id="maqDepartamentoId"
              name="departamentoId"
              value={formMaquina.departamentoId}
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
            <label htmlFor="maqCiudadId">Ciudad *</label>
            <select
              id="maqCiudadId"
              name="ciudadId"
              value={formMaquina.ciudadId}
              onChange={onChange}
              disabled={!formMaquina.departamentoId}
            >
              <option value="">
                {!formMaquina.departamentoId
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

          <div className="campo">
            <label htmlFor="maqDireccionExacta">Dirección exacta</label>
            <input
              id="maqDireccionExacta"
              name="direccionExacta"
              value={formMaquina.direccionExacta}
              onChange={onChange}
              placeholder="Dirección exacta"
            />
          </div>

          <div className="campo">
            <label htmlFor="maqArea">Área interna</label>
            <input
              id="maqArea"
              name="area"
              value={formMaquina.area}
              onChange={onChange}
              placeholder="Ej. Área de empaque"
            />
          </div>

          <div className="campo campoCompleto">
            <label htmlFor="maqObservaciones">Observaciones</label>
            <textarea
              id="maqObservaciones"
              name="observaciones"
              value={formMaquina.observaciones}
              onChange={onChange}
              rows={4}
              placeholder="Observaciones de la máquina"
            />
          </div>
        </div>
      </div>

      <div className="barraAcciones">
        <button className="btn btnGhost" onClick={onBack}>
          Cancelar
        </button>

        <button className="btn btnSecundario" onClick={onClear}>
          Limpiar máquina
        </button>

        <button className="btn btnPrimario" onClick={onSave} disabled={guardandoMaquina}>
          {guardandoMaquina ? 'Guardando máquina...' : 'Guardar máquina'}
        </button>
      </div>
    </section>
  )
}
