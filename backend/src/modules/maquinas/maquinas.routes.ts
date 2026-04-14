import { Router } from "express";
import {
  crearMaquinaController,
  obtenerMaquinaPorIdController,
} from "./maquinas.controller";

const router = Router();

router.post("/", crearMaquinaController);
router.get("/:id", obtenerMaquinaPorIdController);

export default router;
