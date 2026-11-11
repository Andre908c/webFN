
const express = require('express');
const clienteController = require('../controllers/clienteController');
const {
  requireAuth,
  requireRole,
  requireActiveAccount
} = require('../middleware/authMiddleware');

const router = express.Router();

router.use(requireAuth, requireRole('CLIENTE'), requireActiveAccount);

router.get('/perfil', clienteController.perfil);
router.get('/saldo', clienteController.saldo);
router.get('/movimientos', clienteController.movimientos);
router.put('/perfil', clienteController.actualizarPerfil);
router.put('/cambiar-password', clienteController.cambiarPassword);

module.exports = router;