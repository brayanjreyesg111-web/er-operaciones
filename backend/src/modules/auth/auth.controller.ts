import type { Request, Response } from "express";
import { loginService, verifyToken } from "./auth.service";

export async function loginController(req: Request, res: Response) {
  try {
    const email = String(req.body?.email || "").trim();
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        mensaje: "Correo y contraseña son obligatorios.",
      });
    }

    const data = await loginService(email, password);

    return res.json({ ok: true, data });
  } catch (error: unknown) {
    const mensaje =
      error instanceof Error ? error.message : "No se pudo iniciar sesión.";

    return res.status(401).json({ ok: false, mensaje });
  }
}

export async function meController(req: Request, res: Response) {
  try {
    const auth = String(req.headers.authorization || "");
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

    if (!token) {
      return res.status(401).json({ ok: false, mensaje: "Token no enviado." });
    }

    const payload = verifyToken(token);
    return res.json({ ok: true, data: payload });
  } catch {
    return res.status(401).json({ ok: false, mensaje: "Token inválido o vencido." });
  }
}
