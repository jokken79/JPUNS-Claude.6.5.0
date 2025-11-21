# 🔑 Solución al problema de contraseña admin

## 📅 2025-11-11

## ❓ ¿Por qué sucedió?

Durante la instalación inicial, el script `create_admin_user.py` generó una **contraseña aleatoria** porque `ADMIN_PASSWORD` no estaba configurado en el archivo `.env`.

### El comportamiento anterior:

```python
admin_password = os.getenv('ADMIN_PASSWORD')
if not admin_password:
    admin_password = generate_secure_password()  # ← Password ALEATORIA
```

**Problema**: La contraseña aleatoria se generaba pero:
- ✅ Solo se mostraba en los logs UNA vez
- ❌ NO se guardaba en ningún archivo
- ❌ Si el usuario admin ya existía, NO se reseteaba

## ✅ Solución implementada

### 1. **Agregado al archivo `.env`**

```bash
# Admin credentials
ADMIN_PASSWORD=admin123
COORDINATOR_PASSWORD=coord123
```

### 2. **Script mejorado** (`create_admin_user.py`)

Ahora el script:
- ✅ Si el usuario admin **ya existe** Y `ADMIN_PASSWORD` está en `.env` → **Actualiza la contraseña**
- ✅ Si el usuario admin **NO existe** → Usa `ADMIN_PASSWORD` del `.env` o genera una aleatoria
- ✅ Muestra claramente qué contraseña está usando

```python
if existing_admin:
    # Si ADMIN_PASSWORD está en .env, actualizar la contraseña
    if admin_password:
        existing_admin.password_hash = AuthService.get_password_hash(admin_password)
        db.commit()
        print(f"\n✓ Contraseña actualizada desde ADMIN_PASSWORD en .env")
```

## 🚀 ¿Esto volverá a pasar?

**NO**, ahora el sistema está configurado para:

### Escenario 1: REINSTALAR.bat (instalación completa)
```bash
cd scripts
REINSTALAR.bat
```
→ Lee `ADMIN_PASSWORD=admin123` del `.env`
→ Crea usuario con contraseña **admin123** ✅

### Escenario 2: Resetear contraseña manualmente
```bash
docker exec uns-claudejp-backend python scripts/create_admin_user.py
```
→ Lee `ADMIN_PASSWORD=admin123` del `.env`
→ Actualiza contraseña a **admin123** ✅

### Escenario 3: Resetear con script dedicado
```bash
docker exec uns-claudejp-backend python scripts/reset_admin_password.py
```
→ Resetea directamente a **admin123** ✅

## 📝 Resumen

| Antes | Ahora |
|-------|-------|
| ❌ Password aleatoria no documentada | ✅ Password fija en `.env` |
| ❌ Script no actualizaba si usuario existía | ✅ Script actualiza desde `.env` |
| ❌ Tenías que adivinar la contraseña | ✅ Siempre es `admin123` |

## 🔐 Credenciales finales

**Frontend**: http://localhost:3000/login

- **Username**: `admin`
- **Password**: `admin123`

**Para cambiar la contraseña en producción:**

1. Edita `.env`:
   ```bash
   ADMIN_PASSWORD=tu_password_segura_aqui
   ```

2. Ejecuta:
   ```bash
   docker exec uns-claudejp-backend python scripts/create_admin_user.py
   ```

¡Listo! El sistema usará tu nueva contraseña.
