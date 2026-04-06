import app from "./app";

const PORT = Number(process.env.PORT) || 3001;

/**
 * SECCIÓN 9.1
 * Levanta el servidor Express.
 */
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});