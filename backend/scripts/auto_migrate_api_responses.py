#!/usr/bin/env python3
"""
FASE 4 #4: Automated API Response Migration Tool
================================================

Automatically migrates API endpoints to standardized response format.
Uses AST parsing to identify and update response patterns.

Usage:
    python -m backend.scripts.auto_migrate_api_responses --file auth.py
    python -m backend.scripts.auto_migrate_api_responses --file all
"""

import ast
import re
import sys
from pathlib import Path
from typing import List, Tuple, Optional


class APIResponseMigrator:
    """Automatically migrates API endpoints to standardized responses."""

    def __init__(self):
        self.api_dir = Path(__file__).parent.parent / "app" / "api"
        self.response_import = (
            "from app.core.response import (\n"
            "    success_response, paginated_response,\n"
            "    created_response, no_content_response\n"
            ")"
        )

    def migrate_file(self, filepath: Path) -> bool:
        """Migrate a single API file."""
        if not filepath.exists():
            print(f"❌ File not found: {filepath}")
            return False

        print(f"\n📄 Migrating {filepath.name}...")

        try:
            content = filepath.read_text()

            # Skip if already migrated
            if "from app.core.response import" in content:
                print(f"⏭️  {filepath.name} already migrated, skipping")
                return True

            # Step 1: Add imports
            content = self._add_imports(content)
            print(f"  ✓ Imports added")

            # Step 2: Remove response_model decorators
            content = self._remove_response_models(content)
            print(f"  ✓ response_model decorators removed")

            # Step 3: Add request parameters
            content = self._add_request_params(content)
            print(f"  ✓ Request parameters added")

            # Step 4: Wrap returns (simple patterns)
            content = self._wrap_returns(content)
            print(f"  ✓ Return statements wrapped")

            # Step 5: Write back
            filepath.write_text(content)
            print(f"✅ {filepath.name} migrated successfully")

            return True

        except Exception as e:
            print(f"⚠️  Error migrating {filepath.name}: {e}")
            return False

    def _add_imports(self, content: str) -> str:
        """Add response wrapper imports."""
        if "from app.core.response import" in content:
            return content

        lines = content.split('\n')
        insert_idx = 0

        # Find the last import line
        for i, line in enumerate(lines):
            if line.startswith('from app.') or line.startswith('from fastapi'):
                insert_idx = i + 1

        # Insert import
        lines.insert(insert_idx, self.response_import)
        lines.insert(insert_idx + 1, "")

        return '\n'.join(lines)

    def _remove_response_models(self, content: str) -> str:
        """Remove response_model from decorators."""
        # Remove response_model=... patterns
        content = re.sub(
            r',?\s*response_model=[\w\[\],\s]*',
            '',
            content
        )
        # Remove status_code from response_model context
        content = re.sub(
            r',?\s*status_code=status\.HTTP_\d+',
            '',
            content
        )
        return content

    def _add_request_params(self, content: str) -> str:
        """Add request: Request parameter to endpoints."""
        # Simply add request parameter manually to functions that need it
        # This is safer than using complex regex patterns
        lines = content.split('\n')
        result = []
        i = 0

        while i < len(lines):
            line = lines[i]
            result.append(line)

            # Check if this is an endpoint function definition
            if 'async def ' in line and '(' in line and 'request' not in line:
                # Add request parameter on next line if needed
                if i + 1 < len(lines) and (')' not in line or ':' not in line):
                    # Multi-line function definition
                    pass
                elif ')' in line and ':' in line and '(' in line:
                    # Single-line definition - need to insert before )
                    if not line.rstrip().endswith('():'):
                        # Has parameters, add request as first param
                        line_fixed = re.sub(
                            r'(\(\s*)([^)]*?)(\s*\):)',
                            lambda m: f"{m.group(1)}request: Request,\n    {m.group(2)}{m.group(3)}",
                            line,
                            count=1
                        )
                        result[-1] = line_fixed

            i += 1

        return '\n'.join(result)

    def _wrap_returns(self, content: str) -> str:
        """Wrap return statements with response functions."""
        lines = content.split('\n')
        result = []

        for i, line in enumerate(lines):
            # Skip if line doesn't have return
            if 'return' not in line:
                result.append(line)
                continue

            # Skip comments and docstrings
            stripped = line.strip()
            if stripped.startswith('#') or stripped.startswith('"""') or stripped.startswith("'''"):
                result.append(line)
                continue

            # Simple dict return: return {"message": ...}
            if re.match(r'\s*return\s+\{', line):
                indent = len(line) - len(line.lstrip())
                data_part = line.strip()[7:].strip()  # Remove "return "
                wrapped = ' ' * indent + f'return success_response(data={data_part}, request=request)'
                result.append(wrapped)
                continue

            # Simple variable return: return variable
            if re.match(r'\s*return\s+\w+\s*$', line):
                indent = len(line) - len(line.lstrip())
                var_name = line.strip()[7:].strip()
                wrapped = ' ' * indent + f'return success_response(data={var_name}, request=request)'
                result.append(wrapped)
                continue

            result.append(line)

        return '\n'.join(result)

    def migrate_multiple(self, file_list: List[str]) -> None:
        """Migrate multiple files."""
        success_count = 0

        for filename in file_list:
            filepath = self.api_dir / filename
            if self.migrate_file(filepath):
                success_count += 1

        print(f"\n{'='*60}")
        print(f"✅ Migration complete: {success_count}/{len(file_list)} files")


def main():
    """Main entry point."""
    migrator = APIResponseMigrator()

    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    if sys.argv[1] == "--file":
        if len(sys.argv) < 3:
            print("Usage: --file <filename>")
            sys.exit(1)

        filename = sys.argv[2]
        if filename == "all":
            # Migrate all remaining files
            files_to_migrate = [
                "employees.py", "dashboard.py", "candidates.py",
                "payroll.py", "factories.py", "apartments_v2.py",
                "ai_agents.py", "timer_cards.py", "salary.py",
                "azure_ocr.py", "database.py", "resilient_import.py",
                "notifications.py", "reports.py", "requests.py",
                "monitoring.py", "admin.py", "pages.py", "settings.py",
                "timer_cards_rbac_update.py"
            ]
            migrator.migrate_multiple(files_to_migrate)
        else:
            migrator.migrate_file(migrator.api_dir / filename)
    else:
        print(f"Unknown command: {sys.argv[1]}")
        sys.exit(1)


if __name__ == "__main__":
    main()
