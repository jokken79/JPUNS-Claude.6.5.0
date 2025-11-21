# ✅ Verificación de Apartamentos V2 - Checklist Completo

**Fecha:** 2025-11-11
**Sistema:** UNS-ClaudeJP 5.4.1
**Propósito:** Verificar que Apartamentos V2 funcione correctamente después de instalación

---

## 🎯 Resumen Ejecutivo

Este documento contiene verificaciones paso a paso para asegurar que el sistema de Apartamentos V2 esté completamente funcional después de:
- Reinstalación completa
- Actualización del sistema
- Migración de datos
- Cambio de servidor/PC

**Tiempo estimado:** 15-20 minutos

---

## 📋 Pre-requisitos

Antes de comenzar, asegúrate de tener:

- [ ] Docker Desktop corriendo
- [ ] Servicios iniciados (`scripts\START.bat`)
- [ ] Acceso a terminal/PowerShell
- [ ] Navegador web (Chrome/Edge recomendado)
- [ ] Credenciales de admin (`admin` / `admin123`)

---

## 🔍 Verificación 1: Docker y Servicios

### 1.1 Verificar Docker Desktop

```bash
docker --version
# Esperado: Docker version 20.x o superior

docker compose version
# Esperado: Docker Compose version v2.x o superior
```

**✅ Resultado esperado:** Ambos comandos muestran versiones sin errores

---

### 1.2 Verificar Servicios Corriendo

```bash
docker compose ps
```

**✅ Resultado esperado:**
```
NAME                    STATUS          PORTS
uns-claudejp-backend    healthy         0.0.0.0:8000->8000/tcp
uns-claudejp-frontend   healthy         0.0.0.0:3000->3000/tcp
uns-claudejp-db         healthy         0.0.0.0:5432->5432/tcp
uns-claudejp-redis      healthy         0.0.0.0:6379->6379/tcp
...
```

**⚠️ Si algún servicio muestra "unhealthy":**
```bash
# Ver logs del servicio
docker compose logs [servicio]

# Reiniciar servicio específico
docker compose restart [servicio]
```

---

### 1.3 Verificar Importer Completado

```bash
docker compose logs importer | grep -i apartment
```

**✅ Resultado esperado:**
```
--- Step 3: Creating apartments from employee data ---
Creados: 449 apartamentos
✅ Apartments created (449 records)
--- Step 4: Importing employees from Excel ---
✅ Employees imported
```

**❌ Si NO aparece "Step 3" o "449 apartamentos":**
```bash
# Ejecutar script manualmente
docker exec uns-claudejp-backend python scripts/create_apartments_from_employees.py

# Verificar resultado
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT COUNT(*) FROM apartments;"
```

---

## 🗄️ Verificación 2: Base de Datos

### 2.1 Verificar Conexión a PostgreSQL

```bash
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT version();"
```

**✅ Resultado esperado:**
```
PostgreSQL 15.x on x86_64-pc-linux-musl
```

---

### 2.2 Verificar Tablas de Apartamentos V2

```bash
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "\dt" | grep -E "apartment|additional_charge|rent_deduction"
```

**✅ Resultado esperado:**
```
public | additional_charges      | table | uns_admin
public | apartment_assignments   | table | uns_admin
public | apartments              | table | uns_admin
public | rent_deductions         | table | uns_admin
```

**⚠️ Si falta alguna tabla:**
```bash
# Ver migraciones aplicadas
docker exec uns-claudejp-backend bash -c "cd /app && alembic current"

# Aplicar migraciones pendientes
docker exec uns-claudejp-backend bash -c "cd /app && alembic upgrade head"

# Verificar nuevamente
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "\dt"
```

---

### 2.3 Verificar Datos de Apartamentos

```bash
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT COUNT(*) as total_apartments FROM apartments WHERE deleted_at IS NULL;"
```

**✅ Resultado esperado:**
```
 total_apartments
------------------
              449
```

**❌ Si muestra 0:**
```bash
# Ejecutar script de importación
docker exec uns-claudejp-backend python scripts/create_apartments_from_employees.py

# Esperar 30 segundos

# Verificar nuevamente
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT COUNT(*) FROM apartments;"
```

