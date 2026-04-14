export type FormMaquina = {
  tipoUnidadId: string
  marcaId: string
  refrigeranteId: string
  unidadMedidaCargaId: string
  departamentoId: string
  ciudadId: string
  modelo: string
  serie: string
  cargaRefrigeranteCantidad: string
  direccionExacta: string
  area: string
  observaciones: string
}

export type CrearMaquinaResponse = {
  ok: boolean
  mensaje?: string
  data?: {
    id: number
    codigoInterno?: string | null
    clienteId?: number
  }
}

export const FORM_MAQUINA_INICIAL: FormMaquina = {
  tipoUnidadId: '',
  marcaId: '',
  refrigeranteId: '',
  unidadMedidaCargaId: '',
  departamentoId: '',
  ciudadId: '',
  modelo: '',
  serie: '',
  cargaRefrigeranteCantidad: '',
  direccionExacta: '',
  area: '',
  observaciones: '',
}
