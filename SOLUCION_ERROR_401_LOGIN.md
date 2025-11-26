# ⚠️ SOLUCIÓN: Error 401 en Login

## El Problema
```
[AXIOS] Request to: /auth/login/ | NO token available
Failed to load resource: the server responded with a status of 401 (Unauthorized)
```

**Causa:** El **BACKEND NO ESTÁ CORRIENDO** en puerto 8000

---

## Solución: Iniciar el Backend

### Opción 1: PowerShell (RECOMENDADO)

**Abre una NUEVA terminal PowerShell:**

```powershell
cd d:\JPUNS-Claude.6.5.0\backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Espera hasta ver:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

### Opción 2: Verificar si está corriendo

```powershell
# Verificar puerto 8000
netstat -ano | findstr :8000

# Si ves algo, el proceso está corriendo
# Si no ves nada, el backend no está activo
```

### Opción 3: Probar conexión

```powershell
curl http://localhost:8000/api/health
```

**Resultado esperado:** Status 200

---

## Configuración de Variables (YA HECHO ✅)

El archivo `.env.local` ya está configurado correctamente:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_INTERNAL_API_URL=http://backend:8000
```

---

## Checklist de Inicio

- [ ] **Backend corriendo?** → `http://localhost:8000/api/health` (Status 200)
- [ ] **Frontend corriendo?** → `http://localhost:3000/login`
- [ ] **Credenciales correctas?**
  - Usuario: `admin`
  - Contraseña: `admin123`

---

## Diagrama de Conexión

```
FRONTEND (Puerto 3000)
    ↓
http://localhost:8000/api/auth/login/  ← BACKEND (Puerto 8000)
    ↓
PostgreSQL Database
```

**Si el backend no está en 8000, el login falla con 401.**

---

## Si Sigue Sin Funcionar

1. Verifica que **NO hay otro proceso en puerto 8000**:
   ```powershell
   netstat -ano | findstr :8000
   taskkill /PID <PID> /F  # Matar proceso conflictivo
   ```

2. Verifica la base de datos:
   ```powershell
   # Verificar si PostgreSQL está corriendo
   # (depende de tu configuración)
   ```

3. Revisa los logs del backend en la terminal

---

## Próximos Pasos Después del Login

Una vez que el login funcione:

1. ✅ Reinicia servidor frontend (presiona Ctrl+C y `npm run dev`)
2. ✅ Abre `http://localhost:3000/login`
3. ✅ Ingresa credenciales
4. ✅ Deberías ver el dashboard

---

**¡El error 401 desaparecerá cuando el backend esté corriendo!**
