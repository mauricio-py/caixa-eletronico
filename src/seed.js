const db = require('./db');

// 👇👇 COLOQUE O CPF DA CONTA QUE VOCÊ SABE A SENHA AQUI 👇👇
const CPF_ALVO = '12385678911';

async function seedTransactions() {
  try {
    const account = await db('accounts')
      .join('clients', 'accounts.client_id', 'clients.id')
      .where('clients.cpf', CPF_ALVO)
      .select('accounts.id', 'accounts.balance') // Selecionamos o ID da CONTA
      .first();

    if (!account) {
      console.error(`Nenhuma conta encontrada para o CPF ${CPF_ALVO}.`);
      process.exit(1);
    }

    console.log(`👤 Conta encontrada! ID: ${account.id}. Gerando transações...`);

    const transacoesFalsas = [];
    for (let i = 0; i < 25; i++) {
      transacoesFalsas.push({
        account_id: account.id,
        type: i % 2 === 0 ? 'DEPOSIT' : 'WITHDRAWAL',
        amount: 50.00,
        description: `Teste Paginação #${i + 1}`,
        created_at: new Date()
      });
    }

    await db('transactions').insert(transacoesFalsas);

    await db('accounts')
      .where('id', account.id)
      .update({ balance: 5000.00 });

    console.log("✅ Sucesso! Transações inseridas na SUA conta.");
    process.exit(0);

  } catch (error) {
    console.error("ERRO:", error.message);
    process.exit(1);
  }
}

seedTransactions();