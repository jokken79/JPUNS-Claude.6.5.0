#!/usr/bin/env python3
"""
verify_setup.py - Verificación automatizada de setup para PC nueva
UNS-ClaudeJP 5.2

Uso:
    python scripts/verify_setup.py
"""

import os
import sys
import subprocess
import json
from pathlib import Path


class SetupVerifier:
    """Verificador de setup del sistema"""

    def __init__(self):
        self.errors = []
        self.warnings = []
        self.success = []
        self.root_dir = Path(__file__).parent.parent
        os.chdir(self.root_dir)

    def print_header(self, text):
        """Imprimir encabezado formateado"""
        print("\n" + "=" * 80)
        print(f"  {text}")
        print("=" * 80 + "\n")

    def print_section(self, text):
        """Imprimir sección"""
        print(f"\n{'─' * 80}")
        print(f"📋 {text}")
        print('─' * 80)

    def check_command(self, command, name, optional=False):
        """Verificar que un comando esté disponible"""
        try:
            result = subprocess.run(
                [command, "--version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                version = result.stdout.split('\n')[0].strip()
                self.success.append(f"✅ {name} instalado: {version}")
                return True
            else:
                if optional:
                    self.warnings.append(f"⚠️  {name} no disponible (opcional)")
                else:
                    self.errors.append(f"❌ {name} no disponible")
                return False
        except (subprocess.TimeoutExpired, FileNotFoundError, Exception):
            if optional:
                self.warnings.append(f"⚠️  {name} no disponible (opcional)")
            else:
                self.errors.append(f"❌ {name} no encontrado")
            return False

    def check_docker_running(self):
        """Verificar que Docker Desktop esté corriendo"""
        try:
            result = subprocess.run(
                ["docker", "ps"],
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode == 0:
                self.success.append("✅ Docker Desktop corriendo")
                return True
            else:
                self.errors.append("❌ Docker Desktop NO está corriendo")
                return False
        except Exception as e:
            self.errors.append(f"❌ Error al verificar Docker: {str(e)}")
            return False

    def check_env_file(self):
        """Verificar archivo .env"""
        env_path = self.root_dir / ".env"
        env_example_path = self.root_dir / ".env.example"

        if not env_example_path.exists():
            self.errors.append("❌ .env.example no existe (debería estar en repositorio)")
            return False

        if not env_path.exists():
            self.errors.append("❌ .env NO existe - copiar de .env.example")
            self.errors.append("   Ejecutar: cp .env.example .env")
            return False

        self.success.append("✅ .env existe")

        # Leer .env y verificar variables obligatorias
        try:
            with open(env_path, 'r', encoding='utf-8') as f:
                env_content = f.read()

            required_vars = {
                'SECRET_KEY': 'change-me-to-a-64-byte-token',
                'POSTGRES_PASSWORD': 'change-me-in-local',
            }

            for var, default_value in required_vars.items():
                if var not in env_content:
                    self.errors.append(f"❌ Variable {var} falta en .env")
                elif default_value in env_content:
                    self.warnings.append(
                        f"⚠️  Variable {var} tiene valor por defecto (CAMBIAR)"
                    )
                else:
                    self.success.append(f"✅ Variable {var} configurada")

            return True

        except Exception as e:
            self.errors.append(f"❌ Error al leer .env: {str(e)}")
            return False

    def check_photo_mappings(self):
        """Verificar archivo de fotos"""
        photo_file = self.root_dir / "access_photo_mappings.json"

        if photo_file.exists():
            size_mb = photo_file.stat().st_size / (1024 * 1024)
            self.success.append(
                f"✅ access_photo_mappings.json encontrado ({size_mb:.1f} MB)"
            )

            # Verificar si es JSON válido
            try:
                with open(photo_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                photo_count = len(data.get('photos', []))
                self.success.append(f"   Contiene {photo_count} fotos")
            except Exception as e:
                self.warnings.append(f"⚠️  No se pudo validar JSON: {str(e)}")

            return True
        else:
            self.warnings.append("⚠️  access_photo_mappings.json NO encontrado")
            self.warnings.append("   Sistema funcionará sin fotos de candidatos")
            self.warnings.append("   Ver REQUIRED_FILES.md para obtenerlo")
            return False

    def check_frontend_dependencies(self):
        """Verificar dependencias de frontend"""
        node_modules = self.root_dir / "frontend" / "node_modules"

        if node_modules.exists():
            self.success.append("✅ node_modules instalado en frontend")
            return True
        else:
            self.warnings.append("⚠️  node_modules NO instalado en frontend")
            self.warnings.append("   Ejecutar: cd frontend && npm install --legacy-peer-deps")
            return False

    def check_ports(self):
        """Verificar puertos disponibles"""
        required_ports = {
            3000: "Frontend (Next.js)",
            8000: "Backend (FastAPI)",
            5432: "PostgreSQL",
            8080: "Adminer",
        }

        try:
            # En Windows usar netstat
            result = subprocess.run(
                ["netstat", "-ano"],
                capture_output=True,
                text=True,
                timeout=5
            )

            for port, service in required_ports.items():
                port_str = f":{port}"
                if port_str in result.stdout:
                    self.warnings.append(f"⚠️  Puerto {port} en uso ({service})")
                else:
                    self.success.append(f"✅ Puerto {port} disponible ({service})")

        except Exception as e:
            self.warnings.append(f"⚠️  No se pudo verificar puertos: {str(e)}")

    def check_git_lfs(self):
        """Verificar Git LFS (opcional)"""
        try:
            result = subprocess.run(
                ["git", "lfs", "version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                version = result.stdout.strip()
                self.success.append(f"✅ Git LFS instalado: {version}")
                return True
            else:
                self.warnings.append("⚠️  Git LFS no instalado (opcional)")
                self.warnings.append("   Necesario para archivos >100MB")
                self.warnings.append("   Instalar: https://git-lfs.github.com/")
                return False
        except Exception:
            self.warnings.append("⚠️  Git LFS no instalado (opcional)")
            return False

    def generate_report(self):
        """Generar reporte final"""
        self.print_header("📊 REPORTE DE VERIFICACIÓN")

        # Success
        if self.success:
            print("✅ CORRECTO:")
            for item in self.success:
                print(f"   {item}")

        # Warnings
        if self.warnings:
            print("\n⚠️  ADVERTENCIAS:")
            for item in self.warnings:
                print(f"   {item}")

        # Errors
        if self.errors:
            print("\n❌ ERRORES:")
            for item in self.errors:
                print(f"   {item}")

        # Summary
        print("\n" + "=" * 80)
        total = len(self.success) + len(self.warnings) + len(self.errors)
        print(f"  Total: {len(self.success)} OK | {len(self.warnings)} Advertencias | {len(self.errors)} Errores")
        print("=" * 80)

        if self.errors:
            print("\n⚠️  HAY ERRORES CRÍTICOS - Sistema NO funcionará correctamente")
            print("   Ver errores arriba y corregir antes de continuar")
            return False
        elif self.warnings:
            print("\n✅ Setup FUNCIONAL con advertencias menores")
            print("   Sistema funcionará pero con funcionalidad limitada")
            return True
        else:
            print("\n✅ Setup PERFECTO - Todo configurado correctamente")
            return True

    def run(self):
        """Ejecutar verificación completa"""
        self.print_header("🔍 VERIFICACIÓN DE SETUP - UNS-ClaudeJP 5.2")

        print("Verificando configuración del sistema...\n")

        # 1. Verificar comandos del sistema
        self.print_section("1. Comandos del Sistema")
        self.check_command("docker", "Docker")
        self.check_command("node", "Node.js")
        self.check_command("npm", "npm")
        self.check_command("python", "Python", optional=True)
        self.check_command("git", "Git")
        self.check_git_lfs()

        # 2. Verificar Docker corriendo
        self.print_section("2. Docker Desktop")
        self.check_docker_running()

        # 3. Verificar archivo .env
        self.print_section("3. Configuración (.env)")
        self.check_env_file()

        # 4. Verificar archivo de fotos
        self.print_section("4. Archivo de Fotos")
        self.check_photo_mappings()

        # 5. Verificar dependencias frontend
        self.print_section("5. Dependencias Frontend")
        self.check_frontend_dependencies()

        # 6. Verificar puertos
        self.print_section("6. Puertos Disponibles")
        self.check_ports()

        # Generar reporte
        success = self.generate_report()

        # Next steps
        if not success:
            print("\n📋 PRÓXIMOS PASOS:")
            print("   1. Corregir errores arriba")
            print("   2. Ejecutar este script de nuevo")
            print("   3. Cuando no haya errores, ejecutar: docker-compose up -d")
            print()
            sys.exit(1)
        else:
            print("\n📋 PRÓXIMOS PASOS:")
            if not any("Docker Desktop corriendo" in s for s in self.success):
                print("   1. Iniciar Docker Desktop")
                print("   2. Ejecutar: docker-compose up -d")
            else:
                print("   1. Ejecutar: docker-compose up -d")
                print("   2. Esperar 1-2 minutos")
                print("   3. Abrir: http://localhost:3000")
                print("   4. Login: admin / admin123")
            print()


if __name__ == "__main__":
    verifier = SetupVerifier()
    verifier.run()
