import CierreReporteForm from './CierreReporteForm'
import type {
  CierreReporteFormState,
  DetalleMaquina,
  ReporteDetalle,
} from '../../types/reportes.types'

type Props = {
  logoEr: string
  reporte: ReporteDetalle | null
  detalle: DetalleMaquina | undefined
  loading: boolean
  error: string
  mostrarFormularioCierre: boolean
  cierreForm: CierreReporteFormState
  guardandoCierre: boolean
  onBack: () => void
  onWhatsApp: () => void
  onCorreo: () => void
  onMostrarCierre: () => void
  onOcultarCierre: () => void
  onChangeCierre: (next: CierreReporteFormState) => void
  onSaveCierre: () => void
}

function textoVisible(valor?: string | null) {
  if (valor === null || valor === undefined) return ''
  return String(valor).trim()
}

function formatearEstado(estado?: string | null) {
  const txt = textoVisible(estado)
  if (!txt) return 'Generado'

  const mapa: Record<string, string> = {
    borrador: 'Borrador',
    generado: 'Generado',
    recibido: 'Recibido',
    recibido_con_observaciones: 'Recibido con observaciones',
    sin_recepcion: 'Sin recepción',
    finalizado: 'Finalizado',
  }

  return mapa[txt.toLowerCase()] || txt
}

