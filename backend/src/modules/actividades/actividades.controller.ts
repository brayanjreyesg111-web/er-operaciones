/*************************************************
 * actividades.controller.ts
 * MÓDULO DE ACTIVIDADES INTERNAS Y OPERATIVAS
 *************************************************/

import type { Request, Response } from "express";
import {
  actualizarPasoActividadService,
  crearActividadService,
  crearMensajeActividadService,
  listarActividadesService,
  obtenerActividadPorIdService,
} from "./actividades.service";

function resolverStatus(error: unknown): number {
  const mensaje = error instanceof Error ? error.message.toLowerCase() : "error desconocido";

  if (
    mensaje.includes("obligatorio") ||
    mensaje.includes("no es válido") ||
    mensaje.includes("no existe") ||
    mensaje.includes("no pertenece") ||
    mensaje.includes("debes")
  ) {
    return 400;
  }

  return 500;
}

export async function listarActividades(req: Request, res: Response) {
  try {
    const actividades = await listarActividadesService(req.query as Record<string, unknown>);

    return res.status(200).json({
      ok: true,
      mensaje: "Actividades obtenidas correctamente.",
      data: actividades,
    });
  } catch (error) {
    return res.status(resolverStatus(error)).json({
      ok: false,
      mensaje: error instanceof Error ? error.message : "Error al listar actividades.",
    });
  }
}

export async function obtenerActividadPorId(req: Request, res: Response) {
  try {
    const actividad = await obtenerActividadPorIdService(Number(req.params.id));

    return res.status(200).json({
      ok: true,
      mensaje: "Actividad obtenida correctamente.",
      data: actividad,
    });
  } catch (error) {
    return res.status(resolverStatus(error)).json({
      ok: false,
      mensaje: error instanceof Error ? error.message : "Error al obtener la actividad.",
    });
  }
}

export async function crearActividad(req: Request, res: Response) {
  try {
    const actividad = await crearActividadService(req.body || {});

    return res.status(201).json({
      ok: true,
      mensaje: "Actividad creada correctamente.",
      data: actividad,
    });
  } catch (error) {
    return res.status(resolverStatus(error)).json({
      ok: false,
      mensaje: error instanceof Error ? error.message : "Error al crear la actividad.",
    });
  }
}

export async function actualizarPasoActividad(req: Request, res: Response) {
  try {
    const actividad = await actualizarPasoActividadService(
      Number(req.params.id),
      Number(req.params.pasoId),
      req.body || {}
    );

    return res.status(200).json({
      ok: true,
      mensaje: "Paso actualizado correctamente.",
      data: actividad,
    });
  } catch (error) {
    return res.status(resolverStatus(error)).json({
      ok: false,
      mensaje: error instanceof Error ? error.message : "Error al actualizar el paso.",
    });
  }
}

export async function crearMensajeActividad(req: Request, res: Response) {
  try {
    const mensaje = await crearMensajeActividadService(Number(req.params.id), req.body || {});

    return res.status(201).json({
      ok: true,
      mensaje: "Mensaje agregado correctamente.",
      data: mensaje,
    });
  } catch (error) {
    return res.status(resolverStatus(error)).json({
      ok: false,
      mensaje: error instanceof Error ? error.message : "Error al crear el mensaje.",
    });
  }
}
