#!/usr/bin/env python3
"""Generate correct password hash"""
import os
import sys
import getpass
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Get password from environment variable or prompt user
password = os.getenv("ADMIN_PASSWORD")

if not password:
    print("ADMIN_PASSWORD environment variable not set.")
    print("Please enter the password to hash:")
    password = getpass.getpass("Password: ")

    if not password:
        print("❌ Error: Password cannot be empty")
        sys.exit(1)

correct_hash = pwd_context.hash(password)

print(f"Password: {'*' * len(password)} (hidden)")
print(f"Hash: {correct_hash}")
print(f"Verification: {pwd_context.verify(password, correct_hash)}")
