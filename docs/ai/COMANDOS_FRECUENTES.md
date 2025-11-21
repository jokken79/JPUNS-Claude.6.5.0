# 💻 COMANDOS FRECUENTES - Referencia Rápida para IAs

**Propósito**: Lista de comandos más utilizados en el proyecto UNS-ClaudeJP v5.4  
**Para**: Acceso rápido sin búsqueda en documentación extensa  
**Última actualización**: 2025-11-07

---

## 🚀 INICIO Y GESTIÓN DEL SISTEMA

### Iniciar/Detener Sistema Completo
```bash
# Windows - Desde raíz del proyecto
START.bat                           # Iniciar todos los servicios
STOP.bat                            # Detener servicios
LOGS.bat                            # Ver logs interactivos (menú)
DIAGNOSTICO.bat                     # Diagnóstico completo del sistema

# Linux/macOS
python generate_env.py              # Generar .env si no existe
docker compose up -d                # Iniciar servicios en background
docker compose logs -f              # Ver logs en tiempo real
docker compose down                 # Detener servicios
```

### Verificar Estado
```bash
# Ver contenedores corriendo
docker ps
docker compose ps

# Ver logs específicos
docker logs uns-claudejp-backend --tail=50
docker logs uns-claudejp-frontend --tail=50
docker logs uns-claudejp-db --tail=50

# Ver logs en tiempo real
docker compose logs -f backend
docker compose logs -f frontend
```

---

## 🐳 ACCESO A CONTENEDORES

### Acceder a Bash/Shell
```bash
# Backend (Python/FastAPI)
docker exec -it uns-claudejp-backend bash

# Frontend (Node.js/Next.js)
docker exec -it uns-claudejp-frontend bash

# Base de Datos (PostgreSQL)
docker exec -it uns-claudejp-db bash
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp
```

### Ejecutar Comandos Directos (sin entrar al contenedor)
```bash
# Backend
docker exec uns-claudejp-backend python scripts/create_admin_user.py
docker exec uns-claudejp-backend alembic upgrade head
docker exec uns-claudejp-backend pytest tests/ -v

# Frontend
docker exec uns-claudejp-frontend npm run build
docker exec uns-claudejp-frontend npm run lint

# Base de Datos
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "SELECT COUNT(*) FROM users;"
```

---

## 🗄️ BASE DE DATOS (PostgreSQL)

### Conexión y Consultas
```bash
# Conectar a PostgreSQL
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp

# Comandos PostgreSQL útiles
\dt                                 # Listar todas las tablas
\d users                            # Describir tabla users
\l                                  # Listar bases de datos
\du                                 # Listar usuarios
\q                                  # Salir de psql
```

### Consultas SQL Frecuentes
```sql
-- Ver usuarios del sistema
SELECT id, username, role, is_active FROM users;

-- Ver total de candidatos
SELECT COUNT(*) FROM candidates;

-- Ver empleados activos
SELECT id, first_name, last_name, status FROM employees WHERE status = 'ACTIVE';

-- Ver fábricas
SELECT id, name, prefecture FROM factories;

-- Ver tarjetas de tiempo del mes actual
SELECT * FROM timer_cards 
WHERE work_date >= DATE_TRUNC('month', CURRENT_DATE);

-- Ver salarios del último mes
SELECT * FROM salary 
WHERE payment_date >= CURRENT_DATE - INTERVAL '30 days';

-- Ver solicitudes pendientes
SELECT * FROM requests WHERE status = 'PENDING';
```

### Backup y Restore
```bash
# Backup de base de datos
docker exec uns-claudejp-db pg_dump -U uns_admin uns_claudejp > backup_$(date +%Y%m%d).sql

# Restore desde backup
cat backup_20251107.sql | docker exec -i uns-claudejp-db psql -U uns_admin -d uns_claudejp

# Backup con script
BACKUP_DATOS.bat                    # Windows - usa scripts/BACKUP_DATOS_FUN.bat
```

---

## 🔧 BACKEND (FastAPI + Python)

### Migraciones de Base de Datos (Alembic)
```bash
# Dentro del contenedor backend (docker exec -it uns-claudejp-backend bash)

cd /app

# Ver estado actual de migraciones
alembic current

# Aplicar todas las migraciones pendientes
alembic upgrade head

# Crear nueva migración automáticamente
alembic revision --autogenerate -m "Add new_field to employees"

# Crear migración manual
alembic revision -m "Custom migration"

# Rollback una migración
alembic downgrade -1

# Rollback a migración específica
alembic downgrade <revision_id>

# Ver historial de migraciones
alembic history

# Ver SQL que ejecutará una migración (sin aplicar)
alembic upgrade head --sql
```

### Scripts de Gestión
```bash
# Dentro del contenedor backend

# Crear/resetear usuario admin
python scripts/create_admin_user.py

# Importar datos de prueba
python scripts/import_data.py

# Verificar datos en BD
python scripts/verify_data.py

# Otros scripts
ls scripts/                         # Ver todos los scripts disponibles
```

