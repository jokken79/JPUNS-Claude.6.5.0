"""
Test script for photo compression service

Usage:
    python backend/scripts/test_photo_compression.py
"""
import sys
import os
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

from app.services.photo_service import photo_service
import base64
from PIL import Image
import io


def create_test_image(width: int, height: int, format: str = 'JPEG') -> str:
    """Create a test image data URL"""
    # Create a colorful gradient image
    image = Image.new('RGB', (width, height))
    pixels = image.load()

    for y in range(height):
        for x in range(width):
            # Create gradient effect
            r = int(255 * x / width)
            g = int(255 * y / height)
            b = 128
            pixels[x, y] = (r, g, b)

    # Convert to data URL
    buffer = io.BytesIO()
    image.save(buffer, format=format, quality=95)
    b64_data = base64.b64encode(buffer.getvalue()).decode('ascii')

    return f"data:image/{format.lower()};base64,{b64_data}"


def test_compression():
    """Test photo compression with various scenarios"""

    print("=" * 80)
    print("PHOTO COMPRESSION SERVICE TEST")
    print("=" * 80)
    print()

    # Test 1: Large photo compression
    print("Test 1: Compressing large photo (2000x2500 pixels)")
    print("-" * 80)
    large_photo = create_test_image(2000, 2500)
    original_info = photo_service.get_photo_info(large_photo)
    print(f"Original: {original_info['width']}x{original_info['height']} pixels, "
          f"{original_info['size_mb']:.2f}MB ({original_info['size_kb']:.1f}KB)")

    compressed = photo_service.compress_photo(large_photo)
    compressed_info = photo_service.get_photo_info(compressed)
    print(f"Compressed: {compressed_info['width']}x{compressed_info['height']} pixels, "
          f"{compressed_info['size_mb']:.2f}MB ({compressed_info['size_kb']:.1f}KB)")

    reduction = (1 - compressed_info['size_bytes'] / original_info['size_bytes']) * 100
    print(f"Reduction: {reduction:.1f}%")
    print()

    # Test 2: Small photo (no compression needed)
    print("Test 2: Small photo (640x480 pixels)")
    print("-" * 80)
    small_photo = create_test_image(640, 480)
    original_info = photo_service.get_photo_info(small_photo)
    print(f"Original: {original_info['width']}x{original_info['height']} pixels, "
          f"{original_info['size_mb']:.2f}MB ({original_info['size_kb']:.1f}KB)")

    compressed = photo_service.compress_photo(small_photo)
    compressed_info = photo_service.get_photo_info(compressed)
    print(f"Compressed: {compressed_info['width']}x{compressed_info['height']} pixels, "
          f"{compressed_info['size_mb']:.2f}MB ({compressed_info['size_kb']:.1f}KB)")

    reduction = (1 - compressed_info['size_bytes'] / original_info['size_bytes']) * 100
    print(f"Reduction: {reduction:.1f}%")
    print()

    # Test 3: Validation
    print("Test 3: Photo size validation")
    print("-" * 80)

    # Create a "large" test photo
    huge_photo = create_test_image(4000, 5000)
    huge_info = photo_service.get_photo_info(huge_photo)

    # Test validation with different limits
    print(f"Test photo size: {huge_info['size_mb']:.2f}MB")
    print(f"Valid for 5MB limit: {photo_service.validate_photo_size(huge_photo, 5)}")
    print(f"Valid for 10MB limit: {photo_service.validate_photo_size(huge_photo, 10)}")
    print(f"Valid for 20MB limit: {photo_service.validate_photo_size(huge_photo, 20)}")
    print()

    # Test 4: Aspect ratio preservation
    print("Test 4: Aspect ratio preservation")
    print("-" * 80)
    test_sizes = [
        (1200, 800),   # Landscape
        (800, 1200),   # Portrait
        (1000, 1000),  # Square
        (1920, 1080),  # 16:9
    ]

    for width, height in test_sizes:
        photo = create_test_image(width, height)
        original_ratio = width / height

        compressed = photo_service.compress_photo(photo)
        info = photo_service.get_photo_info(compressed)

        compressed_ratio = info['width'] / info['height']
        ratio_diff = abs(original_ratio - compressed_ratio)

        print(f"{width}x{height} → {info['width']}x{info['height']} "
              f"(ratio: {original_ratio:.3f} → {compressed_ratio:.3f}, "
              f"diff: {ratio_diff:.4f})")

    print()

    # Test 5: Custom compression settings
    print("Test 5: Custom compression settings")
    print("-" * 80)
    test_photo = create_test_image(1600, 1200)
    original_info = photo_service.get_photo_info(test_photo)

    print(f"Original: {original_info['size_kb']:.1f}KB")

    # Test different quality settings
    for quality in [60, 75, 85, 95]:
        compressed = photo_service.compress_photo(test_photo, quality=quality)
        info = photo_service.get_photo_info(compressed)
        print(f"Quality {quality}: {info['size_kb']:.1f}KB")

    print()

    # Test 6: Different formats
    print("Test 6: Format handling (PNG → JPEG conversion)")
    print("-" * 80)

    # Create PNG with transparency
    png_image = Image.new('RGBA', (800, 600), (255, 0, 0, 128))
    buffer = io.BytesIO()
    png_image.save(buffer, format='PNG')
    b64_data = base64.b64encode(buffer.getvalue()).decode('ascii')
    png_photo = f"data:image/png;base64,{b64_data}"

    original_info = photo_service.get_photo_info(png_photo)
    print(f"Original PNG: {original_info['format']}, {original_info['mode']}, "
          f"{original_info['size_kb']:.1f}KB")

    compressed = photo_service.compress_photo(png_photo)
    compressed_info = photo_service.get_photo_info(compressed)
    print(f"Compressed: {compressed_info['format']}, {compressed_info['mode']}, "
          f"{compressed_info['size_kb']:.1f}KB")

    print()
    print("=" * 80)
    print("ALL TESTS COMPLETED SUCCESSFULLY")
    print("=" * 80)


if __name__ == "__main__":
    test_compression()