---

### 2.4 Verificar Estructura de Datos

```bash
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT apartment_code, address, base_rent, capacity FROM apartments LIMIT 3;"
```

**✅ Resultado esperado:**
```
 apartment_code |           address                    | base_rent | capacity
----------------+--------------------------------------+-----------+----------
 サンハイツ101    | (Pendiente - actualizar dirección)   |  45000.00 |        4
 グリーンヒル202  | (Pendiente - actualizar dirección)   |  45000.00 |        3
 パークサイド303  | (Pendiente - actualizar dirección)   |  45000.00 |        2
```

---

### 2.5 Verificar Tablas Relacionadas

```bash
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "
SELECT
    'apartments' as tabla,
    COUNT(*) as registros
FROM apartments
UNION ALL
SELECT 'apartment_assignments', COUNT(*) FROM apartment_assignments
UNION ALL
SELECT 'additional_charges', COUNT(*) FROM additional_charges
UNION ALL
SELECT 'rent_deductions', COUNT(*) FROM rent_deductions
ORDER BY tabla;
"
```

**✅ Resultado esperado:**
```
       tabla           | registros
-----------------------+-----------
 additional_charges    |         0
 apartment_assignments |         0
 apartments            |       449
 rent_deductions       |         0
```

**Nota:** Es normal que assignments, charges y deductions estén en 0 en instalación nueva.

---

## 🔌 Verificación 3: Backend API

### 3.1 Verificar Health Check

```bash
curl http://localhost:8000/api/health
```

**✅ Resultado esperado:**
```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected"
}
```

---

### 3.2 Obtener Token de Autenticación

```bash
# Windows PowerShell
$response = Invoke-RestMethod -Uri "http://localhost:8000/api/auth/login" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"username":"admin","password":"admin123"}'

$TOKEN = $response.access_token
echo "Token: $($TOKEN.Substring(0,20))..."

# Linux/Mac/Git Bash
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | python -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

echo "Token: ${TOKEN:0:20}..."
```

**✅ Resultado esperado:** Token JWT largo (~200 caracteres)

---

### 3.3 Verificar Endpoint de Apartamentos

```bash
# PowerShell
Invoke-RestMethod -Uri "http://localhost:8000/api/apartments-v2/apartments?page_size=3" `
  -Headers @{Authorization="Bearer $TOKEN"} | ConvertTo-Json -Depth 5

# Linux/Mac/Bash
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/apartments-v2/apartments?page_size=3" \
  | python -m json.tool
```

**✅ Resultado esperado:**
```json
{
  "items": [
    {
      "id": 1,
      "apartment_code": "サンハイツ101",
      "address": "(Pendiente - actualizar dirección)",
      "base_rent": 45000,
      "capacity": 4,
      "current_occupancy": 0,
      "occupancy_rate": 0.0,
      "is_available": true
    },
    {...},
    {...}
  ],
  "total": 449,
  "page": 1,
  "page_size": 3
}
```

---

### 3.4 Verificar Endpoint de Cálculo Prorrateado

```bash
# PowerShell
$body = @{
    apartment_id = 1
    start_date = "2025-11-15"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/apartments-v2/calculate/prorated" `
  -Method Post `
  -Headers @{Authorization="Bearer $TOKEN"; "Content-Type"="application/json"} `
  -Body $body | ConvertTo-Json

# Bash
curl -s -X POST http://localhost:8000/api/apartments-v2/calculate/prorated \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "apartment_id": 1,
    "start_date": "2025-11-15"
  }' \
  | python -m json.tool
