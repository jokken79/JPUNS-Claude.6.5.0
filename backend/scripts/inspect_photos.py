"""
Script para inspeccionar el contenido de las fotos en el JSON exportado
"""
import json
import base64
from pathlib import Path

# Cargar JSON
json_path = Path(__file__).parent.parent.parent / "config" / "access_candidates_data.json"
data = json.load(open(json_path, encoding='utf-8'))

print("=" * 80)
print("INSPECCION DE FOTOS EN JSON")
print("=" * 80)
print()

# Buscar el campo de foto en las columnas
columns = data['metadata']['columns']
print(f"Total columnas: {len(columns)}")
print()

# Encontrar la columna de foto
foto_col = None
for col in columns:
    if '写真' in col or 'foto' in col.lower() or 'photo' in col.lower():
        foto_col = col
        print(f"[INFO] Campo de foto encontrado: {col}")
        break

if not foto_col:
    print("[AVISO] No se encontro campo de foto")
    exit(1)

print()
print("-" * 80)
print("ANALISIS DE CANDIDATOS CON FOTO")
print("-" * 80)
print()

# Analizar los primeros 5 candidatos con foto
count = 0
for candidate in data['candidates']:
    foto_data = candidate.get(foto_col, '')

    if foto_data and count < 5:
        count += 1
        name = candidate.get('氏名', 'N/A')

        print(f"\n[{count}] Candidato: {name}")
        print(f"    Longitud Base64: {len(foto_data)} caracteres")
        print(f"    Primeros 100 caracteres: {foto_data[:100]}")

        try:
            foto_bytes = base64.b64decode(foto_data)
            print(f"    Bytes decodificados: {len(foto_bytes)} bytes")
            print(f"    Primeros 20 bytes (hex): {foto_bytes[:20].hex()}")

            # Intentar detectar tipo de archivo
            if foto_bytes.startswith(b'\xff\xd8\xff'):
                print(f"    Tipo detectado: JPEG")
            elif foto_bytes.startswith(b'\x89PNG'):
                print(f"    Tipo detectado: PNG")
            elif foto_bytes.startswith(b'BM'):
                print(f"    Tipo detectado: BMP")
            else:
                print(f"    Tipo detectado: Desconocido")
                # Intentar como texto
                try:
                    text = foto_bytes.decode('utf-8', errors='ignore')
                    print(f"    Como texto: {text[:50]}")
                except:
                    pass
        except Exception as e:
            print(f"    Error al decodificar: {e}")

print()
print("=" * 80)
print("RESUMEN")
print("=" * 80)

# Contar fotos reales (más de 1000 caracteres = imagen real)
fotos_reales = sum(1 for c in data['candidates'] if len(c.get(foto_col, '')) > 1000)
fotos_pequenas = sum(1 for c in data['candidates'] if 0 < len(c.get(foto_col, '')) <= 1000)
sin_foto = sum(1 for c in data['candidates'] if not c.get(foto_col))

print(f"Total candidatos: {len(data['candidates'])}")
print(f"Fotos reales (>1000 chars): {fotos_reales}")
print(f"Fotos pequenas (1-1000 chars): {fotos_pequenas}")
print(f"Sin foto: {sin_foto}")
print()
