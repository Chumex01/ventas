from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app import models 
from app.config import settings
from app.routers import Personal
from app.routers import auth
from app.routers import Compras
from app.routers import ventas

# --- CREACIÓN DE TABLAS EN LA BASE DE DATOS ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Creando tablas en la base de datos...")
    Base.metadata.create_all(bind=engine)
    print("Tablas creadas exitosamente.")
    yield

# Inicializamos la aplicación FastAPI
app = FastAPI(title="Mi API con FastAPI", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Creamos nuestra primera ruta (endpoint) usando un decorador
@app.get("/")
def leer_raiz():
    return {"mensaje": "¡Hola, Mundo! Bienvenido a mi API con FastAPI"}

# Creamos otra ruta de ejemplo
@app.get("/items/{item_id}")
def leer_item(item_id: int, q: str = None):
    return {"item_id": item_id, "q": q}

# Incluimos el router de personal
app.include_router(Personal.router)
# Incluimos el router de autenticación
app.include_router(auth.router)
# Incluimos el router de compras
app.include_router(Compras.router)
# Incluimos el router de ventas
app.include_router(ventas.router)