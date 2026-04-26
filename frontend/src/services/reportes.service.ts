import type {
  CierreReporteFormState,
  FormReporte,
  HallazgoOption,
  ProcedimientoOption,
  ReporteDetalle,
} from '../types/reportes.types'

const API = 'http://localhost:3001/api'

function limpiarBase64(data: string): string {
  return String(data || '').replace(/^data:.*;base64,/, '')
}

async function fileToBase64(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const result = String(reader.result || '')
      resolve(limpiarBase64(result))
    }

    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function fetchApi<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  })

  const raw = await res.text()
  const json = raw ? JSON.parse(raw) : {}

  if (!res.ok || json?.ok === false) {
    throw new Error(json?.mensaje || raw || `Error HTTP ${res.status}`)
  }

  return (json.data ?? json) as T
}

function obtenerVisitaObligatoria(form: FormReporte): number {
  const visitaId = Number(form.visitaId)

  if (!Number.isFinite(visitaId) || visitaId <= 0) {
    throw new Error('Ahora el reporte debe crearse desde una visita existente. Ingresa un visitaId válido.')
  }

  return visitaId
}

export async function crearReporteDesdeFormulario(params: {
  form: FormReporte
  procedimientos: ProcedimientoOption[]
  hallazgosCatalogo: HallazgoOption[]
}): Promise<ReporteDetalle> {
  const { form, procedimientos, hallazgosCatalogo } = params

  const procedimiento = procedimientos.find((item) => item.id === Number(form.procedimientoId))
  const visitaId = obtenerVisitaObligatoria(form)

  const anexos = await Promise.all(
    form.anexos.map(async (file) => ({
      nombreArchivo: file.name,
      mimeType: file.type || 'application/octet-stream',
      tipoArchivo: file.type.startsWith('image/') ? 'imagen' : 'archivo',
      contenidoBase64: await fileToBase64(file),
    }))
  )

  const hallazgos = form.hallazgosSeleccionados
    .map((id) => hallazgosCatalogo.find((item) => item.id === id))
    .filter((item): item is HallazgoOption => Boolean(item))
    .map((item) => ({
      hallazgoCatalogoId: item.id,
      codigoHallazgo: item.codigo,
      descripcionHallazgo: item.descripcion,
    }))

  const payload = {
    visitaId,
    clienteId: Number(form.clienteId),
    tecnicoId: Number(form.tecnicoId),
    maquinaId: Number(form.maquinaId),
    procedimientoId: Number(form.procedimientoId),
    conclusiones: form.conclusiones,
    observaciones: form.observaciones,
    psi: form.psi,
    amperaje: form.amperaje,
    detallesMaquinas: [
      {
        maquinaId: Number(form.maquinaId),
        procedimientoId: Number(form.procedimientoId),
        tituloActividad: procedimiento?.nombre || '',
        descripcionActividadPdf: procedimiento?.descripcionCompletaPdf || '',
        psi: form.psi,
        amperaje: form.amperaje,
        observaciones: form.observaciones,
        hallazgos,
      },
    ],
    anexos,
  }

  return await fetchApi<ReporteDetalle>(`${API}/reportes`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function cerrarReportePosterior(params: {
  reporteId: number
  cierre: CierreReporteFormState
}): Promise<ReporteDetalle> {
  const { reporteId, cierre } = params

  const payload =
    cierre.tipoCierre === 'RECIBIDO_EN_SITIO'
      ? {
          tipoCierre: 'RECIBIDO_EN_SITIO',
          recibido: true,
          aprobado: true,
          nombreRecibe: cierre.nombreRecibe,
          puestoRecibe: cierre.cargoRecibe,
          observaciones: cierre.observacionesRecepcion,
          firmaNombreArchivo: cierre.firmaNombreArchivo || 'firma_cliente.png',
          firmaMimeType: cierre.firmaMimeType || 'image/png',
          firmaBase64: limpiarBase64(cierre.firmaBase64),
        }
      : cierre.tipoCierre === 'RECIBIDO_DIGITAL'
        ? {
            tipoCierre: 'RECIBIDO_DIGITAL',
            recibido: true,
            aprobado: true,
            nombreRecibe: cierre.nombreRecibe || 'Recibido digitalmente',
            puestoRecibe: cierre.cargoRecibe || 'Recepción digital',
            observaciones: cierre.observacionesRecepcion || 'Reporte recibido y aceptado de forma digital / a distancia.',
          }
        : {
            tipoCierre: 'SIN_RECEPCION',
            recibido: false,
            aprobado: false,
            motivoNoRecepcion: cierre.motivoSinRecepcion,
            observaciones: cierre.observacionSinRecepcion,
          }

  return await fetchApi<ReporteDetalle>(`${API}/reportes/${reporteId}/cierre`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function obtenerReportePorId(reporteId: number): Promise<ReporteDetalle> {
  return await fetchApi<ReporteDetalle>(`${API}/reportes/${reporteId}`)
}
