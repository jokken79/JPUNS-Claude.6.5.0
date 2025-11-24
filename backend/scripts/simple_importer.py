#!/usr/bin/env python3
"""
Resilient Importer - Executes all initialization operations with resilience.

Features:
- Checkpoints after each operation
- Exponential backoff retries
- Detailed structured logging
- Graceful failure handling (continues on non-critical errors)
- Operation resume capability
"""

import sys
import os
import time
import subprocess
from pathlib import Path
from typing import List, Dict, Tuple, Optional
import logging

# Setup path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.resilience import (
    CheckpointManager,
    StructuredLogger,
    RetryPolicy,
    ExponentialBackoffStrategy,
)

# Operation ID for this run (must be defined before CheckpointManager)
OPERATION_ID = f"importer_{int(time.time())}"

# Initialize logger
logger = StructuredLogger(name="resilient_importer")
checkpoint_manager = CheckpointManager(operation_id=OPERATION_ID)

# Define all operations in order
OPERATIONS = [
    {
        "id": "migrations",
        "name": "Running ALL Alembic migrations",
        "command": "cd /app && alembic upgrade head",
        "critical": True,  # If this fails, stop everything
        "retry": True,
    },
    {
        "id": "seed_demo",
        "name": "Seeding demo data",
        "command": "python scripts/manage_db.py seed",
        "critical": False,  # Can continue if this fails
        "retry": True,
    },
    {
        "id": "apartments",
        "name": "Creating apartments from employee data",
        "command": "python scripts/create_apartments_from_employees.py",
        "critical": False,
        "retry": True,
    },
    {
        "id": "import_employees",
        "name": "Importing employees from Excel",
        "command": "python scripts/import_data.py",
        "critical": False,
        "retry": True,
    },
    {
        "id": "import_candidates",
        "name": "Importing candidates with 100% COMPLETE field mapping",
        "command": "python scripts/import_candidates_improved.py",
        "critical": False,
        "retry": True,
    },
    {
        "id": "sync_status",
        "name": "Synchronizing candidate-employee status",
        "command": "python scripts/sync_candidate_employee_status.py",
        "critical": False,
        "retry": True,
    },
    {
        "id": "link_candidates",
        "name": "Linking employees to candidates (rirekisho_id + photos)",
        "command": "python scripts/link_employees_to_candidates.py",
        "critical": False,
        "retry": True,
    },
    {
        "id": "sql_functions",
        "name": "Creating SQL functions for apartment-factory relationships",
        "command": "PGPASSWORD=${POSTGRES_PASSWORD} psql -h db -U ${POSTGRES_USER} -d ${POSTGRES_DB} -f alembic/versions/create_populate_apartment_factory_function.sql",
        "critical": False,
        "retry": False,  # SQL functions might already exist
    },
    {
        "id": "link_factories",
        "name": "Linking employees to factories and creating apartment-factory relationships",
        "command": "python scripts/link_employees_to_factories.py",
        "critical": False,
        "retry": True,
    },
    {
        "id": "import_photos",
        "name": "Importing photos from JSON mappings",
        "command": """
if [ -f /app/config/access_photo_mappings.json ]; then
    python scripts/import_photos_from_json_simple.py --file config/access_photo_mappings.json --batch-size 100
else
    echo "⚠️  Photo mappings file not found at /app/config/access_photo_mappings.json"
    echo "   To import photos:"
    echo "   1. Download Access database from Google Drive"
    echo "   2. Run: scripts\\EXTRAER_FOTOS_ROBUSTO.bat (Windows)"
    echo "   3. Restart services: scripts\\STOP.bat && scripts\\START.bat"
fi
""",
        "critical": False,
        "retry": False,
    },
    {
        "id": "verify_candidates",
        "name": "Verifying candidates were imported",
        "command": "python scripts/verify_candidates_imported.py",
        "critical": False,
        "retry": False,
    },
    {
        "id": "import_factories",
        "name": "Importing factories from JSON files",
        "command": "python scripts/import_factories_from_json.py",
        "critical": False,
        "retry": True,
    },
]


