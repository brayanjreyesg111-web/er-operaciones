export type ClienteOption = {
  id: number
  nombre: string
}

export type MaquinaOption = {
  id: number
  clienteId: number
  codigoInterno?: string | null
  modelo?: string | null
  serie?: string | null
  activo?: boolean
}

export type FormCliente = {
  nombre: string
  rtn: string
  contactoNombre: string
  telefono: string
  correo: string
  direccion: string
  ubicacion: string
}

export type ClientesListResponse = {
  ok: boolean
  data: Array<{
    id: number
    nombre: string
  }>
}

export type ClienteDetalleResponse = {
  ok: boolean
  data: {
    id: number
    nombre: string
    maquinas?: Array<{
      id: number
      codigoInterno?: string | null
      modelo?: string | null
      serie?: string | null
      activo?: boolean
    }>
  }
}

export type CrearClienteResponse = {
  ok: boolean
  mensaje?: string
  data?: {
    id: number
    nombre: string
  }
}

export const FORM_CLIENTE_INICIAL: FormCliente = {
  nombre: '',
  rtn: '',
  contactoNombre: '',
  telefono: '',
  correo: '',
  direccion: '',
  ubicacion: '',
}
