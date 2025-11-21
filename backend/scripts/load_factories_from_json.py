#!/usr/bin/env python
"""
Script para cargar configuraciones de fábricas desde archivos JSON a la base de datos.

Este script lee todos los archivos JSON en la carpeta config/factories
y carga cada uno como un registro en la tabla factories.

Uso:
    python load_factories_from_json.py [--all]

Opciones:
    --all    Procesar todos los archivos, incluso los ya existentes en la base de datos
"""
import os
import sys
import json
import logging
import argparse
from pathlib import Path
from typing import Dict, Any, List, Optional

# Añadir el directorio raíz al sys.path para poder importar módulos del proyecto
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.core.database import SessionLocal, engine
from app.models.models import Factory
from app.core.logging import app_logger

# Configuración de logs
logging.basicConfig(level=logging.INFO,
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Load factory configurations from JSON files to database.")
    parser.add_argument('--all', action='store_true', help='Process all files, even those already in the database')
    return parser.parse_args()


def get_factory_name_from_json(data: Dict[str, Any]) -> str:
    """Extract factory name from JSON data."""
    # Intentar obtener el nombre de diferentes ubicaciones en el JSON
    if "client_company" in data and "name" in data["client_company"]:
        # Limpiar espacios y tabulaciones
        name = data["client_company"]["name"].strip()
    elif "plant" in data and "name" in data["plant"]:
        name = f"{data['client_company']['name'].strip()} {data['plant']['name'].strip()}"
    else:
        # Si no se encuentra, usar el factory_id como nombre
        name = data.get("factory_id", "Unknown Factory")

    return name


def get_factory_address_from_json(data: Dict[str, Any]) -> Optional[str]:
    """Extract factory address from JSON data."""
    if "plant" in data and "address" in data["plant"]:
        return data["plant"]["address"].strip()
    elif "client_company" in data and "address" in data["client_company"]:
        return data["client_company"]["address"].strip()
    return None


def get_factory_phone_from_json(data: Dict[str, Any]) -> Optional[str]:
    """Extract factory phone from JSON data."""
    if "plant" in data and "phone" in data["plant"]:
        return data["plant"]["phone"].strip()
    elif "client_company" in data and "phone" in data["client_company"]:
        return data["client_company"]["phone"].strip()
    return None


def get_contact_person_from_json(data: Dict[str, Any]) -> Optional[str]:
    """Extract contact person from JSON data."""
    if "client_company" in data and "responsible_person" in data["client_company"]:
        person = data["client_company"]["responsible_person"]
        if "name" in person:
            return person["name"].strip()
    return None


def load_factory_json(file_path: str) -> Dict[str, Any]:
    """Load factory configuration from a JSON file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data
    except json.JSONDecodeError as e:
        logger.error(f"Error parsing JSON file {file_path}: {e}")
        return {}
    except Exception as e:
        logger.error(f"Error reading file {file_path}: {e}")
        return {}


def find_factory_files() -> List[str]:
    """Find all factory configuration JSON files."""
    factory_dir = Path(__file__).resolve().parent.parent.parent / "config" / "factories"

    if not factory_dir.exists():
        logger.error(f"Factory configuration directory not found: {factory_dir}")
        return []

    logger.info(f"Searching for JSON files in {factory_dir}")
    json_files = list(factory_dir.glob("*.json"))
    logger.info(f"Found {len(json_files)} JSON files")

    return [str(f) for f in json_files]


def create_or_update_factory(db: Session, factory_data: Dict[str, Any], force_update: bool = False):
    """Create or update a factory record in the database."""
    factory_id = factory_data.get("factory_id")
    if not factory_id:
        logger.warning("Factory JSON missing factory_id, skipping")
        return False

    # Check if factory already exists
    existing_factory = db.query(Factory).filter(Factory.factory_id == factory_id).first()

    if existing_factory and not force_update:
        logger.info(f"Factory {factory_id} already exists, skipping (use --all to update)")
        return False

    name = get_factory_name_from_json(factory_data)
    address = get_factory_address_from_json(factory_data)
    phone = get_factory_phone_from_json(factory_data)
    contact_person = get_contact_person_from_json(factory_data)

    try:
        if existing_factory:
            # Update existing factory
            existing_factory.name = name
            existing_factory.address = address
            existing_factory.phone = phone
            existing_factory.contact_person = contact_person
            existing_factory.config = factory_data
            db.commit()
            logger.info(f"Updated factory: {factory_id} - {name}")
        else:
            # Create new factory
            new_factory = Factory(
                factory_id=factory_id,
                name=name,
                address=address,
                phone=phone,
                contact_person=contact_person,
                config=factory_data,
                is_active=True
            )
            db.add(new_factory)
            db.commit()
            logger.info(f"Created new factory: {factory_id} - {name}")

        return True
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error with factory {factory_id}: {e}")
        return False
    except Exception as e:
        db.rollback()
        logger.error(f"Error processing factory {factory_id}: {e}")
        return False


def main():
    """Main function."""
    args = parse_arguments()

    logger.info("Starting factory configuration import")

    # Find JSON files
    json_files = find_factory_files()
    if not json_files:
        logger.warning("No factory configuration files found.")
        return

    # Initialize counters
    created = 0
    updated = 0
    skipped = 0
    errors = 0

    # Create database session
    db = SessionLocal()

    try:
        # Process each JSON file
        for file_path in json_files:
            file_name = os.path.basename(file_path)
            logger.info(f"Processing {file_name}")

            # Load JSON data
            factory_data = load_factory_json(file_path)
            if not factory_data:
                logger.error(f"Failed to load {file_name}, skipping")
                errors += 1
                continue

            # Create or update factory
            result = create_or_update_factory(db, factory_data, force_update=args.all)

            # Update counters
            if result:
                if db.query(Factory).filter(Factory.factory_id == factory_data.get("factory_id")).count() > 0:
                    updated += 1
                else:
                    created += 1
            else:
                skipped += 1

    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        errors += 1

    finally:
        db.close()

    # Print summary
    logger.info("Import complete!")
    logger.info(f"Factories created: {created}")
    logger.info(f"Factories updated: {updated}")
    logger.info(f"Factories skipped: {skipped}")
    logger.info(f"Errors: {errors}")


if __name__ == "__main__":
    main()