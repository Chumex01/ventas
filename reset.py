from app.database import engine, Base
from app import models

print("Borrando tablas viejas...")
Base.metadata.drop_all(bind=engine)

print("Creando tablas nuevas con los campos actualizados...")
Base.metadata.create_all(bind=engine)

print("Base de datos actualizada exitosamente.")