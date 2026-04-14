import type { DetalleMaquina, ReporteResponse } from '../../types/reportes.types'

type Props = {
  logoEr: string
  reporte: ReporteResponse['data'] | null
  detalle: DetalleMaquina | undefined
  loading: boolean
  error: string
  onBack: () => void
  onWhatsApp: () => void
  onCorreo: () => void
}

export default function DetalleReporte({
  logoEr,
  reporte,
  detalle,
  loading,
  error,
  onBack,
  onWhatsApp,
  onCorreo,
}: Props) {
  if (loading) return <section className="panel">Cargando reporte...</section>
  if (error) return <section className="panel errorBox">{error}</section>
  if (!reporte) return <section className="panel errorBox">No hay datos del reporte.</section>

  return (
    <>
      <section className="panel">
        <div className="formTopBar">
          <div className="formBrand">
            <img src={logoEr} alt="Logo Expertos en Refrigeración" className="logoMini" />
            <div>
              <h2>Reporte Técnico #{reporte.numeroReporte}</h2>
              <p>Vista detalle conectada al backend local.</p>
            </div>
          </div>

          <button className="btn btnGhost" onClick={onBack}>
            Volver
          </button>
        </div>
      </section>

      <section className="panel">
        <h3>Datos generales</h3>
        <div className="infoGrid">
          <div><strong>Cliente:</strong> {reporte.cliente?.nombre || 'N/D'}</div>
          <div><strong>Técnico:</strong> {reporte.tecnico?.nombre || 'N/D'}</div>
          <div><strong>Fecha:</strong> {reporte.fechaReporte || 'N/D'}</div>
          <div><strong>PDF:</strong> {reporte.urlPdfLocal || 'N/D'}</div>
        </div>
      </section>

      <section className="panel">
        <h3>Unidad / equipo</h3>
        <div className="infoGrid">
          <div><strong>Código interno:</strong> {reporte.maquina?.codigoInterno || 'N/D'}</div>
          <div><strong>Marca:</strong> {reporte.maquina?.marca || 'N/D'}</div>
          <div><strong>Modelo:</strong> {reporte.maquina?.modelo || 'N/D'}</div>
          <div><strong>Serie:</strong> {reporte.maquina?.serie || 'N/D'}</div>
          <div><strong>Tipo unidad:</strong> {reporte.tipoUnidad?.nombre || 'N/D'}</div>
          <div><strong>Área:</strong> {reporte.maquina?.area || 'N/D'}</div>
        </div>
      </section>

      <section className="panel">
        <h3>Procedimiento</h3>
        <p><strong>Actividad:</strong> {detalle?.tituloActividad || 'N/D'}</p>
        <p>{detalle?.descripcionActividadPdf || 'N/D'}</p>
      </section>

      <section className="panel">
        <h3>Hallazgos</h3>
        {detalle?.hallazgos?.length ? (
          <ul className="listaHallazgos">
            {detalle.hallazgos.map((hallazgo) => (
              <li key={hallazgo.id}>
                <strong>
                  {hallazgo.codigoHallazgo || hallazgo.hallazgoCatalogo?.codigo || 'SIN-COD'}
                </strong>
                {' - '}
                {hallazgo.descripcionHallazgo || hallazgo.hallazgoCatalogo?.descripcion || 'Sin descripción'}
              </li>
            ))}
          </ul>
        ) : (
          <p>No se registraron hallazgos.</p>
        )}
      </section>

      <section className="panel">
        <h3>Conclusiones y observaciones</h3>
        <div className="infoGrid">
          <div className="fullRow"><strong>Conclusiones:</strong> {reporte.conclusiones || 'N/D'}</div>
          <div className="fullRow"><strong>Observaciones:</strong> {reporte.observaciones || 'N/D'}</div>
          <div className="fullRow"><strong>Diagnóstico:</strong> {detalle?.diagnostico || 'N/D'}</div>
          <div className="fullRow"><strong>Trabajo realizado:</strong> {detalle?.trabajoRealizado || 'N/D'}</div>
          <div className="fullRow"><strong>Recomendaciones:</strong> {detalle?.recomendaciones || 'N/D'}</div>
        </div>
      </section>

      <section className="panel">
        <h3>Recepción del cliente</h3>
        {reporte.cierre ? (
          <div className="infoGrid">
            <div><strong>Recibe:</strong> {reporte.cierre.nombreRecibe || 'N/D'}</div>
            <div><strong>Puesto:</strong> {reporte.cierre.puestoRecibe || 'N/D'}</div>
            <div><strong>Fecha cierre:</strong> {reporte.cierre.fechaCierre || 'N/D'}</div>
            <div><strong>Motivo no recepción:</strong> {reporte.cierre.motivoNoRecepcion || 'N/D'}</div>
            <div className="fullRow"><strong>Observaciones:</strong> {reporte.cierre.observaciones || 'N/D'}</div>

            {reporte.cierre.urlFirmaLocal && (
              <div className="fullRow">
                <strong>Firma:</strong>
                <div className="firmaBox">
                  <img src={reporte.cierre.urlFirmaLocal} alt="Firma del cliente" />
                </div>
              </div>
            )}
          </div>
        ) : (
          <p>No hay cierre registrado.</p>
        )}
      </section>

      <section className="panel">
        <h3>Acciones</h3>
        <div className="accionesGrid">
          <a className="btn btnPrimario" href={reporte.acciones?.verPdf || '#'} target="_blank" rel="noreferrer">
            Ver PDF
          </a>

          <a className="btn btnSecundario" href={reporte.acciones?.descargarPdf || '#'} download>
            Descargar PDF
          </a>

          <button className="btn btnGhost" onClick={onWhatsApp}>
            WhatsApp
          </button>

          <button className="btn btnGhost" onClick={onCorreo}>
            Correo
          </button>
        </div>
      </section>
    </>
  )
}