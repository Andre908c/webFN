const cajeroService = require('../services/cajeroService');

async function login(req, res) {
  try {
    const { numero_cuenta, pin } = req.body;
    const data = await cajeroService.loginCajero(numero_cuenta, pin);
    req.session.cajero = data;
    res.json({ message: 'Acceso a cajero OK', cuenta: data });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function saldo(req, res) {
  try {
    if (!req.session.cajero) {
      return res.status(401).json({ error: 'Debe autenticarse en el cajero' });
    }
    const data = await cajeroService.getSaldo(req.session.cajero.cuentaId);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function ultimosMovimientos(req, res) {
  try {
    if (!req.session.cajero) {
      return res.status(401).json({ error: 'Debe autenticarse en el cajero' });
    }
    const data = await cajeroService.getUltimosMovimientos(
      req.session.cajero.cuentaId
    );
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function retirar(req, res) {
  try {
    if (!req.session.cajero) {
      return res.status(401).json({ error: 'Debe autenticarse en el cajero' });
    }
    const { monto } = req.body;
    const data = await cajeroService.retirar(req.session.cajero.cuentaId, monto);
    res.json(data);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

function logout(req, res) {
  delete req.session.cajero;
  res.json({ message: 'Sesión de cajero cerrada' });
}

module.exports = {
  login,
  saldo,
  ultimosMovimientos,
  retirar,
  logout
};