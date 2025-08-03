import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageOps
import cv2
from typing import List, Tuple, Optional, Dict, Union
import colorsys
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor
import threading

# 擴展的字元集合（從亮到暗排列 - 黑色映射到空白，白色映射到筆畫最多的字元）
CHARACTER_SETS = {
    "block": [' ', '.', "'", '`', ':', '░', '▒', '▓', '█'],
    "ascii": [" ", ".", ",", ":", ";", "+", "*", "?", "%", "S", "#", "@"],
    "extended_ascii": [' ', '.', '·', ':', '!', '+', '*', 'x', '%', '#', 'W', '@'],
    "japanese": ['　', '。', '、', 'つ', 'の', 'る', 'お', '愛', '雲', '龍', '闇'],
    "chinese": ['　', '一', '十', '口', '日', '目', '田', '圖', '國', '圓', '鬱'],
    "chinese_simple": ['　', '一', '二', '三', '王', '主', '国', '图', '圆', '黑', '墨'],
    "braille": ['⠀', '⠁', '⠃', '⠇', '⠏', '⠟', '⠿', '⡿', '⣿'],
    "shade": [' ', '░', '▒', '▓', '█'],
    "geometric": [' ', '▸', '▹', '◂', '◃', '◆', '◇', '◈', '◉', '●', '■'],
    "emoji": ['⬜', '🟨', '🟧', '🟥', '🟪', '🟦', '🟩', '🟫', '⬛'],
    "custom_art": [' ', '.', 'o', 'O', '0', '@', '#', '&', '%', '$', 'M', 'W'],
}

# 字元密度映射（用於更準確的亮度表示）
CHARACTER_DENSITY = {
    ' ': 0.0,
    '.': 0.1,
    ',': 0.1,
    "'": 0.05,
    '`': 0.05,
    ':': 0.2,
    ';': 0.2,
    '!': 0.3,
    '+': 0.4,
    '*': 0.5,
    'x': 0.6,
    '%': 0.7,
    '#': 0.8,
    '@': 0.9,
    'W': 0.95,
    'M': 1.0,
    '░': 0.3,
    '▒': 0.6,
    '▓': 0.8,
    '█': 1.0,
}

@dataclass
class ConversionOptions:
    """轉換選項配置"""
    width: int = 100
    art_type: str = "block"
    color_mode: str = "grayscale"  # grayscale, ansi, ansi256, truecolor, html
    contrast: float = 1.0
    brightness: float = 1.0
    edge_detection: bool = False
    edge_threshold: int = 100
    denoise: bool = False
    sharpen: bool = False
    invert: bool = False
    dithering: bool = False
    custom_chars: Optional[str] = None
    
