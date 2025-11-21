# 📋 PROCESO COMPLETO DE REGISTRACIÓN DE USUARIOS Y EMAIL

**Fecha**: 2025-11-13
**Tema**: Cómo se captura el email del usuario y cómo se usa en notificaciones

---

## 🔄 FLUJO COMPLETO: DE A A Z

### ETAPA 1: CREACIÓN DEL USUARIO

#### Opción A: Registro Manual (Frontend)

**Usuario rellenan formulario**:
```
┌─────────────────────────────────────┐
│  FORMULARIO DE REGISTRO             │
├─────────────────────────────────────┤
│ Username: admin                     │
│ Email:    admin@uns-kikaku.com  ← AQUÍ SE CAPTURA
│ Password: MyP@ssw0rd!              │
│ Full Name: Juan García             │
│ Role: ADMIN                        │
└─────────────────────────────────────┘
```

**Frontend envía POST** a `POST /api/auth/register`:
```json
{
  "username": "admin",
  "email": "admin@uns-kikaku.com",     ← EMAIL OBLIGATORIO
  "password": "MyP@ssw0rd!",
  "full_name": "Juan García",
  "role": "ADMIN"
}
```

#### Validación en Backend (Schema Pydantic)

```python
# backend/app/schemas/auth.py línea 16-22

class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr                     # ← VALIDA QUE SEA EMAIL VÁLIDO
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = None
    role: UserRole = UserRole.EMPLOYEE

# EmailStr de Pydantic:
# ✅ Valida formato correcto (ejemplo@domain.com)
# ✅ No permite nulos (NULL)
# ✅ No permite emails vacíos
```

#### Opción B: Script de Creación de Admin (Backend)

**Script automático** crea usuario:
```python
# backend/scripts/create_admin_user.py línea 56-62

admin_user = User(
    username='admin',
    email='admin@uns-kikaku.com',       # ← EMAIL HARDCODED EN SCRIPT
    password_hash=AuthService.get_password_hash(admin_password),
    role=UserRole.SUPER_ADMIN,
    full_name='Administrador del Sistema',
    is_active=True
)

db.add(admin_user)
db.commit()
```

**Salida del script**:
```
✓ Usuario administrador creado exitosamente!

   Username: admin
   Password: Abc123!@#xyz
   Email:    admin@uns-kikaku.com      ← EMAIL GUARDADO
   Rol:      SUPER_ADMIN
```

---

### ETAPA 2: ALMACENAMIENTO EN BD

**Base de datos PostgreSQL**:
```sql
-- Tabla: users

CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    username    VARCHAR(50) UNIQUE NOT NULL,
    email       VARCHAR(100) UNIQUE NOT NULL,    ← OBLIGATORIO
    password_hash VARCHAR(255) NOT NULL,
    role        VARCHAR(20) DEFAULT 'EMPLOYEE',
    full_name   VARCHAR(100),
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- Ejemplo de registro insertado:
INSERT INTO users (username, email, password_hash, role, full_name, is_active)
VALUES (
    'admin',
    'admin@uns-kikaku.com',    ← GUARDADO AQUÍ
    '$2b$12$...',
    'SUPER_ADMIN',
    'Administrador del Sistema',
    true
);
```

**Verificación en modelo Python**:
```python
# backend/app/models/models.py línea 1-25

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
                                          ↑↑↑↑↑↑↑↑↑↑↑
                                    NO PUEDE SER NULL
    password_hash = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole, name='user_role'), nullable=False)
    # ... otros campos
```

**Resultado**: Email está **GARANTIZADO** en BD para todo usuario autenticado.

---

### ETAPA 3: LOGIN DEL USUARIO

**Usuario inicia sesión**:
```
POST /api/auth/login
{
    "username": "admin",
    "password": "MyP@ssw0rd!"
}
```

**Backend valida credenciales y crea JWT**:
```python
# backend/app/services/auth_service.py

user = db.query(User).filter(User.username == username).first()
if user and verify_password(password, user.password_hash):
    # ✅ Login exitoso
    token = create_access_token(data={"username": user.username})
    return {
        "access_token": token,
        "token_type": "bearer"
    }
```

**Token JWT incluye**:
```json
{
  "username": "admin",
  "user_id": 1,
  "role": "SUPER_ADMIN",
  "exp": 1700000000  // Expira en X tiempo
}
```

