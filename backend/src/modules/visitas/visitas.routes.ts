/*************************************************
 * visitas.routes.ts
 * MÓDULO DE VISITAS
 * RUTAS MÍNIMAS FUNCIONALES
 *
 * NOTA:
 * Se deja sin validateRequest por ahora
 * para destrabar compilación y pruebas.
 *************************************************/

import { Router } from "express";
import {
  asociarMaquinasAVisitaHandler,
  crearVisita,
  listarVisitas,
  obtenerVisitaPorId,
} from "./visitas.controller";

/*************************************************
 * SECCIÓN 1. ROUTER
 *************************************************/

const router = Router();

/*************************************************
 * SECCIÓN 2. RUTAS
 *************************************************/

// POST /api/visitas
router.post("/", crearVisita);

// GET /api/visitas
router.get("/", listarVisitas);

// GET /api/visitas/:id
router.get("/:id", obtenerVisitaPorId);

// POST /api/visitas/:id/maquinas
router.post("/:id/maquinas", asociarMaquinasAVisitaHandler);

export default router;