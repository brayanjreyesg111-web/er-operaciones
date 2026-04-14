/**
 * SECCIÓN 1. TIPOS BASE PARA CREAR VISITA
 * Sirve para tipar la información que recibirá el backend al crear una visita.
 */
export type CrearVisitaInput = {
  ordenServicioId?: number;
  clienteId: number;
  tecnicoId: number;
  tipoVisita?: string;
  motivoVisita?: string;
  resultadoBreve?: string;
  estado?: string;
  requiereCotizacion?: boolean;
  esVisitaLibre?: boolean;
  fechaVisita?: string;
  horaInicio?: string;
  horaFin?: string;
  observaciones?: string;
};

/**
 * SECCIÓN 2. TIPO PARA ASOCIAR MÁQUINAS A UNA VISITA
 * Aquí enviaremos uno o varios IDs de máquina.
 */
export type AsociarMaquinasVisitaInput = {
  maquinaIds: number[];
};

/**
 * SECCIÓN 3. ESTADOS PERMITIDOS DE VISITA
 * Si después quieres cambiar los estados, modifica solo esta sección.
 */
export const ESTADOS_VISITA_PERMITIDOS = [
  "pendiente",
  "programada",
  "en_proceso",
  "atendida",
  "cerrada",
  "cancelada",
] as const;

export type EstadoVisita = (typeof ESTADOS_VISITA_PERMITIDOS)[number];

/**
 * SECCIÓN 4. FUNCIÓN AUXILIAR PARA LIMPIAR TEXTOS
 * Quita espacios al inicio y al final.
 */
function limpiarTexto(valor?: string): string | undefined {
  if (typeof valor !== "string") return undefined;
  const limpio = valor.trim();
  return limpio.length ? limpio : undefined;
}

/**
 * SECCIÓN 5. FUNCIÓN AUXILIAR PARA VALIDAR FECHAS
 * Solo valida que el texto pueda convertirse a fecha válida.
 */
function esFechaValida(valor?: string): boolean {
  if (!valor) return true;
  const fecha = new Date(valor);
  return !Number.isNaN(fecha.getTime());
}

/**
 * SECCIÓN 6. VALIDAR CREACIÓN DE VISITA
 * Reglas:
 * - clienteId es obligatorio
 * - tecnicoId es obligatorio
 * - si NO es visita libre, debe venir ordenServicioId
 * - si viene estado, debe estar permitido
 * - si vienen fechas/horas, deben ser válidas
 */
export function validarCrearVisita(body: any): {
  ok: boolean;
  errores: string[];
  datos?: CrearVisitaInput;
} {
  const errores: string[] = [];

  const ordenServicioId =
    body?.ordenServicioId !== undefined ? Number(body.ordenServicioId) : undefined;
  const clienteId = Number(body?.clienteId);
  const tecnicoId = Number(body?.tecnicoId);

  const esVisitaLibre =
    body?.esVisitaLibre === true || String(body?.esVisitaLibre).toLowerCase() === "true";

  const requiereCotizacion =
    body?.requiereCotizacion === true ||
    String(body?.requiereCotizacion).toLowerCase() === "true";

  const estado = limpiarTexto(body?.estado)?.toLowerCase();

  if (!Number.isInteger(clienteId) || clienteId <= 0) {
    errores.push("clienteId debe ser un número entero válido.");
  }

  if (!Number.isInteger(tecnicoId) || tecnicoId <= 0) {
    errores.push("tecnicoId debe ser un número entero válido.");
  }

  if (!esVisitaLibre) {
    if (!Number.isInteger(ordenServicioId) || (ordenServicioId ?? 0) <= 0) {
      errores.push("ordenServicioId es obligatorio cuando la visita no es libre.");
    }
  }

  if (ordenServicioId !== undefined) {
    if (!Number.isInteger(ordenServicioId) || ordenServicioId <= 0) {
      errores.push("ordenServicioId debe ser un número entero válido.");
    }
  }

  if (estado && !ESTADOS_VISITA_PERMITIDOS.includes(estado as EstadoVisita)) {
    errores.push(
      `estado no válido. Usa uno de estos: ${ESTADOS_VISITA_PERMITIDOS.join(", ")}`
    );
  }

  if (!esFechaValida(body?.fechaVisita)) {
    errores.push("fechaVisita no tiene un formato de fecha válido.");
  }

  if (!esFechaValida(body?.horaInicio)) {
    errores.push("horaInicio no tiene un formato de fecha válido.");
  }

  if (!esFechaValida(body?.horaFin)) {
    errores.push("horaFin no tiene un formato de fecha válido.");
  }

  const datos: CrearVisitaInput = {
    ordenServicioId,
    clienteId,
    tecnicoId,
    tipoVisita: limpiarTexto(body?.tipoVisita),
    motivoVisita: limpiarTexto(body?.motivoVisita),
    resultadoBreve: limpiarTexto(body?.resultadoBreve),
    estado: estado || "pendiente",
    requiereCotizacion,
    esVisitaLibre,
    fechaVisita: limpiarTexto(body?.fechaVisita),
    horaInicio: limpiarTexto(body?.horaInicio),
    horaFin: limpiarTexto(body?.horaFin),
    observaciones: limpiarTexto(body?.observaciones),
  };

  return {
    ok: errores.length === 0,
    errores,
    datos: errores.length === 0 ? datos : undefined,
  };
}

/**
 * SECCIÓN 7. VALIDAR ASOCIACIÓN DE MÁQUINAS A VISITA
 * Regla:
 * - debe venir un arreglo con al menos 1 ID
 * - todos los IDs deben ser enteros válidos
 */
export function validarAsociarMaquinasVisita(body: any): {
  ok: boolean;
  errores: string[];
  datos?: AsociarMaquinasVisitaInput;
} {
  const errores: string[] = [];

  const maquinaIdsRaw: unknown[] = Array.isArray(body?.maquinaIds)
    ? body.maquinaIds
    : [];

  if (maquinaIdsRaw.length === 0) {
    errores.push("Debes enviar al menos una máquina en maquinaIds.");
  }

  const maquinaIds: number[] = maquinaIdsRaw
    .map((id: unknown) => Number(id))
    .filter((id: number) => Number.isInteger(id) && id > 0);

  if (maquinaIdsRaw.length > 0 && maquinaIds.length !== maquinaIdsRaw.length) {
    errores.push("Todos los IDs en maquinaIds deben ser enteros válidos.");
  }

  const unicos: number[] = [...new Set<number>(maquinaIds)];

  return {
    ok: errores.length === 0,
    errores,
    datos: errores.length === 0 ? { maquinaIds: unicos } : undefined,
  };
}