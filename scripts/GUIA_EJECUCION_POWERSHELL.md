# 🚀 GUÍA DE EJECUCIÓN - PowerShell Ultra Edition

## 📋 Tenemos 3 Versiones

| Versión | Archivo | Visual | Requisitos | Mejor Para |
|---------|---------|--------|-----------|-----------|
| **cmd básico** | `REINSTALAR.bat` | Simple | Ninguno | Máxima compatibilidad |
| **PowerShell normal** | `REINSTALAR.ps1` | Bueno | PowerShell + Policy | Buen balance |
| **PowerShell ULTRA** | `REINSTALAR_ULTRA.ps1` | ⭐⭐⭐ Excelente | PowerShell + Policy | Mejor experiencia |

---

## 🎯 VERSIÓN ULTRA (RECOMENDADA)

Esta versión aprovecha **todo el potencial de PowerShell**:

### ✨ Características Visuales

✅ **Barras de progreso animadas** - Ves el avance en tiempo real
✅ **Tablas formateadas** - Información clara y organizada
✅ **Colores profesionales** - Verde éxito, rojo errores, amarillo warnings
✅ **Spinners/loaders** - Animaciones mientras espera
✅ **Timeline visual** - Cronología de eventos
✅ **Bordes con Unicode** - Diseño profesional con ╔═╗║╚
✅ **Progreso numerado** - PASO 1/6, 2/6, etc.
✅ **Estadísticas finales** - Resumen completo con tiempos
✅ **Múltiples símbolos Unicode** - ✓, ✗, ⚠, ▲, ⏱, etc.
✅ **Separación visual clara** - Cada fase bien delimitada

---

## 🔧 CONFIGURACIÓN (Una sola vez)

### Paso 1: Habilitar PowerShell

1. **Abre PowerShell como ADMINISTRADOR**
   - Click derecho en PowerShell → "Ejecutar como administrador"

2. **Ejecuta este comando:**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope CurrentUser -Force
   ```

3. **Confirma con "Y" y presiona ENTER**

### Paso 2: Verifica que funciona

```powershell
Get-ExecutionPolicy -Scope CurrentUser
```

Debe mostrar: `Bypass`

---

## ▶️ EJECUCIÓN (Cada vez que reinstalas)

### Opción A: Desde PowerShell (Recomendado)

1. **Abre PowerShell (sin necesidad de admin)**
2. **Navega a la carpeta del proyecto:**
   ```powershell
   cd "C:\ruta\a\tu\UNS-ClaudeJP-5.4.1"
   ```

3. **Ejecuta:**
   ```powershell
   .\scripts\REINSTALAR_ULTRA.ps1
   ```

### Opción B: Desde Windows Terminal (Aún Mejor)

1. **Descarga Windows Terminal** (gratis de Microsoft Store)
2. **Abre Windows Terminal**
3. **Navega a tu proyecto:**
   ```powershell
   cd "C:\ruta\a\tu\UNS-ClaudeJP-5.4.1"
   ```

4. **Ejecuta:**
   ```powershell
   .\scripts\REINSTALAR_ULTRA.ps1
   ```

### Opción C: Desde cmd.exe

1. **Abre cmd.exe**
2. **Navega a la carpeta scripts:**
   ```batch
   cd C:\ruta\a\tu\UNS-ClaudeJP-5.4.1\scripts
   ```

3. **Ejecuta:**
   ```batch
   PowerShell.exe -ExecutionPolicy Bypass -File "REINSTALAR_ULTRA.ps1"
   ```

---

## 🎨 Vista Previa de REINSTALAR_ULTRA.ps1

```
╔════════════════════════════════════════════════════════════════════════════╗
║  🚀  UNS-ClaudeJP 5.4 - REINSTALACIÓN COMPLETA                            ║
║  Versión: PowerShell Ultra Edition                                        ║
║  © 2025 UNS-Kikaku Corp.                                                  ║
╚════════════════════════════════════════════════════════════════════════════╝

