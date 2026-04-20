/*************************************************
 * visitas.controller.ts
 * MÓDULO DE VISITAS
 *************************************************/

import { Request, Response } from "express";
import {
  asociarMaquinasAVisitaService,
  crearVisitaService,
  finalizarVisitaService,
  listarVisitasService,
  obtenerVisitaPorIdService,
} from "./visitas.service";

function resolverStatus(error: unknown): number {
  const mensaje = error instanceof Error ? error.message.toLowerCase() : "error desconocido";

  if (
    mensaje.includes("obligatorio") ||
    mensaje.includes("no es válido") ||
    mensaje.includes("no pertenece") ||
    mensaje.includes("debes enviar") ||
    mensaje.includes("no existen") ||
    mensaje.includes("no existe")
  ) {
    return 400;
  }

  return 500;
}

export async function crearVisita(req: Request, res: Response) {
  try {
    const visitaCreada = await crearVisitaService(req.body);

    return res.status(201).json({
      ok: true,
      mensaje: "Visita creada correctamente.",
      data: visitaCreada,
    });
  } catch (error) {
    const status = resolverStatus(error);
    return res.status(status).json({
      ok: false,
      mensaje: error instanceof Error ? error.message : "Error al crear la visita.",
    });
  }
}

export async function listarVisitas(req: Request, res: Response) {
  try {
    const visitas = await listarVisitasService(req.query as Record<string, unknown>);

    return res.status(200).json({
      ok: true,
      mensaje: "Visitas obtenidas correctamente.",
      data: visitas,
    });
  } catch (error) {
    const status = resolverStatus(error);
    return res.status(status).json({
      ok: false,
      mensaje: error instanceof Error ? error.message : "Error al listar visitas.",
    });
  }
}

export async function obtenerVisitaPorId(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const visita = await obtenerVisitaPorIdService(id);

    return res.status(200).json({
      ok: true,
      mensaje: "Visita obtenida correctamente.",
      data: visita,
    });
  } catch (error) {
    const status = resolverStatus(error);
    return res.status(status).json({
      ok: false,
      mensaje: error instanceof Error ? error.message : "Error al obtener la visita.",
    });
  }
}

export async function asociarMaquinasAVisitaHandler(req: Request, res: Response) {
  try {
    const visitaId = Number(req.params.id);
    const maquinas = Array.isArray(req.body?.maquinas) ? req.body.maquinas : [];

    const visitaActualizada = await asociarMaquinasAVisitaService(visitaId, maquinas);

    return res.status(200).json({
      ok: true,
      mensaje: "Máquinas asociadas correctamente a la visita.",
      data: visitaActualizada,
    });
  } catch (error) {
    const status = resolverStatus(error);
    return res.status(status).json({
      ok: false,
      mensaje: error instanceof Error ? error.message : "Error al asociar máquinas a la visita.",
    });
  }
}

export async function finalizarVisita(req: Request, res: Response) {
  try {
    const visitaId = Number(req.params.id);
    const visita = await finalizarVisitaService(visitaId, req.body || {});

    return res.status(200).json({
      ok: true,
      mensaje: "Visita finalizada correctamente.",
      data: visita,
    });
  } catch (error) {
    const status = resolverStatus(error);
    return res.status(status).json({
      ok: false,
      mensaje: error instanceof Error ? error.message : "Error al finalizar la visita.",
    });
  }
}
