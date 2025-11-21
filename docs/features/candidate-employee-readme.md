# DOCUMENTACIÓN: Relación Candidatos ↔ Empleados

## Análisis Exhaustivo de la Relación entre Candidatos (履歴書) y Empleados (派遣社員)

Este conjunto de documentación proporciona una vista completa, técnica y visual de cómo los candidatos y empleados se relacionan en el sistema UNS-ClaudeJP 6.0.0.

---

## DOCUMENTOS DISPONIBLES

### 1. **CANDIDATE_EMPLOYEE_QUICK_REFERENCE.md** ⭐ COMIENZA AQUÍ
**Tamaño:** 12 KB | **Líneas:** 359  
**Descripción:** Referencia rápida en una página con lo más importante

**Contenido:**
- Tabla resumen de toda la relación
- Campos más importantes
- Flujo mínimo paso a paso
- Endpoints críticos
- Errores comunes a evitar
- Términos clave

**Perfecto para:** Entender rápidamente la relación sin detalles técnicos profundos

---

### 2. **CANDIDATE_EMPLOYEE_ANALYSIS.md** ⭐ DOCUMENTACIÓN PRINCIPAL
**Tamaño:** 18 KB | **Líneas:** 586  
**Descripción:** Análisis técnico y exhaustivo de toda la relación

**Contenido:**
1. **Estructura de Modelos de Base de Datos**
   - Tabla `candidates` (campos clave)
   - Tabla `employees` (campos clave)
   - Tabla `contract_workers` y `staff`

2. **Sincronización de Fotos**
   - Flujo de candidato → empleado
   - Compresión automática (800x1000px, quality 85)
   - Formato data URL (base64)

3. **Scripts de Importación y Sincronización**
   - `sync_candidate_employee_status.py`
   - `unified_photo_import.py`
   - Importación de fotos desde Access/Excel

4. **Endpoints API**
   - POST /candidates/rirekisho/form
   - POST /candidates/{id}/evaluate
   - POST /employees/
   - Detalles de cada endpoint

5. **Flujo de Aprobación y Contratación**
   - Workflow visual: pending → approved → hired
   - Estados posibles

6. **Almacenamiento de Fotos**
   - Campos de foto en BD
   - Formato de data URL
   - Tamaños (original, comprimido, almacenado)

7. **Servicio de Fotos**
   - Compresión automática
   - Validación de tamaño
   - Información de foto

8. **Frontend**
   - Cómo se manejan las fotos en candidatos
   - Cómo se manejan las fotos en empleados

9. **Campo de Aprobación**
   - Status candidato
   - approved_by, approved_at

10. **Sincronización Automática**
    - Cuándo se sincroniza qué
    - Qué NO se sincroniza

11. **Flujos de Datos**
    - Flujo de foto (upload)
    - Flujo de estado (status)
    - Flujo de documentos

**Perfecto para:** Entender en profundidad toda la implementación técnica

---

### 3. **CANDIDATE_EMPLOYEE_DIAGRAMS.md** ⭐ VISUALIZACIÓN
**Tamaño:** 40 KB | **Líneas:** 892  
**Descripción:** Diagramas visuales y ASCII art de la relación

**Contenido:**
1. **Diagrama de Entidades y Relaciones (ER)**
   - Estructura visual de tablas
   - Campos de cada tabla
   - Relaciones y Foreign Keys

2. **Flujo de Fotos (DETAILED)**
   - Step-by-step de upload
   - Step-by-step de creación de empleado
   - Resultado en base de datos
   - Frontend display

3. **Estado del Candidato (Status Workflow)**
   - State machine visual
   - Transiciones posibles
   - Lógica del sync script
   - Detalles del campo status

4. **Relación Uno-a-Muchos**
   - Escenario: mismo candidato, múltiples empleados
   - Queries SQL de ejemplo
   - Caso de uso real

5. **Photo Data URL Format**
   - Anatomía del data URL
   - Ejemplos JPEG, PNG, WebP
   - Almacenamiento en BD
   - Compresión aplicada

6. **Import Pipeline**
   - Step-by-step de importación
   - Docker Compose entry
   - Timeline de startup

7. **API Endpoints Cheat Sheet**
   - Todos los endpoints
   - Request/response para cada uno
   - Workflow sequences

8. **Key Files Reference**
   - Archivos de modelos
   - Archivos de API
   - Archivos de servicios
   - Scripts
   - Frontend
   - Tests

9. **Summary Table**
   - Tabla de referencia rápida

**Perfecto para:** Ver cómo funciona todo visualmente con diagramas ASCII

---

## GUÍA DE USO SEGÚN TU NECESIDAD

### Si necesitas...

**Entender rápidamente en 5 minutos:**
→ Lee `CANDIDATE_EMPLOYEE_QUICK_REFERENCE.md`

**Implementar una feature relacionada:**
→ Lee `CANDIDATE_EMPLOYEE_ANALYSIS.md` + relevante del `DIAGRAMS.md`

**Debuggear un problema:**
→ Ve al error en `CANDIDATE_EMPLOYEE_QUICK_REFERENCE.md` → solución

**Ver cómo funciona el flujo completo:**
→ Lee `CANDIDATE_EMPLOYEE_DIAGRAMS.md` (flujos paso a paso)

**Entender los modelos de BD:**
→ `CANDIDATE_EMPLOYEE_DIAGRAMS.md` (Sección 1) + `CANDIDATE_EMPLOYEE_ANALYSIS.md` (Sección 1)

