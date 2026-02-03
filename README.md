# 🏧 API Caixa Eletrônico (ATM Simulator)

API RESTful desenvolvida em Node.js e PostgreSQL simulando as operações essenciais de um sistema bancário real.

O projeto segue um padrão arquitetural robusto:

- **Código Interno & Banco de Dados:** Inglês (Padrão Internacional).
- **Interface da API (URLs e JSON):** Português (Para o cliente final brasileiro).

## 🚀 Tecnologias

- **Node.js** (Runtime)
- **Express** (Framework Web)
- **PostgreSQL** (Banco de Dados Relacional)
- **pg** (Driver de conexão e Pool)
- **dotenv** (Gerenciamento de variáveis de ambiente)

---

## ⚙️ Configuração e Instalação

### 1. Pré-requisitos

- Tenha o **Node.js** e o **PostgreSQL** instalados na sua máquina.

### 2. Instalação

Clone o repositório e instale as dependências:

```bash
npm install
3. Configurando o Banco de Dados
Crie um banco de dados vazio no seu PostgreSQL chamado caixa_eletronico.

Crie um arquivo .env na raiz do projeto (baseado nas suas credenciais):

Snippet de código
DB_USER=postgres
DB_HOST=localhost
DB_DATABASE=caixa_eletronico
DB_PASSWORD=sua_senha
DB_PORT=5432
PORT=3000
4. Criando as Tabelas
Execute o script de configuração para criar as tabelas (clients, accounts, transactions) automaticamente:

Bash
node src/setup.js
5. Rodando o Servidor
Bash
npm start
O servidor rodará em http://localhost:3000.

📖 Documentação da API
1. Criar Conta
Cria um novo cliente e uma conta bancária vinculada.

URL: /contas/criar

Método: POST

Corpo da Requisição (JSON):

JSON
{
    "nome": "João da Silva",
    "cpf": "12345678900",
    "data_nascimento": "1990-05-20",
    "senha": "123456"
}
2. Depósito
Adiciona saldo à conta e registra a transação.

URL: /contas/depositar

Método: POST

Corpo da Requisição (JSON):

JSON
{
    "numero_conta": "123456",
    "valor": 500.00
}
🗂 Estrutura do Projeto
Plaintext
/
├── src
│    ├── controllers  # Lógica de negócio (English filenames)
│    ├── routes       # Definição de rotas (English filenames)
│    ├── db.js        # Conexão com o Banco (Pool)
│    └── setup.js     # Script de Reset/Criação do Banco
├── database          # Scripts SQL de referência
├── .env              # Variáveis de ambiente (não comitar)
├── index.js          # Ponto de entrada da aplicação
└── README.md         # Documentação
```
