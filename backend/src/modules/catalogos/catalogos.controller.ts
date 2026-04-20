import type { Request, Response } from "express";
import {
  listarCiudadesPorDepartamento,
  listarDepartamentos,
  listarHallazgos,
  listarMarcas,
  listarProcedimientos,
  listarRefrigerantes,
  listarTecnicos,
  listarTiposUnidad,
  listarUnidadesMedidaCarga,
} from "./catalogos.service";

export async function listarTiposUnidadController(_req: Request, res: Response) {
  try {
    const data = await listarTiposUnidad();
    return res.json({ ok: true, data });
  } catch (error) {
    console.error("Error listando tipos de unidad:", error);
    return res.status(500).json({ ok: false, mensaje: "No se pudieron listar los tipos de unidad." });
  }
}

export async function listarMarcasController(_req: Request, res: Response) {
  try {
    const data = await listarMarcas();
    return res.json({ ok: true, data });
  } catch (error) {
    console.error("Error listando marcas:", error);
    return res.status(500).json({ ok: false, mensaje: "No se pudieron listar las marcas." });
  }
}

export async function listarRefrigerantesController(_req: Request, res: Response) {
  try {
    const data = await listarRefrigerantes();
    return res.json({ ok: true, data });
  } catch (error) {
    console.error("Error listando refrigerantes:", error);
    return res.status(500).json({ ok: false, mensaje: "No se pudieron listar los refrigerantes." });
  }
}

export async function listarUnidadesMedidaCargaController(_req: Request, res: Response) {
  try {
    const data = await listarUnidadesMedidaCarga();
    return res.json({ ok: true, data });
  } catch (error) {
    console.error("Error listando unidades de carga:", error);
    return res.status(500).json({ ok: false, mensaje: "No se pudieron listar las unidades de carga." });
  }
}

export async function listarDepartamentosController(_req: Request, res: Response) {
  try {
    const data = await listarDepartamentos();
    return res.json({ ok: true, data });
  } catch (error) {
    console.error("Error listando departamentos:", error);
    return res.status(500).json({ ok: false, mensaje: "No se pudieron listar los departamentos." });
  }
}

export async function listarCiudadesPorDepartamentoController(req: Request, res: Response) {
  try {
    const departamentoId = Number(req.params.departamentoId);

    if (!Number.isInteger(departamentoId) || departamentoId <= 0) {
      return res.status(400).json({ ok: false, mensaje: "departamentoId no válido." });
    }

    const data = await listarCiudadesPorDepartamento(departamentoId);
    return res.json({ ok: true, data });
  } catch (error) {
    console.error("Error listando ciudades:", error);
    return res.status(500).json({ ok: false, mensaje: "No se pudieron listar las ciudades." });
  }
}

export async function listarTecnicosController(_req: Request, res: Response) {
  try {
    const data = await listarTecnicos();
    return res.json({ ok: true, data });
  } catch (error) {
    console.error("Error listando técnicos:", error);
    return res.status(500).json({ ok: false, mensaje: "No se pudieron listar los técnicos." });
  }
}

export async function listarProcedimientosController(_req: Request, res: Response) {
  try {
    const data = await listarProcedimientos();
    return res.json({ ok: true, data });
  } catch (error) {
    console.error("Error listando procedimientos:", error);
    return res.status(500).json({ ok: false, mensaje: "No se pudieron listar los procedimientos." });
  }
}

export async function listarHallazgosController(_req: Request, res: Response) {
  try {
    const data = await listarHallazgos();
    return res.json({ ok: true, data });
  } catch (error) {
    console.error("Error listando hallazgos:", error);
    return res.status(500).json({ ok: false, mensaje: "No se pudieron listar los hallazgos." });
  }
}