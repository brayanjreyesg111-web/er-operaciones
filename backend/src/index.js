const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    ok: true,
    mensaje: 'Backend ER Operaciones funcionando correctamente'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    servicio: 'ER Operaciones API',
    estado: 'activo'
  });
});

app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});