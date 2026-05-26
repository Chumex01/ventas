from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timedelta
import secrets

from app.database import get_db
from app import models

router = APIRouter(prefix="/licencia", tags=["licencia"])

DURACIONES = {
    "mensual": 30,
    "trimestral": 90,
    "anual": 365,
    "vitalicio": 36500,
}

NOMBRES_PLANES = {
    "mensual": "Plan Mensual",
    "trimestral": "Plan Trimestral",
    "anual": "Plan Anual",
    "vitalicio": "Plan Vitalicio",
}


def generar_clave():
    """Genera una clave aleatoria tipo XXXXX-XXXXX-XXXXX-XXXXX"""
    return (
        f"{secrets.token_hex(5).upper()}-"
        f"{secrets.token_hex(5).upper()}-"
        f"{secrets.token_hex(5).upper()}-"
        f"{secrets.token_hex(5).upper()}"
    )


class ActivarRequest(BaseModel):
    clave: str


@router.get("/estado")
def obtener_estado(db: Session = Depends(get_db)):
    """El frontend consulta esto al arrancar para saber si hay licencia activa"""
    lic = db.query(models.Licencia).filter(
        models.Licencia.activa == True
    ).order_by(models.Licencia.fecha_activacion.desc()).first()

    if not lic:
        return {
            "activa": False,
            "plan": None,
            "plan_nombre": None,
            "fecha_activacion": None,
            "fecha_expiracion": None,
            "dias_restantes": None,
        }

    # Si expiró, desactivar
    if lic.fecha_expiracion and datetime.now() > lic.fecha_expiracion:
        lic.activa = False
        db.commit()

    dias = 0
    if lic.fecha_expiracion:
        dias = (lic.fecha_expiracion - datetime.now()).days
        if dias < 0:
            dias = 0

    return {
        "activa": lic.activa,
        "plan": lic.plan,
        "plan_nombre": NOMBRES_PLANES.get(lic.plan, lic.plan),
        "fecha_activacion": str(lic.fecha_activacion) if lic.fecha_activacion else None,
        "fecha_expiracion": str(lic.fecha_expiracion) if lic.fecha_expiracion else None,
        "dias_restantes": dias,
    }


@router.post("/activar")
def activar_licencia(req: ActivarRequest, db: Session = Depends(get_db)):
    """El cliente pega su clave aquí. Se activa y desactiva claves anteriores del mismo plan."""
    lic = db.query(models.Licencia).filter(
        models.Licencia.clave == req.clave.strip().upper()
    ).first()

    if not lic:
        raise HTTPException(status_code=400, detail="Clave inválida")

    if lic.activa:
        raise HTTPException(
            status_code=400,
            detail="Esta clave ya fue utilizada"
        )

    # Desactivar cualquier licencia activa del mismo plan
    db.query(models.Licencia).filter(
        models.Licencia.plan == lic.plan,
        models.Licencia.activa == True
    ).update({"activa": False})

    # Activar la nueva
    dias = DURACIONES.get(lic.plan, 30)
    lic.activa = True
    lic.fecha_activacion = datetime.now()
    lic.fecha_expiracion = datetime.now() + timedelta(days=dias)
    db.commit()

    return {
        "detail": "Licencia activada correctamente",
        "plan": lic.plan,
        "plan_nombre": NOMBRES_PLANES.get(lic.plan, lic.plan),
        "dias": dias,
        "expira": str(lic.fecha_expiracion),
    }


@router.get("/stock")
def stock_claves(db: Session = Depends(get_db)):
    """Vos consultás esto para ver cuántas claves te quedan sin usar por plan"""
    resultado = {}
    for plan in DURACIONES:
        total = db.query(models.Licencia).filter(
            models.Licencia.plan == plan
        ).count()
        sin_usar = db.query(models.Licencia).filter(
            models.Licencia.plan == plan,
            models.Licencia.activa == False
        ).count()
        resultado[plan] = {
            "total": total,
            "sin_usar": sin_usar,
            "usadas": total - sin_usar,
        }
    return resultado