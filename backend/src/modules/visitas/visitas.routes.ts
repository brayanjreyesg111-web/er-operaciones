/*************************************************
 * visitas.routes.ts
 * MÓDULO DE VISITAS
 * ETAPA 1
 *************************************************/

import { Router } from "express";
import {
  asociarMaquinasAVisitaHandler,
  crearVisita,
  finalizarVisita,
  listarVisitas,
  obtenerVisitaPorId,
} from "./visitas.controller";

const router = Router();

router.post("/", crearVisita);
router.get("/", listarVisitas);
router.get("/:id", obtenerVisitaPorId);
router.post("/:id/maquinas", asociarMaquinasAVisitaHandler);
router.patch("/:id/finalizar", finalizarVisita);

export default router;
