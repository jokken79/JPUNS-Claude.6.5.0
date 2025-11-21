"""Azure Computer Vision configuration utilities."""

import logging
import os
from typing import Optional, Tuple

from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# Load default environment variables from a .env file if present.
load_dotenv()

AZURE_ENDPOINT: Optional[str] = os.getenv("AZURE_COMPUTER_VISION_ENDPOINT")
AZURE_KEY: Optional[str] = os.getenv("AZURE_COMPUTER_VISION_KEY_SECONDARY") or os.getenv("AZURE_COMPUTER_VISION_KEY")
AZURE_API_VERSION: str = os.getenv("AZURE_COMPUTER_VISION_API_VERSION", "2023-02-01-preview")


def azure_credentials_available() -> bool:
    """Return True when both the endpoint and key are configured."""

    return bool(AZURE_ENDPOINT and AZURE_KEY)


def get_azure_credentials() -> Tuple[Optional[str], Optional[str]]:
    """Expose the configured Azure Computer Vision credentials."""

    if not azure_credentials_available():
        logger.warning("Azure Computer Vision credentials are not configured")
    return AZURE_ENDPOINT, AZURE_KEY