export default function DetalleReporte({
  logoEr,
  reporte,
  detalle,
  loading,
  error,
  mostrarFormularioCierre,
  cierreForm,
  guardandoCierre,
  onBack,
  onWhatsApp,
  onCorreo,
  onMostrarCierre,
  onOcultarCierre,
  onChangeCierre,
  onSaveCierre,
}: Props) {
  if (loading) return <section className="panel">Cargando reporte...</section>
  if (error) return <section className="panel errorBox">{error}</section>
  if (!reporte) return <section className="panel errorBox">No hay datos del reporte.</section>

  const nombreRecibe = textoVisible(reporte.cierre?.nombreRecibe)
  const puestoRecibe = textoVisible(reporte.cierre?.puestoRecibe)
  const observacionesCierre = textoVisible(reporte.cierre?.observaciones)
  const fechaCierre = textoVisible(reporte.cierre?.fechaCierre)
  const urlFirmaLocal = textoVisible(reporte.cierre?.urlFirmaLocal)
  const motivoNoRecepcion = textoVisible(reporte.cierre?.motivoNoRecepcion)

  const mostrarRecepcionTrabajo =
    Boolean(urlFirmaLocal) ||
    Boolean(nombreRecibe) ||
    Boolean(puestoRecibe)

  const cierreYaRegistrado =
    mostrarRecepcionTrabajo || Boolean(motivoNoRecepcion)

  return (
    <>
      <section className="panel">
        <div className="formTopBar">
          <div className="formBrand">
            <img src={logoEr} alt="Logo Expertos en Refrigeración" className="logoMini" />
            <div>
              <span className="heroBadge heroBadgeSmall">Detalle del reporte</span>
              <h2>Reporte Técnico #{reporte.numeroReporte}</h2>
              <p>Vista detalle conectada al backend local y lista para revisión.</p>
            </div>
          </div>

          <button className="btn btnGhost" onClick={onBack} type="button">
            Volver
          </button>
        </div>

        <div className="detailOverviewGrid">
          <article className="detailCard">
            <span className="summaryLabel">Cliente</span>
            <strong>{reporte.cliente?.nombre || 'N/D'}</strong>
            <p className="cardHint">Relacionado al reporte actual.</p>
          </article>

          <article className="detailCard">
            <span className="summaryLabel">Técnico</span>
            <strong>{reporte.tecnico?.nombre || 'N/D'}</strong>
            <p className="cardHint">Responsable del reporte generado.</p>
          </article>

          <article className="detailCard">
            <span className="summaryLabel">Fecha</span>
            <strong>{reporte.fechaReporte || 'N/D'}</strong>
            <p className="cardHint">Fecha guardada en backend.</p>
          </article>

          <article className="detailCard">
            <span className="summaryLabel">Estado</span>
            <strong>{formatearEstado(reporte.estado)}</strong>
            <p className="cardHint">Cambiará al registrar el cierre.</p>
          </article>
        </div>
      </section>

      <section className="panel">
        <h3 className="detailSectionTitle">Unidad / equipo</h3>
        <div className="infoGrid">
          <div className="fullRow">
            <strong>Código interno</strong>
            <div className="detalleTextoLargo">
              {reporte.maquina?.codigoInterno || 'N/D'}
            </div>
          </div>

          <div>
            <strong>Marca</strong>
            <div className="detalleTextoLargo">{reporte.maquina?.marca || 'N/D'}</div>
          </div>

          <div>
            <strong>Modelo</strong>
            <div className="detalleTextoLargo">{reporte.maquina?.modelo || 'N/D'}</div>
          </div>

          <div>
            <strong>Serie</strong>
            <div className="detalleTextoLargo">{reporte.maquina?.serie || 'N/D'}</div>
          </div>

          <div>
            <strong>Tipo unidad</strong>
            <div className="detalleTextoLargo">{reporte.tipoUnidad?.nombre || 'N/D'}</div>
          </div>

          <div>
            <strong>Área</strong>
            <div className="detalleTextoLargo">{reporte.maquina?.area || 'N/D'}</div>
          </div>
        </div>
      </section>

      <section className="panel">
        <h3 className="detailSectionTitle">Procedimiento</h3>
        <div className="detalleTextoLargo">
          <strong>Actividad:</strong> {detalle?.tituloActividad || 'N/D'}
        </div>
        <div className="detalleTextoPrelinea">
          {detalle?.descripcionActividadPdf || 'N/D'}
        </div>
      </section>

      <section className="panel">
        <h3 className="detailSectionTitle">Hallazgos</h3>
        {detalle?.hallazgos?.length ? (
          <ul className="listaHallazgos">
            {detalle.hallazgos.map((hallazgo) => (
              <li key={hallazgo.id}>
                <strong>
                  {hallazgo.codigoHallazgo || hallazgo.hallazgoCatalogo?.codigo || 'SIN-COD'}
                </strong>
                {' — '}
                {hallazgo.descripcionHallazgo || hallazgo.hallazgoCatalogo?.descripcion || 'Sin descripción'}
              </li>
            ))}
          </ul>
        ) : (
          <p className="fieldHint">No se registraron hallazgos.</p>
        )}
      </section>

      <section className="panel">
        <h3 className="detailSectionTitle">Conclusiones y observaciones</h3>
        <div className="infoGrid">
          <div className="fullRow">
            <strong>Conclusiones</strong>
            <div className="detalleTextoLargo">{reporte.conclusiones || 'N/D'}</div>
          </div>

          <div className="fullRow">
            <strong>Observaciones</strong>
            <div className="detalleTextoLargo">{reporte.observaciones || 'N/D'}</div>
          </div>
        </div>
      </section>

      {mostrarRecepcionTrabajo && (
        <section className="panel">
          <h3 className="detailSectionTitle">Recepción de trabajo</h3>
          <div className="infoGrid">
            {nombreRecibe && (
              <div>
                <strong>Recibe</strong>
                <div className="detalleTextoLargo">{nombreRecibe}</div>
              </div>
            )}

            {puestoRecibe && (
              <div>
                <strong>Puesto</strong>
                <div className="detalleTextoLargo">{puestoRecibe}</div>
              </div>
            )}

            {fechaCierre && (
              <div>
                <strong>Fecha cierre</strong>
                <div className="detalleTextoLargo">{fechaCierre}</div>
              </div>
            )}

            {observacionesCierre && (
              <div className="fullRow">
                <strong>Observaciones</strong>
                <div className="detalleTextoLargo">{observacionesCierre}</div>
              </div>
            )}

            {urlFirmaLocal && (
              <div className="fullRow">
                <strong>Firma</strong>
                <div className="firmaBox">
                  <img src={urlFirmaLocal} alt="Firma del cliente" />
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {!mostrarRecepcionTrabajo && motivoNoRecepcion && (
        <section className="panel">
          <h3 className="detailSectionTitle">Estado del cierre</h3>
          <div className="detalleTextoLargo">
            <strong>Sin recepción:</strong> {motivoNoRecepcion}
          </div>
        </section>
      )}

      <section className="panel">
        <div className="bloqueFormularioHeader">
          <div>
            <h3>Acciones</h3>
            <p className="fieldHint">
              PDF, envío y cierre del trabajo desde la misma vista.
            </p>
          </div>
        </div>

        <div className="accionesGrid">
          <a
            className="btn btnPrimario"
            href={reporte.acciones?.verPdf || '#'}
            target="_blank"
            rel="noreferrer"
          >
            Ver PDF
          </a>

          <a
            className="btn btnSecundario"
            href={reporte.acciones?.descargarPdf || '#'}
            download
          >
            Descargar PDF
          </a>

          <button className="btn btnGhost" onClick={onWhatsApp} type="button">
            WhatsApp
          </button>

          <button className="btn btnGhost" onClick={onCorreo} type="button">
            Correo
          </button>

          {!cierreYaRegistrado && !mostrarFormularioCierre && (
            <button className="btn btnGhost" onClick={onMostrarCierre} type="button">
              Cerrar reporte
            </button>
          )}

          {!cierreYaRegistrado && mostrarFormularioCierre && (
            <button className="btn btnGhost" onClick={onOcultarCierre} type="button">
              Ocultar cierre
            </button>
          )}
        </div>
      </section>

      {!cierreYaRegistrado && mostrarFormularioCierre && (
        <>
          <CierreReporteForm value={cierreForm} onChange={onChangeCierre} />

          <section className="panel">
            <div className="barraAcciones">
              <button className="btn btnGhost" onClick={onOcultarCierre} type="button">
                Cancelar
              </button>

              <button
                className="btn btnPrimario"
                onClick={onSaveCierre}
                type="button"
                disabled={guardandoCierre}
              >
                {guardandoCierre ? 'Guardando cierre...' : 'Guardar cierre'}
              </button>
            </div>
          </section>
        </>
      )}
    </>
  )
}

