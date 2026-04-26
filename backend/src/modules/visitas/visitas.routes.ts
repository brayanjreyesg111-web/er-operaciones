/*************************************************
 * visitas.routes.ts
 * MÓDULO DE VISITAS
 * ETAPA 1
 *************************************************/

import { Router } from "express";
import {
  actualizarEstadoVisita,
  asignarTecnicoAVisita,
  asociarMaquinasAVisitaHandler,
  crearComentarioVisita,
  crearVisita,
  finalizarVisita,
  listarComentariosVisita,
  listarVisitas,
  obtenerVisitaPorId,
} from "./visitas.controller";

const router = Router();

router.post("/", crearVisita);
router.get("/", listarVisitas);
router.get("/:id/comentarios", listarComentariosVisita);
router.post("/:id/comentarios", crearComentarioVisita);
router.get("/:id", obtenerVisitaPorId);
router.post("/:id/maquinas", asociarMaquinasAVisitaHandler);
router.patch("/:id/estado", actualizarEstadoVisita);
router.patch("/:id/asignar-tecnico", asignarTecnicoAVisita);
router.patch("/:id/finalizar", finalizarVisita);

export default router;
