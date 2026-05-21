# Todo referente a administración de personal, como empleados, roles, etc.
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.security import get_current_active_user, get_password_hash  # ✅ IMPORTAR EL HASHER
from app.audit import create_audit_log       

router = APIRouter(
    prefix="/personal",
    tags=["Personal"],
    responses={404: {"description": "Not found"}},
)

# GET
@router.get("/", response_model=list[schemas.UsuariosGet])
def listar_usuarios(db: Session = Depends(get_db), current_user: models.Usuarios = Depends(get_current_active_user)):
    usuarios = db.query(models.Usuarios).filter(models.Usuarios.estado == True).all()
    return usuarios

# GET por ID
@router.get("/{usuario_id}", response_model=schemas.UsuariosGet)
def obtener_usuario(usuario_id: int, db: Session = Depends(get_db), current_user: models.Usuarios = Depends(get_current_active_user)):
    usuario = db.query(models.Usuarios).filter(
        models.Usuarios.id == usuario_id, 
        models.Usuarios.estado == True
    ).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario

# POST
@router.post("/", response_model=schemas.UsuariosGet)
def crear_usuario(usuario: schemas.UsuarioCreate, db: Session = Depends(get_db), current_user: models.Usuarios = Depends(get_current_active_user)):
    password_hasheada = get_password_hash(usuario.password)
    
    # ✅ BUSCAR EL OBJETO ROL EN LA BASE DE DATOS
    rol_obj = db.query(models.Roles).filter(models.Roles.id == usuario.rol).first()
    if not rol_obj:
        raise HTTPException(status_code=400, detail="El rol especificado no existe")
    
    nuevo_usuario = models.Usuarios(
        nombre=usuario.nombre,
        primer_apellido=usuario.primer_apellido,
        segundo_apellido=usuario.segundo_apellido,
        email=usuario.email,
        password=password_hasheada,  
        rol=rol_obj  # ✅ PASAR EL OBJETO, NO EL ID
    )
    db.add(nuevo_usuario)
    
    create_audit_log(
        db=db,
        user_id=current_user.id,
        tabla="Usuarios",
        accion="CREAR_USUARIO",
        new_val={
            "id": nuevo_usuario.id,
            "nombre": nuevo_usuario.nombre,
            "primer_apellido": nuevo_usuario.primer_apellido,
            "segundo_apellido": nuevo_usuario.segundo_apellido,
            "email": nuevo_usuario.email,
            "rol": rol_obj.nombre  # ✅ En el audit log, guarda el nombre del rol, no el objeto
        }
    )
    
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario

# PUT
@router.put("/{usuario_id}", response_model=schemas.UsuariosGet)
def actualizar_usuario(usuario_id: int, usuario: schemas.UsuarioUpdate, db: Session = Depends(get_db), current_user: models.Usuarios = Depends(get_current_active_user)):
    usuario_db = db.query(models.Usuarios).filter(
        models.Usuarios.id == usuario_id, 
        models.Usuarios.estado == True
    ).first()
    if not usuario_db:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    old_val = {
        "nombre": usuario_db.nombre,
        "email": usuario_db.email,
        "rol": usuario_db.rol.nombre if usuario_db.rol else None  # ✅ Obtener nombre del rol
    }
    
    if usuario.nombre is not None:
        usuario_db.nombre = usuario.nombre
    if usuario.email is not None:
        usuario_db.email = usuario.email
    if usuario.rol is not None:
        # ✅ BUSCAR EL OBJETO ROL NUEVO
        rol_obj = db.query(models.Roles).filter(models.Roles.id == usuario.rol).first()
        if not rol_obj:
            raise HTTPException(status_code=400, detail="El rol especificado no existe")
        usuario_db.rol = rol_obj  # ✅ Asignar el objeto
    
    create_audit_log(
        db=db,
        user_id=current_user.id,
        accion="ACTUALIZAR_USUARIO",
        tabla="Usuarios",
        old_val=old_val,
        new_val={
            "id": usuario_db.id,
            "nombre": usuario_db.nombre,
            "email": usuario_db.email,
            "rol": usuario_db.rol.nombre if usuario_db.rol else None  # ✅ Obtener nombre del rol
        }
    )
    
    db.commit()
    db.refresh(usuario_db)
    return usuario_db

# DELETE
@router.delete("/{usuario_id}")
def eliminar_usuario(usuario_id: int, db: Session = Depends(get_db), current_user: models.Usuarios = Depends(get_current_active_user)):
    usuario_db = db.query(models.Usuarios).filter(
        models.Usuarios.id == usuario_id, 
        models.Usuarios.estado == True
    ).first()
    if not usuario_db:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    old_val = {
        "nombre": usuario_db.nombre,
        "email": usuario_db.email,
        "rol": usuario_db.rol.nombre if usuario_db.rol else None
    }
    
    usuario_db.estado = False
    
    create_audit_log(
        db=db,
        user_id=current_user.id,
        accion="ELIMINAR_USUARIO",
        tabla="Usuarios",
        old_val=old_val
    )
    
    db.commit()
    return {"detail": "Usuario eliminado correctamente"}