/*************************************************
 * actividades.service.ts
 * MÓDULO DE ACTIVIDADES INTERNAS Y OPERATIVAS
 *************************************************/

import { prisma } from "../../lib/prisma";

export interface ActividadPasoInput {
  tituloPaso: string;
  descripcionPaso?: string | null;
  obligatorio?: boolean;
}

export interface CrearActividadInput {
  titulo: string;
  descripcion?: string | null;
  categoriaActividad?: string | null;
  tipoOrigen?: string | null;
  clienteId?: number | string | null;
  ordenServicioId?: number | string | null;
  solicitudId?: number | string | null;
  prioridad?: string | null;
  fechaProgramada?: string | Date | null;
  requiereReporte?: boolean;
  requiereVisita?: boolean;
  creadoPorId: number | string;
  observaciones?: string | null;
  asignadoAUserId?: number | string | null;
  pasos?: ActividadPasoInput[];
}

export interface ActualizarPasoInput {
  estadoPaso: string;
  realizadoPorId?: number | string | null;
}

export interface CrearMensajeActividadInput {
  usuarioId: number | string;
  creadoParaUserId?: number | string | null;
  tipoMensaje?: string | null;
  asunto?: string | null;
  mensaje: string;
  prioridad?: string | null;
}

function convertirANumero(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === "") return null;
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 ? numero : null;
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

function esErrorUnicoPrisma(error: unknown) {
  const posible = error as { code?: string } | null;
  return Boolean(posible && posible.code === "P2002");
}

async function obtenerSiguienteCodigoActividad(): Promise<string> {
  const actividades = await prisma.actividad.findMany({
    select: { codigoActividad: true },
    where: { codigoActividad: { startsWith: "ACT-" } },
  });

  let maxNumero = 0;

  for (const actividad of actividades) {
    const match = String(actividad.codigoActividad || "").match(/ACT-(\d+)/i);
    const numero = match ? Number(match[1]) : NaN;
    if (Number.isInteger(numero) && numero > maxNumero) maxNumero = numero;
  }

  for (let siguiente = maxNumero + 1; siguiente <= maxNumero + 5000; siguiente += 1) {
    const codigo = `ACT-${String(siguiente).padStart(4, "0")}`;
    const existe = await prisma.actividad.findUnique({
      where: { codigoActividad: codigo },
      select: { id: true },
    });

    if (!existe) return codigo;
  }

  throw new Error("No se pudo generar un código de actividad disponible.");
}

const actividadInclude = {
  cliente: { select: { id: true, nombre: true, telefono: true, correo: true } },
  ordenServicio: { select: { id: true, numeroOrden: true, estado: true, prioridad: true } },
  solicitud: {
    select: {
      id: true,
      nombreSolicitante: true,
      telefono: true,
      empresa: true,
      tipoServicio: true,
      estado: true,
    },
  },
  creadoPor: { select: { id: true, nombre: true, email: true } },
  asignados: {
    include: {
      usuario: { select: { id: true, nombre: true, email: true } },
    },
  },
  pasos: { orderBy: { orden: "asc" } },
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
  visitas: {
    select: {
      id: true,
      numeroVisita: true,
      estado: true,
      fechaVisita: true,
    },
    orderBy: { id: "desc" },
  },
  mensajes: {
    orderBy: { id: "desc" },
    take: 8,
    include: {
      usuario: { select: { id: true, nombre: true, email: true } },
    },
  },
} as const;

async function recalcularActividad(actividadId: number) {
  const actividad = await prisma.actividad.findUnique({
    where: { id: actividadId },
    include: {
      pasos: { select: { id: true, estadoPaso: true } },
      visitas: { select: { id: true, estado: true } },
    },
  });

  if (!actividad) return;

  const pasos = actividad.pasos || [];
  const visitas = actividad.visitas || [];

  const pasosHechos = pasos.filter((paso) =>
    ["HECHO", "FINALIZADO", "COMPLETADO"].includes(String(paso.estadoPaso || "").toUpperCase())
  ).length;

  const visitasFinalizadas = visitas.filter((visita) =>
    ["FINALIZADA", "ATENDIDA", "COMPLETADA", "CERRADA"].includes(String(visita.estado || "").toUpperCase())
  ).length;

  const progresoPasos = pasos.length ? Math.round((pasosHechos / pasos.length) * 100) : 0;
  const progresoVisitas = visitas.length ? Math.round((visitasFinalizadas / visitas.length) * 100) : 0;
  const progreso = Math.max(progresoPasos, progresoVisitas);

  const todoHecho =
    (pasos.length > 0 && pasosHechos === pasos.length) ||
    (visitas.length > 0 && visitasFinalizadas === visitas.length);

  const estado = todoHecho
    ? "COMPLETADA"
    : progreso > 0
      ? "EN_PROCESO"
      : actividad.estado;

  await prisma.actividad.update({
    where: { id: actividadId },
    data: {
      progresoPorcentaje: progreso,
      estado,
      fechaInicio: progreso > 0 && !actividad.fechaInicio ? new Date() : actividad.fechaInicio,
      fechaFin: estado === "COMPLETADA" ? new Date() : actividad.fechaFin,
    },
  });
}