### Testing
```bash
# Dentro del contenedor backend

# Ejecutar todos los tests
pytest tests/ -v

# Ejecutar tests con output detallado
pytest tests/ -vs

# Ejecutar un archivo específico
pytest tests/test_auth.py -v

# Ejecutar tests que coincidan con patrón
pytest -k "test_login" -v

# Ejecutar con coverage
pytest tests/ --cov=app --cov-report=html
```

### Python REPL con Contexto
```bash
# Dentro del contenedor backend
python

# Luego en Python:
>>> from app.database import SessionLocal
>>> from app.models import models
>>> db = SessionLocal()
>>> 
>>> # Consultar usuarios
>>> users = db.query(models.User).all()
>>> for user in users:
...     print(user.username, user.role)
>>> 
>>> # Crear nuevo usuario
>>> new_user = models.User(username="test", email="test@test.com")
>>> db.add(new_user)
>>> db.commit()
>>> 
>>> # Cerrar sesión
>>> db.close()
```

---

## 🎨 FRONTEND (Next.js + React)

### Desarrollo
```bash
# Dentro del contenedor frontend (docker exec -it uns-claudejp-frontend bash)

# Dev server (ya está corriendo por defecto)
npm run dev

# Build para producción
npm run build

# Start en modo producción
npm run start

# Ver logs del dev server
docker logs uns-claudejp-frontend -f
```

### Validación y Testing
```bash
# Dentro del contenedor frontend

# Type check (TypeScript)
npm run type-check

# Lint (ESLint)
npm run lint

# Lint con auto-fix
npm run lint -- --fix

# Tests unitarios (Vitest)
npm test

# Tests E2E (Playwright)
npm run test:e2e
```

### Gestión de Dependencias
```bash
# Dentro del contenedor frontend

# Instalar nueva dependencia
npm install <package-name>

# Instalar como dev dependency
npm install -D <package-name>

# Desinstalar
npm uninstall <package-name>

# Actualizar dependencia
npm update <package-name>

# Ver dependencias instaladas
npm list

# Ver dependencias desactualizadas
npm outdated

# Limpiar cache npm
npm cache clean --force
```

---

## 🔄 REBUILD Y LIMPIEZA

### Rebuild de Servicios
```bash
# Rebuild un servicio específico
docker compose build backend
docker compose build frontend

# Rebuild todos los servicios
docker compose build

# Rebuild sin caché
docker compose build --no-cache

# Rebuild y reiniciar
docker compose up -d --build backend
```

### Limpieza de Docker
```bash
# Detener y remover contenedores
docker compose down

# Remover contenedores y volúmenes
docker compose down -v

# Limpiar sistema Docker (cuidado!)
docker system prune -a

# Limpiar volúmenes no usados
docker volume prune

# Limpiar imágenes no usadas
docker image prune -a

# Limpiar todo (CUIDADO - borra TODO Docker)
docker system prune -a --volumes

# Script Windows
LIMPIAR_CACHE.bat                   # Limpia caché Docker de manera segura
```

---

## 🔍 DEBUGGING Y DIAGNÓSTICO

### Ver Logs Detallados
```bash
# Logs de todos los servicios
docker compose logs

# Logs con follow (tiempo real)
docker compose logs -f

# Logs de un servicio específico
docker compose logs backend
docker compose logs frontend
docker compose logs db

# Últimas N líneas
docker logs uns-claudejp-backend --tail=100

# Logs desde una fecha
docker logs --since="2025-11-07T10:00:00" uns-claudejp-backend
```

### Inspeccionar Contenedores
```bash
# Información detallada del contenedor
docker inspect uns-claudejp-backend

# Ver variables de entorno
docker exec uns-claudejp-backend env

# Ver procesos corriendo
docker exec uns-claudejp-backend ps aux

# Ver uso de recursos
docker stats

# Ver espacio en disco
docker system df
```

### Health Checks
```bash
# Verificar salud de servicios
docker compose ps

# Health check manual de DB
docker exec uns-claudejp-db pg_isready -U uns_admin

# Health check de backend API
curl http://localhost:8000/health

# Health check de frontend
curl http://localhost:3000
```

---

## 🌐 TESTING DE API

### Endpoints de Autenticación
```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Obtener usuario actual (requiere token)
curl http://localhost:8000/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Endpoints de Datos
```bash
# Listar candidatos (requiere token)
curl http://localhost:8000/api/candidates \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Listar empleados
curl http://localhost:8000/api/employees \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Crear nuevo candidato
curl -X POST http://localhost:8000/api/candidates \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"first_name": "Test", "last_name": "User", ...}'
```

### Swagger UI (Interfaz Interactiva)
```
Abrir en navegador:
http://localhost:8000/api/docs
http://localhost:8000/api/redoc
```

---

## 📁 GESTIÓN DE ARCHIVOS

### Ubicaciones Importantes
```bash
# Ver archivos subidos
ls -lah uploads/

# Ver logs de aplicación
ls -lah backend/logs/
ls -lah logs/

# Ver configuraciones
ls -lah config/

