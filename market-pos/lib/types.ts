export interface User {
  id: number;
  username: string;
  nombre_completo: string;
  rol: string;
  activo: boolean;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  categoria: string;
  precio_compra: number;
  precio_venta: number;
  stock: number;
  stock_minimo: number;
  unidad: string;
  activo: boolean;
}

export interface Proveedor {
  id: number;
  nombre: string;
  contacto: string;
  telefono: string;
  direccion: string;
  activo: boolean;
}

export interface DetalleVenta {
  producto_id: number;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface Venta {
  id: number;
  fecha: string;
  total: number;
  usuario_nombre: string;
  detalles: DetalleVenta[];
}

export interface DetalleCompra {
  producto_id: number;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface Compra {
  id: number;
  fecha: string;
  proveedor_nombre: string;
  total: number;
  usuario_nombre: string;
  detalles: DetalleCompra[];
}

export interface KardexEntry {
  id: number;
  fecha: string;
  tipo: "compra" | "venta";
 producto_nombre: string;
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  usuario_nombre: string;
}

export interface AuditoriaEntry {
  id: number;
  fecha: string;
  usuario_nombre: string;
  accion: string;
  modulo: string;
  detalle: string;
}

// --- Personal ---
export interface Rol {
  id: number;
  nombre: string;
}

export interface Personal {
  id: number;
  nombre: string;
  primer_apellido: string;
  segundo_apellido: string | null;
  email: string;
  rol: Rol | null;
  estado: boolean;
  fecha_creacion: string | null;
}

export interface Producto {
  id: number;
  codigo_barras: string | null;
  nombre: string;
  descripcion: string | null;
  precio_venta: number;
  precio_compra_promedio: number;
  stock: number;
  estado: boolean;
}

export interface Proveedor {
  id: number;
  nombre: string;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
  estado: boolean;
}

// --- Compras ---
export interface Compra {
  id: number;
  factura: string;
  nro_factura: string;
  fecha: string;
  estado: boolean;
  proveedor: { id: number; nombre: string } | null;
  detalle_compras: DetalleCompra[];
}

export interface DetalleCompra {
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
}

// --- Ventas ---
export interface Venta {
  id: number;
  fecha: string;
  total: number;
  estado: boolean;
  usuario: { id: number; nombre: string } | null;
  detalle_ventas: DetalleVenta[];
}

export interface DetalleVenta {
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
}

export interface KardexRow {
  fecha_movimiento: string;
  producto: { nombre: string } | null;
  cantidad: number;
  referencia: string | null;
  usuario: { nombre: string } | null;
}