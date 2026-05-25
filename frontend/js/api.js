// ===== API Layer — Comunicación con el Backend FastAPI =====
const API_BASE = 'http://localhost:8000';

function getToken() {
  return localStorage.getItem('access_token');
}

function authHeaders() {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {}),
    },
  };
  
  try {
    const response = await fetch(url, config);
    
    if (response.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_name');
      window.location.href = 'index.html';
      return null;
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.detail || `Error ${response.status}`);
    }
    
    return data;
  } catch (error) {
    if (error.message === 'Failed to fetch') {
      throw new Error('No se pudo conectar con el servidor. ¿Está corriendo el backend?');
    }
    throw error;
  }
}

// --- Auth ---
async function apiLogin(username, password) {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);
  
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData,
  });
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Error de autenticación');
  return data;
}

async function apiLogout() {
  return apiRequest('/auth/logout', { method: 'POST' });
}

// --- Personal ---
async function apiGetPersonal() {
  return apiRequest('/personal/');
}

async function apiGetUsuario(id) {
  return apiRequest(`/personal/${id}`);
}

async function apiCreateUsuario(data) {
  return apiRequest('/personal/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

async function apiUpdateUsuario(id, data) {
  return apiRequest(`/personal/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

async function apiDeleteUsuario(id) {
  return apiRequest(`/personal/${id}`, { method: 'DELETE' });
}

// --- Productos ---
async function apiGetProductos() {
  return apiRequest('/productos/');
}

async function apiGetProducto(id) {
  return apiRequest(`/productos/${id}`);
}

async function apiCreateProducto(data) {
  return apiRequest('/productos/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

async function apiUpdateProducto(id, data) {
  return apiRequest(`/productos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

async function apiDeleteProducto(id) {
  return apiRequest(`/productos/${id}`, { method: 'DELETE' });
}

// --- Proveedores ---
async function apiGetProveedores() {
  return apiRequest('/proveedores/');
}

async function apiGetProveedor(id) {
  return apiRequest(`/proveedores/${id}`);
}

async function apiCreateProveedor(data) {
  return apiRequest('/proveedores/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

async function apiUpdateProveedor(id, data) {
  return apiRequest(`/proveedores/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

async function apiDeleteProveedor(id) {
  return apiRequest(`/proveedores/${id}`, { method: 'DELETE' });
}

// --- Compras ---
async function apiGetCompras() {
  return apiRequest('/compras/');
}

async function apiCreateCompra(compraData) {
  return apiRequest('/compras/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(compraData),
  });
}

// --- Ventas ---
async function apiGetVentas() {
  return apiRequest('/ventas/');
}

async function apiCreateVenta(ventaData) {
  return apiRequest('/ventas/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ventaData),
  });
}

// --- Reportes (Kardex) ---
async function apiGetKardexCompras() {
  return apiRequest('/kardex/compras');
}

async function apiGetKardexVentas() {
  return apiRequest('/kardex/ventas');
}
