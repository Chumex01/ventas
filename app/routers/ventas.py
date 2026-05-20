from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.audit import create_audit_log
from app.database import get_db
from app.security import get_current_active_user

router = APIRouter(
    prefix="/ventas",
    tags=["Ventas"],
)

@router.get("/", response_model=list[schemas.VentaGet])
def listar_ventas(db: Session = Depends(get_db), current_user: models.Usuarios = Depends(get_current_active_user)):
    return db.query(models.Ventas).filter(models.Ventas.estado == True).all()

@router.post("/", response_model=schemas.VentaGet)
def crear_venta(
    venta_data: schemas.VentaCreate,
    db: Session = Depends(get_db),
    current_user: models.Usuarios = Depends(get_current_active_user),
):
    # 1. Inicializamos la venta con total 0
    nueva_venta = models.Ventas(
        usuario_id=current_user.id,
        total=0.0 
    )
    db.add(nueva_venta)
    db.flush() # Obtenemos el ID de la venta para los detalles

    total_calculado = 0.0

    # 2. Iteramos sobre cada producto que viene en el JSON
    for detalle in venta_data.detalles:
        
        # --- VALIDACIÓN DE STOCK ---
        producto = db.query(models.Productos).filter(models.Productos.id == detalle.producto_id).first()
        if not producto:
            raise HTTPException(status_code=404, detail=f"El producto con ID {detalle.producto_id} no existe.")
        
        if producto.stock < detalle.cantidad:
            raise HTTPException(
                status_code=400, 
                detail=f"Stock insuficiente para '{producto.nombre}'. Disponible: {producto.stock}, Solicitado: {detalle.cantidad}"
            )
        # ---------------------------

        # Creamos el detalle de la venta
        nuevo_detalle = models.DetalleVenta(
            venta_id=nueva_venta.id,
            producto_id=detalle.producto_id,
            cantidad=detalle.cantidad,
            precio_unitario=detalle.precio_unitario
        )
        db.add(nuevo_detalle)

        # 3. Creamos el Kardex (RESTA automática)
        nuevo_kardex = models.kardex(
            producto_id=detalle.producto_id,
            tipo_movimiento="VENTA",
            cantidad=detalle.cantidad, 
            referencia=f"Venta ID {nueva_venta.id}",
            usuario_id=current_user.id,
        )
        db.add(nuevo_kardex)

        # 4. RESTAMOS DEL STOCK REAL DEL PRODUCTO
        producto.stock -= detalle.cantidad

        # 5. Sumamos al total de la venta
        total_calculado += (detalle.cantidad * detalle.precio_unitario)

    # 6. Actualizamos el total de la venta principal
    nueva_venta.total = total_calculado

    # 7. Auditoría
    create_audit_log(
        db=db,
        user_id=current_user.id,
        tabla="Ventas",
        accion="CREAR",
        new_val={
            "venta_id": nueva_venta.id,
            "total": total_calculado,
            "productos_vendidos": len(venta_data.detalles)
        },
    )
    
    db.commit()
    db.refresh(nueva_venta) # Esto cargará automáticamente los detalles anidados gracias al backref
    
    return nueva_venta