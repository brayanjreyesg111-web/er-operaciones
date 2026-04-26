export type CrearOrdenServicioInput = {
  clienteId: number;
  contactoNombre?: string;
  telefonoContacto?: string;
  correoContacto?: string;
  ubicacionServicio?: string;
  prioridad?: string;
  tipoSolicitud?: string;
  origenSolicitud?: string;
  descripcionProblema: string;
  fechaSolicitud?: string;
  solicitudId?: number;
};

export type ActualizarOrdenServicioInput = {
  contactoNombre?: string;
  telefonoContacto?: string;
  correoContacto?: string;
  ubicacionServicio?: string;
  prioridad?: string;
  tipoSolicitud?: string;
  origenSolicitud?: string;
  descripcionProblema?: string;
  fechaSolicitud?: string;
};

export const ESTADOS_ORDEN_PERMITIDOS = [
  "nueva",
  "asignada",
  "en_proceso",
  "atendida",
  "cerrada",
  "cancelada",
] as const;

export type EstadoOrdenServicio = (typeof ESTADOS_ORDEN_PERMITIDOS)[number];

function limpiarTexto(valor?: string): string | undefined {
  if (typeof valor !== "string") return undefined;
  const limpio = valor.trim();
  return limpio.length ? limpio : undefined;
}

export function validarCrearOrdenServicio(body: any): { ok: boolean; errores: string[]; datos?: CrearOrdenServicioInput } {
  const errores: string[] = [];
  const clienteId = Number(body?.clienteId);
  const solicitudId = body?.solicitudId ? Number(body.solicitudId) : undefined;

  if (!Number.isInteger(clienteId) || clienteId <= 0) errores.push("clienteId debe ser un número entero válido.");
  if (solicitudId !== undefined && (!Number.isInteger(solicitudId) || solicitudId <= 0)) errores.push("solicitudId debe ser un número entero válido.");

  const descripcionProblema = limpiarTexto(body?.descripcionProblema);
  if (!descripcionProblema) errores.push("descripcionProblema es obligatorio.");

  const datos: CrearOrdenServicioInput = {
    clienteId,
    contactoNombre: limpiarTexto(body?.contactoNombre),
    telefonoContacto: limpiarTexto(body?.telefonoContacto),
    correoContacto: limpiarTexto(body?.correoContacto),
    ubicacionServicio: limpiarTexto(body?.ubicacionServicio),
    prioridad: limpiarTexto(body?.prioridad),
    tipoSolicitud: limpiarTexto(body?.tipoSolicitud),
    origenSolicitud: limpiarTexto(body?.origenSolicitud),
    descripcionProblema: descripcionProblema || "",
    fechaSolicitud: limpiarTexto(body?.fechaSolicitud),
    solicitudId,
  };

  return { ok: errores.length === 0, errores, datos: errores.length === 0 ? datos : undefined };
}

export function validarActualizarOrdenServicio(body: any): { ok: boolean; errores: string[]; datos?: ActualizarOrdenServicioInput } {
  const errores: string[] = [];
  const datos: ActualizarOrdenServicioInput = {
    contactoNombre: limpiarTexto(body?.contactoNombre),
    telefonoContacto: limpiarTexto(body?.telefonoContacto),
    correoContacto: limpiarTexto(body?.correoContacto),
    ubicacionServicio: limpiarTexto(body?.ubicacionServicio),
    prioridad: limpiarTexto(body?.prioridad),
    tipoSolicitud: limpiarTexto(body?.tipoSolicitud),
    origenSolicitud: limpiarTexto(body?.origenSolicitud),
    descripcionProblema: limpiarTexto(body?.descripcionProblema),
    fechaSolicitud: limpiarTexto(body?.fechaSolicitud),
  };

  const tieneAlMenosUnCampo = Object.values(datos).some((v) => v !== undefined);
  if (!tieneAlMenosUnCampo) errores.push("Debes enviar al menos un campo para actualizar.");
  return { ok: errores.length === 0, errores, datos: errores.length === 0 ? datos : undefined };
}

export function validarEstadoOrden(estado: any): { ok: boolean; errores: string[]; estado?: EstadoOrdenServicio } {
  const valor = limpiarTexto(estado)?.toLowerCase();
  if (!valor) return { ok: false, errores: ["El estado es obligatorio."] };
  if (!ESTADOS_ORDEN_PERMITIDOS.includes(valor as EstadoOrdenServicio)) {
    return { ok: false, errores: [`Estado no válido. Usa uno de estos: ${ESTADOS_ORDEN_PERMITIDOS.join(", ")}`] };
  }
  return { ok: true, errores: [], estado: valor as EstadoOrdenServicio };
}
