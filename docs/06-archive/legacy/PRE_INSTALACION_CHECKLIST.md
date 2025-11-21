# 📋 Checklist de Pre-Instalación - UNS-ClaudeJP 5.4.1

**Propósito:** Verificar que el sistema esté listo antes de iniciar instalación/reinstalación
**Tiempo:** 5-10 minutos
**Criticidad:** 🔴 CRÍTICO - Completar ANTES de instalar

---

## 🎯 Objetivo

Evitar problemas comunes durante la instalación verificando requisitos y configuración ANTES de ejecutar `REINSTALAR.bat` o `START.bat`.

---

## 💻 Requisitos del Sistema

### Windows

- [ ] **OS:** Windows 10 (64-bit) o Windows 11
- [ ] **RAM:** Mínimo 8GB, Recomendado 16GB
- [ ] **Disco:** Mínimo 20GB libres
- [ ] **CPU:** 4 cores o más recomendado

**Verificar:**
```powershell
# RAM
Get-CimInstance Win32_PhysicalMemory | Measure-Object -Property capacity -Sum | Select-Object @{N="TotalGB";E={[math]::round($_.sum / 1GB,2)}}

# Disco libre
Get-PSDrive C | Select-Object Used,Free,@{N="FreeGB";E={[math]::round($_.Free / 1GB,2)}}

# CPU cores
(Get-WmiObject Win32_Processor).NumberOfCores
```

---

## 🐳 Docker Desktop

### Instalación

- [ ] **Docker Desktop instalado**
  - Descargar: https://www.docker.com/products/docker-desktop
  - Versión mínima: 4.x

- [ ] **WSL 2 habilitado** (Windows)
  ```powershell
  wsl --list --verbose
  # Debe mostrar versión 2
  ```

- [ ] **Docker Desktop corriendo**
  ```bash
  docker --version
  # Esperado: Docker version 20.x o superior

  docker compose version
  # Esperado: Docker Compose version v2.x o superior
  ```

### Configuración de Docker

- [ ] **Recursos asignados:**
  - Abrir Docker Desktop → Settings → Resources
  - CPUs: Mínimo 2, Recomendado 4
  - Memory: Mínimo 4GB, Recomendado 8GB
  - Disk: Mínimo 20GB

- [ ] **Modo WSL 2 habilitado** (Windows)
  - Docker Desktop → Settings → General
  - ✅ "Use the WSL 2 based engine"

- [ ] **File Sharing configurado** (si aplica)
  - Docker Desktop → Settings → Resources → File Sharing
  - Agregar: `D:\UNS-ClaudeJP-5.4.1` (o ruta del proyecto)

---

## 📂 Estructura de Archivos

### Archivos Esenciales

Verificar que existan:

```bash
# Navegar a carpeta del proyecto
cd D:\UNS-ClaudeJP-5.4.1  # O tu ruta

# Verificar archivos críticos
ls -la .env                      # ✓ Debe existir
ls -la docker-compose.yml         # ✓ Debe existir
ls -la backend/                   # ✓ Debe existir
ls -la frontend/                  # ✓ Debe existir
ls -la scripts/START.bat          # ✓ Debe existir
ls -la scripts/REINSTALAR.bat     # ✓ Debe existir
ls -la config/employee_master.xlsm  # ✓ Debe existir
```

**Checklist:**
- [ ] `.env` existe y tiene contenido
- [ ] `docker-compose.yml` existe
- [ ] Carpeta `backend/` existe con código
- [ ] Carpeta `frontend/` existe con código
- [ ] Carpeta `scripts/` con archivos .bat
- [ ] `config/employee_master.xlsm` existe

---

### Archivo .env

**Verificar variables críticas:**

```bash
cat .env | grep -E "POSTGRES|SECRET|FRONTEND"
```

**Debe contener mínimo:**
```env
# Base de datos
POSTGRES_DB=uns_claudejp
POSTGRES_USER=uns_admin
POSTGRES_PASSWORD=uns_password123

# Backend
SECRET_KEY=[algún_valor_largo]
ALGORITHM=HS256
FRONTEND_URL=http://localhost:3000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Checklist .env:**
- [ ] `POSTGRES_DB` definido
- [ ] `POSTGRES_USER` definido
- [ ] `POSTGRES_PASSWORD` definido
- [ ] `SECRET_KEY` definido (largo)
- [ ] `FRONTEND_URL` definido
- [ ] `NEXT_PUBLIC_API_URL` definido

**❌ Si .env NO existe:**
```bash
# Generar .env desde Python
python generate_env.py

