/*************************************************
 * visitas.service.ts
 * MÓDULO DE VISITAS
 * VERSIÓN AJUSTADA AL SCHEMA REAL DE PRISMA
 *************************************************/

import { prisma } from "../../lib/prisma";

/*************************************************
 * SECCIÓN 1. TIPOS
 *************************************************/

export interface CrearVisitaInput {
  clienteId: number | string;
  ordenServicioId?: number | string | null;
  tecnicoId: number | string;
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

/*************************************************
 * SECCIÓN 2. HELPERS
 *************************************************/

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

/*************************************************
 * SECCIÓN 3. CREAR VISITA
 * Soporta:
 * - visita desde orden
 * - visita libre
 *************************************************/

export async function crearVisitaService(data: CrearVisitaInput) {
  const clienteId = convertirANumero(data.clienteId);
  const ordenServicioId = convertirANumero(data.ordenServicioId);
  const tecnicoId = convertirANumero(data.tecnicoId);
  const fechaVisita = convertirAFecha(data.fechaProgramada);

  if (!clienteId) {
    throw new Error("clienteId es obligatorio.");
  }

  if (!tecnicoId) {
    throw new Error("tecnicoId es obligatorio.");
  }

  const cliente = await prisma.cliente.findUnique({
    where: { id: clienteId },
    select: { id: true },
  });

  if (!cliente) {
    throw new Error("El cliente indicado no existe.");
  }

  const tecnico = await prisma.user.findUnique({
    where: { id: tecnicoId },
    select: { id: true },
  });

  if (!tecnico) {
    throw new Error("El técnico indicado no existe.");
  }

  if (ordenServicioId) {
    const orden = await prisma.ordenServicio.findUnique({
      where: { id: ordenServicioId },
      select: { id: true, clienteId: true },
    });

    if (!orden) {
      throw new Error("La orden de servicio indicada no existe.");
    }

    if (orden.clienteId !== clienteId) {
      throw new Error("La orden de servicio no pertenece al cliente indicado.");
    }
  }

  const visitaCreada = await prisma.visita.create({
    data: {
      clienteId,
      ordenServicioId,
      tecnicoId,
      tipoVisita: data.tipoVisita ? String(data.tipoVisita).trim() : null,
      motivoVisita: data.motivo ? String(data.motivo).trim() : null,
      resultadoBreve: data.resultado ? String(data.resultado).trim() : null,
      estado: "pendiente",
      requiereCotizacion: convertirABooleano(data.requiereCotizacion),
      esVisitaLibre: !ordenServicioId,
      fechaVisita: fechaVisita ?? new Date(),
      horaInicio: null,
      horaFin: null,
      observaciones: data.observaciones
        ? String(data.observaciones).trim()
        : null,
    },
  });

  return visitaCreada;
}

/*************************************************
 * SECCIÓN 4. LISTAR VISITAS
 *************************************************/

export async function listarVisitasService(filtros: Record<string, unknown>) {
  const where: Record<string, unknown> = {};

  const clienteId = convertirANumero(filtros.clienteId);
  const ordenServicioId = convertirANumero(filtros.ordenServicioId);
  const tecnicoId = convertirANumero(filtros.tecnicoId);

  if (clienteId) where.clienteId = clienteId;
  if (ordenServicioId) where.ordenServicioId = ordenServicioId;
  if (tecnicoId) where.tecnicoId = tecnicoId;

  if (filtros.tipoVisita) {
    where.tipoVisita = String(filtros.tipoVisita).trim();
  }

  if (filtros.resultado) {
    where.resultadoBreve = String(filtros.resultado).trim();
  }

  if (filtros.estado) {
    where.estado = String(filtros.estado).trim();
  }

  if (filtros.requiereCotizacion !== undefined) {
    where.requiereCotizacion = convertirABooleano(filtros.requiereCotizacion);
  }

  if (filtros.esVisitaLibre !== undefined) {
    where.esVisitaLibre = convertirABooleano(filtros.esVisitaLibre);
  }

  const visitas = await prisma.visita.findMany({
    where,
    orderBy: {
      id: "desc",
    },
  });

  return visitas;
}

/*************************************************
 * SECCIÓN 5. OBTENER VISITA POR ID
 *************************************************/

export async function obtenerVisitaPorIdService(id: number) {
  if (!id || Number.isNaN(id)) {
    throw new Error("El ID de la visita no es válido.");
  }

  const visita = await prisma.visita.findUnique({
    where: { id },
  });

  if (!visita) {
    throw new Error("La visita no existe.");
  }

  const maquinasAsociadas = await prisma.visitaMaquina.findMany({
    where: { visitaId: id },
  });

  return {
    ...visita,
    maquinasAsociadas,
  };
}

/*************************************************
 * SECCIÓN 6. ASOCIAR MÁQUINAS A UNA VISITA
 *************************************************/

export async function asociarMaquinasAVisitaService(
  visitaId: number,
  maquinas: AsociarMaquinaInput[]
) {
  if (!visitaId || Number.isNaN(visitaId)) {
    throw new Error("El ID de la visita no es válido.");
  }

  if (!Array.isArray(maquinas) || maquinas.length === 0) {
    throw new Error("Debes enviar al menos una máquina.");
  }

  const visita = await prisma.visita.findUnique({
    where: { id: visitaId },
    select: { id: true, clienteId: true },
  });

  if (!visita) {
    throw new Error("La visita no existe.");
  }

  const maquinasNormalizadas = maquinas.map((item) => {
    const maquinaId = convertirANumero(item.maquinaId);

    if (!maquinaId) {
      throw new Error("Uno de los maquinaId enviados no es válido.");
    }

    return { maquinaId };
  });

  const idsMaquinas = maquinasNormalizadas.map((item) => item.maquinaId);

  const maquinasExistentes = await prisma.maquina.findMany({
    where: {
      id: {
        in: idsMaquinas,
      },
    },
    select: {
      id: true,
      clienteId: true,
    },
  });

  if (maquinasExistentes.length !== idsMaquinas.length) {
    throw new Error("Una o más máquinas indicadas no existen.");
  }

  const maquinasDeOtroCliente = maquinasExistentes.filter(
    (maquina) => maquina.clienteId !== visita.clienteId
  );

  if (maquinasDeOtroCliente.length > 0) {
    throw new Error("Una o más máquinas no pertenecen al cliente de la visita.");
  }

  const yaAsociadas = await prisma.visitaMaquina.findMany({
    where: {
      visitaId,
      maquinaId: {
        in: idsMaquinas,
      },
    },
    select: {
      maquinaId: true,
    },
  });

  const idsYaAsociados = new Set(yaAsociadas.map((item) => item.maquinaId));

  const nuevasRelaciones = maquinasNormalizadas
    .filter((item) => !idsYaAsociados.has(item.maquinaId))
    .map((item) => ({
      visitaId,
      maquinaId: item.maquinaId,
    }));

  if (nuevasRelaciones.length > 0) {
    await prisma.visitaMaquina.createMany({
      data: nuevasRelaciones,
    });
  }

  const asociacionesFinales = await prisma.visitaMaquina.findMany({
    where: { visitaId },
  });

  return {
    visitaId,
    totalRecibidas: maquinas.length,
    totalNuevas: nuevasRelaciones.length,
    asociaciones: asociacionesFinales,
  };
}