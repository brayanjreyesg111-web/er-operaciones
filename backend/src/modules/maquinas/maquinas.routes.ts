import { Router } from "express";
import {
  crearMaquinaController,
  listarMaquinasController,
  obtenerMaquinaPorIdController,
} from "./maquinas.controller";

const router = Router();

router.get("/", listarMaquinasController);
router.post("/", crearMaquinaController);
router.get("/:id", obtenerMaquinaPorIdController);

export default router;
