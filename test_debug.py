#!/usr/bin/env python3
"""
Debug script to test image conversion
"""

import sys
import os
import io

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from enhanced_converter import EnhancedImageConverter, ConversionOptions
from PIL import Image
import numpy as np

def test_image_conversion():
    """Test image conversion with a known image"""
    
    # Create a test image with clear patterns
    width, height = 100, 100
    img = Image.new('RGB', (width, height), color='white')
    
    # Draw some patterns
    pixels = img.load()
    
    # Draw a black square in the middle
    for x in range(30, 70):
        for y in range(30, 70):
            pixels[x, y] = (0, 0, 0)
    
    # Draw a red square
    for x in range(10, 30):
        for y in range(10, 30):
            pixels[x, y] = (255, 0, 0)
    
    # Draw a gradient
    for x in range(width):
        for y in range(70, 90):
            gray = int(255 * x / width)
            pixels[x, y] = (gray, gray, gray)
    
    # Save test image
    test_path = "test_debug.png"
    img.save(test_path)
    print(f"Test image saved to {test_path}")
    
    # Test conversion
    options = ConversionOptions(
        width=50,
        art_type="block",
        color_mode="grayscale"
    )
    
    converter = EnhancedImageConverter(options)
    
    # Debug: Check image loading
    test_img = Image.open(test_path)
    print(f"\nImage mode: {test_img.mode}")
    print(f"Image size: {test_img.size}")
    
    # Convert to grayscale manually to debug
    if test_img.mode != 'L':
        test_img = test_img.convert('L')
    
    # Check pixel values
    pixels_array = np.array(test_img)
    print(f"\nPixel array shape: {pixels_array.shape}")
    print(f"Min pixel value: {pixels_array.min()}")
    print(f"Max pixel value: {pixels_array.max()}")
    print(f"Mean pixel value: {pixels_array.mean():.2f}")
    
    # Sample some pixels
    print("\nSample pixels (top-left 5x5):")
    print(pixels_array[:5, :5])
    
    print("\nSample pixels (center 5x5):")
    center_y, center_x = pixels_array.shape[0] // 2, pixels_array.shape[1] // 2
    print(pixels_array[center_y-2:center_y+3, center_x-2:center_x+3])
    
    # Now test conversion
    try:
        result = converter.convert_to_art(test_path)
        print(f"\nConversion successful!")
        print(f"Output size: {result['width']}x{result['height']}")
        
        # Show first few lines
        print("\nFirst 5 lines of output:")
        for i, line in enumerate(result['art'][:5]):
            print(f"Line {i}: {line}")
        
        # Show middle lines
        mid = len(result['art']) // 2
        print(f"\nMiddle lines (around line {mid}):")
        for i in range(mid-2, mid+3):
            if 0 <= i < len(result['art']):
                print(f"Line {i}: {result['art'][i]}")
                
    except Exception as e:
        print(f"\nError during conversion: {e}")
        import traceback
        traceback.print_exc()
    
    # Clean up
    if os.path.exists(test_path):
        os.remove(test_path)

if __name__ == "__main__":
    test_image_conversion()