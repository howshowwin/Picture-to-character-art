#!/usr/bin/env python3
"""
Test CJK (Chinese, Japanese, Korean) character sets
"""

import sys
import os
import io

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from enhanced_converter import CHARACTER_SETS

def display_cjk_sets():
    """Display CJK character sets with density progression"""
    print("=== CJK Character Sets Display ===\n")
    
    # Japanese
    print("Japanese Characters (日本語):")
    japanese = CHARACTER_SETS.get("japanese", [])
    print("Characters:", ' → '.join(japanese))
    print("From light to dark: ", end="")
    for char in japanese:
        print(char * 5, end=" ")
    print("\n")
    
    # Traditional Chinese
    print("Traditional Chinese Characters (繁體中文):")
    chinese_trad = CHARACTER_SETS.get("chinese", [])
    print("Characters:", ' → '.join(chinese_trad))
    print("From light to dark: ", end="")
    for char in chinese_trad:
        print(char * 5, end=" ")
    print("\n")
    
    # Simplified Chinese
    print("Simplified Chinese Characters (简体中文):")
    chinese_simp = CHARACTER_SETS.get("chinese_simple", [])
    print("Characters:", ' → '.join(chinese_simp))
    print("From light to dark: ", end="")
    for char in chinese_simp:
        print(char * 5, end=" ")
    print("\n")
    
    # Create gradient demo
    print("=== Gradient Demo ===")
    print("\nJapanese gradient:")
    create_gradient(japanese)
    
    print("\nTraditional Chinese gradient:")
    create_gradient(chinese_trad)
    
    print("\nSimplified Chinese gradient:")
    create_gradient(chinese_simp)

def create_gradient(chars):
    """Create a gradient pattern using the character set"""
    width = 50
    for i in range(len(chars)):
        char = chars[i]
        count = int((width / len(chars)) * (i + 1))
        remaining = width - count
        print('　' * remaining + char * count)

def test_mixed_text():
    """Test rendering mixed text patterns"""
    print("\n=== Mixed Pattern Demo ===")
    
    # Mountain pattern using Chinese characters
    chinese = CHARACTER_SETS.get("chinese", [])
    print("\nMountain pattern (Traditional Chinese):")
    print("　　　　　圓圓圓圓圓")
    print("　　　圓國國國國國國圓")
    print("　　圓國圖圖圖圖圖圖國圓")
    print("　圓國圖田田田田田田圖國圓")
    print("圓國圖田目目目目目田圖國圓")
    
    # Wave pattern using Japanese
    japanese = CHARACTER_SETS.get("japanese", [])
    print("\nWave pattern (Japanese):")
    print("～～愛雲龍雲愛～～愛雲龍雲愛～～")
    print("～愛雲龍闇龍雲愛愛雲龍闇龍雲愛～")
    print("愛雲龍闇闇闇龍雲雲龍闇闇闇龍雲愛")

if __name__ == "__main__":
    display_cjk_sets()
    test_mixed_text()