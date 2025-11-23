# 🚀 JPUNS-Claude 6.5.0 - LEEME PRIMERO

## ⚡ INICIO RÁPIDO (3 pasos)

```bash
# 1. Configurar variables de entorno
copy .env.example .env
notepad .env

# 2. Iniciar aplicación
docker compose up -d

# 3. Abrir en navegador
start http://localhost:3200
```

---

## 🌐 TUS URLs DE ACCESO

### 📱 Aplicación Principal
```
Frontend:        http://localhost:3200
Backend API:     http://localhost:8200/api
API Docs:        http://localhost:8200/docs
```

### 🔧 Herramientas de Administración
```
Adminer:         http://localhost:8280
Grafana:         http://localhost:3201
Prometheus:      http://localhost:9290
```

### 🗄️ Conexiones de Base de Datos
```
PostgreSQL:      localhost:5632
  Usuario:       uns_admin
  Base de datos: uns_claudejp

Redis:           localhost:6579
```

---

## 📊 TABLA COMPLETA DE PUERTOS

| Servicio | Puerto | URL/Conexión |
|----------|--------|--------------|
| 🎨 **Frontend** | **3200** | http://localhost:3200 |
| ⚙️ **Backend API** | **8200** | http://localhost:8200/api |
| 🗄️ **PostgreSQL** | **5632** | postgresql://localhost:5632 |
| 📦 **Redis** | **6579** | redis://localhost:6579 |
| 🔍 **Adminer** | **8280** | http://localhost:8280 |
| 📊 **Grafana** | **3201** | http://localhost:3201 |
| 📈 **Prometheus** | **9290** | http://localhost:9290 |
| 🔭 **OTEL** | **4517/4518** | localhost:4517 |
| ⏱️ **Tempo** | **3400** | http://localhost:3400 |

---

## ✅ PASOS DETALLADOS

### 1️⃣ Configurar Variables de Entorno

```bash
# Copiar el template
copy .env.example .env

# Editar el archivo
notepad .env
```

**Variables OBLIGATORIAS a configurar:**
```env
# Base de datos
POSTGRES_PASSWORD=TuPasswordSeguro123!

# Seguridad JWT
SECRET_KEY=ejecuta-python-para-generar-uno-nuevo

# Redis
REDIS_PASSWORD=TuPasswordRedisSeguro123!

# Grafana
GRAFANA_ADMIN_PASSWORD=TuPasswordGrafanaSeguro123!
```

**Generar SECRET_KEY:**
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### 2️⃣ Iniciar Servicios Docker

```bash
# Iniciar todos los servicios
docker compose up -d

# Ver logs en tiempo real
docker compose logs -f

# Ver estado de servicios
docker compose ps
```

### 3️⃣ Verificar Funcionamiento

```bash
# Verificar frontend
curl http://localhost:3200

# Verificar backend
curl http://localhost:8200/api/health

# Verificar base de datos
docker compose exec db psql -U uns_admin -d uns_claudejp -c "SELECT version();"
```

---

## 🔐 CREDENCIALES POR DEFECTO

### Aplicación Web
```
Usuario:  admin
Password: admin123
```

### Adminer (PostgreSQL UI)
```
Sistema:  PostgreSQL
Servidor: db
Usuario:  uns_admin
Password: (el que configuraste en .env)
Base:     uns_claudejp
```

### Grafana
```
Usuario:  admin
Password: (el que configuraste en .env)
URL:      http://localhost:3201
```

⚠️ **IMPORTANTE**: Cambia estas credenciales en producción!

---

## 📚 DOCUMENTACIÓN DISPONIBLE

### 🎯 Para empezar
- **LEEME_PRIMERO.md** ← Estás aquí
- **INICIO_RAPIDO_PUERTOS_NUEVOS.md** - Guía rápida en español
- **README.md** - Documentación principal completa

### 📖 Configuración de puertos
- **PUERTO_CONFIGURACION_ACTUALIZADO_v2.md** - Guía completa en español
- **PORT_CONFIGURATION_6.5.0.md** - Port reference (English)
- **PORT_MIGRATION_COMPLETE_v2.md** - Migration guide (English)

