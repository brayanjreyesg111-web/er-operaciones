import type { Request, Response } from "express";
import { reportesService } from "./reportes.service";

async function crearReporte(req: Request, res: Response) {
  try {
    const result = await reportesService.crearReporte(req.body);
    return res.status(201).json(result);
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "No se pudo crear el reporte.";
    return res.status(400).json({
      ok: false,
      mensaje,
    });
  }
}

async function cerrarReporte(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de reporte inválido.",
      });
    }

    const result = await reportesService.cerrarReporte(id, req.body);
    return res.json(result);
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "No se pudo guardar el cierre.";
    return res.status(400).json({
      ok: false,
      mensaje,
    });
  }
}

async function listarReportes(_req: Request, res: Response) {
  try {
    const result = await reportesService.listarReportes();
    return res.json(result);
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "No se pudieron listar los reportes.";
    return res.status(400).json({
      ok: false,
      mensaje,
    });
  }
}

async function obtenerReportePorId(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        ok: false,
        mensaje: "ID de reporte inválido.",
      });
    }

    const result = await reportesService.obtenerReportePorId(id);
    return res.json(result);
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "No se pudo obtener el reporte.";
    return res.status(404).json({
      ok: false,
      mensaje,
    });
  }
}

export const reportesController = {
  crearReporte,
  cerrarReporte,
  listarReportes,
  obtenerReportePorId,
};