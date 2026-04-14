import express from "express";
import cors from "cors";
import path from "node:path";
import routes from "./routes";

const app = express();

/**
 * SECCIÓN 8.0
 * CORS para permitir frontend local con Vite.
 */
app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: false,
  })
);

/**
 * SECCIÓN 8.1
 * Middleware para leer JSON.
 */
app.use(express.json());

/**
 * SECCIÓN 8.1-A
 * Publicar carpeta storage para acceso local por URL.
 */
app.use(
  "/storage",
  express.static(path.resolve(process.cwd(), "storage"))
);

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