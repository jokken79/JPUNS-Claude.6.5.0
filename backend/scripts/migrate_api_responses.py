#!/usr/bin/env python3
"""
FASE 4 #4: API Response Migration Script
==========================================

This script systematically migrates API endpoints from raw responses
to standardized response format using wrapper functions.

Usage:
    python -m scripts.migrate_api_responses --analyze
    python -m scripts.migrate_api_responses --migrate auth
    python -m scripts.migrate_api_responses --migrate all

Patterns to migrate:
    1. JSONResponse -> success_response()
    2. list responses -> paginated_response()
    3. creation responses -> created_response()
    4. deletion responses -> no_content_response()
    5. Plain dictionaries -> success_response()
"""

import re
import sys
from pathlib import Path
from typing import List, Dict, Optional
import ast

# Project root
PROJECT_ROOT = Path(__file__).parent.parent.parent


class APIResponseMigrator:
    """Migrates API endpoints to standardized response format."""

    def __init__(self):
        self.api_dir = PROJECT_ROOT / "backend" / "app" / "api"
        self.response_wrapper_import = (
            "from app.core.response import "
            "success_response, paginated_response, created_response, no_content_response"
        )

    def get_files_to_migrate(self) -> List[Path]:
        """Get list of API files that still need migration."""
        api_files = sorted(self.api_dir.glob("*.py"))
        files_to_migrate = []

        for f in api_files:
            if f.name in ["__init__.py", "deps.py", "logs.py", "contracts.py",
                         "audit.py", "role_permissions.py"]:
                continue

            content = f.read_text()
            # Check if already has response wrappers
            if "success_response" in content:
                continue

            files_to_migrate.append(f)

        return files_to_migrate

    def analyze_file(self, file_path: Path) -> Dict:
        """Analyze a file for response patterns."""
        content = file_path.read_text()

        stats = {
            "file": file_path.name,
            "has_imports": False,
            "response_model_count": len(re.findall(r'response_model=', content)),
            "json_response_count": len(re.findall(r'JSONResponse\(', content)),
            "dict_returns": len(re.findall(r'return\s+\{', content)),
            "list_returns": len(re.findall(r'return\s+\[', content)),
            "pydantic_returns": len(re.findall(r'return\s+\w+\(', content)),
        }

        return stats

    def analyze_all(self):
        """Analyze all files that need migration."""
        files = self.get_files_to_migrate()
        print(f"\n📊 API Response Migration Analysis")
        print(f"{'='*60}")
        print(f"\nFiles to migrate: {len(files)}\n")

        total_stats = {
            "response_model_count": 0,
            "json_response_count": 0,
            "dict_returns": 0,
            "list_returns": 0,
            "pydantic_returns": 0,
        }

        for f in files:
            stats = self.analyze_file(f)
            print(f"📄 {stats['file']:<25} | "
                  f"response_model: {stats['response_model_count']:2d} | "
                  f"JSONResponse: {stats['json_response_count']:2d} | "
                  f"dict: {stats['dict_returns']:2d}")

            for key in total_stats:
                total_stats[key] += stats[key]

        print(f"\n{'─'*60}")
        print(f"Total response_model definitions: {total_stats['response_model_count']}")
        print(f"Total JSONResponse calls: {total_stats['json_response_count']}")
        print(f"Total dict returns: {total_stats['dict_returns']}")
        print(f"\n✅ Analysis complete. Run with --migrate <file> to update.")

    def add_import_if_needed(self, content: str) -> str:
        """Add response wrapper imports to file."""
        if "from app.core.response import" in content:
            return content

        # Find the insertion point (after other app imports)
        lines = content.split('\n')
        insert_idx = 0

        for i, line in enumerate(lines):
            if line.startswith('from app.') or line.startswith('from fastapi'):
                insert_idx = i + 1

        lines.insert(insert_idx, self.response_wrapper_import)
        return '\n'.join(lines)

    def migrate_authentication_endpoints(self, content: str) -> str:
        """Migrate auth.py specific patterns."""
        # Skip response_model and use wrapper functions
        # But preserve OAuth2 token response format

        # For login endpoints returning tokens
        content = re.sub(
            r'return\s+\{\s*"access_token":\s+(\w+),\s*"refresh_token":\s+(\w+),\s*"token_type":\s+"bearer"\s*\}',
            r'return success_response(\n                data={\n                    "access_token": \1,\n                    "refresh_token": \2,\n                    "token_type": "bearer"\n                },\n                request=request\n            )',
            content
        )

        return content

    def migrate_list_endpoints(self, content: str) -> str:
        """Migrate list/paginated endpoints."""
        # Pattern: return [items] with pagination
        # TODO: This requires context-aware migration
        return content

    def migrate_file(self, file_name: str) -> bool:
        """Migrate a specific API file."""
        file_path = self.api_dir / file_name

        if not file_path.exists():
            print(f"❌ File not found: {file_name}")
            return False

        content = file_path.read_text()

        if "from app.core.response import" in content:
            print(f"✅ {file_name} already migrated")
            return True

        # Step 1: Add imports
        content = self.add_import_if_needed(content)

        # Step 2: Migrate specific patterns
        if file_name == "auth.py":
            content = self.migrate_authentication_endpoints(content)

        # Step 3: Write back
        file_path.write_text(content)

        print(f"✅ Migrated: {file_name}")
        return True


def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    migrator = APIResponseMigrator()
    command = sys.argv[1]

    if command == "--analyze":
        migrator.analyze_all()
    elif command == "--migrate":
        if len(sys.argv) < 3:
            print("Usage: migrate_api_responses.py --migrate <file|all>")
            sys.exit(1)

        target = sys.argv[2]
        if target == "all":
            files = migrator.get_files_to_migrate()
            for f in files:
                migrator.migrate_file(f.name)
        else:
            migrator.migrate_file(target)
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)


if __name__ == "__main__":
    main()