```

**✅ Resultado esperado:**
```json
{
  "monthly_rent": 45000,
  "start_date": "2025-11-15",
  "end_date": "2025-11-30",
  "days_in_month": 30,
  "days_occupied": 16,
  "daily_rate": 1500,
  "prorated_rent": 24000,
  "is_prorated": true
}
```

**Verificar cálculo manual:**
```
daily_rate = 45,000 / 30 = 1,500
prorated_rent = 1,500 * 16 = 24,000 ✓
```

---

### 3.5 Verificar Todos los Endpoints Disponibles

```bash
curl -s http://localhost:8000/api/docs | grep -o "apartments-v2" | wc -l
```

**✅ Resultado esperado:** Número > 20 (debe haber múltiples referencias a apartments-v2)

**O ver directamente en navegador:**
```
http://localhost:8000/api/docs
```

Buscar sección "Apartments V2" y verificar endpoints:
- GET /api/apartments-v2/apartments
- POST /api/apartments-v2/apartments
- GET /api/apartments-v2/apartments/{id}
- PUT /api/apartments-v2/apartments/{id}
- DELETE /api/apartments-v2/apartments/{id}
- GET /api/apartments-v2/assignments
- POST /api/apartments-v2/assignments
- POST /api/apartments-v2/calculate/prorated
- POST /api/apartments-v2/deductions/generate
- ... (y más)

---

## 🖥️ Verificación 4: Frontend

### 4.1 Verificar Frontend Responde

```bash
curl -s http://localhost:3000 | head -20
```

**✅ Resultado esperado:** HTML del frontend (contiene `<html`, `<head`, etc.)

---

### 4.2 Verificar Página de Apartamentos (Manual)

**Abrir en navegador:**
```
http://localhost:3000/apartments
```

**Verificar:**
- [ ] Página carga sin errores
- [ ] Muestra lista de apartamentos (12 por página)
- [ ] Columnas visibles: Código, Dirección, Renta, Capacidad, Estado
- [ ] Paginación funciona (449 total)
- [ ] Filtros visibles (Estado, Prefectura, Tipo de habitación)
- [ ] Botón "Ver" abre detalle
- [ ] Botón "Asignar Empleado" abre formulario
- [ ] No hay errores en consola (F12)

**❌ Si muestra error "Failed to fetch":**
```bash
# Verificar backend está corriendo
docker compose ps backend

# Ver logs del backend
docker compose logs -f backend

# Reiniciar frontend
docker compose restart frontend
```

---

### 4.3 Verificar Página de Asignación (Manual)

**Abrir en navegador:**
```
http://localhost:3000/apartments/1/assign
```

**Verificar:**
- [ ] Formulario carga correctamente
- [ ] Selector de empleado funciona (muestra empleados)
- [ ] Selector de fecha funciona
- [ ] Al seleccionar fecha, calcula renta prorrateada automáticamente
- [ ] Muestra breakdown: Días, Tarifa diaria, Total
- [ ] Botón "Asignar" está habilitado
- [ ] No hay errores en consola (F12)

**Probar cálculo:**
```
1. Seleccionar empleado: cualquiera
2. Seleccionar fecha: 15/11/2025
3. Verificar cálculo:
   - Renta mensual: ¥45,000
   - Días del mes: 30
   - Días ocupados: 16 (del 15 al 30)
   - Tarifa diaria: ¥1,500
   - Renta prorrateada: ¥24,000
```

---

### 4.4 Verificar Tipos TypeScript

```bash
# Verificar que el archivo de tipos existe
test -f /home/user/UNS-ClaudeJP-5.4.1/frontend/types/apartments-v2.ts && echo "✅ Tipos existen" || echo "❌ Tipos NO existen"

# Compilar TypeScript
docker exec uns-claudejp-frontend npx tsc --noEmit 2>&1 | grep -i apartment
```

**✅ Resultado esperado:** Sin errores de TypeScript relacionados con apartments

---

## 🧪 Verificación 5: Testing E2E

### 5.1 Test Completo de Asignación

**Script de prueba:** (Guardar como `test_apartment_flow.sh`)

```bash
#!/bin/bash

echo "🧪 Test E2E: Flujo Completo de Apartamentos V2"
echo "=============================================="

# 1. Verificar servicios
echo ""
echo "1️⃣ Verificando servicios..."
docker compose ps | grep -E "backend|frontend|db" | grep healthy && echo "✅ Servicios OK" || echo "❌ Servicios con problemas"

# 2. Verificar base de datos
echo ""
echo "2️⃣ Verificando base de datos..."
COUNT=$(docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -t -c "SELECT COUNT(*) FROM apartments;")
if [ "$COUNT" -eq 449 ]; then
    echo "✅ Apartamentos: 449"
