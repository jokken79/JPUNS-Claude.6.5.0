# ✅ RESUMEN: Agentes Creados para UNS-ClaudeJP

## 🎯 **TOTAL: 9 Agentes Especializados**

---

## **Agentes Elite (Técnicos)** - 3 agentes

### 1. 🧠 **master-problem-solver**
**Modelo:** Haiku  
**Ubicación:** `.claude/elite/master-problem-solver.md`

**Usa para:**
- Bugs complejos multi-capa
- Debugging profundo (frontend + backend + DB)
- Root cause analysis
- Optimización de sistemas
- Crisis resolution

**Triggers:** "problema complejo", "bug imposible", "root cause", "optimización sistema"

---

### 2. 🏗️ **full-stack-architect**
**Modelo:** Haiku  
**Ubicación:** `.claude/elite/full-stack-architect.md`

**Usa para:**
- Diseñar features completas end-to-end
- Arquitectura de sistemas
- Backend (Python/FastAPI) + Frontend (React/Next.js)
- Database design (PostgreSQL)
- Best practices y patrones

**Triggers:** "diseñar feature", "arquitectura completa", "sistema end-to-end", "implementar feature"

---

### 3. 🛡️ **code-quality-guardian**
**Modelo:** Haiku  
**Ubicación:** `.claude/elite/code-quality-guardian.md`

**Usa para:**
- Code review exhaustivo
- Detectar code smells y anti-patterns
- SOLID principles
- Refactoring de código legacy
- Mejora de test coverage

**Triggers:** "revisar código", "code review", "refactorizar", "code smell", "test coverage"

---

## **Agentes de Dominio (Negocio)** - 6 agentes

### 4. 🏖️ **yukyu-specialist** (有給休暇専門家)
**Modelo:** Haiku  
**Ubicación:** `.claude/domain-specialists/yukyu-specialist.md`

**Usa para:**
- Cálculo de yukyu según ley laboral japonesa (労働基準法)
- Algoritmo LIFO (Last In, First Out)
- Workflow TANTOSHA → KEIRI
- Migración de datos históricos
- Compliance legal

**Triggers:** "yukyu", "有給", "vacaciones pagadas", "LIFO deduction", "ley laboral japonesa"

**Conocimiento:**
- 6 meses = 10 días
- 18 meses = 11 días
- Expiración: 2 años
- Mínimo 5 días/año obligatorios

---

### 5. 👥 **employee-lifecycle-specialist** (社員ライフサイクル専門家)
**Modelo:** Haiku  
**Ubicación:** `.claude/domain-specialists/employee-lifecycle-specialist.md`

**Usa para:**
- Proceso de nyuusha (入社 - contratación)
- Conversión de candidato → empleado
- Tipos de empleado (派遣社員/正社員/請負)
- Gestión de documentos (rirekisho, zairyu card)
- Terminación de empleados

**Triggers:** "nyuusha", "入社", "candidato a empleado", "employee type", "派遣社員", "staff"

**Conocimiento:**
- Generación de hakenmoto_id
- Copia de documentos
- Factory assignments
- Apartment assignments

---

### 6. 💰 **payroll-specialist** (給与計算専門家)
**Modelo:** Haiku  
**Ubicación:** `.claude/domain-specialists/payroll-specialist.md`

**Usa para:**
- Cálculo de salarios (jikyu 時給 / gekkyu 月給)
- Deducciones: seguros, impuestos, renta
- Timer cards y asistencia
- Overtime (1.25x) y holiday pay (1.35x)
- Payslips (給与明細)

**Triggers:** "payroll", "給与", "nómina", "deducciones", "timer card", "タイムカード", "overtime"

**Conocimiento:**
- 健康保険 ~5%, 厚生年金 ~9%, 雇用保険 ~0.6%
- Overtime: jikyu × 1.25
- Holiday: jikyu × 1.35
- Yukyu payment integration

---

### 7. 🏢 **apartment-specialist** (寮管理専門家)
**Modelo:** Haiku  
**Ubicación:** `.claude/domain-specialists/apartment-specialist.md`

**Usa para:**
- Asignación de apartamentos a empleados
- Gestión de disponibilidad
- Tipos de habitación (1K, 1DK, 1LDK, 2K, etc.)
- Cálculo de rentas y deducciones
- Sistema V2 de apartamentos

**Triggers:** "apartment", "寮", "apartamento", "apartment assignment", "renta", "寮費"

**Conocimiento:**
- Room types: 1K, 1DK, 1LDK, 2K, 2DK, 2LDK, 3LDK
- Statuses: active, inactive, maintenance, reserved
- Deducción automática en payroll
- Pro-rated rent for partial months

---

### 8. 📋 **candidate-specialist** (候補者・OCR専門家)
**Modelo:** Haiku  
**Ubicación:** `.claude/domain-specialists/candidate-specialist.md`

