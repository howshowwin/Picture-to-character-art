#!/usr/bin/env python3
"""
Simple decoder for ultra-compressed character art format
可以在任何 Python 程式中使用的簡單解碼器
"""

import json

def decode_ultra_minimal(compressed_data, width, height):
    """
    解碼極簡格式的字符藝術
    
    Args:
        compressed_data: dict, 格式為 {"字符": [位置1, 位置2, ...]}
        width: int, 圖像寬度
        height: int, 圖像高度
    
    Returns:
        list of str, 每個元素是一行字符
    """
    # 初始化空白圖像
    result = [[' ' for _ in range(width)] for _ in range(height)]
    
    # 填入字符
    for char, positions in compressed_data.items():
        for pos in positions:
            row = pos // width
            col = pos % width
            if 0 <= row < height and 0 <= col < width:
                result[row][col] = char
    
    # 轉換為字串陣列
    return [''.join(row) for row in result]

def decode_from_file(filename, width, height):
    """從檔案讀取並解碼"""
    with open(filename, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # 處理單幀圖像
    if isinstance(data, dict):
        return decode_ultra_minimal(data, width, height)
    
    # 處理動畫（多幀）
    elif isinstance(data, list):
        frames = []
        for frame_data in data:
            frames.append(decode_ultra_minimal(frame_data, width, height))
        return frames
    
    else:
        raise ValueError("Unknown data format")

def decode_from_string(compressed_string, width, height):
    """
    從字串格式解碼
    格式: "字符:位置1,位置2;字符:位置1,位置2"
    """
    data = {}
    if compressed_string:
        parts = compressed_string.split(';')
        for part in parts:
            if ':' in part:
                char, positions_str = part.split(':', 1)
                positions = [int(p) for p in positions_str.split(',') if p]
                data[char] = positions
    
    return decode_ultra_minimal(data, width, height)

def print_art(lines):
    """列印字符藝術"""
    for line in lines:
        print(line)

# 使用範例
if __name__ == "__main__":
    # 範例 1: 從字典解碼
    print("=== 範例 1: 從字典解碼 ===")
    compressed = {
        "つ": [0, 50, 100],
        "の": [25, 75, 125],
        "愛": [150, 200, 250]
    }
    
    art = decode_ultra_minimal(compressed, width=50, height=10)
    print_art(art)
    
    # 範例 2: 從字串解碼
    print("\n=== 範例 2: 從字串解碼 ===")
    compressed_str = "つ:0,50,100;の:25,75,125;愛:150,200,250"
    art = decode_from_string(compressed_str, width=50, height=10)
    print_art(art)
    
    # 範例 3: 批量處理
    print("\n=== 範例 3: 批量處理 ===")
    def batch_decode(frames_data, width, height):
        """批量解碼多個幀"""
        return [decode_ultra_minimal(frame, width, height) for frame in frames_data]
    
    # 動畫資料
    animation_data = [
        {"つ": [0], "の": [1]},
        {"つ": [1], "の": [2]},
        {"つ": [2], "の": [3]}
    ]
    
    frames = batch_decode(animation_data, width=10, height=1)
    for i, frame in enumerate(frames):
        print(f"Frame {i+1}: {frame[0]}")

# 更進階的使用
class CharacterArtDecoder:
    """字符藝術解碼器類別"""
    
    def __init__(self, width, height, default_char=' '):
        self.width = width
        self.height = height
        self.default_char = default_char
    
    def decode(self, compressed_data):
        """解碼壓縮資料"""
        return decode_ultra_minimal(compressed_data, self.width, self.height)
    
    def decode_with_callback(self, compressed_data, callback):
        """解碼時對每個字符執行回調"""
        result = [[self.default_char for _ in range(self.width)] 
                  for _ in range(self.height)]
        
        for char, positions in compressed_data.items():
            for pos in positions:
                row = pos // self.width
                col = pos % self.width
                if 0 <= row < self.height and 0 <= col < self.width:
                    # 執行回調，可以修改字符
                    result[row][col] = callback(char, row, col)
        
        return [''.join(row) for row in result]
    
    def decode_to_matrix(self, compressed_data):
        """解碼為二維陣列（保持矩陣格式）"""
        result = [[self.default_char for _ in range(self.width)] 
                  for _ in range(self.height)]
        
        for char, positions in compressed_data.items():
            for pos in positions:
                row = pos // self.width
                col = pos % self.width
                if 0 <= row < self.height and 0 <= col < self.width:
                    result[row][col] = char
        
        return result