┌─ FASE 1/3 ────────────────────────────────────────────────────────────────
│ Diagnóstico del Sistema                                                   │
└────────────────────────────────────────────────────────────────────────────

  ┌─ INFO ─────────────────────────────────────────────────────────────────
  │ Verificando requisitos de sistema...                                  │
  └────────────────────────────────────────────────────────────────────────

  Python
  ✓ python (encontrado)                               [OK]

  Docker
  ✓ Docker instalado                                  [OK]
  ✓ Docker ejecutándose                               [OK]

  Docker Compose
  ✓ docker compose (V2)                               [OK]

  Archivos del Proyecto
  ✓ docker-compose.yml                                [OK]
  ✓ generate_env.py                                   [OK]

  ▌ Progreso del Sistema [██████████████████░░░░░░░░░░░░] 33%

═══════════════════════════════════════════════════════════════════════════════
  ✓ DIAGNÓSTICO COMPLETADO EXITOSAMENTE
═══════════════════════════════════════════════════════════════════════════════

[... más fases ...]

═══════════════════════════════════════════════════════════════════════════════
  ✓✓✓ REINSTALACIÓN COMPLETADA AL 100% ✓✓✓
═══════════════════════════════════════════════════════════════════════════════

  📋 URLS DE ACCESO

  ╔═════════════════════════╦═════════════════════════╦═════════════════════════╗
  ║ Servicio              ║ URL                     ║ Estado               ║
  ║ Frontend              ║ http://localhost:3000   ║ ✓ Listo              ║
  ║ Backend API           ║ http://localhost:8000   ║ ✓ Listo              ║
  ║ API Docs              ║ http://localhost:8000/api/docs ║ ✓ Listo       ║
  ║ Base de Datos         ║ http://localhost:8080   ║ ✓ Listo              ║
  ╚═════════════════════════╩═════════════════════════╩═════════════════════════╝

  🔐 CREDENCIALES

  Usuario:       admin
  Contraseña:    admin123

  📌 PRIMEROS PASOS

  1. Abre http://localhost:3000 en tu navegador
  2. Login con admin / admin123
  3. Primera carga puede tardar 1-2 minutos
  4. Ver logs: scripts\LOGS.bat
  5. Detener: scripts\STOP.bat

  📊 ESTADÍSTICAS

  ⏱  Tiempo transcurrido: 00:08:32
  💾 Servicios iniciados: 10 (6 core + 4 observabilidad)
  📦 Tablas creadas: 24
  🔍 Índices de búsqueda: 12 (GIN/trigram)

════════════════════════════════════════════════════════════════════════════════
  ✓ TODO LISTO - Presiona ENTER para cerrar
════════════════════════════════════════════════════════════════════════════════
```

---

## 🌟 Características Especiales de ULTRA

### Barras de Progreso Animadas
```
▌ Compilando Next.js... 4/6 (~10s cada uno)
▌ Instalación [████████████████░░░░░░░░░░░░] 66%
```

### Esperadores Temporales Visuales
```
▌ Inicializando [████████░░░░░░░░░░░░] 10/20 seg
```

### Tablas de Información
```
╔═════════════════════╦═════════════════════╗
║ Servicio           ║ URL                 ║
║ Frontend           ║ http://localhost:3000 ║
╚═════════════════════╩═════════════════════╝
```

### Verificaciones Claras
```
✓ Docker instalado                      [OK]
✗ Docker ejecutándose                   [FAIL]
⚠ PostgreSQL                            [WARNING]
◌ En espera                             [PENDING]
```

### Secciones Organizadas
```
╔═════════════════════════════════════════════════════════════════╗
║ PASO 1/6: GENERACIÓN DE ARCHIVO .env                          ║
╚═════════════════════════════════════════════════════════════════╝
```

---

## 🆘 Solución de Problemas

### "No se reconoce como comando"

**Problema:** Writes `.\scripts\REINSTALAR_ULTRA.ps1` y dice "no se reconoce"

**Solución:**
1. Asegúrate de estar en el directorio correcto
2. Usa `Get-Location` para ver dónde estás
3. Sé que tengas habilitado `Set-ExecutionPolicy`

### "El acceso es denegado"

**Problema:** PowerShell dice "acceso denegado"

**Solución:**
```powershell
# PowerShell como ADMINISTRADOR:
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope CurrentUser -Force
```

### "Docker no funciona"

**Problema:** Script dice Docker no está corriendo

**Solución:**
1. Abre Docker Desktop
2. Espera a que diga "Docker is running"
3. Intenta de nuevo

### Los colores no salen bien

**Problema:** Los colores no se ven en PowerShell clásico

**Solución:**
- Usa Windows Terminal (mejor soporte de colores)
- O usa `REINSTALAR.bat` en su lugar

---

## 📊 Comparación de Versiones

### REINSTALAR.bat (cmd)
```
[FASE 1/3] Diagnóstico del Sistema

   ▶ Python................     [OK]
   ▶ Docker................     [OK]
   ▶ Docker Running........     [OK]

