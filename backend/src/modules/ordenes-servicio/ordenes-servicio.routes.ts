import { Router } from "express";
import {
  actualizarEstadoOrdenServicioHandler,
  actualizarOrdenServicioHandler,
  crearOrdenServicioHandler,
  listarOrdenesServicioHandler,
  obtenerOrdenServicioPorIdHandler,
} from "./ordenes-servicio.controller";

const router = Router();

/**
 * SECCIÓN 6.1
 * Crear una orden de servicio.
 * POST /api/ordenes-servicio
 */
router.post("/", crearOrdenServicioHandler);

/**
 * SECCIÓN 6.2
 * Listar órdenes de servicio.
 * GET /api/ordenes-servicio
 */
router.get("/", listarOrdenesServicioHandler);

/**
 * SECCIÓN 6.3
 * Obtener detalle de una orden por ID.
 * GET /api/ordenes-servicio/:id
 */
router.get("/:id", obtenerOrdenServicioPorIdHandler);

/**
 * SECCIÓN 6.4
 * Actualizar datos básicos de una orden.
 * PUT /api/ordenes-servicio/:id
 */
router.put("/:id", actualizarOrdenServicioHandler);

/**
 * SECCIÓN 6.5
 * Actualizar solo el estado.
 * PATCH /api/ordenes-servicio/:id/estado
 */
router.patch("/:id/estado", actualizarEstadoOrdenServicioHandler);

export default router;