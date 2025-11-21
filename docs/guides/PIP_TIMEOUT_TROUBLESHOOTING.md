# Solución de Problemas: pip ReadTimeoutError en Docker Build

## Error Común

```
pip._vendor.urllib3.exceptions.ReadTimeoutError:
HTTPSConnectionPool(host='files.pythonhosted.org', port=443): Read timed out.
```

Este error ocurre cuando pip tarda demasiado en descargar paquetes desde PyPI.

---

## ✅ Soluciones Implementadas (v5.4)

El Dockerfile.backend ha sido actualizado con:

```dockerfile
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install \
      --default-timeout=1000 \
      --retries=5 \
      --no-cache-dir \
      -r requirements.txt
```

**Parámetros:**
- `--default-timeout=1000` - Aumenta timeout a 1000 segundos (16 minutos)
- `--retries=5` - Reintenta automáticamente hasta 5 veces
- `--no-cache-dir` - Ahorra espacio en la imagen Docker

---

## 🔧 Cómo Probar

### Opción 1: Ejecuta REINSTALAR.bat nuevamente
```bash
scripts\REINSTALAR.bat
```

El DOCKER_BUILDKIT=1 ya está configurado automáticamente.

### Opción 2: Build manual con diagnóstico
```bash
# Ejecuta el diagnóstico primero
scripts\DIAGNOSTICO_PIP.bat

# Luego intenta el build
set DOCKER_BUILDKIT=1
docker compose build --no-cache
```

---

## 🚨 Si Aún Falla

### Causa 1: Conexión lenta a PyPI

**Síntoma:** El build tarda >5 minutos en la fase de pip install

**Solución A - Aumenta timeout aún más:**
```bash
set DOCKER_BUILDKIT=1
docker compose build --build-arg PIP_TIMEOUT=2000
```

**Solución B - Usa un mirror de PyPI:**
```bash
# Opción 1: Aliyun (rápido en Asia)
docker run -it uns-claudejp-backend pip config set global.index-url https://mirrors.aliyun.com/pypi/simple/

# Opción 2: Tsinghua (rápido en China)
pip config set global.index-url https://pypi.tsinghua.edu.cn/simple

# Opción 3: Official PyPI (fallback)
pip config set global.index-url https://pypi.org/simple/
```

### Causa 2: Espacio en disco insuficiente

**Síntoma:** Error de espacio durante la descarga de paquetes

**Solución:**
```bash
# Verifica espacio libre
dir C:\  (en Windows, busca espacio libre)

# Necesitas mínimo 10GB libres

# Limpia Docker
docker volume prune
docker system prune
docker builder prune
```

### Causa 3: Docker cache corrupto

**Síntoma:** El build falla en diferentes paquetes cada vez

**Solución:**
```bash
# Limpia todo
docker system prune -a

# Reconstruye sin cache
set DOCKER_BUILDKIT=1
docker compose build --no-cache
```

### Causa 4: Problemas de red

**Síntoma:** Conectividad intermitente con PyPI

**Solución:**
```bash
# Verifica conectividad
ping files.pythonhosted.org

# Reinicia Docker Desktop:
# 1. Cierra Docker Desktop
# 2. Espera 30 segundos
# 3. Abre Docker Desktop nuevamente
# 4. Intenta nuevamente: scripts\REINSTALAR.bat
```

---

## 📊 Información de Diagnóstico

La herramienta `scripts\DIAGNOSTICO_PIP.bat` verifica:

- ✅ Python instalado
- ✅ Docker funcionando
- ✅ Docker Compose disponible
- ✅ Conectividad a PyPI
- ✅ Espacio en disco

**Ejecuta antes de troubleshooting:**
```bash
scripts\DIAGNOSTICO_PIP.bat
```

---

## 🎯 Dependencias Grandes

Si el build es especialmente lento, es porque estamos instalando:

| Paquete | Tamaño | Razón |
|---------|--------|-------|
| opencv-python-headless | ~100MB | Procesamiento de imágenes |
| mediapipe | ~80MB | Detección de caras |
| easyocr | ~150MB | OCR multiidioma |
| azure-cognitiveservices | ~50MB | Azure Vision API |
| pytesseract + tesseract-ocr-jpn | ~100MB | OCR japonés |

**Total:** ~600MB de dependencias

Esto es normal para una aplicación de OCR y procesamiento de imágenes.

---

## ✨ Optimizaciones Futuras

Si quieres mejorar el tiempo de build:

### Opción 1: Multi-stage build
```dockerfile
FROM python:3.11-slim as builder
RUN pip install --user -r requirements.txt

FROM python:3.11-slim
COPY --from=builder /root/.local /root/.local
```

### Opción 2: Pre-built images
Construir una imagen base con todas las dependencias y reutilizarla.

### Opción 3: Compresión de paquetes
Algunos paquetes como opencv-python pueden reemplazarse con opencv-python-headless (ya lo hacemos).

---

## 📞 Soporte

Si el problema persiste:

1. Ejecuta `scripts\DIAGNOSTICO_PIP.bat` y guarda la salida
2. Revisa los logs: `docker compose logs backend`
3. Verifica tu conexión a internet
4. Intenta en otra hora si el servidor de PyPI está congestionado

---

**Última actualización:** 2025-11-13
**Versión:** UNS-ClaudeJP 5.4.1
