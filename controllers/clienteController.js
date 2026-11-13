const clienteService = require('../services/clienteService');
const transferenciaService = require('../services/transferenciaService');

async function perfil(req, res) {
  try {
    const data = await clienteService.getPerfil(req.session.user.id);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function saldo(req, res) {
  try {
    const data = await clienteService.getSaldo(req.session.user.id);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function movimientos(req, res) {
  try {
    const limit = req.query.limit || 20;
    const data = await clienteService.getMovimientos(req.session.user.id, limit);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function actualizarPerfil(req, res) {
  try {
    const data = await clienteService.updatePerfil(req.session.user.id, req.body);
    if (req.session.user) {
      req.session.user.nombre = data.nombre;
    }
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function cambiarPassword(req, res) {
  try {
    const { passwordActual, passwordNueva } = req.body;
    const data = await clienteService.cambiarPassword(
      req.session.user.id,
      passwordActual,
      passwordNueva
    );
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function transferir(req, res) {
  try {
    const { numero_cuenta_destino, monto, descripcion } = req.body;
    const data = await transferenciaService.transferir(
      req.session.user.id,
      numero_cuenta_destino,
      monto,
      descripcion
    );
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = {
  perfil,
  saldo,
  movimientos,
  actualizarPerfil,
  cambiarPassword,
  transferir
};