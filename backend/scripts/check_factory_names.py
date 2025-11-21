"""Check factory names in database"""
import sys
sys.path.insert(0, '/app')

from app.core.database import SessionLocal
from app.models.models import Factory

db = SessionLocal()

print("=" * 80)
print("VERIFICANDO NOMBRES DE FÁBRICAS EN LA BASE DE DATOS")
print("=" * 80)

factories = db.query(Factory).limit(15).all()

for f in factories:
    print(f"\n{f.factory_id}:")
    print(f"  DB name field: {f.name}")
    if f.config:
        client_name = f.config.get('client_company', {}).get('name', '')
        plant_name = f.config.get('plant', {}).get('name', '')
        print(f"  JSON client_company.name: {client_name}")
        print(f"  JSON plant.name: {plant_name}")

db.close()
