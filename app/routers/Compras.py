from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app import models, schemas
from app.audit import create_audit_log
from app.database import get_db
from app.security import get_current_active_user

router = APIRouter(
    prefix="/compras",
    tags=["Compras"],
    responses={404: {"description": "Not found"}},
)

# --- CORREGIDO: Ahora listamos las COMPRAS, no los detalles sueltos ---
@router.get("/", response_model=list[schemas.CompraGet])
def listar_compras(db: Session = Depends(get_db), current_user: models.Usuarios = Depends(get_current_active_user)):
    return db.query(models.Compras).filter(models.Compras.estado == True).all()

@router.post("/", response_model=schemas.CompraGet)
def crear_compra(
    compra_data: schemas.CompraCreate, # <-- Cambiado a compra_data
    db: Session = Depends(get_db),
    current_user: models.Usuarios = Depends(get_current_active_user),
):
    # 1. Creamos la cabecera de la compra
    nueva_compra = models.Compras(
        factura=compra_data.factura,
        nro_factura=compra_data.nro_factura,
        proveedor_id=compra_data.proveedor_id,
        usuario_id=current_user.id,
    )
    db.add(nueva_compra)
    
    try:
        db.flush() 
        
        # 2. Iteramos la lista de detalles que viene en el JSON
        for detalle in compra_data.detalles:
            
            # Verificamos que el producto exista
            producto = db.query(models.Productos).filter(models.Productos.id == detalle.producto_id).first()
            if not producto:
                raise HTTPException(status_code=404, detail=f"El producto con ID {detalle.producto_id} no existe.")
            
            # Creamos el detalle de la compra
            nuevo_detalle = models.DetalleCompra(
                compra_id=nueva_compra.id,
                producto_id=detalle.producto_id,
                cantidad=detalle.cantidad,
                precio_unitario=detalle.precio_unitario,
            )
            db.add(nuevo_detalle)
            
            # Creamos el Kardex (SUMA automática)
            nuevo_kardex = models.kardex(
                producto_id=detalle.producto_id,
                tipo_movimiento="COMPRA",
                cantidad=detalle.cantidad, 
                referencia=f"Compra ID {nueva_compra.id} - Factura {compra_data.factura}", 
                usuario_id=current_user.id,
            )
            db.add(nuevo_kardex)
            
            # --- NUEVO: SUMAMOS AL STOCK DEL PRODUCTO ---
            producto.stock += detalle.cantidad
            # Opcional: Actualizamos el precio de compra promedio del producto
            # producto.precio_compra_promedio = detalle.precio_unitario

        # 3. Auditoría (registramos cuántos productos trae la compra)
        create_audit_log(
            db=db,
            user_id=current_user.id,
            tabla="Compras",
            accion="CREAR",
            new_val={
                "factura": compra_data.factura,
                "nro_factura": compra_data.nro_factura,
                "proveedor_id": compra_data.proveedor_id,
                "total_productos": len(compra_data.detalles)
            },
        )
        
        db.commit()
        db.refresh(nueva_compra) # Al hacer refresh, cargará automáticamente los detalles gracias al backref
        return nueva_compra

    except IntegrityError as e:
        db.rollback() 
        error_info = str(e.orig)
        
        if "ix_compras_factura" in error_info or "factura" in error_info:
            raise HTTPException(status_code=400, detail="Ya existe una compra registrada con esa factura.")
        elif "nro_factura" in error_info:
            raise HTTPException(status_code=400, detail="Ya existe una compra con ese número de factura.")
        else:
            raise HTTPException(status_code=400, detail="Error de integridad: Datos duplicados.")