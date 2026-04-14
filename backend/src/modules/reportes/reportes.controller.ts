import type { Request, Response } from "express";
import { reportesService } from "./reportes.service";

async function crearReporte(req: Request, res: Response) {
  try {
    const resultado = await reportesService.crearReporte(req.body);

    return res.status(201).json(resultado);
  } catch (error: any) {
  console.error("ERROR REAL AL CREAR REPORTE:");
  console.error(error);

  return res.status(400).json({
    ok: false,
    mensaje: "Error al crear el reporte.",
    error: error?.message ?? "Error desconocido",
  });
}
  }


async function listarReportes(_req: Request, res: Response) {
  try {
    const resultado = await reportesService.listarReportes();

    return res.status(200).json(resultado);
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error al listar reportes.";

    return res.status(500).json({
      ok: false,
      mensaje,
    });
  }
}

async function obtenerReportePorId(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        ok: false,
        mensaje: "El id del reporte no es válido.",
      });
    }

    const resultado = await reportesService.obtenerReportePorId(id);

    return res.status(200).json(resultado);
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error al obtener el reporte.";

    const statusCode =
      error instanceof Error && error.message === "Reporte no encontrado."
        ? 404
        : 400;

    return res.status(statusCode).json({
      ok: false,
      mensaje,
    });
  }
}

export const reportesController = {
  crearReporte,
  listarReportes,
  obtenerReportePorId,
};