export async function listarActividadesService(filtros: Record<string, unknown>) {
  const where: any = {};

  const usuarioId = convertirANumero(filtros.usuarioId ?? filtros.asignadoAUserId);
  const clienteId = convertirANumero(filtros.clienteId);
  const ordenServicioId = convertirANumero(filtros.ordenServicioId);
  const solicitudId = convertirANumero(filtros.solicitudId);

  if (usuarioId) where.asignados = { some: { usuarioId } };
  if (clienteId) where.clienteId = clienteId;
  if (ordenServicioId) where.ordenServicioId = ordenServicioId;
  if (solicitudId) where.solicitudId = solicitudId;
  if (filtros.estado) where.estado = String(filtros.estado).trim();
  if (filtros.categoriaActividad) where.categoriaActividad = String(filtros.categoriaActividad).trim();

  return prisma.actividad.findMany({
    where,
    orderBy: { id: "desc" },
    include: actividadInclude,
  });
}

export async function obtenerActividadPorIdService(id: number) {
  if (!Number.isInteger(id) || id <= 0) throw new Error("El ID de la actividad no es válido.");

  const actividad = await prisma.actividad.findUnique({
    where: { id },
    include: actividadInclude,
  });

  if (!actividad) throw new Error("La actividad no existe.");
  return actividad;
}

export async function crearActividadService(data: CrearActividadInput) {
  const titulo = String(data.titulo || "").trim();
  const creadoPorId = convertirANumero(data.creadoPorId);
  const asignadoAUserId = convertirANumero(data.asignadoAUserId);
  const clienteId = convertirANumero(data.clienteId);
  const ordenServicioId = convertirANumero(data.ordenServicioId);
  const solicitudId = convertirANumero(data.solicitudId);
  const fechaProgramada = convertirAFecha(data.fechaProgramada);

  if (!titulo) throw new Error("El título de la actividad es obligatorio.");
  if (!creadoPorId) throw new Error("creadoPorId es obligatorio.");
  if (!asignadoAUserId) throw new Error("Debes seleccionar el usuario responsable.");

  const creador = await prisma.user.findUnique({
    where: { id: creadoPorId },
    select: { id: true, activo: true },
  });
  if (!creador || !creador.activo) throw new Error("El usuario creador no existe o está inactivo.");

  const responsable = await prisma.user.findUnique({
    where: { id: asignadoAUserId },
    select: { id: true, activo: true },
  });
  if (!responsable || !responsable.activo) throw new Error("El responsable indicado no existe o está inactivo.");

  if (clienteId) {
    const cliente = await prisma.cliente.findUnique({ where: { id: clienteId }, select: { id: true } });
    if (!cliente) throw new Error("El cliente indicado no existe.");
  }

  if (ordenServicioId) {
    const orden = await prisma.ordenServicio.findUnique({ where: { id: ordenServicioId }, select: { id: true } });
    if (!orden) throw new Error("La orden de trabajo indicada no existe.");
  }

  if (solicitudId) {
    const solicitud = await prisma.solicitudServicio.findUnique({ where: { id: solicitudId }, select: { id: true } });
    if (!solicitud) throw new Error("La solicitud indicada no existe.");
  }

  const pasosEntrada = Array.isArray(data.pasos) ? data.pasos : [];
  const pasosValidos = pasosEntrada
    .map((paso) => ({
      tituloPaso: String(paso.tituloPaso || "").trim(),
      descripcionPaso: paso.descripcionPaso ? String(paso.descripcionPaso).trim() : null,
      obligatorio: paso.obligatorio !== false,
    }))
    .filter((paso) => paso.tituloPaso);

  let actividad;

  for (let intento = 0; intento < 25; intento += 1) {
    const codigoActividad = await obtenerSiguienteCodigoActividad();

    try {
      actividad = await prisma.actividad.create({
        data: {
          codigoActividad,
          titulo,
          descripcion: data.descripcion ? String(data.descripcion).trim() : null,
          categoriaActividad: data.categoriaActividad ? String(data.categoriaActividad).trim() : "GENERAL",
          tipoOrigen: data.tipoOrigen ? String(data.tipoOrigen).trim() : "INTERNA",
          clienteId,
          ordenServicioId,
          solicitudId,
          prioridad: data.prioridad ? String(data.prioridad).trim() : "MEDIA",
          estado: "PENDIENTE",
          fechaProgramada,
          progresoPorcentaje: 0,
          requiereReporte: convertirABooleano(data.requiereReporte),
          requiereVisita: convertirABooleano(data.requiereVisita),
          creadoPorId,
          observaciones: data.observaciones ? String(data.observaciones).trim() : null,
          asignados: {
            create: {
              usuarioId: asignadoAUserId,
              rolEnActividad: "RESPONSABLE",
              estadoAsignacion: "ASIGNADA",
            },
          },
          pasos: pasosValidos.length
            ? {
                create: pasosValidos.map((paso, index) => ({
                  orden: index + 1,
                  tituloPaso: paso.tituloPaso,
                  descripcionPaso: paso.descripcionPaso,
                  obligatorio: paso.obligatorio,
                  estadoPaso: "PENDIENTE",
                  porcentajePaso: 0,
                })),
              }
            : undefined,
        },
        include: actividadInclude,
      });
      break;
    } catch (error) {
      if (esErrorUnicoPrisma(error)) continue;
      throw error;
    }
  }

  if (!actividad) {
    throw new Error("No se pudo crear la actividad porque el código generado se repitió varias veces.");
  }

  if (solicitudId) {
    await prisma.solicitudServicio.update({
      where: { id: solicitudId },
      data: { estado: "EN_REVISION", fechaGestion: new Date(), asignadoAUserId },
    });
  }

  return actividad;
}

