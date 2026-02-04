# 🏧 API Caixa Eletrônico (ATM Simulator)

API RESTful desenvolvida em Node.js e PostgreSQL simulando as operações essenciais de um sistema bancário real, com foco em segurança e integridade de transações.

O projeto segue um padrão arquitetural robusto:

- **Código Interno & Banco de Dados:** Inglês (Padrão Internacional).
- **Interface da API (URLs e JSON):** Português (Para o cliente final brasileiro).

## 🚀 Tecnologias

- **Node.js** (Runtime)
- **Express** (Framework Web)
- **Knex.js** (SQL Query Builder & Migrations)
- **PostgreSQL** (Banco de Dados Relacional)
- **JWT (JsonWebToken)** (Autenticação Segura)
- **Bcrypt.js** (Criptografia de Senhas)
- **dotenv** (Gerenciamento de variáveis de ambiente)

---

## ⚙️ Configuração e Instalação

### 1. Pré-requisitos

- Tenha o **Node.js** e o **PostgreSQL** instalados na sua máquina.

### 2. Instalação

Clone o repositório e instale as dependências:

```bash
npm install
```

### 3. Configurando o Banco de Dados

```bash
Crie um banco de dados vazio no seu PostgreSQL chamado caixa_eletronico.

Crie um arquivo .env na raiz do projeto com as suas credenciais. Atenção: Defina uma JWT_SECRET segura.

Snippet de código
DB_USER=postgres
DB_HOST=localhost
DB_DATABASE=caixa_eletronico
DB_PASSWORD=sua_senha
DB_PORT=5432
JWT_SECRET=minha_chave_super_secreta
PORT=3000
```

### 4. Criando as Tabelas

Execute o script de configuração para criar as tabelas (clients, accounts, transactions) automaticamente:

Bash
node src/setup.js 5. Rodando o Servidor
Bash
npm start
O servidor rodará em http://localhost:3000.

🔐 Autenticação (Como usar)
A API utiliza Tokens JWT.

Crie uma conta.

Faça Login para receber seu token.

Nas rotas protegidas (Depósito, Saque, Transferência), envie o token no Header da requisição:

Key: Authorization

Value: Bearer SEU_TOKEN_AQUI

📖 Documentação da API

1. Rotas Públicas
   Criar Conta
   Cria um novo cliente e uma conta bancária vinculada.

```bash
URL: /contas/criar

Método: POST

JSON
{
    "nome": "João da Silva",
    "cpf": "12345678900",
    "data_nascimento": "1990-05-20",
    "senha": "123"
}
Login
Autentica o usuário e retorna o Token de acesso.

URL: /contas/login

Método: POST

JSON
{
    "cpf": "12345678900",
    "senha": "123"
}
2. Rotas Protegidas (Requer Token Bearer)
Listar Contas
Lista todas as contas cadastradas (Admin).

URL: /contas/listar

Método: GET

Depósito
Adiciona saldo à conta.

URL: /contas/depositar

Método: POST

JSON
{
    "numero_conta": "123456",
    "valor": 500.00
}
Saque
Retira saldo da conta (valida se há fundos suficientes).

URL: /contas/sacar

Método: POST

JSON
{
    "numero_conta": "123456",
    "valor": 50.00
}
Transferência
Transfere dinheiro da conta logada para outra conta.

URL: /contas/transferir

Método: POST

JSON
{
    "numero_conta_destino": "654321",
    "valor": 100.00
}
```

🗂 Estrutura do Projeto

```bash
Plaintext
/
├── src
│    ├── controllers  # Lógica de negócio (English filenames)
│    ├── middlewares  # Autenticação e validações
│    ├── routes       # Definição de rotas (English filenames)
│    ├── db.js        # Configuração do Knex
│    └── setup.js     # Script de Reset/Criação do Banco
├── database          # Scripts SQL de referência
├── .env              # Variáveis de ambiente
├── index.js          # Ponto de entrada da aplicação
└── README.md         # Documentação
```
