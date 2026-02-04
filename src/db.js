require('dotenv').config();

const knex = require('knex')({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
  },
  // Configuração do Pool de conexões (opcional, mas recomendado)
  pool: {
    min: 2,
    max: 10
  }
});

// Teste rápido de conexão
knex.raw('SELECT 1')
  .then(() => console.log('✅ PostgreSQL conectado via Knex!'))
  .catch((err) => {
    console.error('❌ Falha na conexão:', err);
    process.exit(1);
  });

module.exports = knex;