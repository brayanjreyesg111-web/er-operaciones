/*************************************************
 * actividades.routes.ts
 * MÓDULO DE ACTIVIDADES INTERNAS Y OPERATIVAS
 *************************************************/

import { Router } from "express";
import {
  actualizarPasoActividad,
  crearActividad,
  crearMensajeActividad,
  listarActividades,
  obtenerActividadPorId,
} from "./actividades.controller";

const router = Router();

router.get("/", listarActividades);
router.post("/", crearActividad);
router.get("/:id", obtenerActividadPorId);
router.patch("/:id/pasos/:pasoId", actualizarPasoActividad);
router.post("/:id/mensajes", crearMensajeActividad);

export default router;
