
const express = require('express');
const cajeroController = require('../controllers/cajeroController');

const router = express.Router();

router.post('/login', cajeroController.login);
router.get('/saldo', cajeroController.saldo);
router.get('/ultimos-movimientos', cajeroController.ultimosMovimientos);
router.post('/retirar', cajeroController.retirar);
router.post('/logout', cajeroController.logout);

module.exports = router;