# 🎯 Agentes Especializados de Dominio - UNS-ClaudeJP

## 📋 Descripción

Agentes expertos en los **módulos específicos de tu app de RRHH** para agencias de staffing japonesas. Complementan a los agentes elite (técnicos) con **conocimiento profundo del negocio**.

---

## 🤖 Agentes Creados (6 Total)

### 1. 🏖️ **Yukyu Specialist** (有給休暇専門家)

**Archivo:** `.claude/domain-specialists/yukyu-specialist.md`

**Experto en:**
- ✅ Ley laboral japonesa (労働基準法 Article 39)
- ✅ Cálculo automático de yukyu por antigüedad
- ✅ Algoritmo LIFO (Last In, First Out) de deducción
- ✅ Workflow de aprobaciones (TANTOSHA → KEIRI)
- ✅ Reportes y análisis de yukyu
- ✅ Migración de datos históricos

**Conocimiento incluido:**
```
Milestones de yukyu:
- 6 meses = 10 días
- 18 meses = 11 días  
- 30 meses = 12 días
- 42 meses = 14 días
- 54 meses = 16 días
- 66+ meses = 18-20 días

Expiración: 2 años (労基法第115条)
Mínimo obligatorio: 5 días/año (reforma 2019)
```

**Triggers:**
- "yukyu", "有給", "vacaciones pagadas"
- "cálculo yukyu", "LIFO deduction"
- "ley laboral japonesa", "yukyu balance"

**Cuándo invocar:**
```
"El cálculo de yukyu no sigue la ley laboral japonesa"
"El algoritmo LIFO no está deduciendo correctamente"
"Necesito migrar datos históricos de yukyu desde Excel"
"Cómo funciona el workflow de aprobación TANTOSHA → KEIRI"
```

---

### 2. 👥 **Employee Lifecycle Specialist** (社員ライフサイクル専門家)

**Archivo:** `.claude/domain-specialists/employee-lifecycle-specialist.md`

**Experto en:**
- ✅ Ciclo completo: Candidato → Nyuusha (入社) → Empleado → Salida
- ✅ Tipos de empleado (派遣社員/正社員/請負)
- ✅ Conversión de candidato a empleado
- ✅ Gestión de documentos (rirekisho, zairyu card)
- ✅ Asignaciones a fábricas (派遣先配属)
- ✅ Terminación de empleados (退職処理)

**Conocimiento incluido:**
```
Tipos de empleado:
1. Employee (派遣社員): Hourly (jikyu), más común
2. Staff (正社員): Monthly salary, oficina/HR
3. Contract Worker (請負): Proyecto/contrato

Flujo de contratación:
CANDIDATE → APPROVAL → NYUUSHA → EMPLOYEE
   ↓            ↓          ↓          ↓
Rirekisho   Admin OK   入社届    Hakenmoto ID
```

**Triggers:**
- "nyuusha", "入社", "contratación"
- "candidato a empleado", "employee type"
- "派遣社員", "staff", "contract worker"
- "factory assignment", "terminación"

**Cuándo invocar:**
```
"Cómo convertir un candidato aprobado a empleado"
"Necesito cambiar un employee a Staff con salario mensual"
"Proceso de nyuusha (入社届) completo"
"Asignar empleado a fábrica y apartamento"
"Terminar empleado y calcular liquidación final"
```

---

### 3. 💰 **Payroll Specialist** (給与計算専門家)

**Archivo:** `.claude/domain-specialists/payroll-specialist.md`

**Experto en:**
- ✅ Cálculo de salarios (jikyu 時給 / gekkyu 月給)
- ✅ Deducciones obligatorias (seguros sociales, impuestos)
- ✅ Timer cards y control de asistencia
- ✅ Overtime y holiday pay (時間外・休日手当)
- ✅ Integración con yukyu y apartamentos
- ✅ Generación de payslips (給与明細)

**Conocimiento incluido:**
```
Cálculo de salario:
Regular: hours × jikyu
Overtime: hours × jikyu × 1.25 (25% extra)
Holiday: hours × jikyu × 1.35 (35% extra)
Yukyu: jikyu × 8 × días

Deducciones:
- 健康保険 (Health): ~5%
- 厚生年金 (Pension): ~9%
- 雇用保険 (Employment): ~0.6%
- 所得税 (Income tax): Withholding tables
- 寮費 (Rent): From apartment assignment
```

**Triggers:**
- "payroll", "給与", "nómina", "salario"
- "deducciones", "timer card", "タイムカード"
- "overtime", "時間外", "payslip"
- "jikyu", "時給"

**Cuándo invocar:**
```
"El cálculo de nómina está incorrecto"
"Las deducciones de seguros no cuadran"
"Cómo se calcula el overtime a 1.25x"
"Timer cards y validación de horas trabajadas"
"Integrar pago de yukyu en payroll"
```

---

## 🚀 Instalación

### Ejecuta el instalador:
```cmd
CREAR_AGENTES_DOMINIO.bat
```

O manualmente:
```cmd
node create_domain_agents.js
node register_domain_agents.js
```

---

## 💡 Cómo Usar

### **Invocación Automática**

