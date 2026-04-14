import { Router } from "express";
import {
  listarCiudadesPorDepartamentoController,
  listarDepartamentosController,
  listarMarcasController,
  listarRefrigerantesController,
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

export default router;
