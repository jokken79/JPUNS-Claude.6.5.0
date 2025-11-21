"""Idempotency guard to prevent duplicate imports."""

from __future__ import annotations

import hashlib
import json
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


@dataclass
class IdempotencyStats:
    """Snapshot of idempotency state statistics."""

    total_processed: int
    total_duplicates: int
    cached_hashes: int


class IdempotencyGuard:
    """Prevent duplicate processing with optional persistence."""

    def __init__(
        self,
        operation_id: str,
        storage_dir: str = "/tmp/idempotency",
    ) -> None:
        self.operation_id = operation_id
        self.storage_path = Path(storage_dir) / f"{operation_id}.json"
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)

        self._hashes: Dict[str, str] = {}
        self._processed_count = 0
        self._duplicate_count = 0
        self._load_from_disk()

    # ------------------------------------------------------------------
    def _load_from_disk(self) -> None:
        if not self.storage_path.exists():
            return
        try:
            with self.storage_path.open("r", encoding="utf-8") as fp:
                data = json.load(fp)
        except (json.JSONDecodeError, OSError) as exc:  # pragma: no cover
            logger.warning("Failed to load idempotency cache: %s", exc)
            return

        if isinstance(data, dict):
            self._hashes.update({str(k): str(v) for k, v in data.items()})
            logger.debug("Loaded %s cached hashes for %s", len(self._hashes), self.operation_id)

    # ------------------------------------------------------------------
    def _hash(self, data: Any) -> str:
        json_str = json.dumps(data, sort_keys=True, default=str)
        return hashlib.sha256(json_str.encode("utf-8")).hexdigest()

    def should_process(self, data: Any) -> bool:
        fingerprint = self._hash(data)
        if fingerprint in self._hashes:
            self._duplicate_count += 1
            return False
        return True

    def mark_processed(self, data: Any, *, persist: bool = True) -> str:
        fingerprint = self._hash(data)
        self._hashes[fingerprint] = fingerprint
        self._processed_count += 1
        if persist:
            self.flush()
        return fingerprint

    def get_data_hash(self, data: Any) -> str:
        """Expose deterministic hashing for advanced use cases."""

        return self._hash(data)

    def flush(self) -> None:
        try:
            with self.storage_path.open("w", encoding="utf-8") as fp:
                json.dump(self._hashes, fp, indent=2)
        except OSError as exc:  # pragma: no cover - disk issues
            logger.warning("Unable to persist idempotency cache: %s", exc)

    def get_stats(self) -> Dict[str, int]:
        return {
            "total_processed": self._processed_count,
            "total_duplicates": self._duplicate_count,
            "cached_hashes": len(self._hashes),
        }

    def reset(self) -> None:
        self._hashes.clear()
        self._processed_count = 0
        self._duplicate_count = 0
        if self.storage_path.exists():
            self.storage_path.unlink(missing_ok=True)
        logger.info("Idempotency guard reset for %s", self.operation_id)
