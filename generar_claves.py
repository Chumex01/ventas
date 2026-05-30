import sys
import os

# Agregar el directorio padre al path para poder importar app
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app import models
from app.routers.licencia import generar_clave

CANTIDADES = {
    "demo": 1,
    "mensual": 50,
    "trimestral": 20,
    "anual": 10,
    "vitalicio": 5,
}

def main():
    db = SessionLocal()

    print("\n" + "=" * 60)
    print("  GENERANDO CLAVES DE LICENCIA")
    print("=" * 60 + "\n")

    for plan, cantidad in CANTIDADES.items():
        generadas = []
        for _ in range(cantidad):
            clave = generar_clave()
            lic = models.Licencia(clave=clave, plan=plan, activa=False)
            db.add(lic)
            generadas.append(clave)

        print(f"  {plan.upper():20s} → {cantidad} claves generadas")

        # Mostrar las primeras 3 como ejemplo
        print(f"  Ejemplos:")
        for c in generadas[:3]:
            print(f"    {c}")
        print()

    db.commit()
    db.close()

    print("=" * 60)
    print("  Claves guardadas en la base de datos.")
    print("  Para ver stock: python -c 'from app.database import SessionLocal; from app.routers.licencia import stock_claves; from app import models; db = SessionLocal(); import json; print(json.dumps(stock_claves(db), indent=2)); db.close()'")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()