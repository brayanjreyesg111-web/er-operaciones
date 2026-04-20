import type { Request, Response } from "express";
import {
  crearSolicitudPublicaService,
  listarSolicitudesPublicasService,
} from "./solicitudes-publicas.service";

export async function crearSolicitudPublicaController(req: Request, res: Response) {
  try {
    const data = await crearSolicitudPublicaService(req.body ?? {});

    return res.status(201).json({
      ok: true,
      mensaje: "Solicitud de visita creada correctamente.",
      data,
    });
  } catch (error: any) {
    return res.status(400).json({
      ok: false,
      mensaje: error?.message || "No se pudo crear la solicitud.",
    });
  }
}

export async function listarSolicitudesPublicasController(_req: Request, res: Response) {
  try {
    const data = await listarSolicitudesPublicasService();

    return res.json({
      ok: true,
      data,
    });
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      mensaje: error?.message || "No se pudieron listar las solicitudes.",
    });
  }
}