# Ver scripts
ls -lah scripts/
```

### Copiar Archivos desde/hacia Contenedores
```bash
# Copiar desde contenedor a host
docker cp uns-claudejp-backend:/app/logs/app.log ./local-logs/

# Copiar desde host a contenedor
docker cp ./local-file.txt uns-claudejp-backend:/app/

# Copiar carpeta completa
docker cp uns-claudejp-backend:/app/reports ./local-reports/
```

---

## 🔧 TROUBLESHOOTING

### Problemas Comunes y Soluciones

#### Puerto ya en uso
```bash
# Windows - Ver qué usa el puerto
netstat -ano | findstr :3000
netstat -ano | findstr :8000
netstat -ano | findstr :5432

# Matar proceso (reemplazar PID)
taskkill /PID <PID> /F

# Linux/macOS
lsof -ti:3000 | xargs kill -9
```

#### Contenedor no inicia
```bash
# Ver logs de error
docker logs uns-claudejp-backend

# Verificar variables de entorno
docker exec uns-claudejp-backend env | grep DATABASE

# Reiniciar servicio
docker compose restart backend
```

#### Base de datos no conecta
```bash
# Verificar que DB está corriendo
docker ps | grep uns-claudejp-db

# Verificar salud de DB
docker exec uns-claudejp-db pg_isready -U uns_admin

# Ver logs de DB
docker logs uns-claudejp-db --tail=50

# Recrear DB (CUIDADO - borra datos)
docker compose down db
docker volume rm uns-claudejp-5.4_postgres_data
docker compose up -d db
```

#### Frontend no carga
```bash
# Verificar que está corriendo
curl http://localhost:3000

# Ver logs
docker logs uns-claudejp-frontend

# Rebuild y reiniciar
docker compose build frontend
docker compose up -d --force-recreate frontend

# Limpiar caché de Next.js
docker exec uns-claudejp-frontend rm -rf .next
docker compose restart frontend
```

---

## 🔐 GESTIÓN DE USUARIOS

### Crear/Resetear Admin
```bash
# Usar script
docker exec uns-claudejp-backend python scripts/create_admin_user.py

# Manual con SQL
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c \
  "UPDATE users SET password='\$2b\$12\$...' WHERE username='admin';"
```

### Listar Usuarios
```bash
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c \
  "SELECT id, username, email, role, is_active FROM users;"
```

---

## 📊 MONITOREO

### Uso de Recursos
```bash
# Ver uso de CPU, RAM, I/O
docker stats

# Espacio en disco
docker system df

# Ver volúmenes
docker volume ls

# Tamaño de volúmenes
docker system df -v
```

### Información del Sistema
```bash
# Versión de Docker
docker --version
docker compose version

# Info del sistema Docker
docker info

# Verificar puertos abiertos
docker compose ps
```

---

## 🎯 ATAJOS Y ALIAS ÚTILES

### Agregar a .bashrc o .zshrc (Linux/macOS)
```bash
# Alias para acceso rápido
alias dbe='docker exec -it uns-claudejp-backend bash'
alias dfe='docker exec -it uns-claudejp-frontend bash'
alias ddb='docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp'

# Alias para logs
alias dlb='docker logs uns-claudejp-backend --tail=50 -f'
alias dlf='docker logs uns-claudejp-frontend --tail=50 -f'

# Alias para restart
alias drb='docker compose restart backend'
alias drf='docker compose restart frontend'
```

---

## 🚀 WORKFLOWS COMPLETOS

### Workflow: Nueva Funcionalidad con Migración
```bash
# 1. Editar modelo
docker exec -it uns-claudejp-backend bash
vi /app/app/models/models.py

# 2. Crear migración
cd /app
alembic revision --autogenerate -m "Add new_feature"

# 3. Aplicar migración
alembic upgrade head

# 4. Reiniciar backend
exit
docker compose restart backend

# 5. Verificar en DB
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp
\d nombre_tabla
\q
```

### Workflow: Actualizar Dependencias Frontend
```bash
# 1. Acceder a frontend
docker exec -it uns-claudejp-frontend bash

# 2. Actualizar package.json (o instalar nuevo paquete)
npm install nueva-dependencia

# 3. Rebuild si es necesario
exit
docker compose build frontend
docker compose up -d --force-recreate frontend

# 4. Verificar
docker logs uns-claudejp-frontend
```

### Workflow: Reset Completo del Sistema
```bash
# ⚠️ CUIDADO - Borra todos los datos

# 1. Detener servicios
STOP.bat

# 2. Limpiar volúmenes
docker compose down -v

# 3. Limpiar caché Docker
docker system prune -a

# 4. Reiniciar
START.bat

# 5. Recrear admin y datos
docker exec uns-claudejp-backend python scripts/create_admin_user.py
docker exec uns-claudejp-backend python scripts/import_data.py
```

---

**💡 TIP**: Guarda este archivo para referencia rápida. Copia comandos según necesites.

---

*Última actualización: 2025-11-07*  
*Mantenido por: Sistema de IA*