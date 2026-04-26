import type { Request, Response } from "express";
import {
  actualizarEstadoSolicitudPublicaService,
  crearSolicitudPublicaService,
  listarSolicitudesPublicasService,
} from "./solicitudes-publicas.service";

export async function crearSolicitudPublicaController(req: Request, res: Response) {
  try {
    const data = await crearSolicitudPublicaService(req.body ?? {});
    return res.status(201).json({ ok: true, mensaje: "Solicitud de visita creada correctamente.", data });
  } catch (error: any) {
    return res.status(400).json({ ok: false, mensaje: error?.message || "No se pudo crear la solicitud." });
  }
}

export async function listarSolicitudesPublicasController(req: Request, res: Response) {
  try {
    const data = await listarSolicitudesPublicasService(req.query as Record<string, unknown>);
    return res.json({ ok: true, data });
  } catch (error: any) {
    return res.status(500).json({ ok: false, mensaje: error?.message || "No se pudieron listar las solicitudes." });
  }
}

export async function actualizarEstadoSolicitudPublicaController(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const data = await actualizarEstadoSolicitudPublicaService(id, req.body?.estado, req.body?.motivoEstado);
    return res.json({ ok: true, mensaje: "Estado de solicitud actualizado correctamente.", data });
  } catch (error: any) {
    return res.status(400).json({ ok: false, mensaje: error?.message || "No se pudo actualizar la solicitud." });
  }
}
