from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app import models, schemas
from app.security import get_current_active_user

router = APIRouter(
    prefix="/kardex",
    tags=["Kardex"],
)

# ==========================================
# GET - KARDEX DE COMPRAS (ENTRADAS)
# ==========================================
@router.get("/compras", response_model=list[schemas.kardexGetCompras])
def obtener_kardex_compras(db: Session = Depends(get_db), current_user: models.Usuarios = Depends(get_current_active_user)):
    
    movimientos = (
        db.query(models.kardex)
        .options(
            joinedload(models.kardex.producto),  # Trae info del producto sin query extra
            joinedload(models.kardex.usuario)    # Trae info del usuario sin query extra
        )
        .filter(models.kardex.tipo_movimiento == "COMPRA")
        .filter(models.kardex.estado == True)
        .order_by(models.kardex.fecha_movimiento.desc())  # Del más nuevo al más viejo
        .all()
    )
    
    return movimientos


# ==========================================
# GET - KARDEX DE VENTAS (SALIDAS)
# ==========================================
@router.get("/ventas", response_model=list[schemas.kardexGetVentas])
def obtener_kardex_ventas(db: Session = Depends(get_db), current_user: models.Usuarios = Depends(get_current_active_user)):
    
    movimientos = (
        db.query(models.kardex)
        .options(
            joinedload(models.kardex.producto),
            joinedload(models.kardex.usuario)
        )
        .filter(models.kardex.tipo_movimiento == "VENTA")
        .filter(models.kardex.estado == True)
        .order_by(models.kardex.fecha_movimiento.desc())
        .all()
    )
    
    return movimientos