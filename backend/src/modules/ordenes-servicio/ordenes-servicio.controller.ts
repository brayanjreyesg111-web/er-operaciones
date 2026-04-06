import type { Request, Response } from "express";
import {
  actualizarEstadoOrdenServicio,
  actualizarOrdenServicio,
  crearOrdenServicio,
  listarOrdenesServicio,
  obtenerOrdenServicioPorId,
} from "./ordenes-servicio.service";
import {
  validarActualizarOrdenServicio,
  validarCrearOrdenServicio,
  validarEstadoOrden,
} from "./ordenes-servicio.validation";

/**
 * SECCIÓN 5.1
 * Crear una nueva orden de servicio.
 */
export async function crearOrdenServicioHandler(req: Request, res: Response) {
  try {
    const validacion = validarCrearOrdenServicio(req.body);

    if (!validacion.ok) {
      return res.status(400).json({
        ok: false,
        mensaje: "Error de validación al crear la orden.",
        errores: validacion.errores,
      });
    }

    const orden = await crearOrdenServicio(validacion.datos!);

    return res.status(201).json({
      ok: true,
      mensaje: "Orden de servicio creada correctamente.",
      data: orden,
    });
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      mensaje: error.message || "Error interno al crear la orden.",
    });
  }
}

/**
 * SECCIÓN 5.2
 * Listar órdenes con filtros opcionales.
 *
 * Query params soportados:
 * - estado
 * - clienteId
 * - texto
 */
export async function listarOrdenesServicioHandler(req: Request, res: Response) {
  try {
    const estado =
      typeof req.query.estado === "string" ? req.query.estado : undefined;
    const texto =
      typeof req.query.texto === "string" ? req.query.texto : undefined;
    const clienteId =
      typeof req.query.clienteId === "string"
        ? Number(req.query.clienteId)
        : undefined;

    const ordenes = await listarOrdenesServicio({
      estado,
      texto,
      clienteId,
    });

    return res.status(200).json({
      ok: true,
      mensaje: "Órdenes obtenidas correctamente.",
      total: ordenes.length,
      data: ordenes,
    });
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      mensaje: error.message || "Error interno al listar órdenes.",
    });
  }
}

/**
 * SECCIÓN 5.3
 * Obtener una orden por su ID.
 */
export async function obtenerOrdenServicioPorIdHandler(
  req: Request,
  res: Response
) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        ok: false,
        mensaje: "El ID enviado no es válido.",
      });
    }

    const orden = await obtenerOrdenServicioPorId(id);

    return res.status(200).json({
      ok: true,
      mensaje: "Orden obtenida correctamente.",
      data: orden,
    });
  } catch (error: any) {
    const status = error.message?.includes("no existe") ? 404 : 500;

    return res.status(status).json({
      ok: false,
      mensaje: error.message || "Error interno al obtener la orden.",
    });
  }
}

/**
 * SECCIÓN 5.4
 * Actualizar datos básicos de una orden.
 */
export async function actualizarOrdenServicioHandler(
  req: Request,
  res: Response
) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        ok: false,
        mensaje: "El ID enviado no es válido.",
      });
    }

    const validacion = validarActualizarOrdenServicio(req.body);

    if (!validacion.ok) {
      return res.status(400).json({
        ok: false,
        mensaje: "Error de validación al actualizar la orden.",
        errores: validacion.errores,
      });
    }

    const ordenActualizada = await actualizarOrdenServicio(id, validacion.datos!);

    return res.status(200).json({
      ok: true,
      mensaje: "Orden actualizada correctamente.",
      data: ordenActualizada,
    });
  } catch (error: any) {
    const status = error.message?.includes("no existe") ? 404 : 500;

    return res.status(status).json({
      ok: false,
      mensaje: error.message || "Error interno al actualizar la orden.",
    });
  }
}

/**
 * SECCIÓN 5.5
 * Cambiar el estado de una orden.
 */
export async function actualizarEstadoOrdenServicioHandler(
  req: Request,
  res: Response
) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        ok: false,
        mensaje: "El ID enviado no es válido.",
      });
    }

    const validacionEstado = validarEstadoOrden(req.body?.estado);

    if (!validacionEstado.ok) {
      return res.status(400).json({
        ok: false,
        mensaje: "Error de validación del estado.",
        errores: validacionEstado.errores,
      });
    }

    const orden = await actualizarEstadoOrdenServicio(id, validacionEstado.estado!);

    return res.status(200).json({
      ok: true,
      mensaje: "Estado de la orden actualizado correctamente.",
      data: orden,
    });
  } catch (error: any) {
    const status = error.message?.includes("no existe") ? 404 : 500;

    return res.status(status).json({
      ok: false,
      mensaje: error.message || "Error interno al actualizar el estado.",
    });
  }
}