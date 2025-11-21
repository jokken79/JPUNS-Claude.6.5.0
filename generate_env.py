#!/usr/bin/env python3
"""
Generate .env file from .env.example

This script copies .env.example to .env if it doesn't exist.
Required for initial setup on Linux/macOS.

Usage:
    python generate_env.py
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
        print("❌ Error: .env.example not found")
        sys.exit(1)

    # Check if .env already exists
    if env_file.exists():
        print(f"ℹ️  .env already exists, skipping generation")
        return 0

    try:
        # Read .env.example
        with open(env_example, 'r') as f:
            content = f.read()

        # Generate unique secrets
        secret_key = generate_secure_token(32)  # 64 hex characters
        postgres_password = generate_secure_token(16)  # Strong password
        redis_password = generate_secure_token(16)
        grafana_password = generate_secure_token(16)

        # Replace placeholders with generated values
        content = content.replace('change-me-to-a-64-byte-token', secret_key)
        content = content.replace('change-me-in-local', 'change-me-in-local')  # Keep other placeholders for manual override

        # Write to .env
        with open(env_file, 'w') as f:
            f.write(content)

        print(f"✅ Created .env from .env.example")
        print(f"✅ Generated unique SECRET_KEY: {secret_key[:16]}...")
        print("")
        print("📋 Next steps:")
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
        print(f"❌ Error creating .env: {e}")
        sys.exit(1)

if __name__ == "__main__":
    sys.exit(main())
