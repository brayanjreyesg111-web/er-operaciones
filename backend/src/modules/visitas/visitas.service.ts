/*************************************************
 * visitas.service.ts
 * MÓDULO DE VISITAS
 * ETAPA 1 AJUSTADA A LA BASE REAL DEL ZIP
 *************************************************/

import { prisma } from "../../lib/prisma";

export interface CrearVisitaInput {
  clienteId: number | string;
  ordenServicioId?: number | string | null;
  tecnicoId: number | string;
  actividadId?: number | string | null;
  tipoVisita?: string | null;
  motivo?: string | null;
  resultado?: string | null;
  requiereCotizacion?: boolean;
  fechaProgramada?: string | Date | null;
  observaciones?: string | null;
}

export interface AsociarMaquinaInput {
  maquinaId: number | string;
}

function convertirANumero(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === "") return null;
  const numero = Number(valor);
  return Number.isNaN(numero) ? null : numero;
}

function convertirAFecha(valor: unknown): Date | null {
  if (!valor) return null;
  const fecha = valor instanceof Date ? valor : new Date(String(valor));
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function convertirABooleano(valor: unknown): boolean {
  if (typeof valor === "boolean") return valor;
  if (typeof valor === "string") return valor.toLowerCase() === "true";
  return false;
}

async function obtenerSiguienteNumeroVisita(): Promise<string> {
  const visitas = await prisma.visita.findMany({
    select: { numeroVisita: true },
    where: { numeroVisita: { not: null } },
  });

  let maxNumero = 0;

  for (const visita of visitas) {
    const numero = parseInt(String(visita.numeroVisita || "").replace(/\D/g, ""), 10);
    if (!Number.isNaN(numero) && numero > maxNumero) {
      maxNumero = numero;
    }
  }

  return `VIS-${String(maxNumero + 1).padStart(4, "0")}`;
}

const visitaInclude = {
  cliente: {
    select: {
      id: true,
      nombre: true,
      telefono: true,
      correo: true,
      departamento: { select: { id: true, nombre: true } },
      ciudad: { select: { id: true, nombre: true } },
    },
  },
  tecnico: { select: { id: true, nombre: true, email: true } },
  actividad: {
    select: {
      id: true,
      codigoActividad: true,
      titulo: true,
      categoriaActividad: true,
      estado: true,
      progresoPorcentaje: true,
    },
  },
  ordenServicio: {
    select: {
      id: true,
      numeroOrden: true,
      prioridad: true,
      estado: true,
    },
  },
  maquinas: {
    include: {
      maquina: {
        select: {
          id: true,
          codigoInterno: true,
          marca: true,
          modelo: true,
          serie: true,
          area: true,
        },
      },
    },
  },
  asignados: {
    include: {
      usuario: {
        select: { id: true, nombre: true, email: true },
      },
    },
  },
  reportes: {
    select: {
      id: true,
      numeroReporte: true,
      estado: true,
      fechaReporte: true,
    },
  },
} as const;

async function recalcularActividadSiCorresponde(actividadId: number | null | undefined) {
  if (!actividadId) return;

  const actividad = await prisma.actividad.findUnique({
    where: { id: actividadId },
    include: {
      visitas: { select: { id: true, estado: true } },
      pasos: { select: { id: true, estadoPaso: true } },
    },
  });

  if (!actividad) return;

  const visitas = actividad.visitas || [];
  const pasos = actividad.pasos || [];

  const totalPasos = pasos.length;
  const pasosHechos = pasos.filter((paso) => paso.estadoPaso === "HECHO").length;
  const progresoPasos = totalPasos ? Math.round((pasosHechos / totalPasos) * 100) : null;

  const totalVisitas = visitas.length;
  const visitasFinalizadas = visitas.filter((visita) => ["FINALIZADA", "ATENDIDA", "CERRADA"].includes(String(visita.estado || "").toUpperCase())).length;
  const progresoVisitas = totalVisitas ? Math.round((visitasFinalizadas / totalVisitas) * 100) : null;

  const progreso = Math.max(progresoPasos ?? 0, progresoVisitas ?? 0);
  const todasLasVisitasFinalizadas = totalVisitas > 0 && visitasFinalizadas === totalVisitas;
  const todosLosPasosHechos = totalPasos > 0 && pasosHechos === totalPasos;

  const estado = todasLasVisitasFinalizadas || todosLosPasosHechos
    ? "COMPLETADA"
    : progreso > 0
      ? "EN_PROCESO"
      : actividad.estado;

  await prisma.actividad.update({
    where: { id: actividadId },
    data: {
      progresoPorcentaje: progreso,
      estado,
      fechaFin: estado === "COMPLETADA" ? new Date() : actividad.fechaFin,
    },
  });
}

export async function crearVisitaService(data: CrearVisitaInput) {
  const clienteId = convertirANumero(data.clienteId);
  const ordenServicioId = convertirANumero(data.ordenServicioId);
  const tecnicoId = convertirANumero(data.tecnicoId);
  const actividadId = convertirANumero(data.actividadId);
  const fechaVisita = convertirAFecha(data.fechaProgramada);

  if (!clienteId) throw new Error("clienteId es obligatorio.");
  if (!tecnicoId) throw new Error("tecnicoId es obligatorio.");

  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId }, select: { id: true } });
  if (!cliente) throw new Error("El cliente indicado no existe.");

  const tecnico = await prisma.user.findUnique({ where: { id: tecnicoId }, select: { id: true } });
  if (!tecnico) throw new Error("El técnico indicado no existe.");

  if (ordenServicioId) {
    const orden = await prisma.ordenServicio.findUnique({
      where: { id: ordenServicioId },
      select: { id: true, clienteId: true },
    });

    if (!orden) throw new Error("La orden de servicio indicada no existe.");
    if (orden.clienteId !== clienteId) {
      throw new Error("La orden de servicio no pertenece al cliente indicado.");
    }
  }

  if (actividadId) {
    const actividad = await prisma.actividad.findUnique({
      where: { id: actividadId },
      select: { id: true, clienteId: true },
    });

    if (!actividad) throw new Error("La actividad indicada no existe.");
    if (actividad.clienteId && actividad.clienteId !== clienteId) {
      throw new Error("La actividad no pertenece al cliente indicado.");
    }
  }

  const numeroVisita = await obtenerSiguienteNumeroVisita();

  const visitaCreada = await prisma.visita.create({
    data: {
      numeroVisita,
      clienteId,
      ordenServicioId,
      tecnicoId,
      actividadId,
      tipoVisita: data.tipoVisita ? String(data.tipoVisita).trim() : null,
      motivoVisita: data.motivo ? String(data.motivo).trim() : null,
      resultadoBreve: data.resultado ? String(data.resultado).trim() : null,
      estado: "PENDIENTE",
      requiereCotizacion: convertirABooleano(data.requiereCotizacion),
      esVisitaLibre: !ordenServicioId,
      fechaVisita: fechaVisita ?? new Date(),
      horaInicio: null,
      horaFin: null,
      observaciones: data.observaciones ? String(data.observaciones).trim() : null,
      asignados: {
        create: {
          usuarioId: tecnicoId,
          rolEnVisita: "RESPONSABLE",
          estadoAsignacion: "ASIGNADA",
        },
      },
    },
    include: visitaInclude,
  });

  if (actividadId) {
    await recalcularActividadSiCorresponde(actividadId);
  }

  return visitaCreada;
}

