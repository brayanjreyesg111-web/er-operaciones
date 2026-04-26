import { Router } from "express";
import {
  actualizarEstadoSolicitudPublicaController,
  crearSolicitudPublicaController,
  listarSolicitudesPublicasController,
} from "./solicitudes-publicas.controller";

const router = Router();

router.get("/", listarSolicitudesPublicasController);
router.post("/", crearSolicitudPublicaController);
router.patch("/:id/estado", actualizarEstadoSolicitudPublicaController);

export default router;
