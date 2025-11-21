"""Check PMI and Otsuka factories"""
import sys
sys.path.insert(0, '/app')

from app.core.database import SessionLocal
from app.models.models import Factory

db = SessionLocal()

print("=" * 80)
print("VERIFICANDO ピーエムアイ Y オーツカ")
print("=" * 80)

# Check Factory-28 (PMI)
f28 = db.query(Factory).filter(Factory.factory_id == "Factory-28").first()
if f28:
    print("\nFactory-28 (ピーエムアイ有限会社):")
    print(f"  DB name field: {f28.name}")
    print(f"  JSON client_company.name: {f28.config['client_company']['name']}")
    print(f"  JSON plant.name: {f28.config['plant']['name']}")
else:
    print("\n✗ Factory-28 NO ENCONTRADA")

# Check Factory-30 (Otsuka)
f30 = db.query(Factory).filter(Factory.factory_id == "Factory-30").first()
if f30:
    print("\nFactory-30 (株式会社オーツカ):")
    print(f"  DB name field: {f30.name}")
    print(f"  JSON client_company.name: {f30.config['client_company']['name']}")
    print(f"  JSON plant.name: {f30.config['plant']['name']}")
else:
    print("\n✗ Factory-30 NO ENCONTRADA")

# Search all factories for PMI and Otsuka
print("\n" + "=" * 80)
print("BUSCANDO EN TODAS LAS FACTORIES")
print("=" * 80)

all_factories = db.query(Factory).all()
print(f"\nBuscando 'ピーエムアイ':")
for f in all_factories:
    if 'ピーエムアイ' in f.config.get('client_company', {}).get('name', ''):
        print(f"  ✓ {f.factory_id}: {f.config['client_company']['name']}")

print(f"\nBuscando 'オーツカ':")
for f in all_factories:
    if 'オーツカ' in f.config.get('client_company', {}).get('name', ''):
        print(f"  ✓ {f.factory_id}: {f.config['client_company']['name']}")

db.close()
