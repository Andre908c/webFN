const authService = require('../services/authService');

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await authService.login(email, password);

    req.session.user = {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      estado: user.estado,
      cuenta: user.cuenta
    };

    return res.json({
      message: 'Login exitoso',
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        cuenta: user.cuenta
      }
    });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || 'Error interno' });
  }
}

function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'No se pudo cerrar la sesión' });
    }
    res.clearCookie('connect.sid');
    return res.json({ message: 'Sesión cerrada' });
  });
}

function me(req, res) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  return res.json({ user: req.session.user });
}

module.exports = {
  login,
  logout,
  me
};
