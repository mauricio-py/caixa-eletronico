const db = require('../db'); // O nosso Knex configurado
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. LOGIN
exports.login = async (req, res) => {
  const { cpf, senha } = req.body;

  if (!cpf || !senha) {
    return res.status(400).json({ erro: 'Informe CPF e senha.' });
  }

  try {
    // Busca o cliente e a conta dele
    const client = await db('clients')
      .join('accounts', 'clients.id', 'accounts.client_id')
      .where('clients.cpf', cpf)
      .select('accounts.id', 'accounts.password_hash', 'accounts.account_number')
      .first();

    if (!client) {
      return res.status(401).json({ erro: 'Usuário não encontrado.' });
    }

    // Verifica a senha
    const validPassword = await bcrypt.compare(senha, client.password_hash);

    if (!validPassword) {
      return res.status(401).json({ erro: 'Senha incorreta.' });
    }

    // Gera o token
    const token = jwt.sign(
      { id: client.id, accountNumber: client.account_number },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ mensagem: 'Login realizado com sucesso!', token });

  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro no login.' });
  }
};

// 2. CRIAR CONTA
exports.createAccount = async (req, res) => {
  const { nome, cpf, data_nascimento, senha } = req.body;

  if (!nome || !cpf || !data_nascimento || !senha) {
    return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(senha, salt);

    await db.transaction(async (trx) => {
      const [client] = await trx('clients')
        .insert({ name: nome, cpf: cpf, birth_date: data_nascimento })
        .returning('id');

      const accountNumber = Math.floor(Math.random() * 999999).toString();

      await trx('accounts').insert({
        client_id: client.id,
        account_number: accountNumber,
        agency: '0001',
        password_hash: passwordHash
      });

      res.status(201).json({
        mensagem: 'Conta criada com sucesso!',
        dados: { cliente: nome, conta: accountNumber }
      });
    });

  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ erro: 'CPF já cadastrado.' });
    console.error(error);
    res.status(500).json({ erro: 'Erro ao criar conta.' });
  }
};

