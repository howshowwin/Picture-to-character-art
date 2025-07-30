from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import tempfile
import os
import sys
import logging
from typing import Optional

# 設定日誌
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 確保能夠導入本地模組
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from image_converter import convert_image_to_art
    from video_converter import convert_video_to_art
    logger.info("成功導入轉換模組")
except ImportError as e:
    logger.error(f"無法導入轉換模組: {e}")
    raise

app = FastAPI(title="Picture/Video to Character Art", version="1.0.0")

# CORS 設定 - 本地使用，允許所有來源
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Picture/Video to Character Art API", "status": "running"}

@app.get("/health")
async def health_check():
    """健康檢查端點"""
    return {"status": "healthy", "message": "API is running normally"}

@app.post("/api/v1/convert")
async def convert_image(
    image: UploadFile = File(...),
    width: int = Form(100),
    art_type: str = Form("block")
):
    """圖片轉字元藝術 API"""
    try:
        # 檢查檔案類型
        if not image.content_type.startswith('image/'):
            return JSONResponse(
                status_code=400,
                content={"status": "error", "message": "請上傳圖片檔案"}
            )
        
        # 創建臨時檔案
        with tempfile.NamedTemporaryFile(delete=False, suffix=".tmp") as tmp_file:
            content = await image.read()
            tmp_file.write(content)
            temp_path = tmp_file.name
        
        try:
            # 轉換圖片
            art_lines = convert_image_to_art(temp_path, width, art_type)
            
            # 回傳結果
            return {
                "status": "success",
                "type": "image",
                "meta": {
                    "original_filename": image.filename,
                    "art_type": art_type,
                    "width": width,
                    "height": len(art_lines)
                },
                "data": art_lines
            }
        
        finally:
            # 清理臨時檔案
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": f"處理圖片時發生錯誤: {str(e)}"}
        )

@app.post("/api/v1/convert-video")
async def convert_video(
    video: UploadFile = File(...),
    width: int = Form(60),
    fps: int = Form(24),
    art_type: str = Form("block")
):
    """影片轉字元藝術 API"""
    try:
        # 檢查檔案類型
        if not video.content_type.startswith('video/'):
            return JSONResponse(
                status_code=400,
                content={"status": "error", "message": "請上傳影片檔案"}
            )
        
        # 創建臨時檔案
        with tempfile.NamedTemporaryFile(delete=False, suffix=".tmp") as tmp_file:
            content = await video.read()
            tmp_file.write(content)
            temp_path = tmp_file.name
        
        try:
            # 轉換影片
            frames_data, duration, total_frames = convert_video_to_art(temp_path, width, fps, art_type)
            
            # 回傳結果
            return {
                "status": "success",
                "type": "video",
                "meta": {
                    "original_filename": video.filename,
                    "art_type": art_type,
                    "width": width,
                    "height": len(frames_data[0]["art"]) if frames_data else 0,
                    "fps": fps,
                    "duration": duration,
                    "total_frames": total_frames
                },
                "data": {
                    "frames": frames_data
                }
            }
        
        finally:
            # 清理臨時檔案
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": f"處理影片時發生錯誤: {str(e)}"}
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)