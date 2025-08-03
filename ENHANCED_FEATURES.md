# Enhanced Character Art Converter - 新功能說明

## 🚀 主要增強功能

### 1. 更豐富的字元集選擇
- **Block Characters** (█▓▒░) - 經典方塊字元
- **ASCII Characters** (@#%*+) - 傳統 ASCII 藝術
- **Extended ASCII** - 擴展 ASCII 字元集
- **Japanese Characters** - 日文字元（從淡到濃）
- **Braille Patterns** - 盲文點陣圖案
- **Shade Characters** - 陰影字元
- **Geometric Shapes** - 幾何圖形
- **Emoji Characters** - 表情符號
- **Custom Characters** - 自定義字元集

### 2. 彩色字元藝術支援
- **Grayscale** - 傳統灰階模式
- **ANSI Colors** - 8 色 ANSI 終端顏色
- **ANSI 256 Colors** - 256 色擴展 ANSI
- **True Color** - 24 位元真彩色 (RGB)
- **HTML/CSS Color** - 網頁彩色輸出

### 3. 影像增強功能
- **對比度調整** - 0.5x 到 2x 可調
- **亮度調整** - 0.5x 到 2x 可調
- **降噪處理** - 中值濾波降噪
- **銳化處理** - 增強邊緣細節
- **反轉顏色** - 黑白反轉效果

### 4. 進階特效
- **邊緣偵測** - Canny 邊緣偵測算法
  - 可調整閾值 (50-200)
  - 適合線條藝術風格
- **抖動處理** - Floyd-Steinberg 抖動算法
  - 更好的灰階表現
  - 復古點陣圖效果

### 5. 多種輸出格式
- **純文字檔案** (.txt)
- **HTML 網頁** (.html) - 包含樣式和動畫
- **SVG 向量圖** (.svg) - 可縮放向量圖形
- **JSON 資料** (.json) - 包含完整資料
- **ANSI 終端格式** (.ans) - 支援終端顏色
- **GIF 動畫** (.gif) - 影片轉動畫 GIF（開發中）

### 6. 效能優化
- **多執行緒處理** - 影片轉換使用 4 個執行緒
- **幀緩存機制** - 提升影片播放流暢度
- **智能字元映射** - 基於視覺密度的字元選擇

### 7. 改進的使用者介面
- **現代化設計** - 美觀的漸層背景和卡片式佈局
- **即時預覽** - 可調整字體大小的即時預覽
- **拖放上傳** - 支援拖放檔案
- **分頁式介面** - 預覽、匯出選項、檔案資訊分頁
- **響應式設計** - 適應不同螢幕尺寸

## 🎨 使用範例

### 基本使用
1. 執行 `start_enhanced.bat` (Windows) 或 `python start_enhanced.py`
2. 在瀏覽器中開啟 enhanced.html
3. 上傳圖片或影片
4. 調整參數
5. 點擊轉換
6. 匯出結果

### 進階技巧

#### 線條藝術風格
1. 啟用「Edge Detection」
2. 調整 Edge Threshold 到適當值
3. 選擇 ASCII 或 Block 字元集
4. 可搭配 Invert Colors 獲得不同效果

#### 復古點陣圖風格
1. 啟用「Dithering」
2. 降低輸出寬度 (如 60-80)
3. 使用 Block Characters
4. 調整對比度到 1.2-1.5

#### 彩色藝術
1. 選擇 True Color 或 HTML/CSS Color
2. 可搭配 Sharpen 增強細節
3. 適當調整亮度和對比度
4. 匯出為 HTML 保留顏色

#### 動畫效果
1. 上傳影片檔案
2. 調整 FPS (建議 12-24)
3. 降低寬度以提升效能
4. 匯出為 HTML 可自動播放

## 🛠️ 技術細節

### 字元密度映射
系統會根據每個字元的視覺密度進行智能映射，而不是簡單的線性映射。這確保了更準確的亮度表現。

### 感知亮度計算
使用人眼感知亮度公式：
```
brightness = 0.2989 * R + 0.5870 * G + 0.1140 * B
```

### 多執行緒架構
影片處理使用 ThreadPoolExecutor 並行處理多個幀，大幅提升轉換速度。

### 顏色空間轉換
- ANSI 8 色：最接近顏色匹配
- ANSI 256 色：6x6x6 色彩立方體 + 24 級灰階
- True Color：完整 RGB 色彩

## 📝 API 端點

### V2 增強版端點
- `POST /api/v2/convert` - 圖片轉換
- `POST /api/v2/convert-video` - 影片轉換

### 參數說明
- `width` - 輸出寬度 (20-300)
- `art_type` - 字元集類型
- `color_mode` - 顏色模式
- `contrast` - 對比度 (0.5-2.0)
- `brightness` - 亮度 (0.5-2.0)
- `edge_detection` - 邊緣偵測開關
- `edge_threshold` - 邊緣閾值 (50-200)
- `denoise` - 降噪開關
- `sharpen` - 銳化開關
- `invert` - 反轉顏色開關
- `dithering` - 抖動開關
- `custom_chars` - 自定義字元（可選）
- `fps` - 影片幀率 (1-60)
- `num_threads` - 處理執行緒數 (1-8)

## 🚧 開發中功能
- GIF 動畫匯出
- 即時攝影機輸入
- 批次檔案處理
- 更多濾鏡效果
- WebSocket 即時串流

## 💡 小提示
1. 對於文字較多的圖片，使用較高的輸出寬度
2. 人像照片建議開啟降噪功能
3. 線條圖適合使用邊緣偵測
4. 彩色模式會增加輸出檔案大小
5. 影片轉換建議先用較低 FPS 測試效果