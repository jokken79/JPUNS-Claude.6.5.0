"""
Script para eliminar una fábrica de la base de datos
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.database import SessionLocal
from app.models.models import Factory


def delete_factory(factory_id: str):
    """Delete a factory by factory_id"""
    db = SessionLocal()

    try:
        # Find factory
        factory = db.query(Factory).filter(Factory.factory_id == factory_id).first()

        if not factory:
            print(f"❌ Factory '{factory_id}' not found")
            return False

        # Show factory details before deletion
        print(f"\n📋 Factory to delete:")
        print(f"   ID: {factory.factory_id}")
        print(f"   Name: {factory.name}")
        print(f"   Company: {factory.company_name or 'N/A'}")
        print(f"   Plant: {factory.plant_name or 'N/A'}")

        # Ask for confirmation
        response = input(f"\n⚠️  Are you sure you want to delete this factory? (yes/no): ")

        if response.lower() != 'yes':
            print("❌ Deletion cancelled")
            return False

        # Delete factory
        db.delete(factory)
        db.commit()

        print(f"✅ Factory '{factory_id}' deleted successfully!")
        return True

    except Exception as e:
        db.rollback()
        print(f"❌ Error deleting factory: {str(e)}")
        return False

    finally:
        db.close()


def main():
    """Main function"""
    if len(sys.argv) < 2:
        print("Usage: python delete_factory.py <factory_id>")
        print("\nExample:")
        print("  python delete_factory.py FACTORY-001")
        print("  python delete_factory.py トヨタ自動車株式会社_高岡工場")
        return

    factory_id = sys.argv[1]
    delete_factory(factory_id)


if __name__ == "__main__":
    main()
