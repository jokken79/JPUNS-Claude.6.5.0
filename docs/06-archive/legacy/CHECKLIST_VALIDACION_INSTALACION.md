# ✅ CHECKLIST DE VALIDACIÓN DE INSTALACIÓN
## UNS-ClaudeJP 5.4.1 - Verificación Completa

**Fecha:** 2025-11-12
**Versión:** 1.0 - Final
**Actualizado:** 2025-11-12

---

## 🔍 PRE-INSTALACIÓN (30 minutos)

### Hardware & Sistema Operativo
- [ ] **OS:** Windows 10/11 con Docker Desktop instalado
- [ ] **RAM:** Mínimo 8GB (preferible 16GB)
- [ ] **Disco:** Mínimo 20GB libres (preferible 50GB)
- [ ] **Puertos disponibles:** 3000, 3001, 5432, 6379, 8000, 8080, 9090
  ```batch
  netstat -ano | findstr ":3000"
  # Resultado esperado: Ninguna línea (puerto disponible)
  ```

### Verificación de Dependencias
- [ ] **Python 3.11+**
  ```batch
  python --version
  # Resultado esperado: Python 3.11.x
  ```

- [ ] **Docker Desktop**
  ```batch
  docker --version
  # Resultado esperado: Docker version 20.10+
  ```

- [ ] **Docker Compose V2**
  ```batch
  docker compose version
  # Resultado esperado: Docker Compose version v2.x.x
  ```

- [ ] **Git**
  ```batch
  git --version
  # Resultado esperado: git version 2.x.x
  ```

### Configuración del Sistema
- [ ] **Git configurado:**
  ```batch
  git config user.name
  git config user.email
  # Ambos deben retornar valores
  ```

- [ ] **Variables de entorno:**
  ```batch
  echo %PATH% | findstr "Docker"
  # Debe encontrar Docker en PATH
  ```

- [ ] **Docker Desktop activo:**
  ```batch
  docker ps
  # Resultado esperado: (sin errores, lista vacía es OK)
  ```

### Preparación del Ambiente
- [ ] **Crear directorio de backups:**
  ```batch
  mkdir backend\backups
  ```

- [ ] **Crear .env.backup (si existe .env):**
  ```batch
  copy .env .env.backup
  ```

- [ ] **Crear snapshot manual antes de comenzar:**
  ```batch
  REM Backup manual de datos actuales (si hay instalación previa)
  docker exec uns-claudejp-db pg_dump -U uns_admin uns_claudejp > backup_pre_reinstall.sql
  ```

---

## 🚀 DURANTE LA INSTALACIÓN

### FASE 1: Diagnóstico
- [ ] **Script ejecuta correctamente:**
  ```
  [OK] Python encontrado
  [OK] Docker Desktop corriendo
  [OK] Docker Compose detectado (V2 o V1)
  [OK] Archivos del proyecto existen
  ```

### FASE 2: Confirmación
- [ ] **Advertencia mostrada:** "⚠️ ADVERTENCIA IMPORTANTE - Eliminará TODOS los datos"
- [ ] **Confirmación requerida:** Debe requerir S o SI
- [ ] **Cancelación posible:** Presionar N debe cancelar

### FASE 3: Instalación

#### Paso 1/6: Generar .env
- [ ] **Archivo .env creado:**
  ```batch
  type .env | findstr "SECRET_KEY"
  # Resultado esperado: SECRET_KEY=xxxxxxxxx (64 caracteres)
  ```

- [ ] **Variables críticas presentes:**
  ```batch
  type .env | findstr /E "POSTGRES_PASSWORD DATABASE_URL"
  # Resultado esperado: Ambas variables con valores
  ```

#### Paso 2/6: Detener y Limpiar
- [ ] **Backup creado (si existe DB previa):**
  ```batch
  dir backend\backups\backup_*.sql
  # Resultado esperado: Al menos un archivo .sql
  ```

- [ ] **Contenedores eliminados:**
  ```batch
  docker ps -a | findstr "uns-claudejp"
  # Resultado esperado: (vacío - ningún contenedor anterior)
  ```

- [ ] **Volúmenes eliminados:**
  ```batch
  docker volume ls | findstr "uns-claudejp"
  # Resultado esperado: (vacío)
  ```

#### Paso 3/6: Build de Imágenes
- [ ] **Build completado sin errores:**
  ```
  [OK] Backend image built successfully
  [OK] Frontend image built successfully
  ```

- [ ] **Imágenes creadas:**
  ```batch
  docker images | findstr "uns-claudejp"
  # Resultado esperado: 2 imágenes (backend, frontend)
  ```

#### Paso 4/6: Servicios Base
- [ ] **PostgreSQL saludable (máx 90s):**
  ```batch
  docker ps | findstr "uns-claudejp-db"
  # Resultado esperado: healthy (después de 90s)
  ```

