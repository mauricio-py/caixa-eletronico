-- Clientes
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cpf VARCHAR(11) UNIQUE NOT NULL,
    data_nascimento DATE NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contas
CREATE TABLE contas (
    id SERIAL PRIMARY KEY,
    cliente_id INT REFERENCES clientes (id),
    numero_conta VARCHAR(20) UNIQUE NOT NULL,
    agencia VARCHAR(10) NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    saldo NUMERIC(15, 2) DEFAULT 0.00 CHECK (saldo >= 0),
    ativa BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enum e Transações
CREATE TYPE tipo_transacao AS ENUM ('DEPOSITO', 'SAQUE', 'TRANSFERENCIA_ENVIADA', 'TRANSFERENCIA_RECEBIDA');

CREATE TABLE transacoes (
    id SERIAL PRIMARY KEY,
    conta_id INT REFERENCES contas (id),
    tipo tipo_transacao NOT NULL,
    valor NUMERIC(15, 2) NOT NULL,
    conta_destino_origem_info VARCHAR(100),
    data_transacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);