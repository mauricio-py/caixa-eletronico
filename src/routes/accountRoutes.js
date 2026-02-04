const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const authMiddleware = require('../middlewares/authMiddleware');

// Rota pública (qualquer um pode criar conta ou logar)
router.post('/criar', accountController.createAccount);
router.post('/login', accountController.login);

// Rotas protegidas (precisa de Token JWT no Header)
// O middleware vem antes do controller
router.post('/depositar', authMiddleware, accountController.deposit);

module.exports = router;