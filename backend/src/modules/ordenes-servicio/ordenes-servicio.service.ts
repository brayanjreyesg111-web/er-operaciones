import { prisma } from "../../lib/prisma";
import type {
  ActualizarOrdenServicioInput,
  CrearOrdenServicioInput,
  EstadoOrdenServicio,
} from "./ordenes-servicio.validation";

/**
 * SECCIÓN 4.1
 * Convierte fecha string a Date si viene informada.
 */
function resolverFecha(fecha?: string): Date | undefined {
  if (!fecha) return undefined;
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return undefined;
  return valor;
}

/**
 * SECCIÓN 4.2
 * Genera el correlativo de la orden.
 *
 * FORMATO ACTUAL:
 * OS-000001
 *
 * Si luego quieres otro formato, modifica SOLO esta función.
 */
async function generarNumeroOrden(): Promise<string> {
  const ultimaOrden = await prisma.ordenServicio.findFirst({
    orderBy: { id: "desc" },
    select: { id: true },
  });

  const siguienteNumero = (ultimaOrden?.id ?? 0) + 1;
  return `OS-${String(siguienteNumero).padStart(6, "0")}`;
}

/**
 * SECCIÓN 4.3
 * Crea una nueva orden de servicio.
 */
export async function crearOrdenServicio(data: CrearOrdenServicioInput) {
  const clienteExiste = await prisma.cliente.findUnique({
    where: { id: data.clienteId },
    select: { id: true, nombre: true, activo: true },
  });

  if (!clienteExiste) {
    throw new Error("El cliente indicado no existe.");
  }

  if (!clienteExiste.activo) {
    throw new Error("El cliente indicado está inactivo.");
  }

  const numeroOrden = await generarNumeroOrden();

  return prisma.ordenServicio.create({
    data: {
      clienteId: data.clienteId,
      numeroOrden,
      contactoNombre: data.contactoNombre,
      telefonoContacto: data.telefonoContacto,
      correoContacto: data.correoContacto,
      ubicacionServicio: data.ubicacionServicio,
      prioridad: data.prioridad ?? "media",
      tipoSolicitud: data.tipoSolicitud,
      origenSolicitud: data.origenSolicitud,
      descripcionProblema: data.descripcionProblema,
      fechaSolicitud: resolverFecha(data.fechaSolicitud) ?? new Date(),
      estado: "nueva",
    },
    include: {
      cliente: {
        select: {
          id: true,
          nombre: true,
        },
      },
    },
  });
}

/**
 * SECCIÓN 4.4
 * Lista órdenes con filtros opcionales.
 *
 * Filtros disponibles:
 * - estado
 * - clienteId
 * - texto
 */
export async function listarOrdenesServicio(filtros: {
  estado?: string;
  clienteId?: number;
  texto?: string;
}) {
  const estado = filtros.estado?.trim();
  const clienteId =
    typeof filtros.clienteId === "number" && Number.isInteger(filtros.clienteId)
      ? filtros.clienteId
      : undefined;
  const texto = filtros.texto?.trim();

  return prisma.ordenServicio.findMany({
    where: {
      ...(estado ? { estado } : {}),
      ...(clienteId ? { clienteId } : {}),
      ...(texto
        ? {
            OR: [
              { numeroOrden: { contains: texto, mode: "insensitive" } },
              { descripcionProblema: { contains: texto, mode: "insensitive" } },
              { contactoNombre: { contains: texto, mode: "insensitive" } },
              {
                cliente: {
                  nombre: { contains: texto, mode: "insensitive" },
                },
              },
            ],
          }
        : {}),
    },
    include: {
      cliente: {
        select: {
          id: true,
          nombre: true,
          telefono: true,
          correo: true,
        },
      },
      visitas: {
        select: {
          id: true,
          estado: true,
          fechaVisita: true,
        },
        orderBy: {
          fechaVisita: "desc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * SECCIÓN 4.5
 * Obtiene una orden por su ID.
 */
export async function obtenerOrdenServicioPorId(id: number) {
  const orden = await prisma.ordenServicio.findUnique({
    where: { id },
    include: {
      cliente: true,
      visitas: {
        include: {
          tecnico: {
            select: {
              id: true,
              nombre: true,
              email: true,
            },
          },
          reportes: {
            select: {
              id: true,
              numeroReporte: true,
              estado: true,
              fechaReporte: true,
            },
            orderBy: {
              fechaReporte: "desc",
            },
          },
        },
        orderBy: {
          fechaVisita: "desc",
        },
      },
    },
  });

  if (!orden) {
    throw new Error("La orden de servicio no existe.");
  }

  return orden;
}

/**
 * SECCIÓN 4.6
 * Actualiza datos básicos de una orden.
 */
export async function actualizarOrdenServicio(
  id: number,
  data: ActualizarOrdenServicioInput
) {
  const ordenExiste = await prisma.ordenServicio.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!ordenExiste) {
    throw new Error("La orden de servicio no existe.");
  }

  return prisma.ordenServicio.update({
    where: { id },
    data: {
      ...(data.contactoNombre !== undefined
        ? { contactoNombre: data.contactoNombre }
        : {}),
      ...(data.telefonoContacto !== undefined
        ? { telefonoContacto: data.telefonoContacto }
        : {}),
      ...(data.correoContacto !== undefined
        ? { correoContacto: data.correoContacto }
        : {}),
      ...(data.ubicacionServicio !== undefined
        ? { ubicacionServicio: data.ubicacionServicio }
        : {}),
      ...(data.prioridad !== undefined ? { prioridad: data.prioridad } : {}),
      ...(data.tipoSolicitud !== undefined
        ? { tipoSolicitud: data.tipoSolicitud }
        : {}),
      ...(data.origenSolicitud !== undefined
        ? { origenSolicitud: data.origenSolicitud }
        : {}),
      ...(data.descripcionProblema !== undefined
        ? { descripcionProblema: data.descripcionProblema }
        : {}),
      ...(data.fechaSolicitud !== undefined
        ? { fechaSolicitud: resolverFecha(data.fechaSolicitud) ?? undefined }
        : {}),
    },
    include: {
      cliente: {
        select: {
          id: true,
          nombre: true,
        },
      },
    },
  });
}

/**
 * SECCIÓN 4.7
 * Actualiza solamente el estado de una orden.
 */
export async function actualizarEstadoOrdenServicio(
  id: number,
  estado: EstadoOrdenServicio
) {
  const ordenExiste = await prisma.ordenServicio.findUnique({
    where: { id },
    select: { id: true, estado: true },
  });

  if (!ordenExiste) {
    throw new Error("La orden de servicio no existe.");
  }

  return prisma.ordenServicio.update({
    where: { id },
    data: { estado },
    include: {
      cliente: {
        select: {
          id: true,
          nombre: true,
        },
      },
    },
  });
}