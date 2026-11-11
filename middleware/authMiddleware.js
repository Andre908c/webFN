function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (!roles.includes(req.session.user.rol)) {
      return res.status(403).json({ error: 'No autorizado para este recurso' });
    }
    next();
  };
}

function requireActiveAccount(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  if (req.session.user.estado !== 'ACTIVO') {
    return res.status(403).json({ error: 'Cuenta no activa' });
  }
  next();
}

module.exports = {
  requireAuth,
  requireRole,
  requireActiveAccount
};