export async function listarVisitasService(filtros: Record<string, unknown>) {
  const where: Record<string, unknown> = {};

  const clienteId = convertirANumero(filtros.clienteId);
  const ordenServicioId = convertirANumero(filtros.ordenServicioId);
  const tecnicoId = convertirANumero(filtros.tecnicoId);
  const actividadId = convertirANumero(filtros.actividadId);

  if (clienteId) where.clienteId = clienteId;
  if (ordenServicioId) where.ordenServicioId = ordenServicioId;
  if (tecnicoId) where.tecnicoId = tecnicoId;
  if (actividadId) where.actividadId = actividadId;
  if (filtros.tipoVisita) where.tipoVisita = String(filtros.tipoVisita).trim();
  if (filtros.resultado) where.resultadoBreve = String(filtros.resultado).trim();
  if (filtros.estado) where.estado = String(filtros.estado).trim();
  if (filtros.requiereCotizacion !== undefined) {
    where.requiereCotizacion = convertirABooleano(filtros.requiereCotizacion);
  }
  if (filtros.esVisitaLibre !== undefined) {
    where.esVisitaLibre = convertirABooleano(filtros.esVisitaLibre);
  }

  return prisma.visita.findMany({
    where,
    orderBy: { id: "desc" },
    include: visitaInclude,
  });
}

