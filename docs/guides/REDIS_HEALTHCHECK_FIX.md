# Fix: Redis Healthcheck Error

## Error

```
✘ Container uns-claudejp-redis          Error
dependency failed to start: container uns-claudejp-redis is unhealthy
```

## Causa

El healthcheck de Redis estaba intentando ejecutar:
```
redis-cli --raw incr ping
```

Pero Redis estaba configurado con contraseña (`--requirepass ${REDIS_PASSWORD}`), por lo que el comando fallaba porque no pasaba la contraseña.

## Solución

### Cambio en docker-compose.yml

**ANTES (línea 76):**
```yaml
test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
```

**DESPUÉS (línea 76):**
```yaml
test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "--raw", "incr", "ping"]
```

Se agregó: `-a "${REDIS_PASSWORD}"` para pasar la contraseña al healthcheck.

---

## Cómo Arreglarlo

### Opción 1: Limpiar y Reintentar (RECOMENDADO)

```bash
scripts\FIX_REDIS_HEALTHCHECK.bat
```

Luego:
```bash
scripts\REINSTALAR.bat
```

### Opción 2: Manual

```bash
# Detener todo
docker compose down -v

# Limpiar volumenes de Redis
docker volume rm uns-claudejp-5.4.1_redis_data

# Limpiar containers
docker container prune -f

# Reintentar
scripts\REINSTALAR.bat
```

---

## Verificación

Después de arreglar, deberías ver:

```
✔ Container uns-claudejp-redis          Healthy                              3.0s
```

En lugar de:

```
✘ Container uns-claudejp-redis          Error
```

---

## Detalles Técnicos

El problema ocurría porque:

1. Redis estaba iniciando con contraseña: `--requirepass ${REDIS_PASSWORD}`
2. El healthcheck intentaba conectar sin contraseña
3. Redis rechazaba la conexión
4. El healthcheck fallaba
5. El contenedor se marcaba como "unhealthy"
6. Docker Compose detenía el inicio de otros servicios

La solución fue agregar `-a ${REDIS_PASSWORD}` al comando del healthcheck para que pasara la contraseña correctamente.

---

## Estado Actual

✅ **FIXED** en `docker-compose.yml` (línea 76)

El archivo ya está actualizado. Solo necesitas:

1. Ejecutar `scripts\FIX_REDIS_HEALTHCHECK.bat` (para limpiar)
2. Ejecutar `scripts\REINSTALAR.bat` (para reintentar)

---

**Última actualización:** 2025-11-13
**Versión:** UNS-ClaudeJP 5.4.1
