const db = require('./db');

async function setupDatabase() {
  const query = `
        -- 1. DROP (Limpeza) - Apaga as tabelas antigas se existirem
        DROP TABLE IF EXISTS transacoes CASCADE;
        DROP TABLE IF EXISTS contas CASCADE;
        DROP TABLE IF EXISTS clientes CASCADE;
        DROP TYPE IF EXISTS tipo_transacao CASCADE;
        
        -- Apaga as novas em inglês caso precise rodar o script de novo no futuro
        DROP TABLE IF EXISTS transactions CASCADE;
        DROP TABLE IF EXISTS accounts CASCADE;
        DROP TABLE IF EXISTS clients CASCADE;
        DROP TYPE IF EXISTS transaction_type CASCADE;

        -- 2. CREATE Clients
        CREATE TABLE clients (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            cpf VARCHAR(11) UNIQUE NOT NULL,
            birth_date DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- 3. CREATE Accounts
        CREATE TABLE accounts (
            id SERIAL PRIMARY KEY,
            client_id INT REFERENCES clients(id),
            account_number VARCHAR(20) UNIQUE NOT NULL,
            agency VARCHAR(10) NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            balance NUMERIC(15, 2) DEFAULT 0.00 CHECK (balance >= 0),
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- 4. CREATE ENUM & Transactions
        CREATE TYPE transaction_type AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'TRANSFER_SENT', 'TRANSFER_RECEIVED');

        CREATE TABLE transactions (
            id SERIAL PRIMARY KEY,
            account_id INT REFERENCES accounts(id),
            type transaction_type NOT NULL,
            amount NUMERIC(15, 2) NOT NULL,
            description VARCHAR(100), -- antigo conta_destino_origem_info
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

  try {
    await db.pool.query(query);
    console.log("✅ Database reset and updated to English successfully!");
  } catch (error) {
    console.error("❌ Error setting up database:", error);
  } finally {
    await db.pool.end();
  }
}

setupDatabase();