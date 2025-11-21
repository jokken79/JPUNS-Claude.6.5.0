# 🧪 TESTING MANUAL - 入社連絡票 (NYŪSHA RENRAKUHYŌ) WORKFLOW

**Fecha**: 2025-11-13
**Versión**: 1.0
**Sistema**: UNS-ClaudeJP 5.4.1
**Estado Implementación**: ✅ 100% COMPLETADO

---

## 📋 ÍNDICE

1. [Pre-Requisitos](#pre-requisitos)
2. [Setup del Entorno](#setup-del-entorno)
3. [Test Case 1: Crear Candidato](#test-case-1-crear-candidato)
4. [Test Case 2: Aprobar Candidato](#test-case-2-aprobar-candidato)
5. [Test Case 3: Verificar Request NYUUSHA](#test-case-3-verificar-request-nyuusha)
6. [Test Case 4: Llenar Formulario de Empleado](#test-case-4-llenar-formulario-de-empleado)
7. [Test Case 5: Crear Empleado](#test-case-5-crear-empleado)
8. [Checklist de Validación](#checklist-de-validación)
9. [Troubleshooting](#troubleshooting)

---

## PRE-REQUISITOS

### Requisitos del Sistema
- Docker Desktop en ejecución
- Servicios iniciados: `backend`, `frontend`, `db`
- Usuario admin con credenciales: `admin` / `admin123`

### URLs Accesibles
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/api/docs
- **Adminer (DB)**: http://localhost:8080

### Herramientas Necesarias
- Navegador web (Chrome/Firefox)
- Terminal para comandos Docker (opcional)
- Postman o similar para testing API (opcional)

---

## SETUP DEL ENTORNO

### 1. Verificar que Docker está corriendo

```bash
# Windows (CMD/PowerShell)
cd scripts
START.bat

# Linux/macOS
docker compose up -d
docker compose ps
```

### 2. Esperar a que servicios inicien

```bash
# Esperar 30-60 segundos
docker compose logs -f --tail=50

# Verificar health
curl http://localhost:8000/api/health
```

### 3. Verificar migración aplicada (IMPORTANTE)

```bash
# Verificar que las columnas se han creado
docker exec uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "\d requests"

# Debería mostrar:
# - candidate_id | integer
# - employee_data | jsonb
```

### 4. Acceder al Frontend

Navega a http://localhost:3000 y verifica que:
- [ ] Página carga correctamente
- [ ] Logo y menú visible
- [ ] Puedes hacer login

### 5. Login con Admin

**Credenciales**:
- Usuario: `admin`
- Contraseña: `admin123`

Deberías ver:
- [ ] Dashboard carga
- [ ] Menú lateral visible
- [ ] Opciones: Candidatos, Empleados, Solicitudes, etc.

---

## TEST CASE 1: CREAR CANDIDATO

### Descripción
Verificar que se puede crear un nuevo candidato con datos básicos.

### Pasos

#### 1.1 Navegar a Candidatos

```
Dashboard → Click "Candidatos" (menú izquierdo)
o navega a: http://localhost:3000/candidates
```

Deberías ver:
- [ ] Listado de candidatos (si existen)
- [ ] Botón "Nuevo Candidato" o "+" en la esquina superior
- [ ] Barra de búsqueda y filtros

#### 1.2 Crear Nuevo Candidato

```
Click "Nuevo Candidato" → /candidates/new
```

Deberías ver:
- [ ] Formulario `CandidateForm` con múltiples campos
- [ ] Campos principales visibles:
  - Nombre (Roman)
  - Nombre (Kanji) - Opcional
  - Fecha de Nacimiento
  - Email
  - Teléfono
  - Género
  - Nacionalidad
  - Y 200+ campos más

#### 1.3 Llenar Datos Básicos

```
Completa los siguientes campos (mínimo):

- Full Name (Roman): "Tanaka Taro" (o similar)
- Full Name (Kanji): "田中太郎" (opcional)
- Date of Birth: "1990-05-15"
- Email: "tanaka.taro@example.com"
- Phone: "09012345678"
- Gender: "Male" / "男性"
- Nationality: "Japanese" / "日本"
```

#### 1.4 Guardar Candidato

```
Scroll al final del formulario
Click "保存" (Save) o "Create Candidate"
```

Deberías ver:
- [ ] Mensaje de éxito: "Candidato creado exitosamente"
- [ ] Redirección a `/candidates/{id}` (página de detalle)
- [ ] Datos guardados correctamente
- [ ] Status mostrado como "pending" o similar

### Verificación en Base de Datos (Opcional)

```bash
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp

# En psql:
SELECT id, rirekisho_id, full_name_roman, status FROM candidates ORDER BY created_at DESC LIMIT 1;

# Debería mostrar algo como:
# id | rirekisho_id | full_name_roman | status
# -- | ------------ | --------------- | -------
# 1  | RK-2025-001  | Tanaka Taro     | pending
```

---

## TEST CASE 2: APROBAR CANDIDATO

### Descripción
Verificar que se puede aprobar un candidato y que automáticamente se crea un Request NYUUSHA.

### Pasos

#### 2.1 Acceder a Detalle de Candidato

```
Desde el listado `/candidates`, click en el candidato que creaste
o navega a: http://localhost:3000/candidates/{id}
```

Deberías ver:
- [ ] Datos del candidato mostrados
- [ ] Status actual: "pending"
- [ ] Botones de acción (aprobar, rechazar, etc.)

#### 2.2 Buscar Botón de Aprobación

```
Busca un botón con:
- 👍 Emoji o label "承認" (Aprobar/Approve)
- 👎 Emoji o label "却下" (Rechazar/Reject)
```

Deberías ver:
- [ ] Botón de aprobación claramente visible

#### 2.3 Hacer Clic en Aprobar

```
Click en botón 👍 "Aprobar" / "承認"
```

Deberías ver:
- [ ] Diálogo de confirmación (opcional)
- [ ] Mensaje: "Candidato aprobado exitosamente"
- [ ] Status cambió a "approved"
- [ ] Timestamp de aprobación mostrado

#### 2.4 Verificar Auto-Creación de Request

⚠️ **Esto ocurre automáticamente en el backend**

Sin hacer nada más, el backend debería haber creado un Request NYUUSHA automáticamente.

### Verificación en Base de Datos (Opcional)

```bash
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp

# Verificar que Request fue creado
SELECT id, candidate_id, request_type, status FROM requests
WHERE request_type = 'nyuusha'
ORDER BY created_at DESC LIMIT 1;

# Debería mostrar:
# id | candidate_id | request_type | status
# -- | ------------ | ------------ | -------
# 1  | 1            | nyuusha      | pending
```

---

## TEST CASE 3: VERIFICAR REQUEST NYUUSHA

### Descripción
Verificar que el Request NYUUSHA está visible en la página de solicitudes y tiene el badge distintivo.

### Pasos

#### 3.1 Navegar a Solicitudes

```
Dashboard → Click "Solicitudes" / "申請" (menú izquierdo)
o navega a: http://localhost:3000/requests
```

Deberías ver:
- [ ] Listado de requests
- [ ] Filtro por tipo (si existe)
- [ ] Contador de requests por estado

#### 3.2 Buscar Request NYUUSHA

```
Opción A: Buscar en el listado
- Busca el candidato "Tanaka Taro" en la columna de datos

Opción B: Filtrar por tipo
- Si existe filtro, selecciona "NYUUSHA" o "入社連絡票"
```

Deberías ver:
- [ ] Request aparece en el listado
- [ ] Badge de tipo: **ORANGE** 🟠 con label "入社連絡票"
- [ ] Badge de estado: YELLOW ⚠️ con label "pending" / "保留中"
- [ ] Información del candidato visible

#### 3.3 Verificar Badges

```
En la fila del request:
- Badge TYPE: 🟠 ORANGE fondo - "入社連絡票"
- Badge STATUS: 🟡 YELLOW fondo - "pending"
```

Colores esperados:
- NYUUSHA: `bg-orange-100` (naranja)
- PENDING: `bg-yellow-100` (amarillo)

### Verificación Visual Esperada

```
┌─────────────────────────────────────────────────────────┐
│ Requests Listado                                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Candidate: Tanaka Taro                                 │
│ Type: [🟠 入社連絡票]  Status: [🟡 pending]            │
│ Created: 2025-11-13 14:30:00                           │
│                                                         │
│ [Click to view details]                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## TEST CASE 4: LLENAR FORMULARIO DE EMPLEADO

### Descripción
Verificar que se puede acceder a la página de detalle del request y llenar el formulario de datos del empleado.

### Pasos

#### 4.1 Hacer Clic en Request NYUUSHA

```
Desde el listado de `/requests`, click en el request NYUUSHA
Debería redirigir a: /requests/{id}
```

Deberías ver:
- [ ] Página de detalle carga completamente
- [ ] Título: "入社連絡票 (New Hire Notification Form)"
- [ ] Badges: Tipo ORANGE + Status YELLOW
- [ ] Dos secciones principales

#### 4.2 Sección 1: Datos de Candidato (READ-ONLY)

```
Esta sección muestra datos del candidato (no editable)

Campos visibles:
- Rirekisho ID: "RK-2025-001"
- Nombre (Kanji): "田中太郎"
- Nombre (Roman): "Tanaka Taro"
- Fecha de Nacimiento: "1990-05-15"
- Email: "tanaka.taro@example.com"
- Teléfono: "09012345678"
- Nacionalidad: "Japanese"
- Estado: "approved"
- Link: [Ver candidato completo]
```

Deberías ver:
- [ ] Todos los datos son de SOLO LECTURA
- [ ] Link a `/candidates/{candidate_id}` funcional
- [ ] Información claramente identificada como "Candidate Data"

#### 4.3 Sección 2: Datos de Empleado (EDITABLE)

```
Esta sección tiene un formulario editable para llenar datos del empleado

CAMPOS REQUERIDOS (*):
- Factory ID *
- Hire Date *
- Jikyu (Hourly wage) *
- Position *
- Contract Type *

CAMPOS OPCIONALES:
- Hakensaki Shain ID
- Apartment ID
- Bank Name
- Bank Account
- Emergency Contact Name
- Emergency Contact Phone
- Notes (textarea)
```

#### 4.4 Llenar Campos Requeridos

```
Completa los siguientes campos:

1. Factory ID: "FAC-001" (o un ID válido de tu sistema)
2. Hire Date: "2025-11-20" (ej: próxima semana)
3. Jikyu: "1500" (ej: 1500 yen/hora)
4. Position: "製造スタッフ" (manufacturing staff)
5. Contract Type: "正社員" (fulltime employee)
```

Deberías poder:
- [ ] Escribir en campos de texto
- [ ] Abrir date picker para Hire Date
- [ ] Seleccionar valores de dropdowns

#### 4.5 Llenar Campos Opcionales (Recomendado)

```
Completa (opcional):

1. Apartment ID: "APT-001" (si aplica)
2. Bank Name: "銀行名" (nombre banco)
3. Bank Account: "123456789" (número cuenta)
4. Emergency Contact Name: "Tanaka Hanako" (emergencias)
5. Emergency Contact Phone: "09087654321"
6. Notes: "Cualquier nota importante"
```

#### 4.6 Guardar Datos (Botón "保存")

```
Scroll al final del formulario
Click "保存" (Save) o "Guardar Datos"
```

Deberías ver:
- [ ] Mensaje de éxito: "従業員データを保存しました" (Employee data saved)
- [ ] Formulario aún visible (no se cierra)
- [ ] Datos persistidos (si recargabas, siguen ahí)
- [ ] Botón "保存" ahora deshabilitado o gris (datos ya guardados)

### Verificación en Base de Datos (Opcional)

```bash
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp

# Verificar que employee_data se guardó
SELECT id, candidate_id, employee_data FROM requests
WHERE id = {request_id} \gx;

# Debería mostrar JSON como:
# {
#   "factory_id": "FAC-001",
#   "hire_date": "2025-11-20",
#   "jikyu": 1500,
#   "position": "製造スタッフ",
#   "contract_type": "正社員",
#   ...
# }
```

---

## TEST CASE 5: CREAR EMPLEADO

### Descripción
Verificar que se puede aprobar el request NYUUSHA y que automáticamente se crea un Employee con todos los datos.

### Pasos

#### 5.1 Verificar Formulario Completo

```
En la misma página `/requests/{id}`:

Verifica que:
- [ ] Sección Candidate Data visible (completa)
- [ ] Sección Employee Data visible (completa)
- [ ] Todos los campos requeridos (*) lleados
- [ ] Botón "保存" ya fue clickeado exitosamente
```

#### 5.2 Buscar Botón de Aprobación

```
Scroll al final de la página, bajo el formulario

Busca botón:
- Texto: "承認して従業員作成" (Approve & Create Employee)
- Color: Azul o verde (success action)
- Estado: HABILITADO (no gris)
```

Deberías ver:
- [ ] Botón claramente visible
- [ ] Botón está HABILITADO (no deshabilitado)

#### 5.3 Diálogo de Confirmación

```
Click en "承認して従業員作成"
```

Deberías ver:
- [ ] Diálogo emergente: "¿Confirmar creación de empleado?"
- [ ] Datos de resumen (factory_id, position, hire_date)
- [ ] Botones: "Cancelar" y "Confirmar" / "確認"

#### 5.4 Confirmar Aprobación

```
Click en "Confirmar" / "確認" en el diálogo
```

El backend procesará:
1. Copiar 40+ campos de Candidate
2. Agregar datos de employee_data
3. Generar hakenmoto_id único
4. Crear Employee en BD
5. Actualizar Candidate.status = "hired"
6. Actualizar Request.status = "completed"

Deberías ver:
- [ ] Mensaje de éxito: "従業員を作成しました" (Employee created)
- [ ] Página redirige a `/employees/{hakenmoto_id}`
- [ ] Nueva página muestra datos del empleado creado

#### 5.5 Verificar Empleado Creado

```
En la página `/employees/{hakenmoto_id}`:

Verifica que se muestran:
- [ ] hakenmoto_id (único)
- [ ] Datos personales (nombre, DOB, email, etc.)
- [ ] Datos de empleado (factory, position, hire_date, jikyu)
- [ ] Foto (si se cargó)
- [ ] Status: "active" o "working"
- [ ] Todos los 40+ campos copiados de Candidate
```

### Verificación en Base de Datos (Opcional)

```bash
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp

# Verificar que Employee fue creado
SELECT hakenmoto_id, rirekisho_id, full_name_roman, position, factory_id
FROM employees
ORDER BY created_at DESC LIMIT 1;

# Debería mostrar:
# hakenmoto_id | rirekisho_id | full_name_roman | position | factory_id
# ------------ | ------------ | --------------- | -------- | ----------
# E-0001       | RK-2025-001  | Tanaka Taro     | 製造スタッフ | FAC-001

# Verificar que Candidate fue actualizado
SELECT id, rirekisho_id, status FROM candidates WHERE id = {candidate_id};

# Debería mostrar:
# id | rirekisho_id | status
# -- | ------------ | ------
# 1  | RK-2025-001  | hired

# Verificar que Request fue completado
SELECT id, candidate_id, request_type, status FROM requests WHERE id = {request_id};

# Debería mostrar:
# id | candidate_id | request_type | status
# -- | ------------ | ------------ | ---------
# 1  | 1            | nyuusha      | completed
```

---

## CHECKLIST DE VALIDACIÓN

### ✅ Test Case 1: Crear Candidato
- [ ] Formulario accesible desde `/candidates/new`
- [ ] Campos visibles y editables
- [ ] Guardado exitoso
- [ ] Redirección a detalle
- [ ] rirekisho_id generado automáticamente
- [ ] Status = "pending"

### ✅ Test Case 2: Aprobar Candidato
- [ ] Botón de aprobación visible
- [ ] Aprobación confirma con diálogo o directa
- [ ] Mensaje de éxito
- [ ] Status cambió a "approved"
- [ ] Timestamp guardado
- [ ] **AUTOMÁTICO**: Request NYUUSHA creado en BD

### ✅ Test Case 3: Verificar Request NYUUSHA
- [ ] Request visible en `/requests`
- [ ] Badge ORANGE: "入社連絡票"
- [ ] Badge YELLOW: "pending"
- [ ] Datos de candidato mostrados
- [ ] Filtros funcionan (si existen)

### ✅ Test Case 4: Llenar Formulario de Empleado
- [ ] Página `/requests/{id}` carga
- [ ] Sección Candidate (read-only) visible
- [ ] Sección Employee (editable) visible
- [ ] Campos requeridos validados
- [ ] Date picker funcional
- [ ] Guardar exitoso
- [ ] Mensaje: "従業員データを保存しました"
- [ ] Datos persistidos

### ✅ Test Case 5: Crear Empleado
- [ ] Diálogo de confirmación aparece
- [ ] Aprobación procesa exitosamente
- [ ] Redirección a `/employees/{hakenmoto_id}`
- [ ] Employee creado con todos los datos
- [ ] Candidate status = "hired"
- [ ] Request status = "completed"
- [ ] 40+ campos copiados correctamente
- [ ] factory_id, position, hire_date, jikyu asignados

### ✅ Validación de Base de Datos
- [ ] Migración aplicada (`candidate_id`, `employee_data` en tabla requests)
- [ ] Candidate.requests relationship funciona
- [ ] Request.candidate relationship funciona
- [ ] Employee creado con hakenmoto_id único
- [ ] Índice idx_requests_candidate_id existe
- [ ] Datos JSON en employee_data válidos

### ✅ Validación de Frontend
- [ ] RequestTypeBadge renders correctamente
- [ ] RequestStatusBadge renders correctamente
- [ ] Colores CSS aplicados (orange para NYUUSHA)
- [ ] Formulario de empleado se valida
- [ ] Botones se habilitan/deshabilitan según estado
- [ ] Mensajes toast aparecen correctamente

### ✅ Validación de Backend
- [ ] EndpointPUT /employee-data funciona
- [ ] Endpoint POST /approve-nyuusha funciona
- [ ] Auto-creación de request funciona
- [ ] Lógica de copiar campos funciona
- [ ] Validaciones ejecutadas
- [ ] Transacciones completadas

---

## TROUBLESHOOTING

### ❌ Problema 1: "Migración no aplicada"
**Síntoma**: Error "column candidate_id does not exist"

**Solución**:
```bash
# Fuerza aplicación de migraciones
docker exec uns-claudejp-backend bash -c "cd /app && alembic upgrade head"

# O rebuild completo
cd scripts
STOP.bat
cd ..
docker compose build backend
cd scripts
START.bat
```

### ❌ Problema 2: "Request NYUUSHA no se crea"
**Síntoma**: Después de aprobar candidato, no aparece request

**Solución**:
```bash
# Verifica logs del backend
docker compose logs backend --tail 100

# Busca línea: "Created NYUUSHA request"

# Si no aparece, verifica en BD
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c \
  "SELECT * FROM requests WHERE request_type = 'nyuusha';"
```

### ❌ Problema 3: "Página /requests/{id} no carga"
**Síntoma**: Error 404 o página en blanco

**Solución**:
```bash
# Verifica que archivo existe
ls /home/user/UNS-ClaudeJP-5.4.1/frontend/app/\(dashboard\)/requests/\[id\]/page.tsx

# Rebuild frontend
docker compose build frontend
docker compose up -d frontend

# Espera 1-2 minutos de compilación
docker compose logs frontend -f
```

### ❌ Problema 4: "Error al guardar employee_data"
**Síntoma**: Mensaje: "Error saving employee data"

**Solución**:
1. Verifica que todos los campos requeridos están llenos:
   - Factory ID: ✅ Debe existir
   - Hire Date: ✅ Debe ser fecha válida
   - Jikyu: ✅ Debe ser número (800-5000)
   - Position: ✅ No vacío
   - Contract Type: ✅ Seleccionado

2. Verifica logs del backend:
   ```bash
   docker compose logs backend --tail 50 | grep employee-data
   ```

3. Si persiste, verifica que la columna `employee_data` existe:
   ```bash
   docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c "\d requests" | grep employee_data
   ```

### ❌ Problema 5: "Error al crear empleado"
**Síntoma**: "Employee data must be filled"

**Solución**:
1. Asegúrate de haber clickeado "保存" antes de "承認"
2. Verifica que employee_data fue guardado (check en DB)
3. Verifica que request_type = "nyuusha"
4. Verifica que request status = "pending"

```bash
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c \
  "SELECT id, request_type, status, employee_data FROM requests WHERE id = {request_id} \gx;"
```

### ❌ Problema 6: "Employee no se crea aunque aprobé"
**Síntoma**: No redirige a /employees/{id}

**Solución**:
```bash
# Verifica logs del backend
docker compose logs backend --tail 100 | grep approve-nyuusha

# Busca error específico

# Verifica que candidato existe
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c \
  "SELECT id, rirekisho_id FROM candidates WHERE id = {candidate_id};"

# Verifica que employee no existe ya
docker exec -it uns-claudejp-db psql -U uns_admin -d uns_claudejp -c \
  "SELECT hakenmoto_id, rirekisho_id FROM employees WHERE rirekisho_id = 'RK-...';"
```

### ❌ Problema 7: "Badges no se muestran correctamente"
**Síntoma**: Badges muestran label incorrecto o color gris

**Solución**:
1. Limpia cache del navegador: `Ctrl+Shift+Delete`
2. Rebuild frontend:
   ```bash
   docker compose build frontend
   docker compose up -d frontend
   ```
3. Verifica que RequestTypeBadge.tsx tiene configuración para NYUUSHA:
   ```bash
   grep -n "NYUUSHA\|nyuusha" /home/user/UNS-ClaudeJP-5.4.1/frontend/components/requests/RequestTypeBadge.tsx
   ```

---

## CONCLUSIÓN

Si todos los Test Cases pasan con ✅, entonces:

✅ **La implementación de 入社連絡票 está 100% funcional**

El flujo completo funciona:
1. Crear candidato
2. Aprobar candidato → Auto-crear request NYUUSHA
3. Llenar formulario de empleado
4. Crear empleado con todos los datos

**Sistema listo para producción!** 🚀

---

**Documento creado**: 2025-11-13
**Versión**: 1.0
**Status**: ✅ COMPLETO
