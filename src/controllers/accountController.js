const db = require('../db'); // Agora isso é o objeto knex
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Função de Login (Gera o Token)
exports.login = async (req, res) => {
  const { cpf, senha } = req.body;

  if (!cpf || !senha) {
    return res.status(400).json({ erro: 'Informe CPF e senha.' });
  }

  try {
    // Busca cliente e conta unindo as tabelas
    const client = await db('clients')
      .join('accounts', 'clients.id', 'accounts.client_id')
      .where('clients.cpf', cpf)
      .select('clients.id as client_id', 'accounts.id as account_id', 'accounts.password_hash', 'accounts.account_number')
      .first();

    if (!client) {
      return res.status(401).json({ erro: 'Usuário não encontrado.' });
    }

    // Verifica a senha com bcrypt
    const validPassword = await bcrypt.compare(senha, client.password_hash);

    if (!validPassword) {
      return res.status(401).json({ erro: 'Senha incorreta.' });
    }

    // Gera o Token JWT
    const token = jwt.sign(
      { id: client.account_id, accountNumber: client.account_number },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      mensagem: 'Login realizado com sucesso!',
      token: token
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro no login.' });
  }
};

exports.createAccount = async (req, res) => {
  const { nome, cpf, data_nascimento, senha } = req.body;

  if (!nome || !cpf || !data_nascimento || !senha) {
    return res.status(400).json({ erro: 'Dados incompletos.' });
  }

  try {
    // Hash da senha antes de salvar
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(senha, salt);

    // Transação com Knex
    await db.transaction(async (trx) => {
      // 1. Inserir Cliente
      const [client] = await trx('clients')
        .insert({
          name: nome,
          cpf: cpf,
          birth_date: data_nascimento
        })
        .returning('id'); // Retorna o ID inserido

      // 2. Gerar dados e Inserir Conta
      const accountNumber = Math.floor(Math.random() * 999999).toString();

      await trx('accounts').insert({
        client_id: client.id, // Knex retorna objeto { id: 1 }
        account_number: accountNumber,
        agency: '0001',
        password_hash: passwordHash // Salvando hash, não a senha pura
      });

      res.status(201).json({
        mensagem: 'Conta criada com sucesso!',
        dados: { cliente: nome, conta: accountNumber }
      });
    });

  } catch (error) {
    console.error(error);
    if (error.code === '23505') { // Código de erro do Postgres para duplicidade mantém o mesmo
      return res.status(409).json({ erro: 'CPF já cadastrado.' });
    }
    res.status(500).json({ erro: 'Erro ao criar conta.' });
  }
};

exports.deposit = async (req, res) => {
  const { numero_conta, valor } = req.body;

  // Nota: Como usamos JWT, poderíamos pegar o numero_conta do token (req.accountNumber)
  // Mas para depósito, geralmente permitimos depositar na conta de outros, então mantive via body.

  if (!numero_conta || !valor || valor <= 0) {
    return res.status(400).json({ erro: 'Dados inválidos.' });
  }

  try {
    await db.transaction(async (trx) => {
      // 1. Verifica se conta existe
      const account = await trx('accounts')
        .where('account_number', numero_conta)
        .first();

      if (!account) {
        // Forçamos um erro para cancelar a transação
        throw new Error('CONTA_NAO_ENCONTRADA');
      }

      // 2. Atualiza Saldo
      await trx('accounts')
        .where('id', account.id)
        .increment('balance', valor);

      // 3. Registra Transação
      await trx('transactions').insert({
        account_id: account.id,
        type: 'DEPOSIT',
        amount: valor,
        description: 'Depósito via API'
      });

      // Busca saldo atualizado para retornar
      const updatedAccount = await trx('accounts').where('id', account.id).first();

      res.status(200).json({
        mensagem: 'Depósito realizado!',
        saldo_atual: updatedAccount.balance
      });
    });

  } catch (error) {
    if (error.message === 'CONTA_NAO_ENCONTRADA') {
      return res.status(404).json({ erro: 'Conta não encontrada.' });
    }
    console.error(error);
    res.status(500).json({ erro: 'Erro ao realizar depósito.' });
  }
};