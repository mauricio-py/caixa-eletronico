const express = require('express');
const db = require('./src/db');
const accountRoutes = require('./src/routes/accountRoutes'); // O arquivo continua com nome em inglês

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// MUDANÇA AQUI: Prefixo da URL em português
app.use('/contas', accountRoutes);

app.get('/', async (req, res) => {
  // ... (mantenha seu health check igual)
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});