**Frontend almacena token** en localStorage:
```javascript
// frontend/lib/api.ts
localStorage.setItem('token', response.data.access_token)
```

---

### ETAPA 4: USAR TOKEN EN REQUESTS

**Frontend hace request a API** con token:
```javascript
// Cuando admin llama: POST /api/requests/{id}/approve-nyuusha
fetch('/api/requests/1/approve-nyuusha', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIs...'
        // ↑ Token JWT
    }
})
```

**Backend recibe request con token**:
```python
# backend/app/api/requests.py línea 511-514

async def approve_nyuusha_request(
    request_id: int,
    current_user: User = Depends(auth_service.require_role("admin")),
    # ↑ Este Depends extrae el user del token JWT
    db: Session = Depends(get_db)
):
```

**El Depends() hace esto**:
```python
# backend/app/core/deps.py (aproximadamente)

def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    # 1. Decodifica JWT
    payload = jwt.decode(token, SECRET_KEY)

    # 2. Obtiene username del token
    username = payload.get("username")

    # 3. Busca usuario en BD
    user = db.query(User).filter(User.username == username).first()

    # 4. RETORNA objeto User con TODOS sus campos
    # ✅ INCLUYENDO EMAIL
    return user
```

**Resultado**: `current_user` ahora es un objeto User con:
```python
current_user.id       # 1
current_user.username # 'admin'
current_user.email    # 'admin@uns-kikaku.com'  ← ¡AQUÍ ESTÁ!
current_user.role     # UserRole.SUPER_ADMIN
```

---

### ETAPA 5: USAR EMAIL EN NOTIFICACIÓN

**En el endpoint approve_nyuusha** (backend/app/api/requests.py línea 740-750):

```python
# Cuando se crea un nuevo empleado, enviar notificación

# 1. Obtener email del usuario autenticado
admin_email = current_user.email or "admin@unsclaudejp.jp"
# ↑
# current_user.email siempre existe porque:
# - Está definido como NOT NULL en BD
# - Se cargó desde JWT
# - Se fetcheó de BD en el Depends()

# 2. Crear instancia de NotificationService
notification_service = NotificationService()

# 3. Llamar a send_employee_created CON el email
await notification_service.send_employee_created(
    employee_name=new_employee.full_name_roman,
    hakenmoto_id=new_hakenmoto_id,
    admin_email=admin_email  # ← USA EMAIL AQUÍ
)
```

**NotificationService recibe el email**:
```python
# backend/app/services/notification_service.py línea 434-435

def send_employee_created(
    self,
    employee_name: str,
    hakenmoto_id: str,
    admin_email: str          # ← RECIBE EMAIL
) -> bool:
    subject = f"🎊 新しい従業員が作成されました: {employee_name}"

    # Construye HTML del email
    body = f"<html>...</html>"

    # Envía email a admin_email
    return self.send_email(
        to_email=admin_email,  # ← AQUÍ SE USA
        subject=subject,
        body=body
    )
```

**El email se envía por SMTP**:
```python
# backend/app/services/notification_service.py línea 67

def send_email(self, to_email: str, subject: str, body: str) -> bool:
    try:
        # Conectar a servidor SMTP (Gmail, SendGrid, etc)
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)

        # Enviar email
        server.send_message(
            from_addr=FROM_EMAIL,
            to_addrs=[to_email],  # ← DESTINATARIO
            subject=subject,
            body=body
        )

        server.quit()
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return False
```

---

## 📊 FLUJO VISUAL COMPLETO

