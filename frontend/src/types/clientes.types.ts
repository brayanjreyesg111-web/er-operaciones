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
  activo?: boolean | null
}

export type FormCliente = {
  nombre: string
  rtn: string
  contactoNombre: string
  telefono: string
  correo: string
  direccion: string
  departamentoId: string
  ciudadId: string
}

export const FORM_CLIENTE_INICIAL: FormCliente = {
  nombre: '',
  rtn: '',
  contactoNombre: '',
  telefono: '',
  correo: '',
  direccion: '',
  departamentoId: '',
  ciudadId: '',
}