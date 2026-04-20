
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from 'react'
import type { CierreReporteFormState } from '../../types/reportes.types'

type Props = {
  value: CierreReporteFormState
  onChange: (next: CierreReporteFormState) => void
}

const MOTIVOS_SIN_RECEPCION = [
  'Cliente ausente',
  'No había responsable para recibir',
  'Se reprograma recepción',
  'Cliente se retiró antes del cierre',
  'Área no disponible para recepción',
  'Otro',
]

const CANVAS_WIDTH = 1100
const CANVAS_HEIGHT = 260

export default function CierreReporteForm({ value, onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const [drawing, setDrawing] = useState(false)

  const prepararCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    ctx.strokeStyle = '#0b2f3a'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  const redibujarFirma = useCallback(
    (base64: string) => {
      const canvas = canvasRef.current
      if (!canvas || !base64) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      prepararCanvas()

      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      }
      img.src = `data:image/png;base64,${base64}`
    },
    [prepararCanvas]
  )

  useEffect(() => {
    prepararCanvas()
  }, [prepararCanvas])

  useEffect(() => {
    if (value.firmaBase64) {
      redibujarFirma(value.firmaBase64)
    } else {
      prepararCanvas()
    }
  }, [value.firmaBase64, prepararCanvas, redibujarFirma])

  function obtenerPosicion(e: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const scaleX = CANVAS_WIDTH / rect.width
    const scaleY = CANVAS_HEIGHT / rect.height

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  function iniciarDibujo(e: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { x, y } = obtenerPosicion(e)

    drawingRef.current = true
    lastPointRef.current = { x, y }
    setDrawing(true)

    ctx.beginPath()
    ctx.moveTo(x, y)

    try {
      canvas.setPointerCapture(e.pointerId)
    } catch {
      // no-op
    }
  }

  function dibujar(e: PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { x, y } = obtenerPosicion(e)
    const prev = lastPointRef.current

    if (!prev) {
      lastPointRef.current = { x, y }
      return
    }

    ctx.beginPath()
    ctx.moveTo(prev.x, prev.y)
    ctx.lineTo(x, y)
    ctx.stroke()

    lastPointRef.current = { x, y }
  }

  function finalizarDibujo(e?: PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return

    drawingRef.current = false
    lastPointRef.current = null
    setDrawing(false)

    const canvas = canvasRef.current
    if (!canvas) return

    try {
      if (e) canvas.releasePointerCapture(e.pointerId)
    } catch {
      // no-op
    }

    const dataUrl = canvas.toDataURL('image/png')
    const base64 = dataUrl.replace(/^data:image\/png;base64,/, '')

    onChange({
      ...value,
      firmaBase64: base64,
      firmaMimeType: 'image/png',
      firmaNombreArchivo: 'firma_cliente.png',
    })
  }

  function limpiarFirma() {
    prepararCanvas()
    drawingRef.current = false
    lastPointRef.current = null
    setDrawing(false)

    onChange({
      ...value,
      firmaBase64: '',
      firmaMimeType: 'image/png',
      firmaNombreArchivo: 'firma_cliente.png',
    })
  }

  function actualizar<K extends keyof CierreReporteFormState>(
    key: K,
    val: CierreReporteFormState[K]
  ) {
    onChange({
      ...value,
      [key]: val,
    })
  }

  const firmaLista = Boolean(value.firmaBase64)

  return (
    <section className="panel">
      <div className="bloqueFormularioHeader">
        <div>
          <h3>Cerrar reporte</h3>
          <p className="fieldHint">
            Completa esta etapa solo después de revisar el reporte preliminar generado.
          </p>
        </div>
        <span className="formStepBadge">Cierre final</span>
      </div>

      <div className="formSummaryGrid">
        <article className="summaryCard">
          <span className="summaryLabel">Tipo de cierre</span>
          <strong className="summaryValue">
            {value.tipoCierre === 'RECIBIDO_EN_SITIO'
              ? 'Recibido en sitio'
              : value.tipoCierre === 'SIN_RECEPCION'
                ? 'Sin recepción'
                : 'Pendiente'}
          </strong>
          <p className="cardHint">Selecciona la salida real del trabajo.</p>
        </article>

        <article className="summaryCard">
          <span className="summaryLabel">Firma</span>
          <strong className="summaryValue">{firmaLista ? 'Capturada' : 'Pendiente'}</strong>
          <p className="cardHint">Obligatoria cuando el cliente sí recibe.</p>
        </article>

        <article className="summaryCard">
          <span className="summaryLabel">Recibe</span>
          <strong className="summaryValue summaryValueMuted">
            {value.nombreRecibe.trim() || 'Sin nombre'}
          </strong>
          <p className="cardHint">Se llena solo en recibido en sitio.</p>
        </article>

        <article className="summaryCard">
          <span className="summaryLabel">Motivo</span>
          <strong className="summaryValue summaryValueMuted">
            {value.motivoSinRecepcion.trim() || 'No aplica'}
          </strong>
          <p className="cardHint">Solo cuando no hubo recepción.</p>
        </article>
      </div>

      <div className="bloqueFormulario">
        <div className="formGrid">
          <div className="campo campoCompleto">
            <label htmlFor="tipoCierre">
              Tipo de cierre<span className="requiredDot">*</span>
            </label>
            <select
              id="tipoCierre"
              name="tipoCierre"
              title="Tipo de cierre"
              value={value.tipoCierre}
              onChange={(e) =>
                actualizar(
                  'tipoCierre',
                  e.target.value as CierreReporteFormState['tipoCierre']
                )
              }
            >
              <option value="">Seleccione...</option>
              <option value="RECIBIDO_EN_SITIO">Recibido en sitio</option>
              <option value="SIN_RECEPCION">Sin recepción</option>
            </select>
          </div>

          {value.tipoCierre === 'RECIBIDO_EN_SITIO' && (
            <>
              <div className="campo">
                <label>
                  Nombre de quien recibe<span className="requiredDot">*</span>
                </label>
                <input
                  value={value.nombreRecibe}
                  onChange={(e) => actualizar('nombreRecibe', e.target.value)}
                  placeholder="Nombre de quien recibe"
                />
              </div>

              <div className="campo">
                <label>Cargo / puesto</label>
                <input
                  value={value.cargoRecibe}
                  onChange={(e) => actualizar('cargoRecibe', e.target.value)}
                  placeholder="Cargo o puesto"
                />
              </div>

              <div className="campo campoCompleto">
                <label>Observaciones de recepción</label>
                <textarea
                  rows={3}
                  value={value.observacionesRecepcion}
                  onChange={(e) =>
                    actualizar('observacionesRecepcion', e.target.value)
                  }
                  placeholder="Observaciones del cliente al recibir"
                />
              </div>

              <div className="campo campoCompleto">
                <label>
                  Firma del cliente<span className="requiredDot">*</span>
                </label>

                <div className="statusInfoBox">
                  <strong>Instrucción:</strong> el cuadro quedó más alto y el trazo se mantiene
                  estable sin encogerse ni salirse del marco.
                </div>

                <div className="firmaCanvasWrap firmaCanvasWrapAlta">
                  <canvas
                    ref={canvasRef}
                    className="firmaCanvas firmaCanvasAlta"
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    onPointerDown={iniciarDibujo}
                    onPointerMove={dibujar}
                    onPointerUp={finalizarDibujo}
                    onPointerCancel={finalizarDibujo}
                    onPointerLeave={finalizarDibujo}
                  />
                </div>

                <div className="barraAcciones barraAccionesFirma">
                  <button
                    type="button"
                    className="btn btnGhost"
                    onClick={limpiarFirma}
                  >
                    Limpiar firma
                  </button>
                  <span className="inlineBadge">
                    {drawing ? 'Firmando...' : firmaLista ? 'Firma lista' : 'Pendiente de firma'}
                  </span>
                </div>
              </div>
            </>
          )}

          {value.tipoCierre === 'SIN_RECEPCION' && (
            <>
              <div className="campo campoCompleto">
                <label>
                  Motivo de no recepción<span className="requiredDot">*</span>
                </label>
                <select
                  value={value.motivoSinRecepcion}
                  onChange={(e) => actualizar('motivoSinRecepcion', e.target.value)}
                  title="Motivo de no recepción"
                >
                  <option value="">Seleccione motivo</option>
                  {MOTIVOS_SIN_RECEPCION.map((motivo) => (
                    <option key={motivo} value={motivo}>
                      {motivo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="campo campoCompleto">
                <label>Observación sin recepción</label>
                <textarea
                  rows={3}
                  value={value.observacionSinRecepcion}
                  onChange={(e) =>
                    actualizar('observacionSinRecepcion', e.target.value)
                  }
                  placeholder="Detalle adicional"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
