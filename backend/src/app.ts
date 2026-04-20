import express from "express";
import cors from "cors";
import path from "node:path";
import routes from "./routes";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: false,
  })
);

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

app.use("/storage", express.static(path.resolve(process.cwd(), "storage")));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, mensaje: "Servidor funcionando correctamente." });
});

app.get("/api", (_req, res) => {
  res.json({
    ok: true,
    mensaje: "API ER Operaciones activa.",
    modulos: [
      "ordenes-servicio",
      "visitas",
      "reportes",
      "clientes",
      "maquinas",
      "catalogos",
      "solicitudes-publicas",
    ],
  });
});

app.use("/api", routes);

export default app;
