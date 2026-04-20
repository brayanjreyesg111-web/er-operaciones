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

function convertirAFecha(valor?: string | Date) {
  if (!valor) return null;
  const fecha = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(fecha.getTime())) {
    throw new Error("La fechaDeseada no es válida.");
  }
  return fecha;
}

export async function crearSolicitudPublicaService(data: CrearSolicitudPublicaInput) {
  const departamento = await prisma.departamento.findUnique({
    where: { id: data.departamentoId },
    select: { id: true },
  });

  if (!departamento) {
    throw new Error("El departamento indicado no existe.");
  }

  const ciudad = await prisma.ciudad.findUnique({
    where: { id: data.ciudadId },
    select: { id: true, departamentoId: true },
  });

  if (!ciudad) {
    throw new Error("La ciudad indicada no existe.");
  }

  if (ciudad.departamentoId !== data.departamentoId) {
    throw new Error("La ciudad no pertenece al departamento seleccionado.");
  }

  return prisma.solicitudServicio.create({
    data: {
      nombreSolicitante: data.nombreSolicitante.trim(),
      telefono: data.telefono.trim(),
      correo: data.correo?.trim() || null,
      empresa: data.empresa?.trim() || null,
      departamentoId: data.departamentoId,
      ciudadId: data.ciudadId,
      direccionExacta: data.direccionExacta?.trim() || null,
      tipoServicio: data.tipoServicio?.trim() || null,
      descripcion: data.descripcion.trim(),
      fechaDeseada: convertirAFecha(data.fechaDeseada),
      estado: "NUEVA",
      canalOrigen: "PORTAL_WEB",
    },
    include: {
      departamento: {
        select: {
          id: true,
          nombre: true,
        },
      },
      ciudad: {
        select: {
          id: true,
          nombre: true,
        },
      },
      asignadoA: {
        select: {
          id: true,
          nombre: true,
          email: true,
        },
      },
    },
  });
}

export async function listarSolicitudesPublicasService() {
  return prisma.solicitudServicio.findMany({
    orderBy: { id: "desc" },
    include: {
      departamento: {
        select: {
          id: true,
          nombre: true,
        },
      },
      ciudad: {
        select: {
          id: true,
          nombre: true,
        },
      },
      asignadoA: {
        select: {
          id: true,
          nombre: true,
          email: true,
        },
      },
    },
  });
}
