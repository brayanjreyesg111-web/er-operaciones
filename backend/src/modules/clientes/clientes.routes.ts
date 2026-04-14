import { Router } from "express";
import {
  crearClienteController,
  listarClientesController,
  obtenerClientePorIdController,
} from "./clientes.controller";

const router = Router();

router.get("/", listarClientesController);
router.get("/:id", obtenerClientePorIdController);
router.post("/", crearClienteController);

export default router;
