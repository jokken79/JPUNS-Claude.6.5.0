# 🔐 CREDENCIALES Y URLs PARA TESTING

## 🌐 URLs DE ACCESO

| Componente | URL | Puerto |
|-----------|-----|--------|
| **Frontend** | http://localhost:3000 | 3000 |
| **Backend API** | http://localhost:8000 | 8000 |
| **Login Page** | http://localhost:3000/login | 3000 |
| **Dashboard** | http://localhost:3000/dashboard | 3000 |

---

## 👤 USUARIOS DISPONIBLES

### 1. **ADMIN (Acceso Completo)**
```
URL:      http://localhost:3000/login
Usuario:  admin
Password: admin123
Rol:      SUPER_ADMIN
```
✅ Acceso a todas las páginas  
✅ Todas las funcionalidades

### 2. **COORDINATOR (Coordinador)**
```
URL:      http://localhost:3000/login
Usuario:  coordinator
Password: coordinator123 (o usa el hash de la BD)
Rol:      COORDINATOR
```
✅ Acceso limitado a recursos asignados  
✅ Sin acceso a configuración avanzada

### 3. **TEST USER (Para Pruebas)**
```
URL:      http://localhost:3000/login
Usuario:  testuser
Password: testuser123
Rol:      EMPLOYEE
```
⚠️ Acceso limitado a empleados

---

## 📋 PÁGINAS DISPONIBLES

Después del login con admin, puedes acceder a:

| Página | URL | Estado |
|--------|-----|--------|
| Dashboard | `/dashboard` | ✅ Funciona |
| Candidatos | `/dashboard/candidates` | ✅ Funciona |
| Empleados | `/dashboard/employees` | ✅ Funciona |
| Fábricas | `/dashboard/factories` | ✅ Funciona |
| Tarjetas de Tiempo | `/dashboard/timercards` | ✅ Funciona |
| Nómina | `/dashboard/payroll` | ✅ Funciona |
| Solicitudes | `/dashboard/requests` | ✅ Funciona |
| Configuración | `/dashboard/settings` | ✅ Funciona (después npm run dev) |
| Temas | `/dashboard/themes` | ✅ Funciona (después npm run dev) |

---

## 🧪 PASOS PARA PROBAR

### Paso 1: Asegúrate que el servidor esté corriendo
```bash
# Terminal 1: Backend (si no está corriendo)
cd backend
python -m uvicorn app.main:app --reload

# Terminal 2: Frontend (si no está corriendo)
cd frontend
npm run dev
```

### Paso 2: Accede a la aplicación
```
1. Abre: http://localhost:3000/login
2. Ingresa: admin / admin123
3. Deberías redirigir automáticamente a http://localhost:3000/dashboard
```

### Paso 3: Navega por las páginas
Haz clic en el menú lateral para acceder a:
- Candidatos
- Empleados
- Fábricas
- Tarjetas de Tiempo
- Nómina
- Solicitudes
- Configuración
- Temas

---

## 🔍 VER DATOS EN LA API

Si quieres ver datos crudos de la API, usa curl o Postman:

### Con Login:
```bash
# 1. Obtener token
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123"

# Copiar el access_token del resultado

# 2. Usar el token para ver datos
curl -X GET http://localhost:8000/api/employees/ \
  -H "Authorization: Bearer <TU_TOKEN_AQUI>"
```

### Endpoints disponibles (POST login):
```
GET  /api/employees/          - Lista de empleados
GET  /api/candidates/         - Lista de candidatos
GET  /api/factories           - Lista de fábricas
GET  /api/timer-cards         - Tarjetas de tiempo
GET  /api/salary-calculations - Nóminas
GET  /api/requests            - Solicitudes
GET  /api/health              - Estado del servidor
```

---

## 🧑‍💼 INFORMACIÓN DEL USUARIO ADMIN

**ID:** 1  
**Username:** admin  
**Email:** admin@uns-kikaku.com  
**Password:** admin123  
**Rol:** SUPER_ADMIN  
**Hash bcrypt:** `$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPjnswC9.4o1K`

---

## 📱 FLUJO TÍPICO DE USO

```
1. Abre http://localhost:3000/login
   ↓
2. Ingresa admin / admin123
   ↓
3. Se guarda token en localStorage:
   localStorage.getItem('auth-storage')
   → { state: { token: "eyJ...", user: {...}, isAuthenticated: true } }
   ↓
4. Redirige automáticamente a /dashboard
   ↓
5. Navega por las páginas (todas con autenticación)
   ↓
6. Logout en perfil (si existe)
```

---

## ⚠️ TROUBLESHOOTING

### "Página en blanco después del login"
✅ **Solución:** 
1. Abre consola (F12)
2. Verifica localStorage: `localStorage.getItem('auth-storage')`
3. Debe tener: `token`, `isAuthenticated: true`, `user`
4. Si está vacío, reinicia el servidor: `npm run dev`

### "401 Unauthorized"
✅ **Solución:**
1. Verifica que el token existe en localStorage
2. Comprueba que el backend está corriendo en puerto 8000
3. Verifica que el header `Authorization: Bearer <token>` se envía

### "Página no carga"
✅ **Solución:**
1. Abre F12 → Network
2. Busca requests a `/api/`
3. Verifica que retornan 200
4. Si retornan 404, reinicia backend

---

## 📊 APIS POPULARES PARA TESTING

### Empleados
```bash
curl -X GET http://localhost:8000/api/employees/ \
  -H "Authorization: Bearer <TOKEN>"
```

### Candidatos
```bash
curl -X GET http://localhost:8000/api/candidates/ \
  -H "Authorization: Bearer <TOKEN>"
```

### Fábricas
```bash
curl -X GET http://localhost:8000/api/factories \
  -H "Authorization: Bearer <TOKEN>"
```

### Tarjetas de Tiempo
```bash
curl -X GET http://localhost:8000/api/timer-cards \
  -H "Authorization: Bearer <TOKEN>"
```

---

## ✅ VALIDACIÓN COMPLETA

```bash
# 1. Test de login
node verify_all_pages.js

# 2. Resultado esperado
Success Rate: 100%
✅ Exitosas: 9/9
```

---

**Resumen rápido:**
- **URL:** http://localhost:3000/login
- **Usuario:** admin
- **Password:** admin123
- **Todas las páginas funcionan después del login**