**Usa para:**
- OCR de rirekisho (履歴書 - CV japonés)
- Sistema híbrido: Azure OCR → EasyOCR → Tesseract
- Extracción de fotos desde documentos
- Procesamiento de zairyu card (在留カード)
- Workflow de aprobación

**Triggers:** "candidate", "rirekisho", "履歴書", "OCR", "azure ocr", "zairyu card", "在留カード"

**Conocimiento:**
- Rirekisho ID format: RR-YYMMDD-NNN
- OCR fallback chain
- Photo extraction
- Document validation

---

### 9. 🏭 **factory-assignment-specialist** (派遣先配属専門家)
**Modelo:** Haiku  
**Ubicación:** `.claude/domain-specialists/factory-assignment-specialist.md`

**Usa para:**
- Asignación de empleados a empresas clientes (派遣先)
- Gestión de turnos: 朝番/昼番/夜番
- Rotación de personal
- Reportes por cliente
- Historial de asignaciones

**Triggers:** "factory", "派遣先", "client assignment", "shift", "朝番", "昼番", "夜番"

**Conocimiento:**
- 朝番 (asa): Morning shift
- 昼番 (hiru): Day shift
- 夜番 (yoru): Night shift
- Assignment tracking and history

---

## 🚀 **Instalación**

### **Paso 1: Ejecuta el instalador**
```cmd
CREAR_AGENTES_DOMINIO.bat
```

Esto creará:
- 3 agentes elite en `.claude/elite/`
- 6 agentes de dominio en `.claude/domain-specialists/`
- Registro completo en `.claude/agents.json`

### **Paso 2: Verifica**
```cmd
dir .claude\elite
dir .claude\domain-specialists
```

---

## 💡 **Cómo Usar**

### **Invocación Automática**
Los agentes se activan cuando mencionas sus triggers:

**Ejemplos:**

```
"El cálculo de yukyu no sigue la ley laboral japonesa"
→ Invoca: yukyu-specialist

"Necesito implementar el proceso de nyuusha (入社) completo"
→ Invoca: employee-lifecycle-specialist

"Las deducciones de seguro social están incorrectas"
→ Invoca: payroll-specialist

"Asignar apartamento 1K a empleado nuevo"
→ Invoca: apartment-specialist

"OCR de rirekisho no extrae los datos correctamente"
→ Invoca: candidate-specialist

"Cambiar empleado de turno nocturno a diurno en Toyota"
→ Invoca: factory-assignment-specialist
```

### **Invocación Manual**
También puedes invocarlos directamente:
```
"Usa el yukyu-specialist para explicar el algoritmo LIFO"
"Invoca al payroll-specialist para revisar este cálculo"
```

---

## 📊 **Cobertura de la App**

| Módulo | Agente Especializado |
|--------|---------------------|
| Yukyu (有給) | yukyu-specialist |
| Employees (社員) | employee-lifecycle-specialist |
| Payroll (給与) | payroll-specialist |
| Apartments (寮) | apartment-specialist |
| Candidates (候補者) | candidate-specialist |
| Factory Assignments (派遣先) | factory-assignment-specialist |
| Problemas técnicos complejos | master-problem-solver |
| Implementación full-stack | full-stack-architect |
| Code review y calidad | code-quality-guardian |

**✅ 100% de cobertura de los módulos principales**

---

## 📚 **Documentación**

- **Agentes Elite**: `GUIA_USO_AGENTES_ELITE.md`
- **Agentes de Dominio**: `AGENTES_DOMINIO_README.md`
- **Sistema Yukyu**: `YUKYU_SYSTEM_README.md`
- **Modelos DB**: `backend/app/models/models.py`
- **APIs**: `backend/app/api/*.py`

---

## 🎯 **Próximos Pasos**

1. ✅ **Instalar**: Ejecuta `CREAR_AGENTES_DOMINIO.bat`
2. 🧪 **Probar**: Haz preguntas sobre cada módulo
3. 📝 **Ajustar**: Modifica triggers según tu uso
4. 🚀 **Expandir**: Crea más agentes si lo necesitas

---

## 🔧 **Mantenimiento**

### **Editar un agente:**
```cmd
notepad .claude\domain-specialists\yukyu-specialist.md
```

### **Subir cambios a Git:**
```cmd
scripts\GIT_SUBIR.bat
```

### **Sincronizar en otra PC:**
```cmd
scripts\GIT_BAJAR.bat
```

---

## ✨ **Ventajas del Sistema**

✅ **Conocimiento del negocio**: Comprenden ley laboral japonesa  
✅ **Terminología correcta**: Entienden 有給, 派遣, 給与, 寮, etc.  
✅ **Context-aware**: Saben cómo interactúan los módulos  
✅ **Compliance**: Aseguran cumplimiento legal  
✅ **Consistency**: Mantienen estándares en toda la app  
✅ **Escalabilidad**: Fácil agregar más agentes  

---

**¡Sistema de agentes completo y listo para usar! 🎉**

**Última actualización:** 2025-01-12  
**Versión:** 1.0  
**Total de agentes:** 9 (3 elite + 6 dominio)