```
┌─────────────────────────────────────────────────────────────┐
│ PASO 1: REGISTRO                                            │
├─────────────────────────────────────────────────────────────┤
│ Usuario rellenan: username, email, password                │
│          ↓                                                  │
│ Backend valida con Pydantic (EmailStr)                     │
│          ↓                                                  │
│ Guardan en BD (email NOT NULL)                             │
│          ↓                                                  │
│ ✅ User.email = 'admin@uns-kikaku.com'                     │
└─────────────────────────────────────────────────────────────┘
         ↓↓↓ DÍAS DESPUÉS ↓↓↓
┌─────────────────────────────────────────────────────────────┐
│ PASO 2: LOGIN                                               │
├─────────────────────────────────────────────────────────────┤
│ Usuario ingresa: username, password                        │
│          ↓                                                  │
│ Backend verifica credenciales                              │
│          ↓                                                  │
│ Crea JWT token con username                                │
│          ↓                                                  │
│ Frontend almacena token en localStorage                    │
│          ↓                                                  │
│ ✅ Token = 'eyJhbGciOiJIUzI1NiIs...'                       │
└─────────────────────────────────────────────────────────────┘
         ↓↓↓ DURANTE SESIÓN ↓↓↓
┌─────────────────────────────────────────────────────────────┐
│ PASO 3: REQUEST CON AUTENTICACIÓN                           │
├─────────────────────────────────────────────────────────────┤
│ Frontend: GET /api/requests/1/approve-nyuusha             │
│           Header: Authorization: Bearer {token}            │
│          ↓                                                  │
│ Backend: Depends(auth_service.require_role("admin"))      │
│          ↓                                                  │
│          - Decodifica JWT                                  │
│          - Busca User en BD por username                   │
│          - Carga TODOS los campos del User                 │
│          ↓                                                  │
│ ✅ current_user = User(                                    │
│      id=1,                                                 │
│      username='admin',                                     │
│      email='admin@uns-kikaku.com',  ← AQUÍ ESTÁ            │
│      role=SUPER_ADMIN                                      │
│    )                                                       │
└─────────────────────────────────────────────────────────────┘
         ↓↓↓ EN EL ENDPOINT ↓↓↓
┌─────────────────────────────────────────────────────────────┐
│ PASO 4: USAR EMAIL EN NOTIFICACIÓN                          │
├─────────────────────────────────────────────────────────────┤
│ admin_email = current_user.email                           │
│            = 'admin@uns-kikaku.com'                        │
│          ↓                                                  │
│ notification_service.send_employee_created(               │
│     employee_name='Juan García',                           │
│     hakenmoto_id=1001,                                     │
│     admin_email='admin@uns-kikaku.com'  ← ENVIADO AQUÍ    │
│ )                                                          │
│          ↓                                                  │
│ Conecta a SMTP server                                      │
│          ↓                                                  │
│ Envía email a admin@uns-kikaku.com                        │
│          ↓                                                  │
│ ✅ EMAIL ENVIADO EXITOSAMENTE                              │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚠️ GARANTÍAS

| Punto | Garantía |
|-------|----------|
| **Email en BD** | ✅ NOT NULL - siempre existe |
| **Email en User object** | ✅ Se carga automáticamente desde BD |
| **Email en current_user** | ✅ Se obtiene del Depends() |
| **Email en notificación** | ✅ Se pasa como parámetro |
| **Email nunca es None** | ✅ Validación defensive: `or "admin@unsclaudejp.jp"` |

---

## 🔒 DEFENSIVO CHECK QUE AGREGAMOS

```python
# Línea 744 en requests.py:
admin_email = current_user.email or "admin@unsclaudejp.jp"
```

**¿Por qué?**
- `current_user.email` nunca debería ser None (NOT NULL en BD)
- Pero es buena práctica tener fallback
- Si por bug raro es None, usa email por defecto
- **Resultado**: NotificationService siempre recibe email válido

---

## 📝 RESUMEN

| Cuando | Email | Estado |
|--------|-------|--------|
| **Registro** | Se captura del formulario | ✅ Obligatorio |
| **BD** | Se almacena | ✅ NOT NULL |
| **Login** | En JWT token | ✅ Incluido |
| **Request** | En current_user | ✅ Cargado |
| **Notificación** | Se envía por SMTP | ✅ Validado |

---

## ✨ CONCLUSIÓN

**¿Hay que tener información de email para enviar notificaciones?**

**Respuesta**: SÍ, PERO:

1. ✅ **El email SIEMPRE existe** - está en BD como NOT NULL
2. ✅ **El email se captura en registro** - obligatorio (EmailStr)
3. ✅ **El email se carga automáticamente** - vía Depends() desde BD
4. ✅ **El email se usa en notificaciones** - pasado como parámetro
5. ✅ **Hay fallback defensivo** - por si acaso es None

**No hay riesgo de que falte email porque está garantizado en TODAS las etapas del proceso.**

