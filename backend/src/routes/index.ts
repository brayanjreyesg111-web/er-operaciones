import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import solicitudesPublicasRoutes from "../modules/solicitudes-publicas/solicitudes-publicas.routes";
import clientesRoutes from "../modules/clientes/clientes.routes";
import maquinasRoutes from "../modules/maquinas/maquinas.routes";
import catalogosRoutes from "../modules/catalogos/catalogos.routes";
import ordenesServicioRoutes from "../modules/ordenes-servicio/ordenes-servicio.routes";
import visitasRoutes from "../modules/visitas/visitas.routes";
import actividadesRoutes from "../modules/actividades/actividades.routes";
import reportesRoutes from "../modules/reportes/reportes.routes";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    ok: true,
    sistema: "ER Operaciones API",
    modulos: [
      "auth",
      "solicitudes-publicas",
      "clientes",
      "maquinas",
      "catalogos",
      "ordenes-servicio",
      "visitas",
      "actividades",
      "reportes",
    ],
  });
});

router.use("/auth", authRoutes);
router.use("/solicitudes-publicas", solicitudesPublicasRoutes);
router.use("/clientes", clientesRoutes);
router.use("/maquinas", maquinasRoutes);
router.use("/catalogos", catalogosRoutes);
router.use("/ordenes-servicio", ordenesServicioRoutes);
router.use("/visitas", visitasRoutes);
router.use("/actividades", actividadesRoutes);
router.use("/reportes", reportesRoutes);

export default router;
