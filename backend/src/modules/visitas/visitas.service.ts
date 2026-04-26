/*************************************************
 * visitas.service.ts
 * MÓDULO DE VISITAS
 * ETAPA 1 AJUSTADA A LA BASE REAL DEL ZIP
 *************************************************/

import fs from "node:fs";
import path from "node:path";
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

export interface AsignarTecnicoVisitaInput {
  tecnicoId: number | string;
  rolEnVisita?: string | null;
  motivoEstado?: string | null;
  observaciones?: string | null;
}

export interface ArchivoComentarioInput {
  nombreArchivo: string;
  contenidoBase64: string;
  mimeType?: string | null;
}

export interface CrearComentarioVisitaInput {
  usuarioId: number | string;
  actividadId?: number | string | null;
  tipoMensaje?: string | null;
  asunto?: string | null;
  mensaje?: string | null;
  prioridad?: string | null;
  creadoParaUserId?: number | string | null;
  archivos?: ArchivoComentarioInput[];
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

function limpiarBase64(valor: string): string {
  return String(valor || "").replace(/^data:.*;base64,/, "");
}

function sanitizarNombreArchivo(nombreArchivo: string): string {
  return (nombreArchivo || "archivo")
    .trim()
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .replace(/\s+/g, "_") || "archivo";
}

function obtenerBaseUrlLocal(): string {
  return process.env.APP_BASE_URL?.trim() || "http://localhost:3001";
}

function construirUrlStorage(relativa: string): string {
  return `${obtenerBaseUrlLocal()}/storage/${relativa.split(path.sep).join("/")}`;
}

async function guardarArchivosComentarioVisita(
  visitaId: number,
  archivos: ArchivoComentarioInput[] = []
) {
  const guardados: Array<{
    nombreArchivo: string;
    nombreGuardado: string;
    mimeType: string | null;
    tamanoBytes: number;
    rutaArchivo: string;
    urlLocal: string;
  }> = [];

  if (!archivos.length) return guardados;

  const carpetaRelativa = path.join("visitas", `visita_${visitaId}`, "comentarios");
  const carpetaCompleta = path.resolve(process.cwd(), "storage", carpetaRelativa);
  fs.mkdirSync(carpetaCompleta, { recursive: true });

  for (const [index, archivo] of archivos.entries()) {
    if (!archivo.nombreArchivo?.trim()) {
      throw new Error("Todos los archivos del comentario deben incluir nombreArchivo.");
    }

    if (!archivo.contenidoBase64?.trim()) {
      throw new Error(`El archivo ${archivo.nombreArchivo} no tiene contenidoBase64.`);
    }

    const nombreLimpio = sanitizarNombreArchivo(archivo.nombreArchivo);
    const nombreGuardado = `${Date.now()}_${index + 1}_${nombreLimpio}`;
    const rutaArchivo = path.join(carpetaCompleta, nombreGuardado);
    const buffer = Buffer.from(limpiarBase64(archivo.contenidoBase64), "base64");

    fs.writeFileSync(rutaArchivo, buffer);
    const stats = fs.statSync(rutaArchivo);

    const rutaRelativaArchivo = path.join(carpetaRelativa, nombreGuardado);

    guardados.push({
      nombreArchivo: archivo.nombreArchivo,
      nombreGuardado,
      mimeType: archivo.mimeType ?? null,
      tamanoBytes: stats.size,
      rutaArchivo,
      urlLocal: construirUrlStorage(rutaRelativaArchivo),
    });
  }

  return guardados;
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
          direccionExacta: true,
          tipoEquipo: true,
          tipoUnidad: { select: { id: true, nombre: true } },
          marcaCatalogo: { select: { id: true, nombre: true } },
          refrigeranteCatalogo: { select: { id: true, codigo: true, nombre: true } },
          departamento: { select: { id: true, nombre: true } },
          ciudad: { select: { id: true, nombre: true } },
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
  mensajes: {
    orderBy: { id: "desc" },
    take: 5,
    include: {
      usuario: { select: { id: true, nombre: true, email: true } },
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

function esErrorUnicoPrisma(error: unknown) {
  const posible = error as { code?: string } | null;
  return Boolean(posible && posible.code === "P2002");
}

async function obtenerSiguienteCodigoActividadSeguro(): Promise<string> {
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

async function crearActividadOperativaAutomatica(params: {
  clienteId: number;
  ordenServicioId: number | null;
  tecnicoId: number;
  fechaProgramada: Date | null;
  tipoVisita?: string | null;
  motivo?: string | null;
  observaciones?: string | null;
}) {
  if (!params.ordenServicioId) return null;

  const actividadExistente = await prisma.actividad.findFirst({
    where: {
      ordenServicioId: params.ordenServicioId,
      tipoOrigen: "ORDEN",
      categoriaActividad: "OPERATIVA_VISITA",
      asignados: { some: { usuarioId: params.tecnicoId } },
    },
    select: { id: true },
  });

  if (actividadExistente) return actividadExistente.id;

  const titulo = params.tipoVisita
    ? `Visita operativa · ${String(params.tipoVisita).trim()}`
    : "Visita operativa asignada";

  for (let intento = 0; intento < 25; intento += 1) {
    const codigoActividad = await obtenerSiguienteCodigoActividadSeguro();

    try {
      const actividad = await prisma.actividad.create({
        data: {
          codigoActividad,
          titulo,
          descripcion:
            params.motivo ||
            params.observaciones ||
            "Actividad operativa generada automáticamente desde visita.",
          categoriaActividad: "OPERATIVA_VISITA",
          tipoOrigen: "ORDEN",
          clienteId: params.clienteId,
          ordenServicioId: params.ordenServicioId,
          solicitudId: null,
          prioridad: "MEDIA",
          estado: "PENDIENTE",
          fechaProgramada: params.fechaProgramada,
          progresoPorcentaje: 0,
          requiereReporte: true,
          requiereVisita: true,
          creadoPorId: params.tecnicoId,
          observaciones: "Actividad generada automáticamente al crear la visita.",
          asignados: {
            create: {
              usuarioId: params.tecnicoId,
              rolEnActividad: "RESPONSABLE",
              estadoAsignacion: "ASIGNADA",
            },
          },
          pasos: {
            create: [
              { orden: 1, tituloPaso: "Movilizándose al cliente", estadoPaso: "PENDIENTE", porcentajePaso: 0, obligatorio: true },
              { orden: 2, tituloPaso: "Realizando trabajo", estadoPaso: "PENDIENTE", porcentajePaso: 0, obligatorio: true },
              { orden: 3, tituloPaso: "Generando reporte", estadoPaso: "PENDIENTE", porcentajePaso: 0, obligatorio: true },
              { orden: 4, tituloPaso: "Trabajo cerrado", estadoPaso: "PENDIENTE", porcentajePaso: 0, obligatorio: true },
            ],
          },
        },
        select: { id: true },
      });

      return actividad.id;
    } catch (error) {
      if (esErrorUnicoPrisma(error)) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("No se pudo crear la actividad automática porque el código generado se repitió varias veces.");
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

    const visitaActivaExistente = await prisma.visita.findFirst({
      where: {
        ordenServicioId,
        estado: { notIn: ["FINALIZADA", "ATENDIDA", "COMPLETADA", "CERRADA", "CANCELADA"] },
      },
      select: { id: true, numeroVisita: true },
    });

    if (visitaActivaExistente) {
      throw new Error(`La orden ya tiene una visita activa: ${visitaActivaExistente.numeroVisita || `Visita #${visitaActivaExistente.id}`}.`);
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

  let actividadIdFinal = actividadId;

  if (!actividadIdFinal && ordenServicioId) {
    actividadIdFinal = await crearActividadOperativaAutomatica({
      clienteId,
      ordenServicioId,
      tecnicoId,
      fechaProgramada: fechaVisita,
      tipoVisita: data.tipoVisita,
      motivo: data.motivo,
      observaciones: data.observaciones,
    });
  }

  const numeroVisita = await obtenerSiguienteNumeroVisita();

  const visitaCreada = await prisma.visita.create({
    data: {
      numeroVisita,
      clienteId,
      ordenServicioId,
      tecnicoId,
      actividadId: actividadIdFinal,
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

  if (ordenServicioId) {
    await prisma.ordenServicio.update({
      where: { id: ordenServicioId },
      data: { estado: "asignada" },
    });
  }

  if (actividadIdFinal) {
    await recalcularActividadSiCorresponde(actividadIdFinal);
  }

  return obtenerVisitaPorIdService(visitaCreada.id);
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
  if (filtros.estados) {
    const estados = String(filtros.estados)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (estados.length) where.estado = { in: estados };
  }
  if (String(filtros.sinReporte || "").toLowerCase() === "true") {
    where.reportes = { none: {} };
  }
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

export async function asignarTecnicoAVisitaService(
  visitaId: number,
  payload: AsignarTecnicoVisitaInput
) {
  if (!visitaId || Number.isNaN(visitaId)) {
    throw new Error("El ID de la visita no es válido.");
  }

  const tecnicoId = convertirANumero(payload.tecnicoId);
  if (!tecnicoId) throw new Error("tecnicoId es obligatorio.");

  const visita = await prisma.visita.findUnique({
    where: { id: visitaId },
    select: { id: true, ordenServicioId: true, actividadId: true },
  });

  if (!visita) throw new Error("La visita no existe.");

  const tecnico = await prisma.user.findUnique({
    where: { id: tecnicoId },
    select: { id: true, activo: true },
  });

  if (!tecnico || !tecnico.activo) {
    throw new Error("El técnico indicado no existe o está inactivo.");
  }

  await prisma.visita.update({
    where: { id: visitaId },
    data: {
      tecnicoId,
      estado: "PENDIENTE",
      motivoEstado: payload.motivoEstado
        ? String(payload.motivoEstado).trim()
        : "Técnico asignado",
      observaciones: payload.observaciones
        ? String(payload.observaciones).trim()
        : undefined,
    },
  });

  await prisma.visitaAsignado.upsert({
    where: { visitaId_usuarioId: { visitaId, usuarioId: tecnicoId } },
    update: {
      rolEnVisita: payload.rolEnVisita ? String(payload.rolEnVisita).trim() : "RESPONSABLE",
      estadoAsignacion: "ASIGNADA",
    },
    create: {
      visitaId,
      usuarioId: tecnicoId,
      rolEnVisita: payload.rolEnVisita ? String(payload.rolEnVisita).trim() : "RESPONSABLE",
      estadoAsignacion: "ASIGNADA",
    },
  });

  if (visita.ordenServicioId) {
    await prisma.ordenServicio.update({
      where: { id: visita.ordenServicioId },
      data: { estado: "asignada" },
    });
  }

  await recalcularActividadSiCorresponde(visita.actividadId);

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

export async function actualizarEstadoVisitaService(
  visitaId: number,
  payload: { estado: string; motivoEstado?: string | null; observaciones?: string | null }
) {
  if (!visitaId || Number.isNaN(visitaId)) throw new Error("El ID de la visita no es válido.");

  const estado = String(payload.estado || "").trim().toUpperCase();
  if (!["PENDIENTE", "EN_PROCESO", "FINALIZADA"].includes(estado)) {
    throw new Error("Estado de visita no válido. Usa PENDIENTE, EN_PROCESO o FINALIZADA.");
  }

  const visita = await prisma.visita.findUnique({ where: { id: visitaId }, select: { id: true, actividadId: true, ordenServicioId: true, horaInicio: true, horaFin: true } });
  if (!visita) throw new Error("La visita no existe.");

  const visitaActualizada = await prisma.visita.update({
    where: { id: visitaId },
    data: {
      estado,
      motivoEstado: payload.motivoEstado ? String(payload.motivoEstado).trim() : undefined,
      observaciones: payload.observaciones ? String(payload.observaciones).trim() : undefined,
      horaInicio: estado === "EN_PROCESO" && !visita.horaInicio ? new Date() : undefined,
      horaFin: estado === "FINALIZADA" && !visita.horaFin ? new Date() : undefined,
    },
    include: visitaInclude,
  });

  if (visita.ordenServicioId) {
    await prisma.ordenServicio.update({
      where: { id: visita.ordenServicioId },
      data: { estado: estado === "FINALIZADA" ? "en_proceso" : "en_proceso" },
    });
  }

  if (visita.actividadId) {
    if (estado === "EN_PROCESO") {
      await prisma.actividad.update({
        where: { id: visita.actividadId },
        data: { estado: "EN_PROCESO", fechaInicio: new Date() },
      });
    }
    await recalcularActividadSiCorresponde(visita.actividadId);
  }

  return visitaActualizada;
}

export async function listarComentariosVisitaService(visitaId: number) {
  if (!visitaId || Number.isNaN(visitaId)) {
    throw new Error("El ID de la visita no es válido.");
  }

  const visita = await prisma.visita.findUnique({
    where: { id: visitaId },
    select: { id: true },
  });

  if (!visita) throw new Error("La visita no existe.");

  return prisma.actividadMensaje.findMany({
    where: { visitaId },
    orderBy: { id: "desc" },
    include: {
      usuario: { select: { id: true, nombre: true, email: true } },
    },
  });
}

export async function crearComentarioVisitaService(
  visitaId: number,
  payload: CrearComentarioVisitaInput
) {
  if (!visitaId || Number.isNaN(visitaId)) {
    throw new Error("El ID de la visita no es válido.");
  }

  const usuarioId = convertirANumero(payload.usuarioId);
  const actividadIdPayload = convertirANumero(payload.actividadId);
  const creadoParaUserId = convertirANumero(payload.creadoParaUserId);

  if (!usuarioId) throw new Error("usuarioId es obligatorio.");

  const visita = await prisma.visita.findUnique({
    where: { id: visitaId },
    select: { id: true, actividadId: true },
  });

  if (!visita) throw new Error("La visita no existe.");

  const usuario = await prisma.user.findUnique({
    where: { id: usuarioId },
    select: { id: true, activo: true },
  });

  if (!usuario || !usuario.activo) {
    throw new Error("El usuario indicado no existe o está inactivo.");
  }

  const mensajeBase = payload.mensaje ? String(payload.mensaje).trim() : "";
  const archivosGuardados = await guardarArchivosComentarioVisita(
    visitaId,
    Array.isArray(payload.archivos) ? payload.archivos : []
  );

  if (!mensajeBase && !archivosGuardados.length) {
    throw new Error("Debes escribir un comentario o adjuntar al menos una imagen.");
  }

  const textoAdjuntos = archivosGuardados.length
    ? [
        "",
        "Adjuntos:",
        ...archivosGuardados.map(
          (archivo) => `- ${archivo.nombreArchivo}: ${archivo.urlLocal}`
        ),
      ].join("\n")
    : "";

  const comentario = await prisma.actividadMensaje.create({
    data: {
      visitaId,
      actividadId: actividadIdPayload ?? visita.actividadId ?? null,
      usuarioId,
      tipoMensaje: payload.tipoMensaje
        ? String(payload.tipoMensaje).trim()
        : "COMENTARIO_TECNICO",
      asunto: payload.asunto ? String(payload.asunto).trim() : null,
      mensaje: `${mensajeBase}${textoAdjuntos}`.trim(),
      prioridad: payload.prioridad ? String(payload.prioridad).trim() : "MEDIA",
      estado: "NUEVO",
      creadoParaUserId: creadoParaUserId ?? null,
    },
    include: {
      usuario: { select: { id: true, nombre: true, email: true } },
    },
  });

  return {
    ...comentario,
    archivos: archivosGuardados,
  };
}
