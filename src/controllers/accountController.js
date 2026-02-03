const db = require('../db');

exports.createAccount = async (req, res) => {
  // AGORA ACEITAMOS O JSON EM PORTUGUÊS
  const { nome, cpf, data_nascimento, senha } = req.body;

  // Validação usando as variáveis em português
  if (!nome || !cpf || !data_nascimento || !senha) {
    return res.status(400).json({
      erro: 'Todos os campos são obrigatórios (nome, cpf, data_nascimento, senha).'
    });
  }

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Inserir Cliente (Tabela em Inglês, Variável em Português)
    const clientRes = await client.query(
      'INSERT INTO clients (name, cpf, birth_date) VALUES ($1, $2, $3) RETURNING id',
      [nome, cpf, data_nascimento] // Mapeando: nome -> name, data_nascimento -> birth_date
    );

    const clientId = clientRes.rows[0].id;

    // 2. Gerar dados da conta
    const accountNumber = Math.floor(Math.random() * 999999).toString();
    const agency = '0001';

    // 3. Inserir Conta
    await client.query(
      'INSERT INTO accounts (client_id, account_number, agency, password_hash) VALUES ($1, $2, $3, $4)',
      [clientId, accountNumber, agency, senha] // Mapeando: senha -> password_hash
    );

    await client.query('COMMIT');

    res.status(201).json({
      mensagem: 'Conta criada com sucesso!',
      dados: {
        cliente: nome,
        agencia: agency,
        conta: accountNumber,
        saldo: 0.00
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');

    if (error.code === '23505') {
      return res.status(409).json({ erro: 'CPF ou conta já cadastrados.' });
    }

    console.error(error);
    res.status(500).json({ erro: 'Erro interno ao criar conta.' });
  } finally {
    client.release();
  }
};

exports.deposit = async (req, res) => {
  // MUDAMOS AQUI TAMBÉM: JSON EM PORTUGUÊS
  const { numero_conta, valor } = req.body;

  if (!numero_conta || !valor || valor <= 0) {
    return res.status(400).json({ erro: 'Dados inválidos. Informe numero_conta e valor.' });
  }

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Atualizar Saldo
    const updateResult = await client.query(
      `UPDATE accounts 
             SET balance = balance + $1 
             WHERE account_number = $2 
             RETURNING id, balance`,
      [valor, numero_conta] // Mapeando: valor -> amount
    );

    if (updateResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ erro: 'Conta não encontrada.' });
    }

    const accountId = updateResult.rows[0].id;
    const currentBalance = updateResult.rows[0].balance;

    // 2. Registrar Transação
    await client.query(
      `INSERT INTO transactions (account_id, type, amount, description) 
             VALUES ($1, 'DEPOSIT', $2, 'Depósito em Caixa Eletrônico')`,
      [accountId, valor]
    );

    await client.query('COMMIT');

    res.status(200).json({
      mensagem: 'Depósito realizado com sucesso!',
      dados: {
        conta: numero_conta,
        valorDepositado: valor,
        saldoAtual: currentBalance
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ erro: 'Erro interno ao realizar depósito.' });
  } finally {
    client.release();
  }
};