class ColorPalette:
    """ANSI 色彩調色板"""
    ANSI_COLORS = {
        'black': (0, 0, 0),
        'red': (205, 49, 49),
        'green': (13, 188, 121),
        'yellow': (229, 229, 16),
        'blue': (36, 114, 200),
        'magenta': (188, 63, 188),
        'cyan': (17, 168, 205),
        'white': (229, 229, 229),
    }
    
    @staticmethod
    def get_ansi_color(r: int, g: int, b: int) -> str:
        """獲取最接近的 ANSI 顏色碼"""
        min_distance = float('inf')
        closest_color = 'white'
        
        for color_name, (cr, cg, cb) in ColorPalette.ANSI_COLORS.items():
            distance = ((r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2) ** 0.5
            if distance < min_distance:
                min_distance = distance
                closest_color = color_name
        
        return closest_color
    
    @staticmethod
    def get_ansi256_color(r: int, g: int, b: int) -> int:
        """轉換 RGB 到 ANSI 256 色"""
        # 灰階
        if r == g == b:
            if r < 8:
                return 16
            elif r > 248:
                return 231
            else:
                return round(((r - 8) / 247) * 24) + 232
        
        # 彩色
        r = 5 * round(r / 255 * 5)
        g = 5 * round(g / 255 * 5)
        b = 5 * round(b / 255 * 5)
        return 16 + (36 * (r // 51)) + (6 * (g // 51)) + (b // 51)

class EnhancedImageConverter:
    """增強版圖片轉換器"""
    
    def __init__(self, options: ConversionOptions):
        self.options = options
        self._setup_character_set()
    
    def _setup_character_set(self):
        """設置字元集"""
        if self.options.custom_chars:
            self.chars = list(self.options.custom_chars)
        else:
            self.chars = CHARACTER_SETS.get(self.options.art_type, CHARACTER_SETS["block"])
        
        # 根據字元密度排序（如果有定義的話）
        self.char_densities = []
        for char in self.chars:
            density = CHARACTER_DENSITY.get(char, len(self.char_densities) / len(self.chars))
            self.char_densities.append(density)
    
    def preprocess_image(self, image: Image.Image) -> Image.Image:
        """影像前處理"""
        # 轉換為 RGB（如果需要）
        if image.mode != 'RGB' and self.options.color_mode != 'grayscale':
            image = image.convert('RGB')
        
        # 降噪
        if self.options.denoise:
            image = image.filter(ImageFilter.MedianFilter(size=3))
        
        # 銳化
        if self.options.sharpen:
            image = image.filter(ImageFilter.SHARPEN)
        
        # 調整對比度
        if self.options.contrast != 1.0:
            enhancer = ImageEnhance.Contrast(image)
            image = enhancer.enhance(self.options.contrast)
        
        # 調整亮度
        if self.options.brightness != 1.0:
            enhancer = ImageEnhance.Brightness(image)
            image = enhancer.enhance(self.options.brightness)
        
        # 反轉顏色
        if self.options.invert:
            if image.mode == 'L':
                image = ImageOps.invert(image)
            else:
                image = ImageOps.invert(image.convert('RGB'))
        
        return image
    
    def apply_edge_detection(self, image: np.ndarray) -> np.ndarray:
        """應用邊緣偵測"""
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        else:
            gray = image
        
        # 使用 Canny 邊緣偵測
        edges = cv2.Canny(gray, self.options.edge_threshold, self.options.edge_threshold * 2)
        
        # 反轉邊緣（讓邊緣變成白色）
        edges = 255 - edges
        
        return edges
    
    def apply_dithering(self, image: np.ndarray) -> np.ndarray:
        """應用抖動算法（Floyd-Steinberg）"""
        if len(image.shape) == 3:
            # 轉換為灰度
            gray = np.dot(image[...,:3], [0.2989, 0.5870, 0.1140])
        else:
            gray = image.copy()
        
        # 轉換為 float 避免溢出
        gray = gray.astype(np.float64)
        h, w = gray.shape
        
        for y in range(h):
            for x in range(w):
                old_pixel = gray[y, x]
                new_pixel = 255.0 if old_pixel > 128 else 0.0
                gray[y, x] = new_pixel
                error = old_pixel - new_pixel
                
                # 分配誤差到周圍像素
                if x + 1 < w:
                    gray[y, x + 1] = np.clip(gray[y, x + 1] + error * 7 / 16, 0, 255)
                if y + 1 < h:
                    if x > 0:
                        gray[y + 1, x - 1] = np.clip(gray[y + 1, x - 1] + error * 3 / 16, 0, 255)
                    gray[y + 1, x] = np.clip(gray[y + 1, x] + error * 5 / 16, 0, 255)
                    if x + 1 < w:
                        gray[y + 1, x + 1] = np.clip(gray[y + 1, x + 1] + error * 1 / 16, 0, 255)
        
        return gray.astype(np.uint8)
    
    def get_char_for_pixel(self, pixel_value: Union[int, np.ndarray]) -> Tuple[str, Optional[str]]:
        """根據像素值獲取對應字元和顏色"""
        if isinstance(pixel_value, np.ndarray) and len(pixel_value) == 3:
            # RGB 像素
            r, g, b = pixel_value
            # 計算亮度（使用感知亮度公式）
            brightness = 0.2989 * float(r) + 0.5870 * float(g) + 0.1140 * float(b)
        else:
            # 灰度像素
            brightness = float(pixel_value)
            r = g = b = int(pixel_value)
        
        # 確保亮度在有效範圍內
        brightness = max(0.0, min(255.0, brightness))
        
        # 將亮度映射到字元索引
        # 黑色（亮度0）-> 索引0（空白）
        # 白色（亮度255）-> 最後索引（筆畫最多的字元）
        normalized_brightness = brightness / 255.0
        char_index = int(normalized_brightness * (len(self.chars) - 1))
        char_index = max(0, min(len(self.chars) - 1, char_index))
        char = self.chars[char_index]
        
        # 獲取顏色資訊
        color_code = None
        if self.options.color_mode != "grayscale":
            if self.options.color_mode == "ansi":
                color_code = ColorPalette.get_ansi_color(r, g, b)
            elif self.options.color_mode == "ansi256":
                color_code = ColorPalette.get_ansi256_color(r, g, b)
            elif self.options.color_mode in ["truecolor", "html"]:
                color_code = (r, g, b)
        
        return char, color_code
    
    def convert_to_art(self, image_path: str) -> Dict[str, any]:
        """轉換圖片為字元藝術"""
        # 載入圖片
        image = Image.open(image_path)
        
        # 前處理
        image = self.preprocess_image(image)
        
        # 計算新尺寸
        aspect_ratio = image.height / image.width
        height = int(self.options.width * aspect_ratio * 0.55)
        
        # 調整大小
        image = image.resize((self.options.width, height), Image.Resampling.LANCZOS)
        
        # 轉換為 numpy 陣列
        if self.options.color_mode == "grayscale" or image.mode == 'L':
            if image.mode != 'L':
                image = image.convert('L')
            pixels = np.array(image)
        else:
            if image.mode != 'RGB':
                image = image.convert('RGB')
            pixels = np.array(image)
        
        # 邊緣偵測
        if self.options.edge_detection:
            pixels = self.apply_edge_detection(pixels)
        
        # 抖動
        if self.options.dithering:
            pixels = self.apply_dithering(pixels)
        
        # 轉換為字元藝術
        art_lines = []
        color_data = []
        
        for row in pixels:
            line = ""
            row_colors = []
            
            for pixel in row:
                char, color = self.get_char_for_pixel(pixel)
                line += char
                row_colors.append(color)
            
            art_lines.append(line)
            if self.options.color_mode != "grayscale":
                color_data.append(row_colors)
        
        result = {
            "art": art_lines,
            "width": self.options.width,
            "height": height,
            "color_mode": self.options.color_mode,
        }
        
        if color_data:
            result["colors"] = color_data
        
        return result

class EnhancedVideoConverter:
    """增強版影片轉換器"""
    
    def __init__(self, options: ConversionOptions, num_threads: int = 4):
        self.options = options
        self.num_threads = num_threads
        self.frame_converter = EnhancedImageConverter(options)
        self._frame_cache = {}
        self._cache_lock = threading.Lock()
    
    def _process_frame(self, frame: np.ndarray, frame_number: int) -> Dict[str, any]:
        """處理單一幀"""
        # 檢查緩存
        with self._cache_lock:
            if frame_number in self._frame_cache:
                return self._frame_cache[frame_number]
        
        # 轉換為 PIL Image
        if len(frame.shape) == 2:
            pil_image = Image.fromarray(frame, mode='L')
        else:
            # OpenCV 使用 BGR，需要轉換為 RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            pil_image = Image.fromarray(rgb_frame, mode='RGB')
        
        # 前處理
        pil_image = self.frame_converter.preprocess_image(pil_image)
        
        # 調整大小
        aspect_ratio = pil_image.height / pil_image.width
        height = int(self.options.width * aspect_ratio * 0.55)
        pil_image = pil_image.resize((self.options.width, height), Image.Resampling.LANCZOS)
        
        # 轉換為 numpy 陣列
        if self.options.color_mode == "grayscale":
            if pil_image.mode != 'L':
                pil_image = pil_image.convert('L')
            pixels = np.array(pil_image)
        else:
            if pil_image.mode != 'RGB':
                pil_image = pil_image.convert('RGB')
            pixels = np.array(pil_image)
        
        # 應用特效
        if self.options.edge_detection:
            pixels = self.frame_converter.apply_edge_detection(pixels)
        
        if self.options.dithering:
            pixels = self.frame_converter.apply_dithering(pixels)
        
        # 轉換為字元藝術
        art_lines = []
        color_data = []
        
        for row in pixels:
            line = ""
            row_colors = []
            
            for pixel in row:
                char, color = self.frame_converter.get_char_for_pixel(pixel)
                line += char
                row_colors.append(color)
            
            art_lines.append(line)
            if self.options.color_mode != "grayscale":
                color_data.append(row_colors)
        
        result = {
            "art": art_lines,
            "colors": color_data if color_data else None
        }
        
        # 緩存結果
        with self._cache_lock:
            self._frame_cache[frame_number] = result
            # 限制緩存大小
            if len(self._frame_cache) > 100:
                oldest_key = min(self._frame_cache.keys())
                del self._frame_cache[oldest_key]
        
        return result
    
    def convert_video(self, video_path: str, fps: int = 24) -> Tuple[List[Dict], float, int]:
        """轉換影片為字元藝術序列"""
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            raise Exception("無法開啟影片檔案")
        
        # 獲取影片資訊
        original_fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total_frames / original_fps
        
        # 計算幀間隔
        frame_interval = max(1, int(original_fps / fps))
        
        frames_data = []
        frame_numbers = []
        frames_to_process = []
        
        # 收集需要處理的幀
        frame_number = 0
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            if frame_number % frame_interval == 0:
                frames_to_process.append((frame_number, frame.copy()))
                frame_numbers.append(frame_number)
            
            frame_number += 1
        
        cap.release()
        
        # 使用多執行緒處理幀
        with ThreadPoolExecutor(max_workers=self.num_threads) as executor:
            futures = []
            for idx, (frame_num, frame) in enumerate(frames_to_process):
                future = executor.submit(self._process_frame, frame, idx)
                futures.append((idx, frame_num, future))
            
            # 收集結果
            for idx, frame_num, future in futures:
                result = future.result()
                timestamp = frame_num / original_fps
                
                frame_data = {
                    "frame_number": idx,
                    "timestamp": round(timestamp, 3),
                    "art": result["art"]
                }
                
                if result.get("colors"):
                    frame_data["colors"] = result["colors"]
                
                frames_data.append(frame_data)
        
        # 按幀號排序
        frames_data.sort(key=lambda x: x["frame_number"])
        
        return frames_data, duration, len(frames_data)