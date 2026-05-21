from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.security import get_current_active_user
from app.audit import create_audit_log  

router = APIRouter(prefix="/proveedores", tags=["Proveedores"])

# GET
@router.get("/", response_model=list[schemas.ProveedorGet])
def obtener_proveedores(db: Session = Depends(get_db), current_user: models.Usuarios = Depends(get_current_active_user)):
    return db.query(models.Proveedores).filter(models.Proveedores.estado == True).all()

# GET por ID
@router.get("/{proveedor_id}", response_model=schemas.ProveedorGet)
def obtener_proveedor(proveedor_id: int, db: Session = Depends(get_db), current_user: models.Usuarios = Depends(get_current_active_user)):
    proveedor = db.query(models.Proveedores).filter(
        models.Proveedores.id == proveedor_id, 
        models.Proveedores.estado == True
    ).first()
    if not proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    return proveedor

# POST
@router.post("/", response_model=schemas.ProveedorGet)
def crear_proveedor(proveedor: schemas.ProveedorCreate, db: Session = Depends(get_db), current_user: models.Usuarios = Depends(get_current_active_user)):
    nuevo_proveedor = models.Proveedores(
        nombre=proveedor.nombre,
        contacto=proveedor.contacto,
        telefono=proveedor.telefono,
        email=proveedor.email
    )
    db.add(nuevo_proveedor)
    db.commit()
    db.refresh(nuevo_proveedor)
    
    create_audit_log(
        db=db,
        user_id=current_user.id,
        tabla="Proveedores",
        accion="CREAR_PROVEEDOR",
        new_val={
            "id": nuevo_proveedor.id,
            "nombre": nuevo_proveedor.nombre,
            "contacto": nuevo_proveedor.contacto,
            "telefono": nuevo_proveedor.telefono,
            "email": nuevo_proveedor.email
        }
    )
    
    return nuevo_proveedor

# PUT
@router.put("/{proveedor_id}", response_model=schemas.ProveedorGet)
def actualizar_proveedor(proveedor_id: int, proveedor: schemas.ProveedorUpdate, db: Session = Depends(get_db), current_user: models.Usuarios = Depends(get_current_active_user)):
    proveedor_db = db.query(models.Proveedores).filter(
        models.Proveedores.id == proveedor_id, 
        models.Proveedores.estado == True
    ).first()
    if not proveedor_db:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    
    # ✅ Quitado "activo" de old_val
    old_val = {
        "nombre": proveedor_db.nombre,
        "contacto": proveedor_db.contacto,
        "telefono": proveedor_db.telefono,
        "email": proveedor_db.email
    }
    
    proveedor_db.nombre = proveedor.nombre,
    proveedor_db.contacto = proveedor.contacto,
    proveedor_db.telefono = proveedor.telefono,
    proveedor_db.email = proveedor.email,

    create_audit_log(
        db=db,
        user_id=current_user.id,
        tabla="Proveedores",
        accion="ACTUALIZAR_PROVEEDOR",
        old_val=old_val,
        new_val={
            "nombre": proveedor_db.nombre,
            "contacto": proveedor_db.contacto,
            "telefono": proveedor_db.telefono,
            "email": proveedor_db.email
        }    
    )
    
    db.commit()
    db.refresh(proveedor_db)
    return proveedor_db

# DELETE
@router.delete("/{proveedor_id}")
def eliminar_proveedor(proveedor_id: int, db: Session = Depends(get_db), current_user: models.Usuarios = Depends(get_current_active_user)):
    proveedor_db = db.query(models.Proveedores).filter(
        models.Proveedores.id == proveedor_id, 
        models.Proveedores.estado == True
    ).first()
    if not proveedor_db:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    
    # ✅ Quitado "activo" de old_val
    old_val = {
        "nombre": proveedor_db.nombre,
        "contacto": proveedor_db.contacto,
        "telefono": proveedor_db.telefono,
        "email": proveedor_db.email
    }
    
    proveedor_db.estado = False
    
    create_audit_log(
        db=db,
        user_id=current_user.id,
        tabla="Proveedores",
        accion="ELIMINAR_PROVEEDOR",
        old_val=old_val,
        new_val={"estado": proveedor_db.estado}
    )
    
    db.commit()
    return (
        {"detail": "Proveedor eliminado correctamente"}
    )