**Integrar fotos:**
→ `CANDIDATE_EMPLOYEE_ANALYSIS.md` (Secciones 2, 6, 7) + `DIAGRAMS.md` (Sección 2)

**Implementar sincronización:**
→ `CANDIDATE_EMPLOYEE_ANALYSIS.md` (Secciones 3, 10) + `DIAGRAMS.md` (Sección 3)

---

## CONCEPTOS CLAVE (MEMORIZAR)

| Concepto | Descripción |
|----------|-------------|
| **Relación** | 1 Candidato : N Empleados (via `rirekisho_id`) |
| **Clave de Relación** | `rirekisho_id` (String 20) |
| **Foto: Campo Principal** | `photo_data_url` (TEXT, base64) |
| **Foto: Sincronización** | Automática al crear empleado |
| **Status del Candidato** | pending → approved → hired |
| **Endpoint Clave** | POST /api/employees (copia fotos automáticamente) |
| **Script Clave** | sync_candidate_employee_status.py |

---

## ARCHIVOS FUENTE EN EL CODEBASE

**Modelos:**
- `/backend/app/models/models.py` (líneas 191-710)

**API Candidatos:**
- `/backend/app/api/candidates.py`

**API Empleados:**
- `/backend/app/api/employees.py`

**Servicios:**
- `/backend/app/services/candidate_service.py`
- `/backend/app/services/photo_service.py`

**Scripts:**
- `/backend/scripts/sync_candidate_employee_status.py` ⭐
- `/backend/scripts/import_candidates_improved.py`
- `/backend/scripts/import_employees_complete.py`
- `/backend/scripts/unified_photo_import.py`

**Frontend:**
- `/frontend/app/dashboard/candidates/[id]/page.tsx`
- `/frontend/app/dashboard/employees/[id]/page.tsx`

**Tests:**
- `/backend/tests/test_sync_candidate_employee.py`

---

## CAMBIOS RECIENTES (v6.0.0)

- ✓ Relación 1:N mediante `rirekisho_id`
- ✓ Fotos almacenadas como data URLs (base64)
- ✓ Compresión automática (800x1000px, quality 85)
- ✓ Status sincronización automática
- ✓ Script de sincronización incluido
- ✓ Soporte para Employee, ContractWorker, Staff

---

## FLUJO RÁPIDO (5 MINUTOS)

```
1. Usuario crea candidato con formulario + foto
   → POST /api/candidates/rirekisho/form
   → Foto comprimida automáticamente
   → rirekisho_id generado (ej: "UNS-123")

2. Candidato aprobado
   → POST /api/candidates/{id}/evaluate?approved=true
   → status = "approved"

3. Admin crea empleado
   → POST /api/employees/
   → photo_data_url copiada AUTOMÁTICAMENTE del candidato
   → candidate.status = "hired" AUTOMÁTICAMENTE

RESULTADO:
├─ Candidato (rirekisho_id=UNS-123, photo_data_url=base64, status=hired)
└─ Empleado (hakenmoto_id=1, rirekisho_id=UNS-123, photo_data_url=base64)
   ↑ Fotos idénticas, sincronizadas ✓
```

---

## PREGUNTAS FRECUENTES

**P: ¿Dónde se almacenan las fotos?**  
R: En `candidates.photo_data_url` y `employees.photo_data_url` como base64 data URLs.

**P: ¿Las fotos se sincronizan automáticamente?**  
R: Sí, al crear un empleado se copia la foto del candidato automáticamente.

**P: ¿Puedo tener un candidato sin empleado?**  
R: Sí. El status será "pending" (sincronizado por el script).

**P: ¿Puedo tener un empleado sin candidato?**  
R: Técnicamente sí, pero no es la intención. Cada empleado debe venir de un candidato aprobado.

**P: ¿Qué pasa si actualizo la foto del candidato después de crear el empleado?**  
R: La foto del empleado NO se actualiza automáticamente (es una copia, no una referencia).

**P: ¿Cómo sincronizo el status después de importación?**  
R: Ejecuta: `python backend/scripts/sync_candidate_employee_status.py`

**P: ¿Cuál es el tamaño máximo de foto?**  
R: Original: 10MB. Después de compresión: ~200-300KB.

---

## SOPORTE Y CONTACTO

Para preguntas específicas sobre la implementación:

1. Revisa primero la sección correspondiente en estos documentos
2. Busca en el código fuente citado
3. Ejecuta los tests: `pytest backend/tests/test_sync_candidate_employee.py -v`

---

## VERSIÓN

- Documentación Versión: 1.0
- Aplicación: UNS-ClaudeJP 6.0.0
- Fecha: 2024-11-19
- Autor: Análisis exhaustivo del codebase

---

## TABLA DE CONTENIDOS

**Documento 1: QUICK REFERENCE (Este es tu punto de partida)**
- 1 página de referencia rápida
- Tabla de campos importantes
- Endpoints críticos
- Errores comunes

**Documento 2: ANALYSIS (Profundización técnica)**
- 11 secciones de análisis detallado
- Código fuente citado
- Explicaciones línea por línea
- Ejemplos concretos

**Documento 3: DIAGRAMS (Visualización)**
- 9 secciones con diagramas ASCII
- Flowcharts paso a paso
- Ejemplos de datos reales
- Consultas SQL de ejemplo

---

**Inicio recomendado:** CANDIDATE_EMPLOYEE_QUICK_REFERENCE.md  
**Para profundizar:** CANDIDATE_EMPLOYEE_ANALYSIS.md  
**Para visualizar:** CANDIDATE_EMPLOYEE_DIAGRAMS.md

