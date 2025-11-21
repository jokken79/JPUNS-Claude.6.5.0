"""Create initial admin user"""
import sys
import os
import secrets
import string
from dotenv import load_dotenv

sys.path.insert(0, '/app')

from app.core.database import SessionLocal
from app.models.models import User, UserRole
from app.services.auth_service import AuthService

# Load environment variables
load_dotenv()

db = SessionLocal()

def generate_secure_password(length=16):
    """Generate a cryptographically secure random password"""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    password = ''.join(secrets.choice(alphabet) for _ in range(length))
    return password

print("=" * 80)
print("CREANDO USUARIO ADMINISTRADOR INICIAL")
print("=" * 80)

# Check if admin already exists
existing_admin = db.query(User).filter(User.username == 'admin').first()

# Get admin password from environment
admin_password = os.getenv('ADMIN_PASSWORD')

if existing_admin:
    print("\n⚠ Usuario 'admin' ya existe")
    print(f"   Email: {existing_admin.email}")
    print(f"   Rol: {existing_admin.role.value}")

    # Si ADMIN_PASSWORD está en .env, actualizar la contraseña
    if admin_password:
        existing_admin.password_hash = AuthService.get_password_hash(admin_password)
        db.commit()
        print(f"\n✓ Contraseña actualizada desde ADMIN_PASSWORD en .env")
        print(f"   Password: {admin_password}")
    else:
        print(f"\n⚠  Para resetear la contraseña, configura ADMIN_PASSWORD en .env")
else:
    # Get admin password from environment or generate a secure one
    admin_password = os.getenv('ADMIN_PASSWORD')
    if not admin_password:
        admin_password = generate_secure_password()
        print(f"\n⚠  ADMIN_PASSWORD no establecido en .env. Generando password seguro:")

    # Create admin user
    admin_user = User(
        username='admin',
        email='admin@uns-kikaku.com',
        password_hash=AuthService.get_password_hash(admin_password),
        role=UserRole.SUPER_ADMIN,
        full_name='Administrador del Sistema',
        is_active=True
    )

    db.add(admin_user)
    db.commit()

    print("\n✓ Usuario administrador creado exitosamente!")
    print(f"\n   Username: admin")
    print(f"   Password: {admin_password}")
    print(f"   Email:    admin@uns-kikaku.com")
    print(f"   Rol:      SUPER_ADMIN")
    print(f"\n⚠  IMPORTANTE: Cambie esta contraseña en el primer inicio de sesión!")
    print(f"   O establezca ADMIN_PASSWORD en el archivo .env para uso automatizado")

# Create a test coordinator user
existing_coordinator = db.query(User).filter(User.username == 'coordinator').first()

if not existing_coordinator:
    # Get coordinator password from environment or generate a secure one
    coord_password = os.getenv('COORDINATOR_PASSWORD')
    if not coord_password:
        coord_password = generate_secure_password()

    coordinator_user = User(
        username='coordinator',
        email='coordinator@uns-kikaku.com',
        password_hash=AuthService.get_password_hash(coord_password),
        role=UserRole.COORDINATOR,
        full_name='Coordinador de Prueba',
        is_active=True
    )

    db.add(coordinator_user)
    db.commit()

    print("\n✓ Usuario coordinador creado!")
    print(f"\n   Username: coordinator")
    print(f"   Password: {coord_password}")
    print(f"   Email:    coordinator@uns-kikaku.com")
    print(f"   Rol:      COORDINATOR")

# Summary
print("\n" + "=" * 80)
print("USUARIOS CREADOS")
print("=" * 80)

all_users = db.query(User).all()
print(f"\nTotal usuarios: {len(all_users)}\n")

for user in all_users:
    status = "✓ ACTIVO" if user.is_active else "✗ INACTIVO"
    print(f"  {user.username:15s} | {user.role.value:15s} | {user.email:30s} | {status}")

print("\n" + "=" * 80)
print("ACCESO AL SISTEMA:")
print("=" * 80)
print("\nFrontend: http://localhost:3000")
print("Backend:  http://localhost:8000")
print("API Docs: http://localhost:8000/docs")
print("\n" + "=" * 80)

db.close()
