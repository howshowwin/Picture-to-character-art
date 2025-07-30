// 全域變數
let currentFile = null;
let resultData = null;
let isVideo = false;
let currentFrame = 0;
let isPlaying = false;
let playInterval = null;

// API 基礎 URL
const API_BASE = 'http://localhost:8002';

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    setupDragAndDrop();
    setupFileInput();
    setupFontSizeControl();
});

// 設定拖放功能
function setupDragAndDrop() {
    const uploadSection = document.getElementById('uploadSection');
    
    uploadSection.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadSection.classList.add('dragover');
    });
    
    uploadSection.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadSection.classList.remove('dragover');
    });
    
    uploadSection.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadSection.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    });
}

// 設定檔案輸入
function setupFileInput() {
    const fileInput = document.getElementById('fileInput');
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });
}

// 處理檔案選擇
function handleFileSelect(file) {
    currentFile = file;
    isVideo = file.type.startsWith('video/');
    
    // 顯示檔案資訊
    showFileInfo(file);
    
    // 根據檔案類型調整界面
    const fpsControl = document.getElementById('fpsControl');
    const widthInput = document.getElementById('width');
    
    if (isVideo) {
        fpsControl.style.display = 'flex';
        widthInput.value = '60'; // 影片預設較小寬度
    } else {
        fpsControl.style.display = 'none';
        widthInput.value = '100'; // 圖片預設寬度
    }
    
    // 啟用轉換按鈕
    document.getElementById('convertBtn').disabled = false;
    
    // 隱藏之前的結果
    document.getElementById('previewSection').style.display = 'none';
}

// 顯示檔案資訊
function showFileInfo(file) {
    const fileInfo = document.getElementById('fileInfo');
    const fileSize = (file.size / 1024 / 1024).toFixed(2);
    const fileType = isVideo ? 'Video' : 'Image';
    
    fileInfo.innerHTML = `
        <strong>File Info:</strong><br>
        Name: ${file.name}<br>
        Type: ${fileType} (${file.type})<br>
        Size: ${fileSize} MB
    `;
    fileInfo.style.display = 'block';
}

// 轉換檔案
async function convertFile() {
    if (!currentFile) {
        showStatus('Please select a file first', 'error');
        return;
    }
    
    const convertBtn = document.getElementById('convertBtn');
    convertBtn.disabled = true;
    
    // 取得參數
    const width = parseInt(document.getElementById('width').value);
    const artType = document.getElementById('artType').value;
    const fps = parseInt(document.getElementById('fps').value);
    
    // 建立 FormData
    const formData = new FormData();
    formData.append(isVideo ? 'video' : 'image', currentFile);
    formData.append('width', width);
    formData.append('art_type', artType);
    
    if (isVideo) {
        formData.append('fps', fps);
    }
    
    try {
        showStatus('Processing, please wait...', 'loading');
        
        const endpoint = isVideo ? '/api/v1/convert-video' : '/api/v1/convert';
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.status === 'success') {
            resultData = result;
            showResult(result);
            showStatus('Conversion completed!', 'success');
        } else {
            throw new Error(result.message || '轉換失敗');
        }
        
    } catch (error) {
        console.error('轉換錯誤:', error);
        showStatus(`Conversion failed: ${error.message}`, 'error');
    } finally {
        convertBtn.disabled = false;
    }
}

// 顯示狀態
function showStatus(message, type) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = `status ${type}`;
}

// 顯示結果
function showResult(result) {
    const previewSection = document.getElementById('previewSection');
    const videoControls = document.getElementById('videoControls');
    const frameInfo = document.getElementById('frameInfo');
    
    previewSection.style.display = 'block';
    
    if (result.type === 'video') {
        // 影片模式
        videoControls.style.display = 'flex';
        currentFrame = 0;
        showFrame();
    } else {
        // 圖片模式
        videoControls.style.display = 'none';
        frameInfo.innerHTML = '';
        showImageResult(result.data);
    }
}

// 顯示圖片結果
function showImageResult(artLines) {
    const artPreview = document.getElementById('artPreview');
    artPreview.textContent = artLines.join('\n');
}

// 顯示影片幀
function showFrame() {
    if (!resultData || resultData.type !== 'video') return;
    
    const frames = resultData.data.frames;
    if (currentFrame >= frames.length) currentFrame = 0;
    if (currentFrame < 0) currentFrame = frames.length - 1;
    
    const frame = frames[currentFrame];
    const artPreview = document.getElementById('artPreview');
    const frameInfo = document.getElementById('frameInfo');
    
    artPreview.textContent = frame.art.join('\n');
    frameInfo.innerHTML = `
        Frame ${currentFrame + 1} / ${frames.length} | 
        Time: ${frame.timestamp.toFixed(2)}s
    `;
}

// 播放控制
function playPause() {
    if (isPlaying) {
        stopPlay();
    } else {
        startPlay();
    }
}

function startPlay() {
    if (!resultData || resultData.type !== 'video') return;
    
    isPlaying = true;
    const fps = resultData.meta.fps || 24;
    const interval = 1000 / fps;
    
    playInterval = setInterval(() => {
        currentFrame++;
        if (currentFrame >= resultData.data.frames.length) {
            currentFrame = 0; // 循環播放
        }
        showFrame();
    }, interval);
}

function stopPlay() {
    isPlaying = false;
    if (playInterval) {
        clearInterval(playInterval);
        playInterval = null;
    }
}

function nextFrame() {
    stopPlay();
    currentFrame++;
    showFrame();
}

function previousFrame() {
    stopPlay();
    currentFrame--;
    showFrame();
}

function firstFrame() {
    stopPlay();
    currentFrame = 0;
    showFrame();
}

function lastFrame() {
    stopPlay();
    if (resultData && resultData.type === 'video') {
        currentFrame = resultData.data.frames.length - 1;
        showFrame();
    }
}

// 下載結果
function downloadResult() {
    if (!resultData) {
        showStatus('No result available for download', 'error');
        return;
    }
    
    const jsonString = JSON.stringify(resultData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `character-art-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    showStatus('File download completed!', 'success');
}

// 設定字體大小控制
function setupFontSizeControl() {
    const fontSizeSlider = document.getElementById('fontSize');
    const fontSizeValue = document.getElementById('fontSizeValue');
    const artPreview = document.getElementById('artPreview');
    
    // 初始化顯示
    fontSizeValue.textContent = fontSizeSlider.value + 'px';
    
    // 監聽滑桿變化
    fontSizeSlider.addEventListener('input', function() {
        const size = this.value;
        fontSizeValue.textContent = size + 'px';
        artPreview.style.fontSize = size + 'px';
    });
}