import json
import base64
from typing import List, Dict, Optional, Tuple
from io import BytesIO
import html

class OutputFormatter:
    """輸出格式化器，支援多種輸出格式"""
    
    @staticmethod
    def to_text(art_lines: List[str]) -> str:
        """轉換為純文字格式"""
        return '\n'.join(art_lines)
    
    @staticmethod
    def to_ansi(art_lines: List[str], colors: Optional[List[List[any]]] = None) -> str:
        """轉換為 ANSI 終端格式"""
        if not colors:
            return '\n'.join(art_lines)
        
        # ANSI 顏色碼
        ANSI_COLORS = {
            'black': 30,
            'red': 31,
            'green': 32,
            'yellow': 33,
            'blue': 34,
            'magenta': 35,
            'cyan': 36,
            'white': 37,
        }
        
        output_lines = []
        for row_idx, line in enumerate(art_lines):
            colored_line = ""
            for col_idx, char in enumerate(line):
                if colors and row_idx < len(colors) and col_idx < len(colors[row_idx]):
                    color = colors[row_idx][col_idx]
                    if isinstance(color, str) and color in ANSI_COLORS:
                        color_code = ANSI_COLORS[color]
                        colored_line += f"\033[{color_code}m{char}\033[0m"
                    elif isinstance(color, int):
                        # ANSI 256 色
                        colored_line += f"\033[38;5;{color}m{char}\033[0m"
                    elif isinstance(color, tuple) and len(color) == 3:
                        # True Color (24-bit)
                        r, g, b = color
                        colored_line += f"\033[38;2;{r};{g};{b}m{char}\033[0m"
                    else:
                        colored_line += char
                else:
                    colored_line += char
            output_lines.append(colored_line)
        
        return '\n'.join(output_lines)
    
    @staticmethod
    def to_html(art_lines: List[str], colors: Optional[List[List[any]]] = None, 
                font_size: int = 8, font_family: str = "monospace",
                background_color: str = "#000000") -> str:
        """轉換為 HTML 格式"""
        html_content = f"""<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Character Art</title>
    <style>
        body {{
            background-color: {background_color};
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }}
        .art-container {{
            font-family: {font_family};
            font-size: {font_size}px;
            line-height: 1.0;
            white-space: pre;
        }}
        .art-line {{
            margin: 0;
        }}
        .char {{
            display: inline-block;
        }}
    </style>
</head>
<body>
    <div class="art-container">
"""
        
        for row_idx, line in enumerate(art_lines):
            html_content += '<div class="art-line">'
            for col_idx, char in enumerate(line):
                char_escaped = html.escape(char) if char != ' ' else '&nbsp;'
                
                if colors and row_idx < len(colors) and col_idx < len(colors[row_idx]):
                    color = colors[row_idx][col_idx]
                    if isinstance(color, tuple) and len(color) == 3:
                        r, g, b = color
                        html_content += f'<span class="char" style="color: rgb({r},{g},{b})">{char_escaped}</span>'
                    else:
                        html_content += f'<span class="char" style="color: #00ff00">{char_escaped}</span>'
                else:
                    html_content += f'<span class="char" style="color: #00ff00">{char_escaped}</span>'
            
            html_content += '</div>\n'
        
        html_content += """    </div>
</body>
</html>"""
        
        return html_content
    
    @staticmethod
    def to_svg(art_lines: List[str], colors: Optional[List[List[any]]] = None,
               char_width: int = 8, char_height: int = 12) -> str:
        """轉換為 SVG 格式"""
        width = len(art_lines[0]) * char_width if art_lines else 0
        height = len(art_lines) * char_height
        
        svg_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
    <rect width="{width}" height="{height}" fill="#000000"/>
    <style>
        text {{
            font-family: monospace;
            font-size: {char_height}px;
            dominant-baseline: text-before-edge;
        }}
    </style>
"""
        
        for row_idx, line in enumerate(art_lines):
            y = row_idx * char_height
            for col_idx, char in enumerate(line):
                if char != ' ':
                    x = col_idx * char_width
                    char_escaped = html.escape(char)
                    
                    fill_color = "#00ff00"
                    if colors and row_idx < len(colors) and col_idx < len(colors[row_idx]):
                        color = colors[row_idx][col_idx]
                        if isinstance(color, tuple) and len(color) == 3:
                            r, g, b = color
                            fill_color = f"rgb({r},{g},{b})"
                    
                    svg_content += f'    <text x="{x}" y="{y}" fill="{fill_color}">{char_escaped}</text>\n'
        
        svg_content += "</svg>"
        return svg_content
    
    @staticmethod
    def to_json(art_lines: List[str], colors: Optional[List[List[any]]] = None,
                metadata: Optional[Dict] = None) -> str:
        """轉換為 JSON 格式"""
        data = {
            "art": art_lines,
            "width": len(art_lines[0]) if art_lines else 0,
            "height": len(art_lines)
        }
        
        if colors:
            data["colors"] = colors
        
        if metadata:
            data["metadata"] = metadata
        
        return json.dumps(data, indent=2, ensure_ascii=False)
    
    @staticmethod
    def create_animated_gif(frames: List[Dict], output_path: str, fps: int = 24):
        """創建動畫 GIF（需要額外的圖片處理）"""
        from PIL import Image, ImageDraw, ImageFont
        
        images = []
        char_width = 8
        char_height = 12
        
        for frame in frames:
            art_lines = frame["art"]
            colors = frame.get("colors")
            
            width = len(art_lines[0]) * char_width if art_lines else 0
            height = len(art_lines) * char_height
            
            # 創建圖片
            img = Image.new('RGB', (width, height), color='black')
            draw = ImageDraw.Draw(img)
            
            # 嘗試使用等寬字體
            try:
                font = ImageFont.truetype("consolas.ttf", size=10)
            except:
                font = ImageFont.load_default()
            
            for row_idx, line in enumerate(art_lines):
                y = row_idx * char_height
                for col_idx, char in enumerate(line):
                    if char != ' ':
                        x = col_idx * char_width
                        
                        color = (0, 255, 0)  # 預設綠色
                        if colors and row_idx < len(colors) and col_idx < len(colors[row_idx]):
                            color_data = colors[row_idx][col_idx]
                            if isinstance(color_data, tuple) and len(color_data) == 3:
                                color = color_data
                        
                        draw.text((x, y), char, fill=color, font=font)
            
            images.append(img)
        
        # 保存為 GIF
        if images:
            duration = int(1000 / fps)  # 毫秒
            images[0].save(
                output_path,
                save_all=True,
                append_images=images[1:],
                duration=duration,
                loop=0
            )
    
    @staticmethod
    def to_css_animation(frames: List[Dict], animation_name: str = "ascii-animation") -> str:
        """生成 CSS 動畫"""
        css_content = f"""
.{animation_name} {{
    font-family: monospace;
    white-space: pre;
    animation: {animation_name}-frames {len(frames) / 24}s steps({len(frames)}) infinite;
}}

@keyframes {animation_name}-frames {{
"""
        
        for idx, frame in enumerate(frames):
            percentage = (idx / len(frames)) * 100
            frame_content = '\\A'.join(frame["art"])
            css_content += f"""    {percentage:.2f}% {{
        content: "{frame_content}";
    }}
"""
        
        css_content += "}\n"
        return css_content