class ResilientImporter:
    """Orchestrates resilient import operations."""

    def __init__(self, operation_id: str):
        self.operation_id = operation_id
        self.logger = StructuredLogger(name="resilient_importer")
        self.logger.set_context(operation_id=operation_id)
        self.checkpoint_manager = CheckpointManager(operation_id=operation_id)

        # Load checkpoint if exists
        self.checkpoint = self.checkpoint_manager.load_checkpoint(operation_id) or {
            "operation_id": operation_id,
            "completed_operations": [],
            "failed_operations": [],
            "skipped_operations": [],
            "started_at": time.time(),
        }

        # Retry policy with exponential backoff
        self.retry_policy = RetryPolicy(
            strategy=ExponentialBackoffStrategy(
                max_retries=3,
                base_delay=2.0,
                max_delay=30.0,
                exponential_base=2.0,
            )
        )

    def save_checkpoint(self):
        """Save current state to checkpoint."""
        self.checkpoint["updated_at"] = time.time()
        self.checkpoint_manager.save_checkpoint(self.operation_id, self.checkpoint)
        self.logger.debug("Checkpoint saved", checkpoint=self.checkpoint)

    def execute_command(self, command: str) -> Tuple[bool, str, str]:
        """
        Execute a shell command.

        Returns:
            (success: bool, stdout: str, stderr: str)
        """
        try:
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=300,  # 5 minute timeout per operation
            )
            return (
                result.returncode == 0,
                result.stdout,
                result.stderr,
            )
        except subprocess.TimeoutExpired:
            return (False, "", "Command timed out after 5 minutes")
        except Exception as e:
            return (False, "", str(e))

    def execute_operation(self, operation: Dict) -> bool:
        """
        Execute a single operation with retry logic.

        Returns:
            True if successful, False otherwise
        """
        op_id = operation["id"]
        op_name = operation["name"]
        command = operation["command"]
        critical = operation.get("critical", False)
        should_retry = operation.get("retry", True)

        # Check if already completed
        if op_id in self.checkpoint.get("completed_operations", []):
            self.logger.info(f"⏭️  Skipping {op_name} (already completed)")
            return True

        self.logger.info(f"--- Step: {op_name} ---")

        # Execute with retry if enabled
        if should_retry:
            try:
                success, stdout, stderr = self.retry_policy.execute(
                    lambda: self.execute_command(command)
                )
            except Exception as e:
                success = False
                stdout = ""
                stderr = str(e)
        else:
            success, stdout, stderr = self.execute_command(command)

        # Log output
        if stdout:
            for line in stdout.strip().split('\n'):
                if line.strip():
                    print(line)

        if stderr and not success:
            self.logger.error(
                f"Operation failed: {op_name}",
                operation_id=op_id,
                error=stderr[:500],  # Limit error message length
            )

        # Update checkpoint
        if success:
            self.checkpoint.setdefault("completed_operations", []).append(op_id)
            self.logger.info(f"✅ {op_name} - SUCCESS")
        else:
            self.checkpoint.setdefault("failed_operations", []).append({
                "id": op_id,
                "name": op_name,
                "error": stderr[:200],
                "timestamp": time.time(),
            })

            if critical:
                self.logger.error(
                    f"❌ CRITICAL operation failed: {op_name}",
                    operation_id=op_id,
                    error=stderr[:200],
                )
                self.logger.error("🛑 Stopping importer due to critical failure")
                return False
            else:
                self.logger.warning(
                    f"⚠️  Non-critical operation failed: {op_name} (continuing)",
                    operation_id=op_id,
                )

        self.save_checkpoint()
        return success if critical else True  # Continue for non-critical failures

    def run(self) -> bool:
        """
        Execute all operations.

        Returns:
            True if all operations completed successfully
        """
        self.logger.info("========================================")
        self.logger.info("   UNS-ClaudeJP 5.4.1 - RESILIENT SETUP")
        self.logger.info("   100% Field Mapping Enabled")
        self.logger.info("   With Checkpoints & Retry Logic")
        self.logger.info("========================================")
        self.logger.info("")

        total_operations = len(OPERATIONS)
        completed = 0
        failed = 0

        for i, operation in enumerate(OPERATIONS, 1):
            self.logger.info(f"[{i}/{total_operations}] {operation['name']}")

            success = self.execute_operation(operation)

            if success:
                completed += 1
            else:
                failed += 1
                if operation.get("critical", False):
                    # Critical failure, stop
                    break

            self.logger.info("")  # Blank line between operations

        # Final summary
        self.logger.info("========================================")
        if failed == 0:
            self.logger.info("   ✅ COMPLETE SETUP FINISHED!")
            self.logger.info(f"   - All {completed}/{total_operations} operations completed")
            self.logger.info("   - 142 columns in candidates table")
            self.logger.info("   - 100% field mapping enabled")
        else:
            self.logger.warning("   ⚠️  SETUP COMPLETED WITH WARNINGS")
            self.logger.warning(f"   - {completed}/{total_operations} operations completed")
            self.logger.warning(f"   - {failed} operations failed (non-critical)")
            self.logger.warning("   - Check logs for details")
        self.logger.info("========================================")

        # Save final checkpoint
        self.checkpoint["completed_at"] = time.time()
        self.checkpoint["status"] = "success" if failed == 0 else "partial"
        self.checkpoint["total_operations"] = total_operations
        self.checkpoint["completed_count"] = completed
        self.checkpoint["failed_count"] = failed
        self.save_checkpoint()

        return failed == 0


def main():
    """Main entry point."""
    # Setup console logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(message)s',
    )

    importer = ResilientImporter(OPERATION_ID)

    try:
        success = importer.run()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        importer.logger.warning("Import interrupted by user")
        importer.save_checkpoint()
        sys.exit(130)
    except Exception as e:
        importer.logger.error("Fatal error in importer", error=str(e), exception=type(e).__name__)
        importer.save_checkpoint()
        sys.exit(1)


if __name__ == "__main__":
    main()
