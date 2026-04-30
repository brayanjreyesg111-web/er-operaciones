const API = "https://slowly-work-dim-branches.trycloudflare.com/api";

type ClientePayload = {
  nombre: string
  rtn?: string
  contactoNombre?: string
  telefono?: string
  correo?: string
  direccion?: string
  departamentoId: number
  ciudadId: number
}

export async function obtenerClientes() {
  const res = await fetch(`${API}/clientes`, {
    headers: {
      Accept: 'application/json',
    },
  })

  const raw = await res.text()
  const json = JSON.parse(raw)

  if (!res.ok || !json.ok || !json.data) {
    throw new Error(json?.mensaje || `Error HTTP ${res.status}`)
  }

  return json.data
}

export async function obtenerClienteDetalle(clienteId: string | number) {
  const res = await fetch(`${API}/clientes/${clienteId}`, {
    headers: {
      Accept: 'application/json',
    },
  })

  const raw = await res.text()
  const json = JSON.parse(raw)

  if (!res.ok || !json.ok || !json.data) {
    throw new Error(json?.mensaje || `Error HTTP ${res.status}`)
  }

  return json.data
}

export async function crearCliente(payload: ClientePayload) {
  const res = await fetch(`${API}/clientes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const raw = await res.text()
  const json = JSON.parse(raw)

  if (!res.ok || !json.ok || !json.data) {
    throw new Error(json?.mensaje || `Error HTTP ${res.status}`)
  }

  return json.data
}