- [ ] **Redis saludable:**
  ```batch
  docker ps | findstr "uns-claudejp-redis"
  # Resultado esperado: healthy
  ```

- [ ] **Conexión BD verificada:**
  ```batch
  docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT 1;"
  # Resultado esperado: (1 row)
  ```

#### Paso 5/6: Migraciones y Datos
- [ ] **Migraciones ejecutadas:**
  ```batch
  docker exec uns-claudejp-backend bash -c "cd /app && alembic current"
  # Resultado esperado: revision ID (no empty)
  ```

- [ ] **Tablas creadas (13 total):**
  ```bash
  docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "\dt"
  # Resultado esperado: 13 tablas (users, candidates, employees, etc.)
  ```

- [ ] **Usuario admin creado:**
  ```bash
  docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT username FROM users WHERE role='SUPER_ADMIN';"
  # Resultado esperado: admin
  ```

- [ ] **Candidatos importados (>100):**
  ```bash
  docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT COUNT(*) FROM candidates;"
  # Resultado esperado: 1116 (o similar)
  ```

- [ ] **Empleados importados:**
  ```bash
  docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT COUNT(*) FROM employees;"
  # Resultado esperado: >100
  ```

- [ ] **Apartamentos creados (449):**
  ```bash
  docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT COUNT(*) FROM apartments;"
  # Resultado esperado: 449
  ```

#### Paso 6/6: Servicios Finales
- [ ] **Frontend listo (máx 120s):**
  ```batch
  curl http://localhost:3000
  # Resultado esperado: HTML válido de Next.js
  ```

- [ ] **Backend respondiendo:**
  ```batch
  curl http://localhost:8000/api/health
  # Resultado esperado: {"status":"healthy"}
  ```

- [ ] **Adminer accesible:**
  ```batch
  curl http://localhost:8080
  # Resultado esperado: HTML válido
  ```

- [ ] **Grafana accesible:**
  ```batch
  curl http://localhost:3001/api/health
  # Resultado esperado: {"database":"ok"}
  ```

#### Paso Final: Limpieza de Fotos OLE
- [ ] **LIMPIAR_FOTOS_OLE.bat ejecutado:**
  ```
  [OK] Fotos candidatos limpias (1116)
  [OK] Fotos empleados limpias (815)
  ```

---

## ✅ POST-INSTALACIÓN (30 minutos)

### Verificación de Servicios
```batch
docker compose ps
```

- [ ] **db:** "healthy" ✅
- [ ] **redis:** "healthy" ✅
- [ ] **backend:** "healthy" ✅
- [ ] **frontend:** "up" ✅
- [ ] **adminer:** "up" ✅
- [ ] **otel-collector:** "up" ✅
- [ ] **prometheus:** "healthy" ✅
- [ ] **tempo:** "healthy" ✅
- [ ] **grafana:** "up" ✅

### Acceso a URLs
- [ ] **Frontend:** http://localhost:3000
  ```
  ✅ Página carga
  ✅ No hay errores en consola
  ✅ Logo de UNS-ClaudeJP visible
  ```

- [ ] **API Docs:** http://localhost:8000/api/docs
  ```
  ✅ Swagger UI carga
  ✅ 24+ endpoints visibles
  ✅ Endpoint /health disponible
  ```

- [ ] **Database UI:** http://localhost:8080
  ```
  ✅ Adminer carga
  ✅ Puede conectar a base de datos
  ✅ 13 tablas visibles
  ```

- [ ] **Grafana:** http://localhost:3001
  ```
  ✅ Login page carga
  ✅ Credenciales admin/admin funcionan
  ✅ Dashboard "UNS-ClaudeJP" existe
  ```

### Funcionalidad Crítica
- [ ] **Login funcionando:**
  ```
  Usuario: admin
  Password: admin123
  ✅ Login exitoso
  ✅ Redirecciona a dashboard
  ✅ Session guardada
  ```

- [ ] **Dashboard visible:**
  ```
  ✅ Carga completamente
  ✅ Muestra datos (tabs, gráficas)
  ✅ No hay errores JavaScript
  ```

- [ ] **Base de datos accesible:**
  ```
  ✅ Tablas visibles en Adminer
  ✅ Datos presentes (candidates, employees)
  ✅ Queries funcionan
  ```

- [ ] **API respondiendo:**
  ```bash
  curl -X GET http://localhost:8000/api/health
  # Resultado esperado: {"status":"healthy","version":"5.4.1"}
  ```

### Observabilidad
- [ ] **Prometheus scraping:**
  ```bash
  curl http://localhost:9090/api/v1/query?query=up
  # Resultado esperado: Múltiples jobs activos
  ```

- [ ] **Grafana dashboards cargando:**
  ```
  ✅ Dashboard UNS-ClaudeJP visible
  ✅ Gráficas muestran datos (o "No data" es OK en primera instalación)
  ✅ Sin errores de conexión
  ```

