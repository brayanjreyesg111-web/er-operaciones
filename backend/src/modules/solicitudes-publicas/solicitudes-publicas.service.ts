import { prisma } from "../../lib/prisma";

type CrearSolicitudPublicaInput = {
  nombreSolicitante: string;
  telefono: string;
  correo?: string;
  empresa?: string;
  departamentoId: number;
  ciudadId: number;
  direccionExacta?: string;
  tipoServicio?: string;
  descripcion: string;
  fechaDeseada?: string | Date;
};

function limpiarTexto(valor?: string | null): string | null {
  const limpio = String(valor || "").trim();
  return limpio ? limpio : null;
}

function convertirAFecha(valor?: string | Date) {
  if (!valor) return null;
  const fecha = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(fecha.getTime())) throw new Error("La fechaDeseada no es válida.");
  return fecha;
}

function nombreClienteDesdeSolicitud(data: CrearSolicitudPublicaInput): string {
  const solicitante = limpiarTexto(data.nombreSolicitante);
  return solicitante || "Cliente sin nombre";
}

async function resolverClienteDesdeSolicitud(data: CrearSolicitudPublicaInput) {
  const nombre = nombreClienteDesdeSolicitud(data);
  const correo = limpiarTexto(data.correo);
  const telefono = limpiarTexto(data.telefono);
  const solicitante = limpiarTexto(data.nombreSolicitante);
  const empresa = limpiarTexto(data.empresa);

  const clienteExistente = await prisma.cliente.findFirst({
    where: {
      activo: true,
      OR: [
        ...(correo ? [{ correo }] : []),
        ...(telefono ? [{ telefono }] : []),
        { nombre: { equals: nombre, mode: "insensitive" } },
      ],
    },
    select: { id: true },
  });

  if (clienteExistente) {
    return prisma.cliente.update({
      where: { id: clienteExistente.id },
      data: {
        contactoNombre: empresa || solicitante || undefined,
        telefono: telefono || undefined,
        correo: correo || undefined,
        direccion: limpiarTexto(data.direccionExacta) || undefined,
        ubicacion: limpiarTexto(data.direccionExacta) || undefined,
        departamentoId: data.departamentoId || undefined,
        ciudadId: data.ciudadId || undefined,
      },
      select: { id: true, nombre: true },
    });
  }

  return prisma.cliente.create({
    data: {
      nombre,
      contactoNombre: empresa || solicitante,
      telefono,
      correo,
      direccion: limpiarTexto(data.direccionExacta),
      ubicacion: limpiarTexto(data.direccionExacta),
      departamentoId: data.departamentoId,
      ciudadId: data.ciudadId,
      activo: true,
    },
    select: { id: true, nombre: true },
  });
}

const solicitudInclude = {
  cliente: { select: { id: true, nombre: true, telefono: true, correo: true } },
  departamento: { select: { id: true, nombre: true } },
  ciudad: { select: { id: true, nombre: true } },
  asignadoA: { select: { id: true, nombre: true, email: true } },
} as const;

export async function crearSolicitudPublicaService(data: CrearSolicitudPublicaInput) {
  const departamentoId = Number(data.departamentoId);
  const ciudadId = Number(data.ciudadId);
  if (!Number.isInteger(departamentoId) || departamentoId <= 0) throw new Error("El departamento es obligatorio.");
  if (!Number.isInteger(ciudadId) || ciudadId <= 0) throw new Error("La ciudad es obligatoria.");
  if (!limpiarTexto(data.nombreSolicitante)) throw new Error("El nombre del solicitante es obligatorio.");
  if (!limpiarTexto(data.telefono)) throw new Error("El teléfono es obligatorio.");
  if (!limpiarTexto(data.descripcion)) throw new Error("La descripción es obligatoria.");

  const departamento = await prisma.departamento.findUnique({ where: { id: departamentoId }, select: { id: true } });
  if (!departamento) throw new Error("El departamento indicado no existe.");

  const ciudad = await prisma.ciudad.findUnique({ where: { id: ciudadId }, select: { id: true, departamentoId: true } });
  if (!ciudad) throw new Error("La ciudad indicada no existe.");
  if (ciudad.departamentoId !== departamentoId) throw new Error("La ciudad no pertenece al departamento seleccionado.");

  const cliente = await resolverClienteDesdeSolicitud({ ...data, departamentoId, ciudadId });

  return prisma.solicitudServicio.create({
    data: {
      clienteId: cliente.id,
      nombreSolicitante: limpiarTexto(data.nombreSolicitante)!,
      telefono: limpiarTexto(data.telefono)!,
      correo: limpiarTexto(data.correo),
      empresa: limpiarTexto(data.empresa),
      departamentoId,
      ciudadId,
      direccionExacta: limpiarTexto(data.direccionExacta),
      tipoServicio: limpiarTexto(data.tipoServicio),
      descripcion: limpiarTexto(data.descripcion)!,
      fechaDeseada: convertirAFecha(data.fechaDeseada),
      estado: "NUEVA",
      canalOrigen: "PORTAL_WEB",
      motivoEstado: `Cliente asociado automáticamente: ${cliente.nombre}`,
    },
    include: solicitudInclude,
  });
}

function normalizarEstadoFiltro(valor?: unknown): string | undefined {
  const limpio = String(valor || "").trim().toUpperCase();
  return limpio || undefined;
}

export async function listarSolicitudesPublicasService(filtros: Record<string, unknown> = {}) {
  const estado = normalizarEstadoFiltro(filtros.estado);
  const pendientesRaw = String(filtros.pendientes || "").trim().toLowerCase();
  const soloPendientes = ["true", "1", "si", "sí", "yes"].includes(pendientesRaw);

  const estadosPendientes = ["NUEVA", "PENDIENTE", "EN_REVISION", "PROGRAMADA"];

  return prisma.solicitudServicio.findMany({
    where: {
      ...(estado ? { estado } : {}),
      ...(soloPendientes ? { estado: { in: estadosPendientes } } : {}),
    },
    orderBy: { id: "desc" },
    include: solicitudInclude,
  });
}

export async function actualizarEstadoSolicitudPublicaService(solicitudId: number, estado: string, motivoEstado?: string | null) {
  if (!Number.isInteger(solicitudId) || solicitudId <= 0) throw new Error("El ID de la solicitud no es válido.");
  const estadoFinal = String(estado || "").trim().toUpperCase();
  if (!estadoFinal) throw new Error("El estado de la solicitud es obligatorio.");
  const solicitud = await prisma.solicitudServicio.findUnique({ where: { id: solicitudId }, select: { id: true } });
  if (!solicitud) throw new Error("La solicitud pública no existe.");
  return prisma.solicitudServicio.update({
    where: { id: solicitudId },
    data: { estado: estadoFinal, motivoEstado: motivoEstado ? String(motivoEstado).trim() : null, fechaGestion: new Date() },
    include: solicitudInclude,
  });
}
