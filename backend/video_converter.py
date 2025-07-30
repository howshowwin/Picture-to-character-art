import cv2
import numpy as np
from image_converter import convert_frame_to_art

def convert_video_to_art(video_path: str, width: int = 60, fps: int = 24, art_type: str = "block"):
    """
    將影片轉換為字元藝術序列
    
    Args:
        video_path: 影片檔案路徑
        width: 輸出寬度
        fps: 目標幀率
        art_type: 藝術類型 ("block" 或 "ascii")
    
    Returns:
        tuple: (frames_data, duration, total_frames)
    """
    try:
        # 開啟影片
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
        frame_number = 0
        output_frame = 0
        
        print(f"開始處理影片: {duration:.2f}秒, {total_frames}幀, 原始FPS: {original_fps:.2f}")
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            # 按指定間隔提取幀
            if frame_number % frame_interval == 0:
                # 轉換這一幀為字元藝術
                art_lines = convert_frame_to_art(frame, width, art_type)
                
                timestamp = frame_number / original_fps
                
                frames_data.append({
                    "frame_number": output_frame,
                    "timestamp": round(timestamp, 3),
                    "art": art_lines
                })
                
                output_frame += 1
                
                # 簡單進度提示
                if output_frame % 10 == 0:
                    print(f"已處理 {output_frame} 幀...")
            
            frame_number += 1
        
        cap.release()
        
        print(f"影片處理完成！共輸出 {output_frame} 幀")
        
        return frames_data, duration, output_frame
    
    except Exception as e:
        raise Exception(f"影片轉換失敗: {str(e)}")

def get_video_info(video_path: str):
    """
    獲取影片基本資訊
    
    Args:
        video_path: 影片檔案路徑
    
    Returns:
        dict: 影片資訊
    """
    try:
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            raise Exception("無法開啟影片檔案")
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        duration = frame_count / fps
        
        cap.release()
        
        return {
            "fps": fps,
            "frame_count": frame_count,
            "width": width,
            "height": height,
            "duration": duration
        }
    
    except Exception as e:
        raise Exception(f"獲取影片資訊失敗: {str(e)}")