const API = "http://localhost:3001/api";

export type CatalogoUbicacionItem = {
  id: number;
  codigo: string;
  nombre: string;
  departamentoId?: number;
};

export type CrearSolicitudPublicaPayload = {
  nombreSolicitante: string;
  telefono: string;
  correo?: string;
  empresa?: string;
  departamentoId: number;
  ciudadId: number;
  direccionExacta?: string;
  tipoServicio?: string;
  descripcion: string;
  fechaDeseada?: string;
};

export async function obtenerDepartamentosPublicos(): Promise<CatalogoUbicacionItem[]> {
  const res = await fetch(`${API}/catalogos/departamentos`);
  const json = await res.json();

  if (!res.ok || !json?.ok) {
    throw new Error(json?.mensaje || "No se pudieron cargar los departamentos.");
  }

  return json.data || [];
}

export async function obtenerCiudadesPublicas(
  departamentoId: number
): Promise<CatalogoUbicacionItem[]> {
  const res = await fetch(`${API}/catalogos/departamentos/${departamentoId}/ciudades`);
  const json = await res.json();

  if (!res.ok || !json?.ok) {
    throw new Error(json?.mensaje || "No se pudieron cargar las ciudades.");
  }

  return json.data || [];
}

export async function crearSolicitudPublica(payload: CrearSolicitudPublicaPayload) {
  const res = await fetch(`${API}/solicitudes-publicas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const raw = await res.text();
  const json = JSON.parse(raw);

  if (!res.ok || !json.ok) {
    throw new Error(json?.mensaje || `Error HTTP ${res.status}`);
  }

  return json.data;
}
