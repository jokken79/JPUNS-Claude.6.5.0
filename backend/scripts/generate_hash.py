#!/usr/bin/env python3
"""Generate correct password hash"""
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

password = "admin123"
correct_hash = pwd_context.hash(password)

print(f"Password: {password}")
print(f"Hash: {correct_hash}")
print(f"Verification: {pwd_context.verify(password, correct_hash)}")
