# Todo referente a administración de personal, como empleados, roles, etc.
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.security import get_current_active_user
from app.audit import create_audit_log       

router = APIRouter(
    prefix="/personal",
    tags=["Personal"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=list[schemas.UsuariosGet])
def listar_usuarios(db: Session = Depends(get_db), current_user: models.Usuarios = Depends(get_current_active_user)):
    usuarios = db.query(models.Usuarios).filter(models.Usuarios.estado == True).all()
    return usuarios