else
    echo "❌ Apartamentos: $COUNT (esperado: 449)"
fi

# 3. Verificar API
echo ""
echo "3️⃣ Verificando API..."
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | python -c "import sys, json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)

if [ -n "$TOKEN" ]; then
    echo "✅ Token obtenido"

    # Test endpoint
    RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
      "http://localhost:8000/api/apartments-v2/apartments?page_size=1")

    if echo "$RESPONSE" | grep -q "apartment_code"; then
        echo "✅ Endpoint /apartments funciona"
    else
        echo "❌ Endpoint /apartments NO funciona"
    fi
else
    echo "❌ No se pudo obtener token"
fi

# 4. Verificar frontend
echo ""
echo "4️⃣ Verificando frontend..."
curl -s http://localhost:3000 | grep -q "<html" && echo "✅ Frontend responde" || echo "❌ Frontend NO responde"

echo ""
echo "=============================================="
echo "🎉 Test completado"
```

**Ejecutar:**
```bash
chmod +x test_apartment_flow.sh
./test_apartment_flow.sh
```

**✅ Resultado esperado:** Todos los checks en verde (✅)

---

## 📊 Resumen de Verificación

### Checklist General

**Docker y Servicios:**
- [ ] Docker Desktop corriendo
- [ ] 10 servicios en estado "healthy"
- [ ] Importer completado (Step 3 ejecutado)

**Base de Datos:**
- [ ] PostgreSQL responde
- [ ] 4 tablas de apartamentos V2 existen
- [ ] 449 apartamentos cargados
- [ ] Estructura de datos correcta

**Backend API:**
- [ ] Health check OK
- [ ] Login funciona (obtiene token)
- [ ] GET /apartments-v2/apartments retorna datos
- [ ] POST /calculate/prorated funciona
- [ ] 30 endpoints documentados en /api/docs

**Frontend:**
- [ ] Página principal responde
- [ ] /apartments muestra lista de 449
- [ ] /apartments/[id]/assign carga formulario
- [ ] Cálculo prorrateado funciona
- [ ] TypeScript sin errores

**Testing:**
- [ ] Script E2E pasa todas las verificaciones

---

## 🚨 Troubleshooting Rápido

### Problema: Apartamentos = 0

**Solución:**
```bash
docker exec uns-claudejp-backend python scripts/create_apartments_from_employees.py
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT COUNT(*) FROM apartments;"
```

---

### Problema: API 404 Not Found

**Solución:**
```bash
docker compose restart backend
sleep 10
curl http://localhost:8000/api/health
```

---

### Problema: Frontend no carga

**Solución:**
```bash
docker compose restart frontend
sleep 30
curl http://localhost:3000
```

---

### Problema: Token inválido

**Solución:**
```bash
# Recrear usuario admin
docker exec uns-claudejp-backend python scripts/create_admin_user.py

# Obtener nuevo token
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

## ✅ Criterios de Éxito

**El sistema de Apartamentos V2 está funcionando correctamente si:**

1. ✅ 449 apartamentos en base de datos
2. ✅ 4 tablas V2 existen y son consultables
3. ✅ Backend responde a todos los endpoints
4. ✅ Frontend muestra lista de apartamentos
5. ✅ Cálculo prorrateado funciona correctamente
6. ✅ Sin errores en logs de Docker
7. ✅ Sin errores en consola del navegador
8. ✅ Documentación API accesible en /api/docs

**Si todos los puntos están en ✅ → Sistema 100% funcional**

---

## 📞 Soporte

**Si encuentras problemas:**

1. Revisa logs: `docker compose logs [servicio]`
2. Consulta: `docs/features/housing/APARTAMENTOS_V2_FLUJO_COMPLETO.md`
3. Verifica: `CHECKLIST_REINSTALACION.md`
4. Lee: `docs/scripts/SCRIPTS_REFERENCE.md`

---

**Última actualización:** 2025-11-11
**Versión:** 2.0
**Sistema:** UNS-ClaudeJP 5.4.1
