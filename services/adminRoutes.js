const express = require('express');
const adminController = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(requireAuth, requireRole('ADMIN'));

router.get('/dashboard', adminController.dashboard);
router.get('/clientes', adminController.listarClientes);
router.post('/clientes', adminController.crearCliente);
router.patch('/clientes/:id/estado', adminController.cambiarEstado);
router.post('/consignaciones', adminController.consignar);
router.get('/movimientos', adminController.movimientos);

module.exports = router;