import { Router } from "express";
import { reportesController } from "./reportes.controller";

const router = Router();

router.post("/", reportesController.crearReporte);
router.post("/:id/cierre", reportesController.cerrarReporte);
router.get("/", reportesController.listarReportes);
router.get("/:id", reportesController.obtenerReportePorId);

export default router;