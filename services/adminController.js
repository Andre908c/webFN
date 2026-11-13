const adminService = require('../services/adminService');

async function dashboard(req, res) {
  try {
    res.json(await adminService.getDashboard());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function listarClientes(req, res) {
  try {
    res.json(await adminService.listarClientes(req.query.q || ''));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function crearCliente(req, res) {
  try {
    const data = await adminService.crearCliente(req.body);
    res.status(201).json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function cambiarEstado(req, res) {
  try {
    const data = await adminService.cambiarEstadoCliente(req.params.id, req.body.estado);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function consignar(req, res) {
  try {
    const { numero_cuenta, monto, descripcion } = req.body;
    const data = await adminService.consignar(numero_cuenta, monto, descripcion);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function movimientos(req, res) {
  try {
    res.json(await adminService.listarMovimientos(req.query.limit || 50));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  dashboard,
  listarClientes,
  crearCliente,
  cambiarEstado,
  consignar,
  movimientos
};