Los agentes se activan cuando mencionas:
- **Palabras clave en japonés**: 有給, 入社, 給与, タイムカード
- **Módulos específicos**: yukyu, employee, payroll
- **Procesos del negocio**: nyuusha, LIFO, deducciones

### **Ejemplos Prácticos**

#### Ejemplo 1: Problema con Yukyu
```
TÚ: "El sistema no está calculando correctamente los días de 
yukyu para un empleado con 18 meses de antigüedad"

CLAUDE: *invoca yukyu-specialist*

AGENTE:
- Verifica que hire_date esté correcto
- Calcula que 18 meses = 11 días según ley
- Revisa algoritmo de cálculo automático
- Propone fix y test
```

#### Ejemplo 2: Conversión de Candidato
```
TÚ: "Necesito implementar el proceso de nyuusha (入社) 
completo desde candidato aprobado hasta empleado activo"

CLAUDE: *invoca employee-lifecycle-specialist*

AGENTE:
- Explica flujo completo de nyuusha
- Muestra cómo generar hakenmoto_id
- Detalla copia de documentos
- Propone código de conversión
- Sugiere post-hire workflows (yukyu, apartamento)
```

#### Ejemplo 3: Cálculo de Nómina
```
TÚ: "Las deducciones de seguro social están muy altas, 
¿cómo se calculan?"

CLAUDE: *invoca payroll-specialist*

AGENTE:
- Explica deducción de 健康保険 (~5%)
- Muestra cálculo de 厚生年金 (~9%)
- Verifica que rates sean correctos
- Propone audit de deductions
```

---

## 🔄 Integración con Agentes Elite

Los agentes de dominio **complementan** a los agentes elite:

| Situación | Agente de Dominio | Agente Elite |
|-----------|-------------------|--------------|
| Bug en cálculo de yukyu | ✅ yukyu-specialist | master-problem-solver (si muy complejo) |
| Implementar nyuusha completo | ✅ employee-lifecycle-specialist | full-stack-architect |
| Code review de payroll | payroll-specialist (context) | ✅ code-quality-guardian |
| Refactorizar yukyu service | yukyu-specialist (context) | ✅ full-stack-architect |

**Flujo típico:**
```
1. Problema de negocio → Agente de Dominio
2. Problema técnico complejo → Agente Elite
3. Ambos trabajan juntos cuando es necesario
```

---

## 📊 Estructura de Archivos

```
.claude/
├── elite/                          # Agentes técnicos
│   ├── master-problem-solver.md
│   ├── full-stack-architect.md
│   └── code-quality-guardian.md
│
├── domain-specialists/             # Agentes de negocio (6 total)
│   ├── yukyu-specialist.md
│   ├── employee-lifecycle-specialist.md
│   ├── payroll-specialist.md
│   ├── apartment-specialist.md
│   ├── candidate-specialist.md
│   └── factory-assignment-specialist.md
│
└── agents.json                     # Registro de todos los agentes
```

---

## 🎓 Ventajas de Agentes de Dominio

### ✅ **Conocimiento del Negocio**
- Comprenden ley laboral japonesa
- Conocen workflows específicos (TANTOSHA → KEIRI)
- Entienden términos en japonés (有給, 派遣, 給与)

### ✅ **Context-Aware**
- Saben cómo interactúan los módulos
- Conocen las reglas de validación
- Entienden edge cases del negocio

### ✅ **Consistency**
- Aseguran compliance con leyes japonesas
- Mantienen consistencia en cálculos
- Documentan decisiones de negocio

---

## 🔧 Personalización

### Agregar Más Agentes de Dominio

Ya tienes 6 agentes de dominio cubriendo los módulos principales.

**Si necesitas más, podrías crear:**
- `timer-card-specialist`: Gestión detallada de asistencia
- `reports-specialist`: Reportes y analytics avanzados
- `contract-specialist`: Gestión de contratos y renovaciones

**Pasos:**
1. Crea `.md` en `.claude/domain-specialists/`
2. Sigue el template de los agentes existentes
3. Registra en `agents.json`
4. Define triggers específicos

---

## 🚨 Troubleshooting

**Agente no se invoca:**
- Usa triggers específicos ("yukyu", "payroll", "nyuusha")
- Menciona términos en japonés (有給, 給与, 入社)
- Describe el problema del módulo específico

**Agente da respuesta genérica:**
- Sé más específico sobre el módulo
- Menciona campos de la base de datos
- Comparte código relevante del módulo

---

## 📚 Recursos Adicionales

- **Documentación de Yukyu**: `YUKYU_SYSTEM_README.md`
- **Modelos de DB**: `backend/app/models/models.py`
- **APIs**: `backend/app/api/*.py`
- **Ley Laboral**: Labor Standards Act (労働基準法)

---

## ✨ Próximos Pasos

1. ✅ Instalar agentes: `CREAR_AGENTES_DOMINIO.bat`
2. 🧪 Probar con casos reales de tu app
3. 📝 Ajustar triggers según tu uso
4. 🚀 Crear más agentes de dominio si necesitas

---

**¡Los agentes de dominio están listos para ayudarte con tu app de RRHH! 🎉**

---

**Última actualización:** 2025-01-12  
**Versión:** 1.0  
**Autor:** UNS-ClaudeJP Team
