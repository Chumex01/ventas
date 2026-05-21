import json
import decimal  # ✅ IMPORTE OBLIGATORIO
from sqlalchemy.orm import Session
from app import models

def serialize(obj):
    """Función helper para serializar objetos especiales a JSON"""
    # ✅ MANEJA DECIMALES (PRECIOS)
    if isinstance(obj, decimal.Decimal):
        return float(obj)
    
    # ✅ MANEJA FECHAS
    if hasattr(obj, 'isoformat'):
        return obj.isoformat()
    
    raise TypeError(f"Type {type(obj)} not serializable")

def create_audit_log(
    db: Session, 
    user_id: int,   # ✅ Asegúrate que sea user_id
    tabla: str, 
    accion: str, 
    old_val: dict = None, 
    new_val: dict = None
):
    # ✅ USA la función serialize en ambos dumps
    old_json = json.dumps(old_val, default=serialize) if old_val else None
    new_json = json.dumps(new_val, default=serialize) if new_val else None
    
    audit = models.Auditoria(
        usuario_id=user_id,
        tabla=tabla,
        accion=accion,
        datos_antiguos=old_json,
        datos_nuevos=new_json
    )
    
    db.add(audit)