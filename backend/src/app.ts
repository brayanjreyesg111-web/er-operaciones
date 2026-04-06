import express from "express";
import routes from "./routes";

const app = express();

/**
 * SECCIÓN 8.1
 * Middleware para leer JSON.
 */
app.use(express.json());

/**
 * SECCIÓN 8.2
 * Ruta health opcional para revisar que el servidor está vivo.
 */
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    mensaje: "Servidor funcionando correctamente.",
  });
});

/**
 * SECCIÓN 8.3
 * Integración del router principal.
 */
app.use("/api", routes);

export default app;