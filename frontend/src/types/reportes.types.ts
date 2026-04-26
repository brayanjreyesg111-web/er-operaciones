export type VistaActual = 'inicio' | 'crear' | 'detalle' | 'cliente' | 'maquina' | 'detalle-visita'

export type TecnicoOption = {
  id: number
  nombre: string
  email?: string | null
  role?: string | null
  roleLabel?: string | null
  label?: string | null
}

export type ProcedimientoOption = {
  id: number
  codigo?: string | null
  nombre: string
  descripcionCompletaPdf?: string | null
}

export type HallazgoOption = {
  id: number
  codigo: string
  descripcion: string
  categoria?: string | null
}

export type Hallazgo = {
  id: number
  codigoHallazgo?: string | null
  descripcionHallazgo?: string | null
  hallazgoCatalogo?: {
    codigo?: string | null
    descripcion?: string | null
    categoria?: string | null
  } | null
}

export type DetalleMaquina = {
  id: number
  tituloActividad?: string | null
  descripcionActividadPdf?: string | null
  diagnostico?: string | null
  trabajoRealizado?: string | null
  recomendaciones?: string | null
  psi?: string | null
  amperaje?: string | null
  observaciones?: string | null
  hallazgosTexto?: string | null
  hallazgos?: Hallazgo[]
}

export type ReporteResponse = {
  ok: boolean
  data: {
    id: number
    numeroReporte: string
    estado?: string | null
    fechaReporte?: string
    conclusiones?: string | null
    observaciones?: string | null
    urlPdfLocal?: string | null
    cliente?: {
      id?: number
      nombre?: string
    }
    tecnico?: {
      id?: number
      nombre?: string
      email?: string
    }
    maquina?: {
      id?: number
      codigoInterno?: string
      marca?: string
      modelo?: string
      serie?: string
      area?: string
      ciudad?: {
        nombre?: string
      }
      departamento?: {
        nombre?: string
      }
    }
    tipoUnidad?: {
      id?: number
      nombre?: string
      descripcion?: string
    }
    detallesMaquinas?: DetalleMaquina[]
    cierre?: {
      nombreRecibe?: string | null
      puestoRecibe?: string | null
      observaciones?: string | null
      motivoNoRecepcion?: string | null
      fechaCierre?: string | null
      urlFirmaLocal?: string | null
    } | null
    acciones?: {
      verPdf?: string | null
      descargarPdf?: string | null
      whatsappTexto?: string | null
      correoAsunto?: string | null
      correoCuerpo?: string | null
    }
  }
}

export type ReporteDetalle = ReporteResponse['data']

export type CierreReporteFormState = {
  tipoCierre: '' | 'RECIBIDO_EN_SITIO' | 'RECIBIDO_DIGITAL' | 'SIN_RECEPCION'
  nombreRecibe: string
  cargoRecibe: string
  observacionesRecepcion: string
  motivoSinRecepcion: string
  observacionSinRecepcion: string
  firmaBase64: string
  firmaNombreArchivo: string
  firmaMimeType: string
}

export type FormReporte = {
  visitaId: string
  clienteId: string
  maquinaId: string
  tecnicoId: string
  procedimientoId: string
  psi: string
  amperaje: string
  conclusiones: string
  observaciones: string
  hallazgosSeleccionados: number[]
  anexos: File[]
}

export const CIERRE_REPORTE_INICIAL: CierreReporteFormState = {
  tipoCierre: '',
  nombreRecibe: '',
  cargoRecibe: '',
  observacionesRecepcion: '',
  motivoSinRecepcion: '',
  observacionSinRecepcion: '',
  firmaBase64: '',
  firmaNombreArchivo: 'firma_cliente.png',
  firmaMimeType: 'image/png',
}

export const FORM_REPORTE_INICIAL: FormReporte = {
  visitaId: '',
  clienteId: '',
  maquinaId: '',
  tecnicoId: '',
  procedimientoId: '',
  psi: '',
  amperaje: '',
  conclusiones: '',
  observaciones: '',
  hallazgosSeleccionados: [],
  anexos: [],
}
