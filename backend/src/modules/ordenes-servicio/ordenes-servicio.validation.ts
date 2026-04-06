 /**
 * SECCIÓN 3.1
 * Tipos base para crear una orden.
 */
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
};

/**
 * SECCIÓN 3.2
 * Tipos para actualizar una orden.
 */
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

/**
 * SECCIÓN 3.3
 * Estados permitidos de la orden.
 * Si después quieres cambiar los estados, modifica esta sección.
 */
export const ESTADOS_ORDEN_PERMITIDOS = [
  "nueva",
  "asignada",
  "en_proceso",
  "atendida",
  "cerrada",
  "cancelada",
] as const;

export type EstadoOrdenServicio = (typeof ESTADOS_ORDEN_PERMITIDOS)[number];

/**
 * SECCIÓN 3.4
 * Limpia espacios en blanco.
 */
function limpiarTexto(valor?: string): string | undefined {
  if (typeof valor !== "string") return undefined;
  const limpio = valor.trim();
  return limpio.length ? limpio : undefined;
}

/**
 * SECCIÓN 3.5
 * Valida el payload para crear una orden.
 */
export function validarCrearOrdenServicio(body: any): {
  ok: boolean;
  errores: string[];
  datos?: CrearOrdenServicioInput;
} {
  const errores: string[] = [];

  const clienteId = Number(body?.clienteId);
  if (!Number.isInteger(clienteId) || clienteId <= 0) {
    errores.push("clienteId debe ser un número entero válido.");
  }

  const descripcionProblema = limpiarTexto(body?.descripcionProblema);
  if (!descripcionProblema) {
    errores.push("descripcionProblema es obligatorio.");
  }

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
  };

  return {
    ok: errores.length === 0,
    errores,
    datos: errores.length === 0 ? datos : undefined,
  };
}

/**
 * SECCIÓN 3.6
 * Valida el payload para actualizar una orden.
 */
export function validarActualizarOrdenServicio(body: any): {
  ok: boolean;
  errores: string[];
  datos?: ActualizarOrdenServicioInput;
} {
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

  if (!tieneAlMenosUnCampo) {
    errores.push("Debes enviar al menos un campo para actualizar.");
  }

  return {
    ok: errores.length === 0,
    errores,
    datos: errores.length === 0 ? datos : undefined,
  };
}

/**
 * SECCIÓN 3.7
 * Valida el cambio de estado.
 */
export function validarEstadoOrden(estado: any): {
  ok: boolean;
  errores: string[];
  estado?: EstadoOrdenServicio;
} {
  const valor = limpiarTexto(estado)?.toLowerCase();

  if (!valor) {
    return {
      ok: false,
      errores: ["El estado es obligatorio."],
    };
  }

  if (!ESTADOS_ORDEN_PERMITIDOS.includes(valor as EstadoOrdenServicio)) {
    return {
      ok: false,
      errores: [
        `Estado no válido. Usa uno de estos: ${ESTADOS_ORDEN_PERMITIDOS.join(", ")}`,
      ],
    };
  }

  return {
    ok: true,
    errores: [],
    estado: valor as EstadoOrdenServicio,
  };
}