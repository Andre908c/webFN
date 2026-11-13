const API = {
  async request(path, options = {}) {
    const opts = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    };
    if (opts.body && typeof opts.body === 'object') {
      opts.body = JSON.stringify(opts.body);
    }
    const res = await fetch(path, opts);
    let data = null;
    const text = await res.text();
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { error: text || 'Respuesta inválida' };
    }
    if (!res.ok) {
      const err = new Error((data && data.error) || `Error ${res.status}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  },

  login(email, password) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    });
  },

  logout() {
    return this.request('/api/auth/logout', { method: 'POST' });
  },

  me() {
    return this.request('/api/auth/me');
  },

  // Cliente
  perfil() {
    return this.request('/api/cliente/perfil');
  },
  saldo() {
    return this.request('/api/cliente/saldo');
  },
  movimientos(limit = 20) {
    return this.request(`/api/cliente/movimientos?limit=${limit}`);
  },
  transferir(payload) {
    return this.request('/api/cliente/transferir', { method: 'POST', body: payload });
  },
  cambiarPassword(passwordActual, passwordNueva) {
    return this.request('/api/cliente/cambiar-password', {
      method: 'PUT',
      body: { passwordActual, passwordNueva }
    });
  },

  // Cajero
  cajeroLogin(numero_cuenta, pin) {
    return this.request('/api/cajero/login', {
      method: 'POST',
      body: { numero_cuenta, pin }
    });
  },
  cajeroSaldo() {
    return this.request('/api/cajero/saldo');
  },
  cajeroMovimientos() {
    return this.request('/api/cajero/ultimos-movimientos');
  },
  cajeroRetirar(monto) {
    return this.request('/api/cajero/retirar', { method: 'POST', body: { monto } });
  },
  cajeroLogout() {
    return this.request('/api/cajero/logout', { method: 'POST' });
  },

  // Admin
  adminDashboard() {
    return this.request('/api/admin/dashboard');
  },
  adminClientes(q = '') {
    return this.request(`/api/admin/clientes?q=${encodeURIComponent(q)}`);
  },
  adminCrearCliente(payload) {
    return this.request('/api/admin/clientes', { method: 'POST', body: payload });
  },
  adminEstado(id, estado) {
    return this.request(`/api/admin/clientes/${id}/estado`, {
      method: 'PATCH',
      body: { estado }
    });
  },
  adminConsignar(payload) {
    return this.request('/api/admin/consignaciones', { method: 'POST', body: payload });
  },
  adminMovimientos(limit = 50) {
    return this.request(`/api/admin/movimientos?limit=${limit}`);
  }
};

function formatMoney(n) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(Number(n) || 0);
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(iso));
}

function showAlert(el, message, type = 'error') {
  if (!el) return;
  el.className = `alert alert-${type === 'ok' ? 'ok' : type === 'info' ? 'info' : 'error'}`;
  el.textContent = message;
  el.hidden = false;
}

function hideAlert(el) {
  if (el) el.hidden = true;
}
