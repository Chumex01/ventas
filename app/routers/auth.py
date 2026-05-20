from fastapi import APIRouter, Depends, HTTPException, status, Request  # <-- NUEVO: Importamos Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app.database import get_db
from app import models, schemas
from app.security import authenticate_user, create_access_token, get_current_active_user
from app.config import settings
from app.audit import create_audit_log  # <-- NUEVO: Importamos la auditoría

router = APIRouter(prefix="/auth", tags=["Autenticación"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

@router.post("/login")
def login(
    request: Request, # <-- NUEVO: FastAPI inyecta la petición aquí para leer la IP
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    # 1. Autenticar al usuario
    user = authenticate_user(db, nombre=form_data.username, password=form_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nombre de usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 2. Crear el Token JWT
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.nombre}, 
        expires_delta=access_token_expires
    )
    
    # --- NUEVO: AUDITORÍA DE INICIO DE SESIÓN ---
    # Obtenemos la IP real del usuario (considera proxies si usas Nginx/Apache adelante)
    client_ip = request.client.host if request.client else "IP Desconocida"
    
    create_audit_log(
        db=db,
        user_id=user.id,
        tabla="sesiones",
        accion="INICIO_SESION",
        new_val={
            "usuario": user.nombre,
            "ip_address": client_ip,
            "token": access_token
        }
    )
    
    # Como el login no hace db.add() de otra cosa, hacemos commit aquí para guardar la auditoría
    db.commit() 
    # --------------------------------------------

    # 3. Devolver el token
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

# --- LOGOUT ---
@router.post("/logout")
def logout(
    db: Session = Depends(get_db), 
    current_user: models.Usuarios = Depends(get_current_active_user),
    token: str = Depends(oauth2_scheme)
):
    existe = db.query(models.TokenRevocado).filter(models.TokenRevocado.token == token).first()
    if not existe:
        token_revocado = models.TokenRevocado(token=token)
        db.add(token_revocado)
        db.commit()
        
    return {"mensaje": "Sesión cerrada exitosamente. Token invalidado."}