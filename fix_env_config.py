#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fix .env configuration with secure passwords
"""

import secrets
import re
from pathlib import Path

def generate_secure_password(length=20):
    """Generate a cryptographically secure password"""
    return secrets.token_urlsafe(length)

def fix_env_config():
    """Fix existing .env with secure passwords"""
    
    env_file = Path('.env')
    
    if not env_file.exists():
        print("❌ Error: .env file not found")
        return False
    
    try:
        # Read current .env
        with open(env_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Generate new secure passwords
        new_postgres_pass = generate_secure_password(24)
        new_redis_pass = generate_secure_password(24)
        new_grafana_pass = generate_secure_password(24)
        
        # Replace passwords using regex for precise replacement
        content = re.sub(
            r'POSTGRES_PASSWORD=.*',
            f'POSTGRES_PASSWORD={new_postgres_pass}',
            content
        )
        content = re.sub(
            r'REDIS_PASSWORD=.*',
            f'REDIS_PASSWORD={new_redis_pass}',
            content
        )
        content = re.sub(
            r'GRAFANA_ADMIN_PASSWORD=.*',
            f'GRAFANA_ADMIN_PASSWORD={new_grafana_pass}',
            content
        )
        
        # Update DATABASE_URL with new postgres password
        content = re.sub(
            r'postgresql://uns_admin:.*@localhost:5632',
            f'postgresql://uns_admin:{new_postgres_pass}@localhost:5632',
            content
        )
        
        # Write back to .env
        with open(env_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("CONFIGURACION SEGURA APLICADA")
        print("=" * 50)
        print(f"PostgreSQL Password: {new_postgres_pass[:12]}...")
        print(f"Redis Password: {new_redis_pass[:12]}...")
        print(f"Grafana Password: {new_grafana_pass[:12]}...")
        print("=" * 50)
        print("Guarda estas contraseñas en un lugar seguro")
        print("Los servicios se reiniciarán automáticamente")
        
        return True
        
    except Exception as e:
        print(f"Error fixing .env: {e}")
        return False

if __name__ == "__main__":
    success = fix_env_config()
    if success:
        print("\nConfiguracion corregida exitosamente")
    else:
        print("\nFallo la correccion de la configuracion")