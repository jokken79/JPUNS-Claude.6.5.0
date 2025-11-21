# 🔄 REINSTALAR - Opciones (cmd vs PowerShell)

## 📋 Resumen Rápido

Tienes **2 opciones** para reinstalar tu sistema:

| Opción | Archivo | Comando | Mejor Para |
|--------|---------|---------|-----------|
| **cmd (Recomendado)** | `REINSTALAR.bat` | `cd scripts && REINSTALAR.bat` | Máxima compatibilidad |
| **PowerShell** | `REINSTALAR.ps1` | `PowerShell.exe -ExecutionPolicy Bypass -File "scripts/REINSTALAR.ps1"` | Mejor UX + Colores |

---

## 🎯 ¿CUÁL USAR?

### ✅ Usa `REINSTALAR.bat` SI:
- Quieres **máxima compatibilidad** (siempre funciona)
- Usas cmd.exe habitualmente
- No quieres cambiar políticas de PowerShell
- Corres desde `cmd.exe` con `cd scripts && REINSTALAR.bat`

### ✅ Usa `REINSTALAR.ps1` SI:
- Quieres **mejor experiencia visual** (colores, mejor legibilidad)
- Usas PowerShell habitualmente
- Ya tienes PowerShell habilitado en tu sistema
- Prefieres scripting moderno

---

## 🚀 Cómo Usar

### Opción 1: cmd.exe (SIN Configuración)

```batch
cd scripts
REINSTALAR.bat
```

**Ventajas:**
- ✅ No requiere configuración
- ✅ Funciona en cualquier Windows 11 sin cambios
- ✅ Salida clara y directa
- ✅ Más rápido

**Desventajas:**
- ❌ Sin colores en output
- ❌ Sintaxis menos moderna

---

### Opción 2: PowerShell (Recomendado para Elegancia)

#### Primera vez (Cambiar política de ejecución):

```powershell
# Ejecuta PowerShell como ADMINISTRADOR y luego:
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope CurrentUser -Force
```

Después, ejecuta el script:

```powershell
PowerShell.exe -ExecutionPolicy Bypass -File "scripts/REINSTALAR.ps1"
```

O si estás en PowerShell:

```powershell
.\scripts\REINSTALAR.ps1
```

#### Después (Ya configurado):

```powershell
.\scripts\REINSTALAR.ps1
```

**Ventajas:**
- ✅ **Colores en output** (rojo para errores, verde para éxito)
- ✅ Mejor legibilidad
- ✅ Mejor manejo de objetos
- ✅ Más moderno y profesional
- ✅ Mejor estructurado

**Desventajas:**
- ⚠️ Necesita cambiar política de ejecución (1 vez solamente)
- ⚠️ Ligeramente más lento

---

## 🎨 Comparación Visual

### cmd.exe (REINSTALAR.bat)
```
╔══════════════════════════════════════════════════════════════════════╗
║                UNS-CLAUDEJP 5.4 - REINSTALACIÓN                   ║
╚══════════════════════════════════════════════════════════════════════╝

[FASE 1/3] Diagnóstico del Sistema

   ▶ Python................
     [OK]
   ▶ Docker................
     [OK]
   ▶ Docker Running........
     [OK]
```

### PowerShell (REINSTALAR.ps1)
```
╔══════════════════════════════════════════════════════════════════════╗
║                UNS-CLAUDEJP 5.4 - REINSTALACIÓN                   ║
╚══════════════════════════════════════════════════════════════════════╝

[FASE 1/3] Diagnóstico del Sistema

   ▶ Python                     [OK]  ← En VERDE
   ▶ Docker                     [OK]  ← En VERDE
   ▶ Docker Running             [OK]  ← En VERDE

   ✓ Diagnóstico completado ← En VERDE
```

---

## 📊 Funcionalidad

**AMBAS VERSIONES tienen 100% la misma funcionalidad:**

✅ Diagnóstico del sistema
✅ Validación de requisitos
✅ Confirmación antes de eliminar datos
✅ Generación de `.env`
✅ Limpieza de servicios Docker
✅ Reconstrucción de imágenes
✅ Iniciación de BD (PostgreSQL + Redis)
✅ Espera inteligente con counters
✅ Creación de tablas y migraciones
✅ Creación de usuario admin
✅ Sincronización de candidatos
✅ Iniciación de frontend
✅ Limpieza automática de fotos OLE

---

## 🆘 Solución de Problemas

### PowerShell dice "Ejecución de scripts deshabilitada"

**Solución:**

```powershell
# Ejecuta PowerShell como ADMINISTRADOR, luego:
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope CurrentUser -Force
```

Confirma con `Y` y presiona ENTER.

### Colores no aparecen en PowerShell

**Solución:** Usa Windows Terminal (más moderno) en lugar de PowerShell clásico.
Descárgalo gratis desde Microsoft Store.

### Script cmd.exe se cierra sin mostrar errores

**No debería pasar.** Si ocurre:
1. Verifica `docker compose --version`
2. Verifica que Docker Desktop está corriendo
3. Prueba desde PowerShell en su lugar

---

## 💡 Mi Recomendación

**Para máxima comodidad y mejor UX:**

1. **Primera configuración (una sola vez):**
   ```powershell
   # PowerShell como ADMINISTRADOR
   Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope CurrentUser -Force
   ```

2. **Después, usa PowerShell:**
   ```powershell
   .\scripts\REINSTALAR.ps1
   ```

**Beneficios:**
- ✅ Colores para feedback claro
- ✅ Mejor legibilidad
- ✅ Más profesional
- ✅ Una configuración única (rápida)

---

## 📞 Referencia Rápida

| Tarea | Comando |
|-------|---------|
| **Reinstalar (cmd)** | `cd scripts && REINSTALAR.bat` |
| **Reinstalar (PowerShell)** | `.\scripts\REINSTALAR.ps1` |
| **Ver logs** | `scripts\LOGS.bat` |
| **Detener servicios** | `scripts\STOP.bat` |
| **Iniciar servicios** | `scripts\START.bat` |

---

## ✨ Conclusión

- **Si no quieres complicaciones:** Usa `REINSTALAR.bat` (cmd.exe)
- **Si quieres lo mejor:** Usa `REINSTALAR.ps1` (PowerShell, configuración de 30 segundos)

Ambos funcionan perfectamente. Elige según tu preferencia. 🚀