export async function obtenerVisitaPorIdService(id: number) {
  if (!id || Number.isNaN(id)) throw new Error("El ID de la visita no es válido.");

  const visita = await prisma.visita.findUnique({ where: { id }, include: visitaInclude });
  if (!visita) throw new Error("La visita no existe.");
  return visita;
}

export async function asociarMaquinasAVisitaService(visitaId: number, maquinas: AsociarMaquinaInput[]) {
  if (!visitaId || Number.isNaN(visitaId)) throw new Error("El ID de la visita no es válido.");
  if (!Array.isArray(maquinas) || maquinas.length === 0) throw new Error("Debes enviar al menos una máquina.");

  const visita = await prisma.visita.findUnique({ where: { id: visitaId }, select: { id: true, clienteId: true } });
  if (!visita) throw new Error("La visita no existe.");

  const maquinasNormalizadas = maquinas.map((item) => {
    const maquinaId = convertirANumero(item.maquinaId);
    if (!maquinaId) throw new Error("Uno de los maquinaId enviados no es válido.");
    return { maquinaId };
  });

  const idsMaquinas = maquinasNormalizadas.map((item) => item.maquinaId);
  const maquinasExistentes = await prisma.maquina.findMany({
    where: { id: { in: idsMaquinas } },
    select: { id: true, clienteId: true },
  });

  if (maquinasExistentes.length !== idsMaquinas.length) {
    throw new Error("Una o más máquinas indicadas no existen.");
  }

  const maquinasDeOtroCliente = maquinasExistentes.filter((maquina) => maquina.clienteId !== visita.clienteId);
  if (maquinasDeOtroCliente.length > 0) {
    throw new Error("Una o más máquinas no pertenecen al cliente relacionado con la visita.");
  }

  for (const maquina of maquinasNormalizadas) {
    await prisma.visitaMaquina.upsert({
      where: { visitaId_maquinaId: { visitaId, maquinaId: maquina.maquinaId } },
      update: {},
      create: { visitaId, maquinaId: maquina.maquinaId },
    });
  }

  return obtenerVisitaPorIdService(visitaId);
}

export async function finalizarVisitaService(visitaId: number, payload?: { motivoEstado?: string | null; observaciones?: string | null; }) {
  if (!visitaId || Number.isNaN(visitaId)) {
    throw new Error("El ID de la visita no es válido.");
  }

  const visita = await prisma.visita.findUnique({
    where: { id: visitaId },
    include: { reportes: { select: { id: true } } },
  });

  if (!visita) throw new Error("La visita no existe.");

  const visitaActualizada = await prisma.visita.update({
    where: { id: visitaId },
    data: {
      estado: "FINALIZADA",
      motivoEstado: payload?.motivoEstado ? String(payload.motivoEstado).trim() : visita.motivoEstado,
      observaciones: payload?.observaciones ? String(payload.observaciones).trim() : visita.observaciones,
      horaFin: visita.horaFin ?? new Date(),
    },
    include: visitaInclude,
  });

  await recalcularActividadSiCorresponde(visita.actividadId);
  return visitaActualizada;
}
