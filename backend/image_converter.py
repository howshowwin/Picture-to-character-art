from PIL import Image
import numpy as np

# 字元集合 (從亮到暗排列，因為我們用 255-pixel 來映射)
BLOCK_CHARS =  [' ', '.', "'", '`', ':', '░', '▒', '▓', '█']
ASCII_CHARS = [".", ",", ":", ";", "+", "*", "?", "%", "S", "#", "@"]

def convert_image_to_art(image_path: str, width: int = 100, art_type: str = "block") -> list:
    """
    將圖片轉換為字元藝術
    
    Args:
        image_path: 圖片檔案路徑
        width: 輸出寬度
        art_type: 藝術類型 ("block" 或 "ascii")
    
    Returns:
        字元藝術行列表
    """
    try:
        print(f"開始處理圖片: {image_path}")
        
        # 開啟並處理圖片
        image = Image.open(image_path)
        print(f"原始圖片大小: {image.size}, 模式: {image.mode}")
        
        # 轉換為灰度圖
        if image.mode != 'L':
            image = image.convert('L')
        
        # 計算新的高度，保持比例
        aspect_ratio = image.height / image.width
        height = int(width * aspect_ratio * 0.55)  # 0.55 是字元的寬高比調整
        print(f"目標尺寸: {width}x{height}")
        
        # 調整圖片大小
        image = image.resize((width, height), Image.Resampling.LANCZOS)
        
        # 轉換為 numpy 陣列
        pixels = np.array(image)
        print(f"像素陣列形狀: {pixels.shape}")
        print(f"像素值範圍: {pixels.min()} - {pixels.max()}")
        print(f"像素陣列數據類型: {pixels.dtype}")
        print(f"前5x5像素樣本:")
        print(pixels[:5, :5])
        
        # 選擇字元集
        chars = BLOCK_CHARS if art_type == "block" else ASCII_CHARS
        print(f"使用字元集: {chars}")
        
        # 將像素值映射到字元
        art_lines = []
        for i, row in enumerate(pixels):
            line = ""
            for j, pixel in enumerate(row):
                # 將 0-255 的像素值映射到字元索引（暗像素用空格，亮像素用實心）
                # 直接映射：0->0, 255->8
                char_index = int(int(pixel) * (len(chars) - 1) / 255.0)
                char_index = max(0, min(len(chars) - 1, char_index))  # 確保索引在範圍內
                line += chars[char_index]
                
                # 調試：輸出前幾個像素的映射
                if i < 2 and j < 5:
                    print(f"像素[{i},{j}]: {pixel} -> 索引{char_index} -> '{chars[char_index]}'")
                    
            art_lines.append(line)
        
        print(f"轉換完成，共 {len(art_lines)} 行")
        return art_lines
    
    except Exception as e:
        print(f"轉換錯誤: {str(e)}")
        raise Exception(f"圖片轉換失敗: {str(e)}")

def convert_frame_to_art(frame, width: int = 60, art_type: str = "block") -> list:
    """
    將影片幀（OpenCV 格式）轉換為字元藝術
    
    Args:
        frame: OpenCV 格式的影片幀 (BGR numpy array)
        width: 輸出寬度
        art_type: 藝術類型 ("block" 或 "ascii")
    
    Returns:
        字元藝術行列表
    """
    try:
        # 轉換 BGR 到 RGB，然後轉為 PIL Image
        import cv2
        
        # 轉換顏色空間並轉為灰度
        gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # 計算新的高度，保持比例
        height, original_width = gray_frame.shape
        aspect_ratio = height / original_width
        new_height = int(width * aspect_ratio * 0.55)
        
        # 調整大小
        resized_frame = cv2.resize(gray_frame, (width, new_height), interpolation=cv2.INTER_LANCZOS4)
        
        # 選擇字元集
        chars = BLOCK_CHARS if art_type == "block" else ASCII_CHARS
        
        # 將像素值映射到字元
        art_lines = []
        for row in resized_frame:
            line = ""
            for pixel in row:
                # 將 0-255 的像素值映射到字元索引（暗像素用空格，亮像素用實心）
                char_index = int(int(pixel) * (len(chars) - 1) / 255.0)
                line += chars[char_index]
            art_lines.append(line)
        
        return art_lines
    
    except Exception as e:
        raise Exception(f"幀轉換失敗: {str(e)}")