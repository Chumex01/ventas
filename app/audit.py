import json
from datetime import datetime, timezone, time
from sqlalchemy.orm import Session
from app import models

def create_audit_log(db: Session, user_id: int, tabla: str, accion: str, old_val: dict = None, new_val: dict = None):
    
    def serialize(obj):
        if isinstance(obj, (datetime, time)):
            return obj.isoformat()
        raise TypeError(f"Type {type(obj)} not serializable")

    old_json = json.dumps(old_val, default=serialize) if old_val else None
    new_json = json.dumps(new_val, default=serialize) if new_val else None

    log = models.Auditoria(
        usuario_id=user_id,
        tabla=tabla,
        accion=accion,
        datos_antiguos=old_json,
        datos_nuevos=new_json,
        fecha_hora=datetime.now(timezone.utc)
    )
    db.add(log)