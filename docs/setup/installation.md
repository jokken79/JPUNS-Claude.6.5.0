# 🚀 Instalación en Nueva PC - UNS-ClaudeJP 6.0.0

Esta guía te permitirá instalar la aplicación en cualquier PC con Windows que tenga Docker Desktop.

## 📋 Requisitos Previos

1. **Docker Desktop** instalado y funcionando
2. **Git** instalado
3. **Windows 10/11** con PowerShell

## 🔽 Paso 1: Clonar el Repositorio

Abre PowerShell o CMD y ejecuta:

```bash
# Opción 1: Clonar en una carpeta específica
cd D:\
git clone https://github.com/jokken79/UNS-ClaudeJP-6.0.0.git

# Opción 2: Clonar en la ubicación actual
git clone https://github.com/jokken79/UNS-ClaudeJP-6.0.0.git
cd UNS-ClaudeJP-6.0.0
```

## ⚙️ Paso 2: Iniciar la Aplicación

**Es MUY SIMPLE, solo ejecuta:**

```bash
cd scripts
START.bat
```

Eso es todo! El script `START.bat` hará automáticamente:

1. ✅ Generar archivos `.env` con configuración por defecto
2. ✅ Construir las imágenes Docker (backend + frontend)
3. ✅ Crear la base de datos PostgreSQL
4. ✅ Ejecutar todas las migraciones
5. ✅ Crear el usuario admin (admin / admin123)
6. ✅ Iniciar todos los servicios

## ⏱️ Tiempo de Instalación

- **Primera vez**: 5-10 minutos (descarga de imágenes Docker + build)
- **Siguientes veces**: 30 segundos

## 🌐 Acceso a la Aplicación

Una vez que `START.bat` termine:

- **Frontend**: http://localhost:3000
- **Login**: `admin` / `admin123`
- **API Docs**: http://localhost:8000/api/docs
- **Adminer (DB)**: http://localhost:8080

## 🔍 Verificar que Todo Funciona

Ejecuta el script de verificación:

```bash
cd scripts
CHECK_HEALTH.bat
```

Esto te mostrará el estado de todos los servicios.

## 🛠️ Scripts Útiles

Todos en la carpeta `scripts/`:

- **START.bat** - Inicia la aplicación
- **STOP.bat** - Detiene todos los servicios
- **LOGS.bat** - Ver logs en tiempo real
- **CHECK_HEALTH.bat** - Verificar estado del sistema
- **BACKUP_DATOS.bat** - Crear backup de la base de datos
- **RESTAURAR_DATOS.bat** - Restaurar backup

## 🚨 Solución de Problemas

### Error: "Puerto ya en uso"

Si ves errores de puertos ocupados (3000, 8000, 5432):

```bash
# Detener todo
cd scripts
STOP.bat

# Esperar 10 segundos

# Reiniciar
START.bat
```

### Error: "Docker no está corriendo"

1. Abre Docker Desktop
2. Espera a que inicie completamente
3. Ejecuta `START.bat` nuevamente

### Ver logs de un servicio específico

```bash
# Ver logs del backend
docker compose logs backend -f

# Ver logs del frontend
docker compose logs frontend -f
```

## 📦 Servicios Docker

Esta aplicación usa nombres únicos con prefijo `uns-claudejp-600` para evitar conflictos:

**Contenedores:**
- `uns-claudejp-600-db` - Base de datos PostgreSQL
- `uns-claudejp-600-redis` - Cache Redis
- `uns-claudejp-600-backend-1` - API FastAPI
- `uns-claudejp-600-frontend` - Aplicación Next.js
- `uns-claudejp-600-adminer` - Admin DB
- Otros servicios de observabilidad...

**Volúmenes:**
- `uns_claudejp_600_postgres_data` - Datos de PostgreSQL
- `uns_claudejp_600_redis_data` - Datos de Redis
- etc.

## 🔄 Actualizar a la Última Versión

```bash
cd d:\UNS-ClaudeJP-6.0.0
git pull origin main
cd scripts
STOP.bat
START.bat
```

## 📝 Notas Importantes

1. **Todos los errores están corregidos** - La aplicación instalará limpiamente
2. **Nombres únicos** - No habrá conflictos con otras apps Docker
3. **Configuración automática** - No necesitas editar archivos .env manualmente
4. **Usuario admin** - Se crea automáticamente: `admin` / `admin123`

## 🎯 ¿Problemas?

Si algo no funciona:

1. Ejecuta `CHECK_HEALTH.bat` para diagnóstico
2. Revisa los logs: `LOGS.bat`
3. Si es necesario, reinstala: `STOP.bat` → elimina volúmenes → `START.bat`

## ✅ Resumen

**En tu nueva PC solo necesitas:**

```bash
git clone https://github.com/jokken79/UNS-ClaudeJP-6.0.0.git
cd UNS-ClaudeJP-6.0.0\scripts
START.bat
```

**¡Y listo! La aplicación estará funcionando en http://localhost:3000** 🚀

---

**Versión:** 6.0.0
**Última actualización:** 2025-11-16
**GitHub:** https://github.com/jokken79/UNS-ClaudeJP-6.0.0
