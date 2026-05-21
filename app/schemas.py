from typing import Optional

from pydantic import BaseModel, ConfigDict
from datetime import datetime

from pydantic.v1 import ConfigDict

class RolGet(BaseModel):
    id: int
    nombre: str
    fecha_creacion: datetime | None = None
    estado: bool
    model_config = ConfigDict(from_attributes=True)

class UsuariosGet(BaseModel):
    id: int
    nombre: str
    primer_apellido: str
    segundo_apellido: str | None = None
    email: str
    rol: RolGet | None = None
    fecha_creacion: datetime | None = None
    estado: bool
    model_config = ConfigDict(from_attributes=True)

class UsuarioCreate(BaseModel):
    nombre: str
    primer_apellido: str
    segundo_apellido: Optional[str] = None
    email: str
    password: str
    rol: int
    
class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    primer_apellido: Optional[str] = None
    segundo_apellido: Optional[str] = None
    email: Optional[str] = None
    rol: Optional[int] = None

# Compras
class ProveedorGet(BaseModel):
    id: int
    nombre: str
    contacto: str | None = None
    telefono: str | None = None
    email: str | None = None
    fecha_creacion: datetime | None = None
    estado: bool
    model_config = ConfigDict(from_attributes=True)
    
class ProveedorCreate(BaseModel):
    nombre: str
    contacto: str | None = None
    telefono: str | None = None
    email: str | None = None
    
class ProveedorUpdate(BaseModel):
    nombre: Optional[str] = None
    contacto: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None

class ProductoGet(BaseModel):
    id: int
    codigo_barras: Optional[str] = None
    nombre: str
    descripcion: str | None = None
    precio_venta: int
    precio_compra_promedio: int | None = None
    stock: int
    activo: bool
    fecha_creacion: datetime | None = None
    estado: bool
    model_config = ConfigDict(from_attributes=True)
    
class ProductoCreate(BaseModel):
    codigo_barras: Optional[str] = None
    nombre: str
    descripcion: str | None = None
    precio_venta: int
    precio_compra_promedio: int | None = None
    stock: int
    activo: bool
    
class ProductoUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    precio_venta: Optional[float] = None
    precio_compra_promedio: Optional[float] = None
    stock: Optional[int] = None

class CompraDetalleCreate(BaseModel):
    producto_id: int
    cantidad: int
    precio_unitario: float

class CompraCreate(BaseModel):
    factura: str
    nro_factura: str
    proveedor_id: int
    detalles: list[CompraDetalleCreate]

class CompraDetalleGet(BaseModel):
    id: int
    producto_id: int
    cantidad: int
    precio_unitario: float
    Producto: ProductoGet | None = None  # Descomenta esto si quieres ver los datos del producto anidado
    model_config = ConfigDict(from_attributes=True)

class CompraGet(BaseModel):
    id: int
    factura: str
    fecha: datetime | None = None
    nro_factura: str
    proveedor: ProveedorGet | None = None
    usuario: UsuariosGet | None = None
    detalle_compras: list[CompraDetalleGet] = [] 
    estado: bool
    model_config = ConfigDict(from_attributes=True)

# --- SCHEMAS DE VENTAS ---

class VentaGet(BaseModel):
    id: int
    fecha: datetime
    total: float
    usuario: UsuariosGet | None = None
    fecha_creacion: datetime | None = None
    estado: bool
    model_config = ConfigDict(from_attributes=True)
    
class DetalleVentaCreate(BaseModel):
    producto_id: int
    cantidad: int
    precio_unitario: float

class VentaCreate(BaseModel):
    detalles: list[DetalleVentaCreate]

class DetalleVentaGet(BaseModel):
    id: int
    producto_id: int
    cantidad: int
    precio_unitario: float
    producto: ProductoGet | None = None
    model_config = ConfigDict(from_attributes=True)

class VentaGet(BaseModel):
    id: int
    fecha: datetime | None = None
    total: float
    usuario: UsuariosGet | None = None
    detalle_ventas: list[DetalleVentaGet] = [] 
    estado: bool
    model_config = ConfigDict(from_attributes=True)
    
class kardexGetCompras(BaseModel):
    id: int
    producto: ProductoGet | None = None
    fecha_movimiento: datetime | None = None
    tipo_movimiento: str | None = None  # "ENTRADA" o "
    cantidad: int
    referencia: str | None = None
    usuario: UsuariosGet | None = None
    detalle_compras: list[CompraDetalleGet] = []
    model_config = ConfigDict(from_attributes=True)
    
class kardexGetVentas(BaseModel):
    id: int
    producto: ProductoGet | None = None
    fecha_movimiento: datetime | None = None
    tipo_movimiento: str | None = None  # "SALIDA"
    cantidad: int
    referencia: str | None = None
    usuario: UsuariosGet | None = None
    detalle_ventas: list[DetalleVentaGet] = []
    model_config = ConfigDict(from_attributes=True)