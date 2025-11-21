"""Checkpoint management for import recovery."""
from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any, Dict, Iterator, Optional

logger = logging.getLogger(__name__)


@dataclass
class CheckpointState:
    """Represents the persisted checkpoint payload."""

    operation_id: str
    path: Path
    created_at: datetime
    updated_at: Optional[datetime]
    progress: Dict[str, Any]
    metadata: Dict[str, Any]


class CheckpointManager:
    """Manage resilient checkpoints that support recovery and cleanup."""

    def __init__(self, operation_id: str, checkpoint_dir: str = "/tmp/import_checkpoints") -> None:
        self.operation_id = operation_id
        self.checkpoint_dir = Path(checkpoint_dir)
        self.checkpoint_dir.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------------
    def checkpoint(self, *, progress: Dict[str, Any], metadata: Optional[Dict[str, Any]] = None) -> CheckpointState:
        """Persist a checkpoint snapshot and return its state."""

        metadata = metadata or {}
        timestamp = datetime.now(UTC).strftime("%Y%m%dT%H%M%S%f")
        file_path = self.checkpoint_dir / f"{self.operation_id}-{timestamp}.json"
        payload = {
            "operation_id": self.operation_id,
            "created_at": datetime.now(UTC).isoformat(),
            "progress": progress,
            "metadata": metadata,
        }

        with file_path.open("w", encoding="utf-8") as fp:
            json.dump(payload, fp, indent=2, default=str)

        logger.info("Checkpoint created at %s", file_path)
        return CheckpointState(
            operation_id=self.operation_id,
            path=file_path,
            created_at=datetime.fromisoformat(payload["created_at"]),
            updated_at=None,
            progress=progress,
            metadata=metadata,
        )

    # ------------------------------------------------------------------
    def load_checkpoint(self) -> Optional[CheckpointState]:
        """Return the most recent checkpoint state if one exists."""

        latest = None
        for path in self._iter_operation_files():
            if latest is None or path.stat().st_mtime > latest.stat().st_mtime:
                latest = path

        if latest is None:
            logger.debug("No checkpoints found for %s", self.operation_id)
            return None

        with latest.open("r", encoding="utf-8") as fp:
            payload = json.load(fp)

        updated_at = payload.get("updated_at")
        state = CheckpointState(
            operation_id=self.operation_id,
            path=latest,
            created_at=datetime.fromisoformat(payload["created_at"]),
            updated_at=datetime.fromisoformat(updated_at) if updated_at else None,
            progress=payload.get("progress", {}),
            metadata=payload.get("metadata", {}),
        )
        logger.info("Loaded checkpoint %s", latest)
        return state

    # ------------------------------------------------------------------
    def update_checkpoint(self, *, progress: Dict[str, Any], metadata: Optional[Dict[str, Any]] = None) -> CheckpointState:
        """Update the latest checkpoint (or create one if missing)."""

        current = self.load_checkpoint()
        if current is None:
            return self.checkpoint(progress=progress, metadata=metadata)

        metadata = metadata or current.metadata
        payload = {
            "operation_id": self.operation_id,
            "created_at": current.created_at.isoformat(),
            "updated_at": datetime.now(UTC).isoformat(),
            "progress": progress,
            "metadata": metadata,
        }

        with current.path.open("w", encoding="utf-8") as fp:
            json.dump(payload, fp, indent=2, default=str)

        logger.debug("Updated checkpoint %s", current.path)
        return CheckpointState(
            operation_id=self.operation_id,
            path=current.path,
            created_at=current.created_at,
            updated_at=datetime.fromisoformat(payload["updated_at"]),
            progress=progress,
            metadata=metadata,
        )

    # ------------------------------------------------------------------
    def cleanup_old_checkpoints(self, *, keep_days: int = 7) -> None:
        """Remove checkpoint files older than ``keep_days`` days."""

        threshold = datetime.now(UTC) - timedelta(days=keep_days)
        for path in self._iter_operation_files():
            created_at = datetime.fromtimestamp(path.stat().st_mtime, UTC)
            if created_at < threshold:
                logger.info("Removing stale checkpoint %s", path)
                path.unlink(missing_ok=True)

    def delete_all(self) -> None:
        """Remove every checkpoint for the operation."""

        for path in self._iter_operation_files():
            path.unlink(missing_ok=True)

    def list_checkpoints(self) -> list[Path]:
        return list(self._iter_operation_files())

    # ------------------------------------------------------------------
    def _iter_operation_files(self) -> Iterator[Path]:
        pattern = f"{self.operation_id}-*.json"
        yield from self.checkpoint_dir.glob(pattern)
