import { LoginResponse } from "./types";

const API_BASE = "http://localhost:8000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const config: RequestInit = {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {}),
    },
  };

  const response = await fetch(url, config);

  if (response.status === 401) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_role");
    window.location.href = "/login";
    throw new Error("Sesión expirada");
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || `Error ${response.status}`);
  }

  return data as T;
}

// --- Auth ---
export async function apiLogin(username: string, password: string): Promise<LoginResponse> {
  const formData = new URLSearchParams();
  formData.append("username", username);
  formData.append("password", password);

  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Error de autenticación");
  return data as LoginResponse;
}

export async function apiLogout(): Promise<void> {
  return apiRequest("/auth/logout", { method: "POST" });
}

// --- Personal ---
export const apiGetPersonal = () => apiRequest<any[]>("/personal/");
export const apiGetUsuario = (id: number) => apiRequest<any>(`/personal/${id}`);
export const apiCreateUsuario = (data: any) =>
  apiRequest<any>("/personal/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
export const apiUpdateUsuario = (id: number, data: any) =>
  apiRequest<any>(`/personal/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
export const apiDeleteUsuario = (id: number) =>
  apiRequest<any>(`/personal/${id}`, { method: "DELETE" });

// --- Productos ---
export const apiGetProductos = () => apiRequest<any[]>("/productos/");
export const apiGetProducto = (id: number) => apiRequest<any>(`/productos/${id}`);
export const apiCreateProducto = (data: any) =>
  apiRequest<any>("/productos/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
export const apiUpdateProducto = (id: number, data: any) =>
  apiRequest<any>(`/productos/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
export const apiDeleteProducto = (id: number) =>
  apiRequest<any>(`/productos/${id}`, { method: "DELETE" });

// --- Proveedores ---
export const apiGetProveedores = () => apiRequest<any[]>("/proveedores/");
export const apiGetProveedor = (id: number) => apiRequest<any>(`/proveedores/${id}`);
export const apiCreateProveedor = (data: any) =>
  apiRequest<any>("/proveedores/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
export const apiUpdateProveedor = (id: number, data: any) =>
  apiRequest<any>(`/proveedores/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
export const apiDeleteProveedor = (id: number) =>
  apiRequest<any>(`/proveedores/${id}`, { method: "DELETE" });

// --- Compras ---
export const apiGetCompras = () => apiRequest<any[]>("/compras/");
export const apiCreateCompra = (data: any) =>
  apiRequest<any>("/compras/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });

// --- Ventas ---
export const apiGetVentas = () => apiRequest<any[]>("/ventas/");
export const apiCreateVenta = (data: any) =>
  apiRequest<any>("/ventas/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });

// --- Kardex ---
export const apiGetKardexCompras = () => apiRequest<any[]>("/kardex/compras");
export const apiGetKardexVentas = () => apiRequest<any[]>("/kardex/ventas");