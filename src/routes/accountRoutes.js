const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const authMiddleware = require('../middlewares/authMiddleware');

//Metodos de conta
router.get('/listar', accountController.getAllAccounts);
router.post('/criar', accountController.createAccount);
router.post('/login', accountController.login);

// Métodos protegidos por autenticação
router.post('/depositar', authMiddleware, accountController.deposit);
router.post('/sacar', authMiddleware, accountController.withdraw);
router.post('/transferir', authMiddleware, accountController.transfer);
router.get('/extrato', authMiddleware, accountController.getStatement);

module.exports = router;