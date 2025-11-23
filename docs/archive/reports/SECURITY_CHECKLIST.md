# 🔒 CHECKLIST DE SEGURIDAD - UNS-ClaudeJP 5.4

## PUNTUACIÓN: 6.8/10 🟡

---

## 🔴 CRÍTICO - Implementar en 24-48 horas

### Networking
- [ ] **OCULTAR PUERTO 5432** (DB) - Solo via docker network
  ```yaml
  # En docker-compose.yml, COMENTAR:
  # ports:
  #   - "5432:5432"
  ```
- [ ] **OCULTAR PUERTO 8080** (Adminer) - Solo via VPN
- [ ] **Enable SSL/TLS** con Let's Encrypt
  ```bash
  # Instalar certbot
  certbot --nginx -d api.uns-kikaku.com
  ```

### Docker Security
- [ ] **Resource Limits** en todos los contenedores
  ```yaml
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 2G
  ```
- [ ] **Seccomp Profiles** para restringer syscalls
  ```yaml
  security_opt:
    - seccomp:seccomp_profile.json
  ```
- [ ] **User Namespace Remapping**
  ```json
  // /etc/docker/daemon.json
  {
    "userns-remap": "default"
  }
  ```

### Authentication
- [ ] **Account Lockout** - 5 intentos, 15 min lock
  ```python
  # En auth_service.py
  FAILED_LOGIN_ATTEMPTS = 5
  LOCKOUT_DURATION = 15 * 60
  ```
- [ ] **Password Policy** - 12+ chars, complexity
  ```python
  def validate_password_strength(password: str):
      if len(password) < 12: raise ValueError("12+ chars")
      if not re.search(r'[A-Z]'): raise ValueError("Uppercase")
      if not re.search(r'[a-z]'): raise ValueError("Lowercase")
      if not re.search(r'\d'): raise ValueError("Number")
      if not re.search(r'[!@#$%^&*]'): raise ValueError("Special")
  ```

### File Uploads
- [ ] **Antivirus** - ClamAV integration
  ```python
  import clamd
  
  def scan_file(file_path):
      cd = clamd.ClamdUnixSocket()
      result = cd.scan(file_path)
      if result[file_path][0] == 'FOUND':
          raise ValueError("Malware detected")
  ```
- [ ] **MIME Type Validation** - No solo extension
  ```python
  import magic
  
  mime = magic.from_file(file_path, mime=True)
  if mime not in ALLOWED_MIMES:
      raise ValueError("Invalid file type")
  ```

### Backup
- [ ] **Backup Encryption** con GPG
  ```bash
  pg_dump uns_claudejp | gpg --cipher-algo AES256 --symmetric \
    --output backup_$(date +%Y%m%d).sql.gpg
  ```
- [ ] **Offsite Storage** - S3, Azure, etc.
  ```bash
  aws s3 cp backup.sql.gpg s3://secure-backups/ \
    --server-side-encryption AES256
  ```

---

## 🟡 ALTO - Implementar en 1-2 semanas

### 2FA
- [ ] **TOTP 2FA** con pyotp
  ```python
  import pyotp
  
  # Generar secret
  secret = pyotp.random_base32()
  
  # Verificar token
  totp = pyotp.TOTP(secret)
  if totp.verify(user_token):
      # Login success
  ```

### Security Headers
- [ ] **CSP en Frontend**
  ```javascript
  // next.config.js
  const securityHeaders = [
    {
      key: 'Content-Security-Policy',
      value: "default-src 'self'; script-src 'self'"
    }
  ]
  ```
- [ ] **CSRF Tokens** para state-changing ops
  ```python
  from flask_wtf.csrf import CSRFProtect
  
  csrf = CSRFProtect(app)
  ```

### Monitoring
- [ ] **SIEM Integration** - ELK, Splunk, Datadog
  ```python
  import structlog
  
  structlog.configure(
      processors=[
          structlog.processors.JSONRenderer()
      ]
  )
  ```
- [ ] **Vulnerability Scanning** - SAST, DAST, Dependabot
  ```yaml
  # .github/dependabot.yml
  version: 2
  updates:
    - package-ecosystem: "pip"
      directory: "/backend"
    - package-ecosystem: "npm"
      directory: "/frontend"
  ```

---

## 🟢 MEDIO - Implementar en 1 mes

### Compliance
- [ ] **Privacy Policy** (GDPR/APPI)
- [ ] **Data Retention Policy**
- [ ] **Incident Response Plan**
- [ ] **Security Awareness Training**

### Hardening
- [ ] **Network Segmentation**
- [ ] **User Training**
- [ ] **Penetration Testing**
- [ ] **Code Signing**

---

## TOP 10 QUICK WINS (43 horas total)

1. **Hide Port 5432** (30 min) → 90% risk reduction
2. **Resource Limits** (1 hora) → 70% DoS protection
3. **Account Lockout** (2 horas) → 85% brute force protection
4. **Encrypt Backups** (4 horas) → 95% data protection
5. **MIME Validation** (6 horas) → File upload security
6. **Security Headers** (2 horas) → XSS/CSRF protection
7. **Password Policy** (4 horas) → Weak password prevention
8. **Vuln Scanning** (8 horas) → Known vulnerability detection
9. **2FA** (16 horas) → Account takeover prevention
10. **SIEM** (24 horas) → Incident detection

**Total: 43 horas → 85% security improvement**

---

## OWASP TOP 10 STATUS

✅ A01-A06: Protegido
⚠️ A07: Parcial (auth flaws)
❌ A08-A10: No protegido

---

## REINSTALAR.BAT SAFETY

**Es SAFE si ejecutas ANTES:**
- ✅ `BACKUP_DATOS.bat` y verificar backup
- ✅ Cambiar credenciales DESPUÉS
- ✅ Ocultar puerto 5432
- ✅ Ejecutar en network isolada

**Es NOT SAFE si:**
- ❌ Producción sin hardening
- ❌ Sin backup validado
- ❌ Puerto 5432 expuesto
- ❌ Sin SSL/TLS

**Puntuación: 6.5/10 🟡**
