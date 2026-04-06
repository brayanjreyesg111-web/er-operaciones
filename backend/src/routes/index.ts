import { Router } from "express";
import ordenesServicioRoutes from "../modules/ordenes-servicio/ordenes-servicio.routes";

const router = Router();

/**
 * SECCIÓN 7.1
 * Ruta principal del módulo de órdenes de servicio.
 */
router.use("/ordenes-servicio", ordenesServicioRoutes);

export default router;