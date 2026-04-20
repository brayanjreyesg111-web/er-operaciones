import { Router } from "express";
import { loginController, meController } from "./auth.controller";

const router = Router();

router.post("/login", loginController);
router.get("/me", meController);

export default router;
