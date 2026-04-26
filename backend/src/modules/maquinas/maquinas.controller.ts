import type { Request, Response } from "express";
import { crearMaquina, listarMaquinas, obtenerMaquinaPorId } from "./maquinas.service";

export async function listarMaquinasController(req: Request, res: Response) {
  try {
    const clienteId = req.query.clienteId ? Number(req.query.clienteId) : undefined;

    const data = await listarMaquinas({
      clienteId:
        clienteId && Number.isInteger(clienteId) && clienteId > 0 ? clienteId : undefined,
    });

    return res.json({
      ok: true,
      mensaje: "Máquinas obtenidas correctamente.",
      total: data.length,
      data,
    });
  } catch (error: unknown) {
    console.error("Error listando máquinas:", error);

    const mensaje = error instanceof Error ? error.message : "No se pudieron listar las máquinas.";

    return res.status(500).json({
      ok: false,
      mensaje,
    });
  }
}

export async function crearMaquinaController(req: Request, res: Response) {
  try {
    const {
      clienteId,
      tipoUnidadId,
      marcaId,
      refrigeranteId,
      unidadMedidaCargaId,
      departamentoId,
      ciudadId,
      modelo,
      serie,
      cargaRefrigeranteCantidad,
      direccionExacta,
      area,
      observaciones,
    } = req.body ?? {};

    if (!clienteId || Number(clienteId) <= 0) {
      return res.status(400).json({
        ok: false,
        mensaje: "El cliente es obligatorio.",
      });
    }

    if (!tipoUnidadId || Number(tipoUnidadId) <= 0) {
      return res.status(400).json({
        ok: false,
        mensaje: "El tipo de unidad es obligatorio.",
      });
    }

    if (!marcaId || Number(marcaId) <= 0) {
      return res.status(400).json({
        ok: false,
        mensaje: "La marca es obligatoria.",
      });
    }

    if (!refrigeranteId || Number(refrigeranteId) <= 0) {
      return res.status(400).json({
        ok: false,
        mensaje: "El refrigerante es obligatorio.",
      });
    }

    if (!departamentoId || Number(departamentoId) <= 0) {
      return res.status(400).json({
        ok: false,
        mensaje: "El departamento es obligatorio.",
      });
    }

    if (!ciudadId || Number(ciudadId) <= 0) {
      return res.status(400).json({
        ok: false,
        mensaje: "La ciudad es obligatoria.",
      });
    }

    const data = await crearMaquina({
      clienteId: Number(clienteId),
      tipoUnidadId: Number(tipoUnidadId),
      marcaId: Number(marcaId),
      refrigeranteId: Number(refrigeranteId),
      unidadMedidaCargaId:
        unidadMedidaCargaId && Number(unidadMedidaCargaId) > 0
          ? Number(unidadMedidaCargaId)
          : undefined,
      departamentoId:
        departamentoId && Number(departamentoId) > 0 ? Number(departamentoId) : undefined,
      ciudadId: ciudadId && Number(ciudadId) > 0 ? Number(ciudadId) : undefined,
      modelo: modelo ? String(modelo) : undefined,
      serie: serie ? String(serie) : undefined,
      cargaRefrigeranteCantidad:
        cargaRefrigeranteCantidad !== undefined &&
        cargaRefrigeranteCantidad !== null &&
        String(cargaRefrigeranteCantidad) !== ""
          ? Number(cargaRefrigeranteCantidad)
          : undefined,
      direccionExacta: direccionExacta ? String(direccionExacta) : undefined,
      area: area ? String(area) : undefined,
      observaciones: observaciones ? String(observaciones) : undefined,
    });

    return res.status(201).json({
      ok: true,
      mensaje: "Máquina creada correctamente.",
      data,
    });
  } catch (error: unknown) {
    console.error("Error creando máquina:", error);

    const mensaje = error instanceof Error ? error.message : "No se pudo crear la máquina.";

    return res.status(500).json({
      ok: false,
      mensaje,
    });
  }
}

export async function obtenerMaquinaPorIdController(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        ok: false,
        mensaje: "El id de la máquina no es válido.",
      });
    }

    const data = await obtenerMaquinaPorId(id);

    if (!data) {
      return res.status(404).json({
        ok: false,
        mensaje: "Máquina no encontrada.",
      });
    }

    return res.json({
      ok: true,
      data,
    });
  } catch (error: unknown) {
    console.error("Error obteniendo máquina por id:", error);

    const mensaje = error instanceof Error ? error.message : "No se pudo obtener la máquina.";

    return res.status(500).json({
      ok: false,
      mensaje,
    });
  }
}