[OK] Diagnóstico completado
```
- ✅ Rápido
- ✅ Sin configuración
- ❌ Sin colores
- ❌ Menos visual

### REINSTALAR.ps1 (PowerShell Normal)
```
[FASE 1/3] Diagnóstico del Sistema

   ✓ Python                     [OK] ← EN VERDE
   ✓ Docker                     [OK] ← EN VERDE
   ✓ Docker Running             [OK] ← EN VERDE
```
- ✅ Colores
- ✅ Mejor legibilidad
- ⚠️ Requiere configuración
- ⚠️ Buen balance

### REINSTALAR_ULTRA.ps1 (PowerShell Ultra)
```
┌─ FASE 1/3 ───────────────────────
│ Diagnóstico del Sistema
└──────────────────────────────────

  Python
  ✓ python (encontrado)    [OK] ← VERDE

  ▌ Progreso [██████░░░░░░] 33%
```
- ✅✅✅ **Ultra visual**
- ✅ Barras de progreso animadas
- ✅ Tablas formateadas
- ✅ Múltiples símbolos Unicode
- ✅ Timeline con eventos
- ✅ Estadísticas finales
- ⚠️ Requiere configuración
- ⚠️ Ligeramente más lento

---

## 🎯 Mi Recomendación Personal

**Para máxima experiencia:**

1. **Configura una vez (5 minutos):**
   ```powershell
   # PowerShell como ADMINISTRADOR
   Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope CurrentUser -Force
   ```

2. **Descarga Windows Terminal** de Microsoft Store (gratis y moderno)

3. **Usa REINSTALAR_ULTRA.ps1:**
   ```powershell
   .\scripts\REINSTALAR_ULTRA.ps1
   ```

**Resultado:** Una experiencia profesional, visual y moderna. 🚀

---

## ✅ Checklist Rápido

- [ ] Ejecuté `Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope CurrentUser -Force` (como admin)
- [ ] Verifiqué que Docker Desktop está corriendo
- [ ] Tengo el archivo `REINSTALAR_ULTRA.ps1` en `scripts/`
- [ ] Estoy en la carpeta raíz del proyecto
- [ ] Ejecuté `.\scripts\REINSTALAR_ULTRA.ps1`
- [ ] El script comenzó a ejecutarse
- [ ] Todo completó al 100%
- [ ] Accedí a http://localhost:3000

---

## 📞 Referencia Rápida

```powershell
# Navegar al proyecto
cd "C:\tu\ruta\UNS-ClaudeJP-5.4.1"

# Ejecutar ULTRA
.\scripts\REINSTALAR_ULTRA.ps1

# Ver logs
.\scripts\LOGS.bat

# Detener servicios
.\scripts\STOP.bat

# Iniciar servicios
.\scripts\START.bat
```

---

¡Disfruta de la experiencia visual de PowerShell Ultra! 🌟