### 🔧 Referencia técnica
- **RESUMEN_COMPLETO_SESSION_2025-11-23.md** - Resumen de la sesión
- **RESUMEN_CAMBIOS_PUERTOS_v2.txt** - Lista detallada de cambios
- **DOCKER_VERSION_UPDATE_6.5.0.md** - Cambios de Docker

---

## 🛠️ COMANDOS ÚTILES

### Docker
```bash
# Iniciar servicios
docker compose up -d

# Detener servicios
docker compose down

# Reiniciar un servicio específico
docker compose restart backend

# Ver logs
docker compose logs -f backend
docker compose logs -f frontend

# Reconstruir y reiniciar
docker compose up -d --build

# Limpiar todo y empezar de nuevo
docker compose down -v
docker compose up -d --build
```

### Base de Datos
```bash
# Conectar a PostgreSQL
docker compose exec db psql -U uns_admin -d uns_claudejp

# Backup de base de datos
docker compose exec db pg_dump -U uns_admin uns_claudejp > backup.sql

# Restaurar base de datos
cat backup.sql | docker compose exec -T db psql -U uns_admin uns_claudejp
```

### Logs y Debugging
```bash
# Ver todos los logs
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f backend

# Ver últimas 100 líneas
docker compose logs --tail=100 backend

# Ejecutar comando en contenedor
docker compose exec backend bash
docker compose exec frontend sh
```

---

## ❓ TROUBLESHOOTING

### ⚠️ Error: Puerto ya en uso
```bash
# Ver qué está usando el puerto
netstat -ano | findstr :3200

# Verificar servicios Docker
docker compose ps

# Si hay conflicto, cambiar puerto en docker-compose.yml
```

### ⚠️ Error: Cannot connect to database
```bash
# Verificar que PostgreSQL está corriendo
docker compose ps db

# Ver logs de PostgreSQL
docker compose logs db

# Reiniciar base de datos
docker compose restart db
```

### ⚠️ Error: Frontend no carga
```bash
# Ver logs del frontend
docker compose logs -f frontend

# Verificar que backend está corriendo
curl http://localhost:8200/api/health

# Reconstruir frontend
docker compose up -d --build frontend
```

### ⚠️ Error: 401 Unauthorized
```bash
# Verificar credenciales
Usuario: admin
Password: admin123

# Verificar SECRET_KEY en .env
# Debe ser un string largo (64 caracteres)

# Reiniciar backend si cambiaste .env
docker compose restart backend
```

---

## 📞 ENLACES ÚTILES

### Repositorio
```
GitHub: https://github.com/jokken79/JPUNS-Claude.6.5.0
```

### Documentación
```
README principal:     README.md
Inicio rápido:        INICIO_RAPIDO_PUERTOS_NUEVOS.md
Configuración:        PUERTO_CONFIGURACION_ACTUALIZADO_v2.md
```

---

## ✨ CARACTERÍSTICAS PRINCIPALES

- ✅ **Gestión de Candidatos** - CVs japoneses con OCR
- ✅ **Gestión de Empleados** - Trabajadores de dispatch
- ✅ **Control de Asistencia** - 3 tipos de turnos
- ✅ **Cálculo de Nómina** - Automático con deducciones
- ✅ **Sistema de Temas** - 12 temas predefinidos
- ✅ **OCR Híbrido** - Azure + EasyOCR + Tesseract
- ✅ **Gestión de Apartamentos** - Vivienda de empleados
- ✅ **Dashboard Completo** - Métricas y reportes

---

## 🎯 VERSIÓN Y ESTADO

```
Versión:     6.5.0
Estado:      ✅ Producción Ready
Última Act.: 23 Noviembre 2025
Repositorio: github.com/jokken79/JPUNS-Claude.6.5.0
Docker:      9 servicios configurados
Puertos:     Sin conflictos (rango 3200+/8200+)
```

---

## 🚀 ¡LISTO PARA USAR!

Sigue los 3 pasos del inicio rápido y tendrás la aplicación funcionando en minutos.

**¿Problemas?** Consulta la sección de Troubleshooting o la documentación completa.

**¿Preguntas?** Revisa el README.md para información detallada.

---

**Generado por Claude Code** 🤖 | **JPUNS-Claude 6.5.0**
