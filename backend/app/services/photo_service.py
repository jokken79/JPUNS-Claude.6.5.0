"""
Photo Service for automatic compression and processing
"""
from PIL import Image
import io
import base64
from typing import Optional, Tuple
import logging

logger = logging.getLogger(__name__)


class PhotoService:
    """Service for photo compression and processing"""

    @staticmethod
    def compress_photo(
        photo_data_url: str,
        max_width: int = 800,
        max_height: int = 1000,
        quality: int = 85
    ) -> str:
        """
        Compress photo to reduce size while maintaining quality

        Args:
            photo_data_url: Data URL with base64 encoded image (e.g., "data:image/jpeg;base64,...")
            max_width: Maximum width in pixels (default: 800)
            max_height: Maximum height in pixels (default: 1000)
            quality: JPEG quality 1-100 (default: 85, higher = better quality)

        Returns:
            Compressed photo as data URL string

        Example:
            >>> original = "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
            >>> compressed = PhotoService.compress_photo(original)
            >>> # Compressed image maintains aspect ratio and quality
        """
        try:
            # Validate input
            if not photo_data_url or not photo_data_url.startswith('data:image'):
                logger.warning("Invalid photo data URL format")
                return photo_data_url

            # Parse data URL: "data:image/jpeg;base64,<base64_data>"
            parts = photo_data_url.split(',', 1)
            if len(parts) != 2:
                logger.warning("Could not split data URL into prefix and data")
                return photo_data_url

            prefix, b64_data = parts

            # Decode base64 to bytes
            try:
                decoded = base64.b64decode(b64_data)
            except Exception as e:
                logger.error(f"Failed to decode base64 image data: {e}")
                return photo_data_url

            # Open image with PIL
            image = Image.open(io.BytesIO(decoded))

            # Convert to RGB if necessary (handle transparency)
            if image.mode in ('RGBA', 'P', 'LA'):
                # Create white background for transparent images
                background = Image.new('RGB', image.size, (255, 255, 255))
                if image.mode == 'P':
                    image = image.convert('RGBA')
                if 'A' in image.mode:
                    # Paste image on white background using alpha channel as mask
                    background.paste(image, mask=image.split()[-1])
                else:
                    background.paste(image)
                image = background
            elif image.mode != 'RGB':
                image = image.convert('RGB')

            # Get original dimensions and size
            original_width, original_height = image.size
            original_size = len(decoded)

            # Calculate new size maintaining aspect ratio
            if original_width > max_width or original_height > max_height:
                ratio = min(max_width / original_width, max_height / original_height)
                new_width = int(original_width * ratio)
                new_height = int(original_height * ratio)

                # Resize with high-quality Lanczos algorithm
                image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
                logger.info(
                    f"Resized image from {original_width}x{original_height} "
                    f"to {new_width}x{new_height}"
                )

            # Compress to JPEG with quality optimization
            output = io.BytesIO()
            image.save(output, format='JPEG', quality=quality, optimize=True)
            compressed_data = output.getvalue()
            compressed_size = len(compressed_data)

            # Calculate compression statistics
            compression_ratio = (1 - compressed_size / original_size) * 100
            logger.info(
                f"Compressed photo: {original_size:,} bytes → {compressed_size:,} bytes "
                f"({compression_ratio:.1f}% reduction)"
            )

            # Re-encode to base64
            compressed_b64 = base64.b64encode(compressed_data).decode('ascii')

            return f"data:image/jpeg;base64,{compressed_b64}"

        except Exception as e:
            logger.error(f"Error compressing photo: {e}", exc_info=True)
            # Return original on error to avoid data loss
            return photo_data_url

    @staticmethod
    def validate_photo_size(photo_data_url: str, max_size_mb: int = 5) -> bool:
        """
        Validate photo size is within acceptable limits

        Args:
            photo_data_url: Data URL with base64 encoded image
            max_size_mb: Maximum size in megabytes (default: 5)

        Returns:
            True if valid, False if exceeds max size

        Example:
            >>> data_url = "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
            >>> is_valid = PhotoService.validate_photo_size(data_url, max_size_mb=10)
            >>> if not is_valid:
            ...     raise ValueError("Photo exceeds 10MB")
        """
        if not photo_data_url or not photo_data_url.startswith('data:image'):
            return True  # Empty or invalid format passes validation

        parts = photo_data_url.split(',', 1)
        if len(parts) != 2:
            return True

        b64_data = parts[1]

        try:
            decoded = base64.b64decode(b64_data)
            size_mb = len(decoded) / (1024 * 1024)
            is_valid = size_mb <= max_size_mb

            if not is_valid:
                logger.warning(f"Photo size {size_mb:.2f}MB exceeds limit of {max_size_mb}MB")

            return is_valid
        except Exception as e:
            logger.error(f"Error validating photo size: {e}")
            return False

    @staticmethod
    def get_photo_dimensions(photo_data_url: str) -> Optional[Tuple[int, int]]:
        """
        Get photo dimensions (width, height)

        Args:
            photo_data_url: Data URL with base64 encoded image

        Returns:
            Tuple of (width, height) in pixels, or None if invalid

        Example:
            >>> data_url = "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
            >>> dimensions = PhotoService.get_photo_dimensions(data_url)
            >>> if dimensions:
            ...     width, height = dimensions
            ...     print(f"Photo is {width}x{height} pixels")
        """
        if not photo_data_url or not photo_data_url.startswith('data:image'):
            return None

        parts = photo_data_url.split(',', 1)
        if len(parts) != 2:
            return None

        try:
            decoded = base64.b64decode(parts[1])
            image = Image.open(io.BytesIO(decoded))
            width, height = image.size
            logger.debug(f"Photo dimensions: {width}x{height}")
            return (width, height)
        except Exception as e:
            logger.error(f"Error getting photo dimensions: {e}")
            return None

    @staticmethod
    def get_photo_info(photo_data_url: str) -> Optional[dict]:
        """
        Get comprehensive photo information

        Args:
            photo_data_url: Data URL with base64 encoded image

        Returns:
            Dictionary with photo information or None if invalid

        Example:
            >>> data_url = "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
            >>> info = PhotoService.get_photo_info(data_url)
            >>> print(f"Size: {info['size_mb']:.2f}MB, Dimensions: {info['dimensions']}")
        """
        if not photo_data_url or not photo_data_url.startswith('data:image'):
            return None

        parts = photo_data_url.split(',', 1)
        if len(parts) != 2:
            return None

        try:
            prefix, b64_data = parts
            decoded = base64.b64decode(b64_data)
            image = Image.open(io.BytesIO(decoded))

            # Extract format from prefix (e.g., "data:image/jpeg;base64")
            format_match = prefix.split(':')[1].split(';')[0]  # "image/jpeg"
            image_format = format_match.split('/')[1].upper()  # "JPEG"

            return {
                'format': image_format,
                'mode': image.mode,
                'dimensions': image.size,
                'width': image.size[0],
                'height': image.size[1],
                'size_bytes': len(decoded),
                'size_mb': len(decoded) / (1024 * 1024),
                'size_kb': len(decoded) / 1024,
            }
        except Exception as e:
            logger.error(f"Error getting photo info: {e}")
            return None


# Global singleton instance
photo_service = PhotoService()
