# 🚀 START HERE - UNS-ClaudeJP 6.0.0

## ⏱️ Inicio en 30 Segundos

**¿Primera vez con este proyecto? Sigue estos pasos:**

### 1️⃣ Requisitos Previos (Verificar)

```bash
# ¿Tienes Docker instalado?
docker --version
# Necesitas: Docker 20.10+

# ¿Tienes Docker Compose?
docker compose version
# Necesitas: Docker Compose 2.0+

# ¿Tienes suficiente RAM?
# Mínimo: 4GB RAM libre
# Recomendado: 8GB RAM libre
```

### 2️⃣ Configuración Rápida (2 minutos)

```bash
# 1. Clonar el repositorio (si no lo has hecho)
git clone https://github.com/jokken79/JPUNS-Claude.6.0.2.git
cd JPUNS-Claude.6.0.2

# 2. Copiar archivo de configuración
cp config/.env.example .env

# 3. Editar .env (IMPORTANTE: Cambiar credenciales)
# Windows: notepad .env
# Linux/Mac: nano .env
```

### 3️⃣ Iniciar el Sistema (1 minuto)

#### Windows
```batch
cd scripts
START.bat
```

#### Linux/macOS
```bash
docker compose up -d
```

### 4️⃣ Verificar que Funciona

```bash
# Esperar 1-2 minutos para que los servicios inicien

# Verificar estado de servicios
docker compose ps

# Ver logs
docker compose logs -f
```

### 5️⃣ Acceder a la Aplicación

Abre tu navegador en:
- **Frontend**: http://localhost:3000
- **API Docs**: http://localhost:8000/api/docs
- **Adminer** (DB): http://localhost:8080
- **Grafana**: http://localhost:3001

**Credenciales por defecto:**
```
Usuario: admin
Password: admin123
```

⚠️ **IMPORTANTE**: Cambiar credenciales antes de producción.

---

## 🎯 ¿Qué Sigue?

### Para Usuarios

1. **[Guía de Uso](docs/03-uso/)** - Cómo usar el sistema
2. **[OCR Japonés](docs/03-uso/OCR_GUIDE.md)** - Procesar documentos japoneses
3. **[Temas](docs/03-uso/THEMES_GUIDE.md)** - Personalizar la interfaz

### Para Desarrolladores

1. **[Arquitectura](docs/00-START-HERE/ARCHITECTURE.md)** - Entender el sistema
2. **[Backend Guide](backend/README.md)** - Desarrollo backend
3. **[Frontend Guide](frontend/README.md)** - Desarrollo frontend
4. **[CLAUDE.md](CLAUDE.md)** - 🔴 Reglas para IAs (LECTURA OBLIGATORIA)

### Para DevOps

1. **[Docker Guide](docs/05-devops/DOCKER_GUIDE.md)** - Docker y Docker Compose
2. **[GitHub Guide](docs/05-devops/COMO_SUBIR_A_GITHUB.md)** - Git workflow
3. **[Deployment](docs/05-devops/DEPLOYMENT.md)** - Deploy a producción

---

## 🆘 Problemas Comunes

### ❌ "Port already in use"

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <pid> /F

# Linux/macOS
lsof -ti:3000 | xargs kill -9
```

### ❌ "Cannot connect to Docker"

```bash
# Reinicia Docker Desktop (Windows/Mac)
# O reinicia el servicio Docker (Linux)
sudo systemctl restart docker
```

### ❌ Frontend pantalla en blanco

```bash
# Esperar 1-2 minutos (primera compilación)
# Si persiste, verificar logs:
docker compose logs -f frontend
```

### ❌ Error 401 al hacer login

```bash
# Verificar backend health
curl http://localhost:8000/api/health

# Ver logs de autenticación
docker compose logs -f backend | grep -i auth
```

### 📖 Más Problemas

Ver [Troubleshooting Completo](docs/04-troubleshooting/TROUBLESHOOTING.md)

---

## 📚 Documentación Completa

| Documento | Descripción |
|-----------|-------------|
| [README.md](README.md) | Documentación principal del proyecto |
| [DOCUMENTACION_COMPLETA.md](DOCUMENTACION_COMPLETA.md) | Índice maestro de toda la documentación |
| [docs/](docs/) | Directorio completo de documentación |
| [CLAUDE.md](CLAUDE.md) | Reglas para IAs (Copilot, Claude, Cursor) |

---

## 🎓 Conceptos Clave

### Stack Tecnológico

- **Frontend**: Next.js 16 + React 19 + TypeScript
- **Backend**: FastAPI + Python 3.11+ + PostgreSQL 15
- **DevOps**: Docker Compose (12 servicios)
- **OCR**: Azure CV + EasyOCR + Tesseract
- **Observabilidad**: Grafana + Prometheus + Tempo

### Arquitectura

- **Frontend**: App Router de Next.js (50+ páginas)
- **Backend**: REST API con 27+ endpoints
- **Database**: PostgreSQL con 22 tablas (arquitectura modular)
- **Cache**: Redis para sesiones y performance
- **Monitoring**: Dashboards en Grafana

### Características Principales

- Gestión de Candidatos (履歴書) con OCR japonés
- Empleados de Dispatch (派遣社員)
- Control de Asistencia (タイムカード) - 3 turnos
- Cálculo de Nómina (給与) automatizado
- Solicitudes de Empleados (申請) con workflow
- 12+ temas personalizables

---

## 🤝 Obtener Ayuda

### Scripts de Diagnóstico

```bash
# Windows
scripts\HEALTH_CHECK_FUN.bat
scripts\DIAGNOSTICO_FUN.bat

# Linux/macOS
docker compose ps
curl http://localhost:8000/api/health
```

### Recursos

- **Issues**: [GitHub Issues](https://github.com/jokken79/JPUNS-Claude.6.0.2/issues)
- **Documentación**: [docs/](docs/)
- **Troubleshooting**: [docs/04-troubleshooting/](docs/04-troubleshooting/)

---

## ✅ Checklist de Inicio

- [ ] Docker y Docker Compose instalados
- [ ] Repositorio clonado
- [ ] Archivo `.env` configurado
- [ ] Servicios iniciados (`docker compose up -d`)
- [ ] Frontend accesible (http://localhost:3000)
- [ ] Backend accesible (http://localhost:8000/api/docs)
- [ ] Login funcional (admin/admin123)

**¡Listo para empezar! 🎉**

---

<div align="center">

**¿Tienes dudas?** Lee el [README.md](README.md) completo

**¿Eres desarrollador?** Lee [CLAUDE.md](CLAUDE.md) antes de empezar

**UNS-ClaudeJP 6.0.0** - Sistema de Gestión de RRHH para Agencias de Staffing Japonesas

</div>
