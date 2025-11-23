# 🚀 INICIO RÁPIDO - NUEVOS PUERTOS

## ✅ CAMBIO COMPLETADO

Todos los puertos han sido actualizados al rango 3200+/8200+ para evitar conflicto con tu otra aplicación en puerto 3100.

---

## 📋 LO QUE TIENES QUE HACER AHORA

### 1️⃣ Actualizar .env (OBLIGATORIO)

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar con tus contraseñas
notepad .env
```

**Variables que DEBES configurar:**
```env
POSTGRES_PASSWORD=tu_password_aqui
REDIS_PASSWORD=tu_password_aqui
SECRET_KEY=generar_con_comando_abajo
GRAFANA_ADMIN_PASSWORD=tu_password_aqui
```

**Generar SECRET_KEY:**
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### 2️⃣ Actualizar backend/.env (OBLIGATORIO)

```bash
cd backend
cp .env.example .env
notepad .env
```

### 3️⃣ Reiniciar Docker

```bash
# Detener todo
docker-compose down

# Arrancar con nuevos puertos
docker-compose up -d --build
```

### 4️⃣ Verificar que funciona

```bash
# Frontend
start http://localhost:3200

# Backend API Docs
start http://localhost:8200/docs

# Grafana
start http://localhost:3201
```

---

## 🎯 NUEVAS URLs

| Servicio | URL | Credenciales |
|----------|-----|--------------|
| **Frontend** | http://localhost:3200 | admin / admin123 |
| **API Docs** | http://localhost:8200/docs | - |
| **Adminer** | http://localhost:8280 | uns_admin / tu_password |
| **Grafana** | http://localhost:3201 | admin / tu_password |
| **Prometheus** | http://localhost:9290 | - |

---

## 💾 Base de Datos

**Conectar desde herramientas externas (DBeaver, pgAdmin, etc.):**

```
Host: localhost
Port: 5632  ← NUEVO (antes era 5532)
Database: uns_claudejp
User: uns_admin
Password: [tu POSTGRES_PASSWORD de .env]
```

---

## ⚡ Comandos Útiles

```bash
# Ver estado de servicios
docker-compose ps

# Ver logs
docker-compose logs -f

# Verificar backend
curl http://localhost:8200/api/health

# Verificar frontend
curl http://localhost:3200

# Reiniciar un servicio específico
docker-compose restart frontend
docker-compose restart backend
```

---

## ⚠️ IMPORTANTE

1. **Actualiza tus marcadores** del navegador a las nuevas URLs
2. **Actualiza herramientas de DB** (DBeaver, etc.) al puerto 5632
3. **Verifica que puerto 3100** esté libre (ocupado por tu otra app)
4. **No uses los puertos antiguos** (3100, 8100, etc.)

---

## 🆘 Problemas Comunes

### Error: "Port already in use"

```bash
# Ver qué está usando el puerto
netstat -ano | findstr "3200"

# Si es otro proceso, ciérralo o usa otro puerto
```

### Frontend no carga

```bash
# Ver logs del frontend
docker-compose logs frontend

# Reiniciar frontend
docker-compose restart frontend
```

### No puedo conectar a la base de datos

```bash
# Verificar que PostgreSQL está corriendo
docker-compose ps db

# Verificar puerto correcto (5632, NO 5532)
psql -h localhost -p 5632 -U uns_admin -d uns_claudejp
```

---

## 📚 Documentación Completa

Para más detalles, consulta:
- `PORT_MIGRATION_COMPLETE_v2.md` (English)
- `PUERTO_CONFIGURACION_ACTUALIZADO_v2.md` (Español)
- `PORT_CONFIGURATION_6.5.0.md` (Guía de puertos)
- `README.md` (Documentación principal)

---

**¡Listo! Con estos pasos tu aplicación estará funcionando en los nuevos puertos.** 🎉