export async function actualizarPasoActividadService(
  actividadId: number,
  pasoId: number,
  data: ActualizarPasoInput
) {
  if (!Number.isInteger(actividadId) || actividadId <= 0) throw new Error("El ID de la actividad no es válido.");
  if (!Number.isInteger(pasoId) || pasoId <= 0) throw new Error("El ID del paso no es válido.");

  const paso = await prisma.actividadPaso.findUnique({
    where: { id: pasoId },
    select: { id: true, actividadId: true },
  });

  if (!paso || paso.actividadId !== actividadId) {
    throw new Error("El paso no pertenece a la actividad indicada.");
  }

  const estadoPaso = String(data.estadoPaso || "").trim().toUpperCase();
  const realizadoPorId = convertirANumero(data.realizadoPorId);

  if (!estadoPaso) throw new Error("estadoPaso es obligatorio.");

  await prisma.actividadPaso.update({
    where: { id: pasoId },
    data: {
      estadoPaso,
      porcentajePaso: ["HECHO", "FINALIZADO", "COMPLETADO"].includes(estadoPaso) ? 100 : 0,
      realizadoPorId: realizadoPorId || null,
      fechaRealizacion: ["HECHO", "FINALIZADO", "COMPLETADO"].includes(estadoPaso) ? new Date() : null,
    },
  });

  await recalcularActividad(actividadId);
  return obtenerActividadPorIdService(actividadId);
}

export async function crearMensajeActividadService(
  actividadId: number,
  payload: CrearMensajeActividadInput
) {
  if (!Number.isInteger(actividadId) || actividadId <= 0) throw new Error("El ID de la actividad no es válido.");

  const usuarioId = convertirANumero(payload.usuarioId);
  const creadoParaUserId = convertirANumero(payload.creadoParaUserId);

  if (!usuarioId) throw new Error("usuarioId es obligatorio.");
  if (!String(payload.mensaje || "").trim()) throw new Error("El mensaje es obligatorio.");

  const actividad = await prisma.actividad.findUnique({ where: { id: actividadId }, select: { id: true } });
  if (!actividad) throw new Error("La actividad no existe.");

  const mensaje = await prisma.actividadMensaje.create({
    data: {
      actividadId,
      usuarioId,
      creadoParaUserId,
      tipoMensaje: payload.tipoMensaje ? String(payload.tipoMensaje).trim() : "COMENTARIO_ACTIVIDAD",
      asunto: payload.asunto ? String(payload.asunto).trim() : null,
      mensaje: String(payload.mensaje).trim(),
      prioridad: payload.prioridad ? String(payload.prioridad).trim() : "MEDIA",
      estado: "NUEVO",
    },
    include: {
      usuario: { select: { id: true, nombre: true, email: true } },
    },
  });

  return mensaje;
}
