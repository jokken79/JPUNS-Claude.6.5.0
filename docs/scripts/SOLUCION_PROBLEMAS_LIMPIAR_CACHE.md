# Solución de Problemas - LIMPIAR_CACHE.bat

## Problemas Comunes y Soluciones

### 1. Permisos de Administrador
**Problema:** El script falla al intentar eliminar archivos o ejecutar comandos de Docker.

**Solución:**
- Clic derecho en el archivo `.bat` → "Ejecutar como administrador"
- O abrir CMD como administrador y navegar al script

### 2. Docker No Instalado o No en Ejecución
**Problema:** Error en los comandos `docker builder prune` y `docker image prune`.

**Soluciones:**
- **Instalar Docker:** Descargar desde https://www.docker.com/products/docker-desktop/
- **Iniciar Docker:** Asegurarse que Docker Desktop esté en ejecución
- **Usar versión sin Docker:** Ejecutar `LIMPIAR_CACHE_SIN_DOCKER.bat`

### 3. Rutas Incorrectas
**Problema:** El script no encuentra los directorios `backend` o `frontend-nextjs`.

**Solución:**
- Asegurarse que el script está en la carpeta `scripts/` del proyecto
- Verificar la estructura de directorios:
  ```
  proyecto/
  ├── scripts/
  │   └── LIMPIAR_CACHE.bat
  ├── backend/
  └── frontend-nextjs/
  ```

### 4. Antivirus Bloqueando Script
**Problema:** El antivirus detecta el script como amenaza y lo bloquea.

**Solución:**
- Agregar excepción en el antivirus para la carpeta del proyecto
- Desactivar temporalmente el antivirus (con precaución)

### 5. Problemas de Codificación (Caracteres Especiales)
**Problema:** Se ven caracteres extraños en la consola.

**Solución:**
- El script ya incluye `chcp 65001` para UTF-8
- Si persiste, ejecutar en PowerShell en lugar de CMD

## Scripts Alternativos Disponibles

### LIMPIAR_CACHE_MEJORADO.bat
- ✅ Manejo mejorado de errores
- ✅ Verificación de permisos de administrador
- ✅ Verificación de Docker instalado y en ejecución
- ✅ Más información detallada durante la ejecución

### LIMPIAR_CACHE_SIN_DOCKER.bat
- ✅ No requiere Docker
- ✅ Limpia cache local (Python, Next.js, npm)
- ✅ Ideal si Docker no está instalado
- ✅ Más rápido y menos propenso a errores

## Pasos de Diagnóstico

1. **Verificar estructura del proyecto:**
   ```cmd
   dir /b
   dir backend
   dir frontend-nextjs
   ```

2. **Verificar Docker:**
   ```cmd
   docker --version
   docker info
   ```

3. **Verificar permisos:**
   ```cmd
   net session
   ```

4. **Probar con scripts alternativos:**
   - Primero intentar `LIMPIAR_CACHE_SIN_DOCKER.bat`
   - Si funciona, el problema es Docker
   - Si no funciona, es un problema de permisos o rutas

## Comandos Manuales (Si los scripts no funcionan)

### Limpiar cache de Python manualmente:
```cmd
cd backend
for /d /r . %%d in (__pycache__) do @if exist "%%d" rd /s /q "%%d"
del /s /q *.pyc
```

### Limpiar cache de Next.js manualmente:
```cmd
cd frontend-nextjs
if exist .next rd /s /q .next
if exist out rd /s /q out
if exist node_modules\.cache rd /s /q node_modules\.cache
```

### Limpiar Docker manualmente:
```cmd
docker builder prune -af
docker image prune -f
docker system prune -a
```

## Recomendaciones

1. **Ejecutar como administrador** siempre que sea posible
2. **Cerrar aplicaciones** que puedan estar usando los archivos (VS Code, navegadores, etc.)
3. **Hacer backup** antes de ejecutar limpiezas agresivas
4. **Usar la versión mejorada** (`LIMPIAR_CACHE_MEJORADO.bat`) para mejor diagnóstico
5. **Documentar cualquier error** específico que aparezca para futuras referencias

## Si nada funciona

Si todos los scripts fallan, el problema puede ser:
- Configuración del sistema Windows
- Políticas de ejecución de scripts
- Problemas de permisos a nivel de sistema

En este caso, contactar al administrador del sistema o considerar ejecutar los comandos manualmente uno por uno para identificar el punto exacto de fallo.