- [ ] **Tempo almacenando traces:**
  ```bash
  curl http://localhost:3200/api/echo
  # Resultado esperado: "echo"
  ```

---

## 🐛 TESTS DE FUNCIONALIDAD

### Navegación Básica
- [ ] **Candidatos:** http://localhost:3000/candidates → Lista cargada (1116 candidatos)
- [ ] **Empleados:** http://localhost:3000/employees → Lista cargada (>100 empleados)
- [ ] **Fábricas:** http://localhost:3000/factories → Lista cargada
- [ ] **Apartamentos:** http://localhost:3000/apartments → Lista cargada (449 apartamentos)
- [ ] **Dashboard:** http://localhost:3000/dashboard → Tabs y gráficas visibles

### Operaciones Básicas (CRUD)
- [ ] **Ver candidato:** Click en cualquier candidato → Detalles cargan
- [ ] **Ver empleado:** Click en cualquier empleado → Detalles cargan
- [ ] **Fotos:** Imágenes se cargan correctamente (sin errores)
- [ ] **Búsqueda:** Buscar por nombre funciona

### Reportes
- [ ] **Exportar Excel:** Botón de export funciona (si existe)
- [ ] **Generar PDF:** PDF se genera correctamente (si existe)

---

## 🔐 VERIFICACIÓN DE SEGURIDAD

### Credenciales
- [ ] **Admin:** admin / admin123 funciona
- [ ] **JWT:** Token se genera correctamente
- [ ] **Token expiry:** 480 minutos (8 horas)

### Puertos
- [ ] **5432 NO expuesto público:**
  ```bash
  netstat -ano | findstr "5432" | findstr "0.0.0.0"
  # Resultado esperado: (vacío - puerto no expuesto)
  ```

- [ ] **3000 accesible (local):**
  ```bash
  curl http://localhost:3000
  # Resultado esperado: HTML
  ```

- [ ] **8000 accesible (local):**
  ```bash
  curl http://localhost:8000/api/health
  # Resultado esperado: JSON
  ```

### Secretos
- [ ] **SECRET_KEY no está en git:**
  ```bash
  git log -p .env | grep SECRET_KEY
  # Resultado esperado: (vacío - secreto no en historio)
  ```

---

## 📊 MÉTRICAS DE INSTALACIÓN

### Tiempos
| Fase | Tiempo Esperado | Tiempo Real | Status |
|------|-----------------|-------------|--------|
| Quick Wins | 1 hora | ___ min | [ ] |
| P1 Completada | 5 horas | ___ min | [ ] |
| P2 Completada | 8 horas | ___ min | [ ] |
| Total | 14 horas | ___ min | [ ] |

### Riesgos
- [ ] **Backup existente:** ✅ (riesgo R001 mitigado)
- [ ] **Puerto 5432 cerrado:** ✅ (riesgo R003 mitigado)
- [ ] **Frontend health check:** ✅ (riesgo R006 mitigado)
- [ ] **Versiones validadas:** ✅ (riesgo R009 mitigado)

---

## 🔄 TROUBLESHOOTING RÁPIDO

### Frontend Blank Page
```batch
docker logs uns-claudejp-frontend --tail 50
# Buscar: "Ready in Xs" o "ERROR"
# Solución: Esperar 2-3 minutos más
```

### Backend No Responde
```batch
docker logs uns-claudejp-backend --tail 50
# Buscar: "Uvicorn running" o "ERROR"
# Solución: Verificar .env variables
```

### DB No Conecta
```batch
docker logs uns-claudejp-db --tail 50
# Buscar: "accepting connections" o "ERROR"
# Solución: Reiniciar db service
docker compose restart db
```

### Puerto Ocupado
```batch
netstat -ano | findstr ":3000"
# Encontrar PID
taskkill /PID xxxxx /F
```

---

## ✨ INSTALACIÓN EXITOSA

Si TODOS los checks están ✅:

```
🎉 INSTALACIÓN COMPLETADA EXITOSAMENTE 🎉

Sistema está 100% funcional y listo para:
  ✅ Desarrollo
  ✅ Testing
  ✅ Staging (con fixes P2 implementados)
  ✅ Producción (con fixes P1 + P2 + P3 implementados)

Próximos pasos:
  1. Ver PLAN_ACCION_MAESTRO.md para mejoras
  2. Implementar Quick Wins (1 hora)
  3. Implementar P1 (5 horas)
  4. Implementar P2 (8 horas)
```

---

## 📝 NOTAS DE INSTALACIÓN

```
Fecha: _______________
Ejecutado por: ________________
Duración total: _____ minutos
Problemas encontrados: _____________________________________________
Soluciones aplicadas: _____________________________________________
Sistema funcional: ✅ [ ] NO [ ]
```

---

**CHECKLIST COMPLETO Y LISTO PARA USO ✅**

Imprimir este documento y completar durante instalación.
