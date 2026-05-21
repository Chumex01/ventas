from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.security import get_current_active_user
from app.audit import create_audit_log  

router = APIRouter(
    prefix="/productos",
    tags=["Productos"],
    responses={404: {"description": "Not found"}},
)

# ==========================================
# GET - OBTENER TODOS
# ==========================================
@router.get("/", response_model=list[schemas.ProductoGet])
def obtener_productos(db: Session = Depends(get_db), current_user: models.Usuarios = Depends(get_current_active_user)):
    return db.query(models.Productos).filter(models.Productos.estado == True).all()


# ==========================================
# GET - OBTENER POR ID
# ==========================================
@router.get("/{producto_id}", response_model=schemas.ProductoGet)
def obtener_producto(producto_id: int, db: Session = Depends(get_db), current_user: models.Usuarios = Depends(get_current_active_user)):
    producto = db.query(models.Productos).filter(
        models.Productos.id == producto_id, 
        models.Productos.estado == True
    ).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return producto


# ==========================================
# POST - CREAR
# ==========================================
@router.post("/", response_model=schemas.ProductoGet)
def crear_producto(producto: schemas.ProductoCreate, db: Session = Depends(get_db), current_user: models.Usuarios = Depends(get_current_active_user)):
    
    # ✅ Solo validar código de barras si se envió uno
    if producto.codigo_barras:
        producto_existente = db.query(models.Productos).filter(
            models.Productos.codigo_barras == producto.codigo_barras
        ).first()
        if producto_existente:
            raise HTTPException(status_code=400, detail="El código de barras ya existe")
    
    nuevo_producto = models.Productos(
        codigo_barras=producto.codigo_barras,
        nombre=producto.nombre,
        descripcion=producto.descripcion,
        precio_venta=producto.precio_venta,
        precio_compra_promedio=producto.precio_compra_promedio,
        stock=producto.stock,
        activo=True
    )
    db.add(nuevo_producto)
    
    create_audit_log(
        db=db,
        user_id=current_user.id,
        tabla="Productos",
        accion="CREAR_PRODUCTO",
        new_val={
            "codigo_barras": nuevo_producto.codigo_barras,
            "nombre": nuevo_producto.nombre,
            "descripcion": nuevo_producto.descripcion,
            "precio_venta": nuevo_producto.precio_venta,
            "precio_compra_promedio": nuevo_producto.precio_compra_promedio,
            "stock": nuevo_producto.stock,
            "activo": nuevo_producto.activo
        }
    )
    db.commit()
    db.refresh(nuevo_producto)
    return nuevo_producto


# ==========================================
# PUT - ACTUALIZAR
# ==========================================
@router.put("/{producto_id}", response_model=schemas.ProductoGet)
def actualizar_producto(
    producto_id: int, 
    producto: schemas.ProductoUpdate, 
    db: Session = Depends(get_db), 
    current_user: models.Usuarios = Depends(get_current_active_user)
):
        
    producto_db = db.query(models.Productos).filter(
        models.Productos.id == producto_id, 
        models.Productos.estado == True
    ).first()
    if not producto_db:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # ✅ Quitado "activo" de old_val
    old_val = {
        "nombre": producto_db.nombre,
        "descripcion": producto_db.descripcion,
        "precio_venta": producto_db.precio_venta,
        "precio_compra_promedio": producto_db.precio_compra_promedio,
        "stock": producto_db.stock
    }
    
    producto_db.nombre = producto.nombre,
    producto_db.descripcion = producto.descripcion,
    producto_db.precio_venta = producto.precio_venta,    
    producto_db.precio_compra_promedio = producto.precio_compra_promedio,
    producto_db.stock = producto.stock
    
    # ✅ Quitado "activo" de new_val
    create_audit_log(
        db=db,
        user_id=current_user.id,
        accion="ACTUALIZAR_PRODUCTO",
        tabla="Productos",
        old_val=old_val,
        new_val={
            "nombre": producto_db.nombre,
            "descripcion": producto_db.descripcion,
            "precio_venta": producto_db.precio_venta,
            "precio_compra_promedio": producto_db.precio_compra_promedio,
            "stock": producto_db.stock
        }
    )
    
    db.commit()
    db.refresh(producto_db)
    return producto_db


# ==========================================
# DELETE - ELIMINAR LÓGICAMENTE
# ==========================================
@router.delete("/{producto_id}")
def eliminar_producto(producto_id: int, db: Session = Depends(get_db), current_user: models.Usuarios = Depends(get_current_active_user)):
    producto_db = db.query(models.Productos).filter(
        models.Productos.id == producto_id, 
        models.Productos.estado == True
    ).first()
    if not producto_db:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    old_val = {
        "nombre": producto_db.nombre,
        "estado": producto_db.estado
    }
    
    producto_db.estado = False
    
    create_audit_log(
        db=db,
        user_id=current_user.id,
        accion="ELIMINAR_PRODUCTO",
        tabla="Productos",
        old_val=old_val,
        new_val={"estado": producto_db.estado}
    )
    
    db.commit()
    return {"detail": "Producto eliminado correctamente"}