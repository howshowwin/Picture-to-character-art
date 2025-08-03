#!/usr/bin/env python3
"""
Test script for Enhanced Character Art Converter
"""

import sys
import os
import io

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from enhanced_converter import EnhancedImageConverter, ConversionOptions, CHARACTER_SETS
from output_formatter import OutputFormatter

def test_character_sets():
    """Test different character sets"""
    print("=== Testing Character Sets ===")
    for name, chars in CHARACTER_SETS.items():
        print(f"\n{name}: {''.join(chars)}")

def test_image_conversion():
    """Test image conversion with different options"""
    print("\n=== Testing Image Conversion ===")
    
    # Create a simple test image
    from PIL import Image, ImageDraw
    
    # Create gradient test image
    width, height = 200, 100
    img = Image.new('RGB', (width, height))
    draw = ImageDraw.Draw(img)
    
    # Draw gradient
    for x in range(width):
        color = int(255 * x / width)
        draw.rectangle([(x, 0), (x, height)], fill=(color, color, color))
    
    # Save test image
    test_image_path = "test_gradient.png"
    img.save(test_image_path)
    
    # Test different options
    test_configs = [
        {
            "name": "Basic Block",
            "options": ConversionOptions(width=80, art_type="block")
        },
        {
            "name": "ASCII with Edge Detection",
            "options": ConversionOptions(width=80, art_type="ascii", edge_detection=True)
        },
        {
            "name": "Emoji Characters",
            "options": ConversionOptions(width=40, art_type="emoji")
        },
        {
            "name": "Inverted with Dithering",
            "options": ConversionOptions(width=80, art_type="block", invert=True, dithering=True)
        }
    ]
    
    for config in test_configs:
        print(f"\nTesting: {config['name']}")
        converter = EnhancedImageConverter(config['options'])
        
        try:
            result = converter.convert_to_art(test_image_path)
            print(f"  ✓ Conversion successful")
            print(f"  Size: {result['width']}x{result['height']}")
            print(f"  Preview (first 3 lines):")
            for line in result['art'][:3]:
                print(f"    {line[:60]}...")
        except Exception as e:
            print(f"  ✗ Error: {e}")
    
    # Clean up
    os.remove(test_image_path)

def test_output_formats():
    """Test output formatters"""
    print("\n=== Testing Output Formats ===")
    
    # Sample art
    art_lines = [
        "████░░░░████",
        "██░░░░░░░░██",
        "░░░░██░░░░░░",
        "░░░░░░░░░░░░"
    ]
    
    colors = [
        [(255, 0, 0), (255, 0, 0), (0, 255, 0), (0, 255, 0)],
        [(255, 0, 0), (255, 0, 0), (0, 255, 0), (0, 255, 0)],
        [(0, 0, 255), (0, 0, 255), (255, 255, 0), (255, 255, 0)],
        [(0, 0, 255), (0, 0, 255), (255, 255, 0), (255, 255, 0)]
    ]
    
    # Test text format
    print("\nText format:")
    text = OutputFormatter.to_text(art_lines)
    print(text)
    
    # Test ANSI format
    print("\nANSI format preview:")
    ansi = OutputFormatter.to_ansi(art_lines, colors)
    print("(ANSI codes included but may not display in all terminals)")
    
    # Test JSON format
    print("\nJSON format (truncated):")
    json_output = OutputFormatter.to_json(art_lines, colors, {"test": True})
    print(json_output[:200] + "...")
    
    print("\n✓ All output formats working")

def main():
    """Run all tests"""
    print("Enhanced Character Art Converter - Test Suite")
    print("=" * 50)
    
    test_character_sets()
    test_image_conversion()
    test_output_formats()
    
    print("\n" + "=" * 50)
    print("All tests completed!")

if __name__ == "__main__":
    main()