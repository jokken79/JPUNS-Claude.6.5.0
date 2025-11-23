"""
Script de inicialización automática de la base de datos
Se ejecuta al arrancar el backend para asegurar que el usuario admin existe
"""
import asyncio
from sqlalchemy import text
from app.core.database import engine, SessionLocal
from app.core.config import settings
from passlib.context import CryptContext
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def init_database():
    """Inicializa la base de datos con el usuario admin por defecto"""
    try:
        db = SessionLocal()

        # Verificar si existe el usuario admin
        result = db.execute(text("SELECT COUNT(*) FROM users WHERE username = 'admin'"))
        count = result.scalar()

        if count == 0:
            logger.info("Usuario admin no encontrado. Creando...")

            # Hash de la password 'admin123'
            password_hash = pwd_context.hash("admin123")

            # Insertar usuario admin
            db.execute(text("""
                INSERT INTO users (username, email, password_hash, role, full_name)
                VALUES (:username, :email, :password_hash, :role, :full_name)
            """), {
                "username": "admin",
                "email": "admin@uns-kikaku.com",
                "password_hash": password_hash,
                "role": "SUPER_ADMIN",
                "full_name": "System Administrator"
            })
            db.commit()
            logger.info("✅ Usuario admin creado exitosamente")
        else:
            logger.info("Usuario admin ya existe. Actualizando password...")

            # Actualizar password por si acaso
            password_hash = pwd_context.hash("admin123")

            db.execute(text("""
                UPDATE users
                SET password_hash = :password_hash,
                    role = :role,
                    email = :email,
                    full_name = :full_name
                WHERE username = :username
            """), {
                "username": "admin",
                "password_hash": password_hash,
                "role": "SUPER_ADMIN",
                "email": "admin@uns-kikaku.com",
                "full_name": "System Administrator"
            })
            db.commit()
            logger.info("✅ Usuario admin actualizado exitosamente")

        db.close()
        logger.info("✅ Inicialización de base de datos completada")

    except Exception as e:
        logger.error(f"❌ Error al inicializar base de datos: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(init_database())
