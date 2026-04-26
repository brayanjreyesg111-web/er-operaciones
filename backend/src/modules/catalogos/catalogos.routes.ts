import { Router } from "express";
import {
  listarTecnicosController,
  listarUsuariosOperativosController,
  listarProcedimientosController,
  listarHallazgosController,
  listarTiposUnidadController,
  listarMarcasController,
  listarRefrigerantesController,
  listarUnidadesMedidaCargaController,
  listarDepartamentosController,
  listarCiudadesPorDepartamentoController,
} from "./catalogos.controller";

const router = Router();

router.get("/tipos-unidad", listarTiposUnidadController);
router.get("/marcas", listarMarcasController);
router.get("/refrigerantes", listarRefrigerantesController);
router.get("/unidades-medida-carga", listarUnidadesMedidaCargaController);
router.get("/departamentos", listarDepartamentosController);
router.get("/departamentos/:departamentoId/ciudades", listarCiudadesPorDepartamentoController);

router.get("/tecnicos", listarTecnicosController);
router.get("/usuarios-operativos", listarUsuariosOperativosController);
router.get("/procedimientos", listarProcedimientosController);
router.get("/hallazgos", listarHallazgosController);

export default router;