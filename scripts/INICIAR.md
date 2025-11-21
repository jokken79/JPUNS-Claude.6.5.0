# Como Iniciar UNS-ClaudeJP 5.4

## Opcion 1: Automatica (RECOMENDADO)

Simplemente ejecuta:

```bash
scripts\REINSTALAR.bat
```

**Que hace:**
1. Verifica que Python, Docker y Docker Compose esten instalados
2. Si Docker Desktop no esta corriendo, lo inicia automaticamente
3. Espera a que Docker este completamente operativo
4. Realiza la reinstalacion completa del sistema

**Tiempo estimado:** 15-20 minutos (depende de tu internet)

---

## Opcion 2: Manual

Si prefieres iniciar Docker Desktop manualmente:

```bash
# 1. Abre Docker Desktop desde el menu de inicio de Windows
# 2. Espera a que termine de iniciar (revisa la bandeja de tareas)
# 3. Luego ejecuta:
scripts\REINSTALAR.bat
```

---

## Si Algo Falla

### Docker Desktop no esta instalado
- Descarga desde: https://www.docker.com/products/docker-desktop
- Instala con todas las opciones por defecto
- Reinicia Windows
- Ejecuta nuevamente: `scripts\REINSTALAR.bat`

### Se queda en "Esperando..." demasiado tiempo
- Abre Docker Desktop manualmente desde el menu de inicio
- Revisa que en la bandeja de tareas (abajo a la derecha) aparezca el logo de Docker
- Si no aparece, Docker no esta iniciado correctamente
- Intenta reiniciar Windows

### El script se cierra antes de terminar
- Revisa el ultimo mensaje de error
- Es probable que falte permisos de administrador
- Ejecuta CMD como administrador:
  1. Click derecho en CMD
  2. Selecciona "Ejecutar como administrador"
  3. Escribe: `cd D:\UNS-ClaudeJP-5.4.1` (ajusta la ruta si es diferente)
  4. Ejecuta: `scripts\REINSTALAR.bat`

---

## Despues de la Instalacion

Una vez completada, accede a:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/api/docs
- **Database UI:** http://localhost:8080

**Credenciales:**
- Usuario: `admin`
- Password: `admin123`

---

## Comandos Utiles Despues

```bash
# Ver logs en tiempo real
scripts\LOGS.bat

# Detener servicios
scripts\STOP.bat

# Volver a iniciar
scripts\START.bat

# Respaldar base de datos
scripts\BACKUP_DATOS.bat

# Restaurar base de datos
scripts\RESTAURAR_DATOS.bat
```

---

## Problemas Comunes

**El frontend se queda en blanco:**
- Es normal en la primera carga (1-2 minutos)
- Espera a que compile Next.js
- Si sigue en blanco despues de 5 minutos, revisa: `docker compose logs frontend`

**Los puertos estan en uso:**
- Algo mas esta usando los puertos 3000, 8000, 5432, etc.
- Para Windows:
  ```bash
  netstat -ano | findstr :3000
  taskkill /PID <PID> /F
  ```
- Luego vuelve a ejecutar: `scripts\REINSTALAR.bat`

**PostgreSQL no inicia:**
- Es probable que esten corruptos los volumenes de Docker
- Ejecuta: `docker volume prune` (elimina volumenes sin usar)
- Luego: `scripts\REINSTALAR.bat`

---

## Soporte

Si tienes problemas:
1. Revisa los logs: `scripts\LOGS.bat`
2. Verifica que todos los servicios esten corriendo: `docker compose ps`
3. Intenta reiniciar Docker Desktop completamente

