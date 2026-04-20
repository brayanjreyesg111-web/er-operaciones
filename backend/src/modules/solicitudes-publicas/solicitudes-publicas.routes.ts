import { Router } from "express";
import {
  crearSolicitudPublicaController,
  listarSolicitudesPublicasController,
} from "./solicitudes-publicas.controller";

const router = Router();

router.get("/", listarSolicitudesPublicasController);
router.post("/", crearSolicitudPublicaController);

export default router;
