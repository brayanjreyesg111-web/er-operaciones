import { prisma } from "../../lib/prisma";
import type {
  ActualizarOrdenServicioInput,
  CrearOrdenServicioInput,
  EstadoOrdenServicio,
} from "./ordenes-servicio.validation";

function resolverFecha(fecha?: string): Date | undefined {
  if (!fecha) return undefined;
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return undefined;
  return valor;
}

async function generarNumeroOrden(): Promise<string> {
  const ultimaOrden = await prisma.ordenServicio.findFirst({ orderBy: { id: "desc" }, select: { id: true } });
  const siguienteNumero = (ultimaOrden?.id ?? 0) + 1;
  return `OS-${String(siguienteNumero).padStart(6, "0")}`;
}

export async function marcarSolicitudComoConvertida(solicitudId: number, numeroOrden?: string) {
  if (!Number.isInteger(solicitudId) || solicitudId <= 0) return null;

  const solicitud = await prisma.solicitudServicio.findUnique({
    where: { id: solicitudId },
    select: { id: true, estado: true },
  });

  if (!solicitud) throw new Error("La solicitud pública relacionada no existe.");
  if (["CONVERTIDA", "ORDEN_GENERADA", "GESTIONADA"].includes(String(solicitud.estado || "").toUpperCase())) {
    throw new Error("Esta solicitud ya fue convertida a orden de trabajo.");
  }

  return prisma.solicitudServicio.update({
    where: { id: solicitudId },
    data: {
      estado: "ORDEN_GENERADA",
      motivoEstado: numeroOrden ? `Orden generada: ${numeroOrden}` : "Orden de trabajo generada",
      fechaGestion: new Date(),
    },
  });
}

export async function crearOrdenServicio(data: CrearOrdenServicioInput) {
  if (data.solicitudId) {
    const solicitud = await prisma.solicitudServicio.findUnique({
      where: { id: data.solicitudId },
      select: { id: true, clienteId: true, estado: true },
    });

    if (!solicitud) throw new Error("La solicitud pública relacionada no existe.");
    if (["CONVERTIDA", "ORDEN_GENERADA", "GESTIONADA"].includes(String(solicitud.estado || "").toUpperCase())) {
      throw new Error("Esta solicitud ya fue convertida a orden de trabajo.");
    }
    if (solicitud.clienteId && solicitud.clienteId !== data.clienteId) {
      throw new Error("La solicitud pública pertenece a otro cliente. Recarga el dashboard y vuelve a intentar.");
    }
  }

  const clienteExiste = await prisma.cliente.findUnique({
    where: { id: data.clienteId },
    select: { id: true, nombre: true, activo: true },
  });

  if (!clienteExiste) throw new Error("El cliente indicado no existe.");
  if (!clienteExiste.activo) throw new Error("El cliente indicado está inactivo.");

  const numeroOrden = await generarNumeroOrden();

  const orden = await prisma.ordenServicio.create({
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
    include: { cliente: { select: { id: true, nombre: true } } },
  });

  if (data.solicitudId) await marcarSolicitudComoConvertida(data.solicitudId, orden.numeroOrden);
  return orden;
}

export async function listarOrdenesServicio(filtros: { estado?: string; clienteId?: number; texto?: string; sinVisita?: boolean }) {
  const estado = filtros.estado?.trim();
  const clienteId = typeof filtros.clienteId === "number" && Number.isInteger(filtros.clienteId) ? filtros.clienteId : undefined;
  const texto = filtros.texto?.trim();

  return prisma.ordenServicio.findMany({
    where: {
      ...(estado ? { estado } : {}),
      ...(clienteId ? { clienteId } : {}),
      ...(filtros.sinVisita ? { visitas: { none: {} } } : {}),
      ...(texto
        ? {
            OR: [
              { numeroOrden: { contains: texto, mode: "insensitive" } },
              { descripcionProblema: { contains: texto, mode: "insensitive" } },
              { contactoNombre: { contains: texto, mode: "insensitive" } },
              { cliente: { nombre: { contains: texto, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      cliente: { select: { id: true, nombre: true, telefono: true, correo: true } },
      visitas: { select: { id: true, estado: true, fechaVisita: true }, orderBy: { fechaVisita: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function obtenerOrdenServicioPorId(id: number) {
  const orden = await prisma.ordenServicio.findUnique({
    where: { id },
    include: {
      cliente: true,
      visitas: {
        include: {
          tecnico: { select: { id: true, nombre: true, email: true } },
          reportes: { select: { id: true, numeroReporte: true, estado: true, fechaReporte: true }, orderBy: { fechaReporte: "desc" } },
        },
        orderBy: { fechaVisita: "desc" },
      },
    },
  });
  if (!orden) throw new Error("La orden de servicio no existe.");
  return orden;
}

export async function actualizarOrdenServicio(id: number, data: ActualizarOrdenServicioInput) {
  const ordenExiste = await prisma.ordenServicio.findUnique({ where: { id }, select: { id: true } });
  if (!ordenExiste) throw new Error("La orden de servicio no existe.");

  return prisma.ordenServicio.update({
    where: { id },
    data: {
      ...(data.contactoNombre !== undefined ? { contactoNombre: data.contactoNombre } : {}),
      ...(data.telefonoContacto !== undefined ? { telefonoContacto: data.telefonoContacto } : {}),
      ...(data.correoContacto !== undefined ? { correoContacto: data.correoContacto } : {}),
      ...(data.ubicacionServicio !== undefined ? { ubicacionServicio: data.ubicacionServicio } : {}),
      ...(data.prioridad !== undefined ? { prioridad: data.prioridad } : {}),
      ...(data.tipoSolicitud !== undefined ? { tipoSolicitud: data.tipoSolicitud } : {}),
      ...(data.origenSolicitud !== undefined ? { origenSolicitud: data.origenSolicitud } : {}),
      ...(data.descripcionProblema !== undefined ? { descripcionProblema: data.descripcionProblema } : {}),
      ...(data.fechaSolicitud !== undefined ? { fechaSolicitud: resolverFecha(data.fechaSolicitud) ?? undefined } : {}),
    },
    include: { cliente: { select: { id: true, nombre: true } } },
  });
}

export async function actualizarEstadoOrdenServicio(id: number, estado: EstadoOrdenServicio) {
  const ordenExiste = await prisma.ordenServicio.findUnique({ where: { id }, select: { id: true, estado: true } });
  if (!ordenExiste) throw new Error("La orden de servicio no existe.");

  return prisma.ordenServicio.update({
    where: { id },
    data: { estado },
    include: { cliente: { select: { id: true, nombre: true } } },
  });
}