# O copiar desde template
cp .env.example .env
```

---

## 🔧 Herramientas Adicionales

### Python (Para scripts locales)

- [ ] **Python 3.11+ instalado** (opcional, solo si ejecutas scripts localmente)
  ```bash
  python --version
  # Esperado: Python 3.11.x o superior
  ```

### Git (Para control de versiones)

- [ ] **Git instalado**
  ```bash
  git --version
  # Esperado: git version 2.x o superior
  ```

- [ ] **Repositorio clonado/actualizado**
  ```bash
  git status
  # Debe mostrar rama y estado
  ```

---

## 🌐 Red y Puertos

### Puertos Disponibles

Verificar que estos puertos estén LIBRES:

- [ ] **3000** (Frontend)
- [ ] **8000** (Backend)
- [ ] **5432** (PostgreSQL)
- [ ] **6379** (Redis)
- [ ] **8080** (Adminer)
- [ ] **3001** (Grafana)
- [ ] **9090** (Prometheus)

**Verificar puertos ocupados:**

```powershell
# Windows PowerShell
netstat -ano | findstr ":3000"
netstat -ano | findstr ":8000"
netstat -ano | findstr ":5432"

# Si alguno está ocupado, matar proceso:
taskkill /PID [PID] /F
```

```bash
# Linux/Mac
lsof -i :3000
lsof -i :8000
lsof -i :5432

# Matar proceso si está ocupado:
kill -9 [PID]
```

---

### Conexión a Internet

- [ ] **Conexión estable a Internet**
  - Necesario para descargar imágenes Docker en primera instalación
  - Después de instalación, puede funcionar offline

**Verificar:**
```bash
ping -n 4 google.com
# Debe responder sin pérdida de paquetes
```

---

## 📊 Espacio en Disco

### Verificar Espacio Libre

```powershell
# Windows
Get-PSDrive D | Select-Object @{N="FreeGB";E={[math]::round($_.Free / 1GB,2)}}

# Debe mostrar > 20GB libres
```

```bash
# Linux/Mac
df -h /
# Debe mostrar > 20GB available
```

**Estimación de espacio necesario:**
- **Imágenes Docker:** ~5-7GB
- **Volúmenes (datos):** ~2-3GB
- **Código fuente:** ~500MB
- **Logs:** ~200MB
- **Total:** ~10GB mínimo, 20GB recomendado

---

## 🔐 Permisos

### Windows

- [ ] **Ejecutar como Administrador** (solo para primera instalación)
  - Click derecho en PowerShell/CMD → "Ejecutar como administrador"

- [ ] **Permisos de escritura en carpeta del proyecto**
  ```powershell
  # Verificar permisos
  icacls D:\UNS-ClaudeJP-5.4.1
  # Debe mostrar tu usuario con permisos (F) o (M)
  ```

### Antivirus

- [ ] **Excluir carpeta del proyecto del antivirus**
  - Agregar excepción para: `D:\UNS-ClaudeJP-5.4.1`
  - Previene bloqueos de Docker y scripts

---

## 📦 Datos Opcionales

### Excel de Empleados

- [ ] **`config/employee_master.xlsm` existe**
  - Contiene datos de empleados
  - Incluye columna ｱﾊﾟｰﾄ (apartamento)
  - 449 apartamentos únicos

**Verificar:**
```bash
ls -lh config/employee_master.xlsm
# Debe mostrar tamaño > 800KB
```

### Base de Datos de Fotos (Opcional)

Si tienes fotos de empleados en Access:

- [ ] **DATABASEJP.accdb disponible**
  - Ubicación esperada: `BASEDATEJP/` o `base-datos/`
  - Contiene fotos OLE de empleados

- [ ] **Microsoft Access Database Engine instalado** (para extracción)
  - Descargar: https://www.microsoft.com/en-us/download/details.aspx?id=54920
  - Solo necesario si vas a extraer fotos

---

## 🚀 Preparación Final

### Limpiar Instalación Anterior (Si existe)

Si ya instalaste el sistema anteriormente:

```bash
# Detener servicios
cd scripts
STOP.bat

