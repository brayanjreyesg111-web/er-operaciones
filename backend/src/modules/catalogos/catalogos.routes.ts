import { Router } from "express";
import {
  listarCiudadesPorDepartamentoController,
  listarDepartamentosController,
  listarHallazgosController,
  listarMarcasController,
  listarProcedimientosController,
  listarRefrigerantesController,
  listarTecnicosController,
  listarTiposUnidadController,
  listarUnidadesMedidaCargaController,
} from "./catalogos.controller";

const router = Router();

router.get("/tipos-unidad", listarTiposUnidadController);
router.get("/marcas", listarMarcasController);
router.get("/refrigerantes", listarRefrigerantesController);
router.get("/unidades-medida-carga", listarUnidadesMedidaCargaController);
router.get("/departamentos", listarDepartamentosController);
router.get("/departamentos/:departamentoId/ciudades", listarCiudadesPorDepartamentoController);

router.get("/tecnicos", listarTecnicosController);
router.get("/procedimientos", listarProcedimientosController);
router.get("/hallazgos", listarHallazgosController);

export default router;