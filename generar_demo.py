from app.database import SessionLocal
from app import models
from app.routers.licencia import generar_clave
from datetime import datetime, timedelta

db = SessionLocal()

# Crear la clave
nueva_clave = generar_clave()

# Calcular vencimiento: 1 día a partir de ahora
vencimiento = datetime.now() + timedelta(days=1)

# Guardar en la base de datos directamente como activa
licencia_demo = models.Licencia(
    clave=nueva_clave, 
    plan="demo", 
    activa=True, 
    fecha_expiracion=vencimiento
)
db.add(licencia_demo)
db.commit()

print("\n" + "="*40)
print("CLAVE DEMO CREADA CON ÉXITO")
print("="*40)
print(f"Clave: {nueva_clave}")
print(f"Vence: {vencimiento.strftime('%d/%m/%Y %H:%M:%S')}")
print("="*40 + "\n")

db.close()