# Limpiar volúmenes (⚠️ ELIMINA DATOS)
docker compose down -v

# Limpiar imágenes antiguas (opcional)
docker system prune -a --volumes

# Verificar limpieza
docker ps -a
# Debe estar vacío

docker volume ls
# Debe estar vacío o sin volúmenes de uns-claudejp
```

**⚠️ ADVERTENCIA:** `docker compose down -v` ELIMINA TODOS LOS DATOS de la base de datos.

- [ ] **Backup de datos creado** (si tienes datos importantes)
  ```bash
  cd scripts
  BACKUP_DATOS_FUN.bat
  ```

---

### Variables de Entorno del Sistema

Verificar variables de entorno importantes:

```powershell
# Windows
echo $env:PATH
# Debe incluir Docker, Python, Git

echo $env:DOCKER_HOST
# Debe estar vacío o apuntar a Docker Desktop
```

---

## ✅ Checklist Final

**Antes de ejecutar `REINSTALAR.bat` o `START.bat`, verifica:**

### Requisitos Críticos (Obligatorios)
- [ ] Docker Desktop instalado y corriendo
- [ ] WSL 2 habilitado (Windows)
- [ ] Mínimo 8GB RAM disponible
- [ ] Mínimo 20GB disco libre
- [ ] Puertos 3000, 8000, 5432 libres
- [ ] Archivo `.env` existe y está configurado
- [ ] `docker-compose.yml` existe
- [ ] Carpetas `backend/` y `frontend/` existen
- [ ] `config/employee_master.xlsm` existe

### Requisitos Recomendados
- [ ] Conexión a Internet estable
- [ ] Antivirus excluye carpeta del proyecto
- [ ] Backup de datos anterior creado (si aplica)
- [ ] Git instalado y configurado
- [ ] Permisos de administrador (primera vez)

### Verificación de Archivos Clave
- [ ] `scripts/START.bat` existe
- [ ] `scripts/STOP.bat` existe
- [ ] `scripts/REINSTALAR.bat` existe
- [ ] `scripts/VALIDAR_SISTEMA.bat` existe
- [ ] `backend/scripts/create_apartments_from_employees.py` existe
- [ ] `docker-compose.yml` tiene Step 3 (apartamentos)

---

## 🎯 Siguiente Paso

**Si TODOS los checks están en ✅:**

```bash
# Opción 1: Instalación limpia completa
cd scripts
REINSTALAR.bat

# Opción 2: Inicio normal (si ya instalaste antes)
cd scripts
START.bat

# Opción 3: Validar sistema existente
cd scripts
VALIDAR_SISTEMA.bat
```

**Si algún check está en ❌:**
- Completar requisito faltante
- Volver a verificar
- No continuar hasta que TODO esté en ✅

---

## 📞 Problemas Comunes

### Docker Desktop no inicia

**Solución:**
1. Reiniciar PC
2. Verificar Hyper-V habilitado (Windows)
3. Verificar WSL 2 instalado
4. Reinstalar Docker Desktop

### Puerto ocupado

**Solución:**
```powershell
# Encontrar proceso
netstat -ano | findstr :[puerto]

# Matar proceso
taskkill /PID [PID] /F
```

### .env falta

**Solución:**
```bash
# Generar automáticamente
python generate_env.py

# O copiar template
cp .env.example .env
# Luego editar valores manualmente
```

---

## 📚 Documentación Relacionada

- **Instalación:** `CHECKLIST_REINSTALACION.md`
- **Guía general:** `CLAUDE.md`
- **Scripts:** `docs/scripts/SCRIPTS_REFERENCE.md`
- **Apartamentos V2:** `docs/features/housing/APARTAMENTOS_V2_FLUJO_COMPLETO.md`
- **Verificación:** `docs/VERIFICACION_APARTAMENTOS_V2.md`

---

**Última actualización:** 2025-11-11
**Versión:** 1.0
**Sistema:** UNS-ClaudeJP 5.4.1

**¡Asegúrate de completar este checklist ANTES de instalar!** 🚀
