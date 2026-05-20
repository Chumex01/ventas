from datetime import datetime, timezone
from sqlalchemy import JSON, Column, Float, ForeignKey, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

# --- MODELOS DE LA BASE DE DATOS ---
# --- AUTH --- Control de Empleados
class Roles(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), unique=True, index=True)
    fecha_creacion = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    estado = Column(Boolean, default=True)
    
class Usuarios(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), index=True)
    primer_apellido = Column(String(100), index=True)
    segundo_apellido = Column(String(100), index=True, nullable=True)
    email = Column(String(100), unique=True, index=True)
    password = Column(String(255))
    rol_id = Column(Integer, ForeignKey("roles.id"))
    fecha_creacion = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    estado = Column(Boolean, default=True)
    
    rol = relationship("Roles", backref="usuarios")

class Productos(Base):
    __tablename__ = "productos"
    id = Column(Integer, primary_key=True, index=True)
    codigo_barras = Column(String(50), unique=True, index=True)
    nombre = Column(String(100), index=True)
    descripcion = Column(String(255), nullable=True)
    precio_venta = Column(Float(10, 2))
    precio_compra_promedio = Column(Float(10, 2), nullable=True)
    stock = Column(Integer, default=0) 
    activo = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    estado = Column(Boolean, default=True)
    
class Proveedores(Base):
    __tablename__ = "proveedores"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), index=True)
    contacto = Column(String(100), nullable=True)
    telefono = Column(String(20), nullable=True)
    email = Column(String(100), nullable=True)
    fecha_creacion = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    estado = Column(Boolean, default=True)
    
# -- Stock --
class kardex(Base):
    __tablename__ = "kardex"
    id = Column(Integer, primary_key=True, index=True)
    producto_id = Column(Integer, ForeignKey("productos.id"))
    fecha_movimiento = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    tipo_movimiento = Column(String(10))  # 'COMPRA' o 'VENTA', 'AJUSTE'
    cantidad = Column(Integer, default=0)
    referencia = Column(String(255), nullable=True)  # Puede ser el número de factura o detalle de la venta
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    fecha_creacion = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    estado = Column(Boolean, default=True)
    
    producto = relationship("Productos", backref="kardex_movimientos")
    usuario = relationship("Usuarios", backref="kardex_movimientos")
    
# Entradas
class Compras(Base):
    __tablename__ = "compras"
    id = Column(Integer, primary_key=True, index=True)
    factura = Column(String(50), unique=True, index=True)
    fecha = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    nro_factura = Column(String(50), unique=True, index=True)
    proveedor_id = Column(Integer, ForeignKey("proveedores.id"))
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    fecha_creacion = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    estado = Column(Boolean, default=True)
    
    usuario = relationship("Usuarios", backref="compras")
    proveedor = relationship("Proveedores", backref="compras")
    
class DetalleCompra(Base):
    __tablename__ = "detalle_compras"
    id = Column(Integer, primary_key=True, index=True)
    compra_id = Column(Integer, ForeignKey("compras.id"))
    producto_id = Column(Integer, ForeignKey("productos.id"))
    cantidad = Column(Integer)
    precio_unitario = Column(Float(5, 2), default=0.0)
    fecha_creacion = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    estado = Column(Boolean, default=True)
    
    compra = relationship("Compras", backref="detalle_compras")
    producto = relationship("Productos", backref="detalle_compras")

# Salidas
class Ventas(Base):
    __tablename__ = "ventas"
    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    total = Column(Float(10, 2), default=0.0)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    fecha_creacion = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    estado = Column(Boolean, default=True)
    
    usuario = relationship("Usuarios", backref="ventas")
    
class DetalleVenta(Base):
    __tablename__ = "detalle_ventas"
    id = Column(Integer, primary_key=True, index=True)
    venta_id = Column(Integer, ForeignKey("ventas.id"))
    producto_id = Column(Integer, ForeignKey("productos.id"))
    cantidad = Column(Integer)
    precio_unitario = Column(Float(5, 2), default=0.0)
    fecha_creacion = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    estado = Column(Boolean, default=True)
    
    venta = relationship("Ventas", backref="detalle_ventas")
    producto = relationship("Productos", backref="detalle_ventas")
    
# Auditoria
class Auditoria(Base):
    __tablename__ = "auditoria"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey('usuarios.id'))
    accion = Column(String(255))
    tabla = Column(String(50))
    datos_antiguos = Column(JSON, nullable=True)
    datos_nuevos = Column(JSON, nullable=True)
    fecha_hora = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    usuario = relationship("Usuarios", backref="auditorias")
    
class TokenRevocado(Base):
    __tablename__ = "tokens_revocados"
    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(255), unique=True, index=True)  # JWT ID
    fecha_revocacion = Column(DateTime, default=lambda: datetime.now(timezone.utc))