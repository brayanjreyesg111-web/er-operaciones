export type VistaActual = 'inicio' | 'crear' | 'detalle' | 'cliente' | 'maquina'

export type TecnicoOption = {
  id: number
  nombre: string
}

export type ProcedimientoOption = {
  id: number
  nombre: string
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
  hallazgos?: Hallazgo[]
}

export type ReporteResponse = {
  ok: boolean
  data: {
    id: number
    numeroReporte: string
    fechaReporte?: string
    conclusiones?: string | null
    observaciones?: string | null
    urlPdfLocal?: string | null
    cliente?: {
      nombre?: string
    }
    tecnico?: {
      nombre?: string
      email?: string
    }
    maquina?: {
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

export type FormReporte = {
  clienteId: string
  maquinaId: string
  tecnicoId: string
  procedimientoId: string
  psi: string
  amperaje: string
  conclusiones: string
  observaciones: string
}

export const FORM_REPORTE_INICIAL: FormReporte = {
  clienteId: '',
  maquinaId: '',
  tecnicoId: '',
  procedimientoId: '',
  psi: '',
  amperaje: '',
  conclusiones: '',
  observaciones: '',
}

export const TECNICOS_DEMO: TecnicoOption[] = [
  { id: 2, nombre: 'Tecnico Prueba ER' },
  { id: 3, nombre: 'Tecnico Supervisor ER' },
]

export const PROCEDIMIENTOS_DEMO: ProcedimientoOption[] = [
  { id: 1, nombre: 'Mantenimiento preventivo general' },
  { id: 2, nombre: 'Diagnóstico de falla eléctrica' },
  { id: 3, nombre: 'Revisión de presiones y amperaje' },
]

export const HALLAZGOS_DEMO: HallazgoOption[] = [
  { id: 1, codigo: 'H-01', descripcion: 'Fuga detectada en línea de succión', categoria: 'Refrigeración' },
  { id: 2, codigo: 'H-02', descripcion: 'Capacitor fuera de rango', categoria: 'Eléctrico' },
  { id: 3, codigo: 'H-03', descripcion: 'Serpentín con suciedad acumulada', categoria: 'Mecánico' },
  { id: 4, codigo: 'H-04', descripcion: 'Terminal floja en contactor', categoria: 'Eléctrico' },
  { id: 5, codigo: 'H-05', descripcion: 'Presión baja respecto al rango normal', categoria: 'Refrigeración' },
]