// 3. DEPÓSITO
exports.deposit = async (req, res) => {
  const { numero_conta, valor } = req.body;

  if (!numero_conta || !valor || valor <= 0) {
    return res.status(400).json({ erro: 'Dados inválidos.' });
  }

  try {
    await db.transaction(async (trx) => {
      const account = await trx('accounts').where('account_number', numero_conta).first();

      if (!account) return res.status(404).json({ erro: 'Conta não encontrada.' });

      // Soma o valor ao saldo
      await trx('accounts').where('id', account.id).increment('balance', valor);

      await trx('transactions').insert({
        account_id: account.id,
        type: 'DEPOSIT',
        amount: valor,
        description: 'Depósito via API'
      });

      res.status(200).json({ mensagem: 'Depósito realizado!' });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao depositar.' });
  }
};

// 4. SAQUE (AQUI ESTÁ O QUE FALTAVA!)
exports.withdraw = async (req, res) => {
  const { numero_conta, valor } = req.body;

  if (!numero_conta || !valor || valor <= 0) {
    return res.status(400).json({ erro: 'Dados inválidos.' });
  }

  try {
    await db.transaction(async (trx) => {
      // 1. Acha a conta
      const account = await trx('accounts').where('account_number', numero_conta).first();

      if (!account) {
        // Como estamos numa transaction, precisamos lançar erro pra parar tudo
        throw new Error('CONTA_NAO_ENCONTRADA');
      }

      // 2. VERIFICA SE TEM SALDO (A Lógica Principal)
      if (parseFloat(account.balance) < valor) {
        throw new Error('SALDO_INSUFICIENTE');
      }

      // 3. Tira o dinheiro
      await trx('accounts').where('id', account.id).decrement('balance', valor);

      // 4. Salva no histórico
      await trx('transactions').insert({
        account_id: account.id,
        type: 'WITHDRAWAL', // Tipo SAQUE
        amount: valor,
        description: 'Saque em Caixa Eletrônico'
      });

      // Pega o saldo atualizado pra mostrar
      const contaAtualizada = await trx('accounts').where('id', account.id).first();

      res.status(200).json({
        mensagem: 'Saque realizado com sucesso!',
        saldo_atual: contaAtualizada.balance
      });
    });

  } catch (error) {
    // Tratamento de erros manuais
    if (error.message === 'CONTA_NAO_ENCONTRADA') return res.status(404).json({ erro: 'Conta não encontrada.' });
    if (error.message === 'SALDO_INSUFICIENTE') return res.status(400).json({ erro: 'Saldo insuficiente.' });

    console.error(error);
    res.status(500).json({ erro: 'Erro ao processar saque.' });
  }
};

// 5. LISTAR CONTAS
exports.getAllAccounts = async (req, res) => {
  try {
    const accounts = await db('accounts')
      .join('clients', 'accounts.client_id', 'clients.id')
      .select('accounts.account_number', 'accounts.balance', 'clients.name', 'clients.cpf');

    res.status(200).json(accounts);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao listar.' });
  }
};

exports.transfer = async (req, res) => {
  const { numero_conta_destino, valor } = req.body;
  const id_remetente = req.userId; // Pegamos do Token (Segurança!)

  if (!numero_conta_destino || !valor || valor <= 0) {
    return res.status(400).json({ erro: 'Dados inválidos.' });
  }

  try {
    await db.transaction(async (trx) => {
      // 1. Busca dados do Remetente (quem envia)
      // Precisamos do saldo dele e do numero da conta para o histórico
      const remetente = await trx('accounts').where('id', id_remetente).first();

      // 2. Valida Saldo
      if (parseFloat(remetente.balance) < valor) {
        throw new Error('SALDO_INSUFICIENTE');
      }

      // 3. Busca dados do Destinatário (quem recebe)
      const destinatario = await trx('accounts').where('account_number', numero_conta_destino).first();

      if (!destinatario) {
        throw new Error('CONTA_DESTINO_INEXISTENTE');
      }

      // Validação extra: não pode transferir pra si mesmo
      if (remetente.id === destinatario.id) {
        throw new Error('TRANSFERENCIA_PARA_SI_MESMO');
      }

      // --- AQUI COMEÇA A MOVIMENTAÇÃO DO DINHEIRO ---

      // 4. Tira do Remetente
      await trx('accounts').where('id', remetente.id).decrement('balance', valor);

      // 5. Põe no Destinatário
      await trx('accounts').where('id', destinatario.id).increment('balance', valor);

      // --- AQUI COMEÇA O REGISTRO DO EXTRATO (2 Linhas) ---

      // 6. Registro no Extrato do Remetente (Saída)
      await trx('transactions').insert({
        account_id: remetente.id,
        type: 'TRANSFER_SENT',
        amount: valor,
        description: `Transf. enviada para conta ${destinatario.account_number}`
      });

      // 7. Registro no Extrato do Destinatário (Entrada)
      await trx('transactions').insert({
        account_id: destinatario.id,
        type: 'TRANSFER_RECEIVED',
        amount: valor,
        description: `Transf. recebida de conta ${remetente.account_number}`
      });

      // Retorna o saldo atualizado de quem enviou
      const saldoAtualizado = await trx('accounts').where('id', remetente.id).first();

      res.status(200).json({
        mensagem: 'Transferência realizada com sucesso!',
        saldo_atual: saldoAtualizado.balance
      });
    });

  } catch (error) {
    if (error.message === 'SALDO_INSUFICIENTE') return res.status(400).json({ erro: 'Saldo insuficiente.' });
    if (error.message === 'CONTA_DESTINO_INEXISTENTE') return res.status(404).json({ erro: 'Conta de destino não encontrada.' });
    if (error.message === 'TRANSFERENCIA_PARA_SI_MESMO') return res.status(400).json({ erro: 'Não é possível transferir para a própria conta.' });

    console.error(error);
    res.status(500).json({ erro: 'Erro ao realizar transferência.' });
  }
};