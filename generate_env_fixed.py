#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate .env file from .env.example

This script copies .env.example to .env if it doesn't exist.
Required for initial setup on Linux/macOS.

Usage:
    python generate_env_fixed.py
"""

import shutil
import os
import sys
import secrets
from pathlib import Path

def generate_secure_token(length=32):
    """Generate a cryptographically secure random token"""
    return secrets.token_hex(length)

def main():
    """Generate .env file from .env.example with unique secrets"""

    env_example = Path('.env.example')
    env_file = Path('.env')

    # Check if .env.example exists
    if not env_example.exists():
        print("Error: .env.example not found")
        sys.exit(1)

    # Check if .env already exists
    if env_file.exists():
        print(f".env already exists, skipping generation")
        return 0

    try:
        # Read .env.example with UTF-8 encoding
        with open(env_example, 'r', encoding='utf-8') as f:
            content = f.read()

        # Generate unique secrets
        secret_key = generate_secure_token(32)  # 64 hex characters
        postgres_password = generate_secure_token(16)  # Strong password
        redis_password = generate_secure_token(16)
        grafana_password = generate_secure_token(16)

        # Replace placeholders with generated values
        content = content.replace('change-me-to-a-64-byte-token', secret_key)
        # Replace all instances of change-me-in-local with generated passwords
        content = content.replace('POSTGRES_PASSWORD=change-me-in-local', f'POSTGRES_PASSWORD={postgres_password}')
        content = content.replace('REDIS_PASSWORD=change-me-in-local', f'REDIS_PASSWORD={redis_password}')
        content = content.replace('GRAFANA_ADMIN_PASSWORD=change-me-in-local', f'GRAFANA_ADMIN_PASSWORD={grafana_password}')
        # Also update DATABASE_URL with the new postgres password
        content = content.replace('change-me-in-local@localhost:5632', f'{postgres_password}@localhost:5632')

        # Write to .env with UTF-8 encoding
        with open(env_file, 'w', encoding='utf-8') as f:
            f.write(content)

        print(f"Created .env from .env.example")
        print(f"Generated unique SECRET_KEY: {secret_key[:16]}...")
        print("")
        print("Next steps:")
        print("1. Review .env and configure as needed:")
        print("   - POSTGRES_PASSWORD (auto-generated for Docker)")
        print("   - REDIS_PASSWORD (auto-generated for Docker)")
        print("   - GRAFANA_ADMIN_PASSWORD (auto-generated)")
        print("   - Azure credentials (if using OCR)")
        print("   - SMTP credentials (if sending emails)")
        print("")
        print("2. Start services:")
        print("   Windows: scripts\\START.bat")
        print("   Linux/macOS: docker compose up -d")
        print("")
        print("3. Wait 30 seconds for services to start")
        print("4. Test: curl http://localhost:8000/api/health")
        print("")

        return 0

    except Exception as e:
        print(f"Error creating .env: {e}")
        sys.exit(1)

if __name__ == "__main__":
    sys.exit(main())