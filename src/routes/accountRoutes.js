const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');

// MUDANÇA AQUI: Rotas em português
router.post('/criar', accountController.createAccount);
router.post('/depositar', accountController.deposit);

module.exports = router;