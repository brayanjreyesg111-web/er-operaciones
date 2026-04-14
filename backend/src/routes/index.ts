import { Router } from "express";
import ordenesServicioRoutes from "../modules/ordenes-servicio/ordenes-servicio.routes";
import visitasRoutes from "../modules/visitas/visitas.routes";
import reportesRoutes from "../modules/reportes/reportes.routes";
import clientesRoutes from "../modules/clientes/clientes.routes";
import maquinasRoutes from "../modules/maquinas/maquinas.routes";
import catalogosRoutes from "../modules/catalogos/catalogos.routes";

const router = Router();

/**
 * SECCIÓN 7.1
 * Ruta principal del módulo de órdenes de servicio.
 */
router.use("/ordenes-servicio", ordenesServicioRoutes);

/**
 * SECCIÓN 7.2
 * Ruta principal del módulo de visitas.
 */
router.use("/visitas", visitasRoutes);

/**
 * SECCIÓN 7.3
 * Ruta principal del módulo de reportes.
 */
router.use("/reportes", reportesRoutes);

/**
 * SECCIÓN 7.4
 * Ruta principal del módulo de clientes.
 */
router.use("/clientes", clientesRoutes);

/**
 * SECCIÓN 7.5
 * Ruta principal del módulo de máquinas.
 */
router.use("/maquinas", maquinasRoutes);

/**
 * SECCIÓN 7.6
 * Ruta principal del módulo de catálogos.
 */
router.use("/catalogos", catalogosRoutes);
export default router;