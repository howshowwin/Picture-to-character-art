// Global variables
let currentFile = null;
let resultData = null;
let isVideo = false;
let currentFrame = 0;
let isPlaying = false;
let playInterval = null;
let useV2API = true; // Use enhanced API

// API base URL
const API_BASE = 'http://localhost:8002';

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    setupDragAndDrop();
    updateSliderValues();
});

// Setup event listeners
function setupEventListeners() {
    // File input
    document.getElementById('fileInput').addEventListener('change', handleFileSelect);
    
    // Sliders
    const sliders = ['width', 'contrast', 'brightness', 'fps', 'edgeThreshold', 'previewFontSize'];
    sliders.forEach(sliderId => {
        const slider = document.getElementById(sliderId);
        if (slider) {
            slider.addEventListener('input', updateSliderValues);
        }
    });
    
    // Character set change
    document.getElementById('artType').addEventListener('change', function() {
        const customGroup = document.getElementById('customCharsGroup');
        customGroup.style.display = this.value === 'custom' ? 'block' : 'none';
    });
    
    // Edge detection toggle
    document.getElementById('edgeDetection').addEventListener('change', function() {
        const thresholdGroup = document.getElementById('edgeThresholdGroup');
        thresholdGroup.style.display = this.checked ? 'block' : 'none';
    });
    
    // Preview font size
    document.getElementById('previewFontSize').addEventListener('input', function() {
        const artPreview = document.getElementById('artPreview');
        artPreview.style.fontSize = this.value + 'px';
    });
    
    // Preview font family
    document.getElementById('previewFont').addEventListener('change', function() {
        const artPreview = document.getElementById('artPreview');
        artPreview.style.fontFamily = this.value;
    });
    
    // Preview text color
    document.getElementById('previewTextColor').addEventListener('input', function() {
        const artPreview = document.getElementById('artPreview');
        const colorMode = resultData && resultData.meta ? resultData.meta.color_mode : 'grayscale';
        
        // Only apply color if in grayscale mode
        if (colorMode === 'grayscale') {
            artPreview.style.color = this.value;
        }
    });
}

// Setup drag and drop
function setupDragAndDrop() {
    const uploadArea = document.getElementById('uploadArea');
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
}

// Handle file selection
function handleFileSelect(e) {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
}

// Handle file
function handleFile(file) {
    currentFile = file;
    isVideo = file.type.startsWith('video/');
    
    // Show/hide video-specific controls
    const fpsGroup = document.getElementById('fpsGroup');
    const gifExportBtn = document.getElementById('gifExportBtn');
    
    if (isVideo) {
        fpsGroup.style.display = 'block';
        gifExportBtn.style.display = 'block';
        document.getElementById('width').value = 60;
    } else {
        fpsGroup.style.display = 'none';
        gifExportBtn.style.display = 'none';
        document.getElementById('width').value = 100;
    }
    
    updateSliderValues();
    
    // Enable convert button
    document.getElementById('convertBtn').disabled = false;
    
    // Show file info
    showFileInfo(file);
}

// Show file info
function showFileInfo(file) {
    const fileSize = (file.size / 1024 / 1024).toFixed(2);
    const fileType = isVideo ? 'Video' : 'Image';
    
    const infoHtml = `
        <h4>File Information</h4>
        <p><strong>Name:</strong> ${file.name}</p>
        <p><strong>Type:</strong> ${fileType} (${file.type})</p>
        <p><strong>Size:</strong> ${fileSize} MB</p>
        <p><strong>Last Modified:</strong> ${new Date(file.lastModified).toLocaleString()}</p>
    `;
    
    document.getElementById('fileInfoDetails').innerHTML = infoHtml;
}

// Update slider values
function updateSliderValues() {
    const sliderConfigs = {
        width: { suffix: '' },
        contrast: { suffix: '', fixed: 1 },
        brightness: { suffix: '', fixed: 1 },
        fps: { suffix: ' fps' },
        edgeThreshold: { suffix: '' },
        previewFontSize: { suffix: 'px' }
    };
    
    Object.keys(sliderConfigs).forEach(sliderId => {
        const slider = document.getElementById(sliderId);
        const valueSpan = document.getElementById(sliderId + 'Value');
        
        if (slider && valueSpan) {
            const config = sliderConfigs[sliderId];
            const value = config.fixed ? parseFloat(slider.value).toFixed(config.fixed) : slider.value;
            valueSpan.textContent = value + (config.suffix || '');
        }
    });
}

// Convert file
async function convertFile() {
    if (!currentFile) {
        showStatus('Please select a file first', 'error');
        return;
    }
    
    const convertBtn = document.getElementById('convertBtn');
    convertBtn.disabled = true;
    
    // Collect parameters
    const params = {
        width: parseInt(document.getElementById('width').value),
        art_type: document.getElementById('artType').value,
        color_mode: document.getElementById('colorMode').value,
        contrast: parseFloat(document.getElementById('contrast').value),
        brightness: parseFloat(document.getElementById('brightness').value),
        edge_detection: document.getElementById('edgeDetection').checked,
        edge_threshold: parseInt(document.getElementById('edgeThreshold').value),
        denoise: document.getElementById('denoise').checked,
        sharpen: document.getElementById('sharpen').checked,
        invert: document.getElementById('invert').checked,
        dithering: document.getElementById('dithering').checked
    };
    
    // Add custom characters if selected
    if (params.art_type === 'custom') {
        const customChars = document.getElementById('customChars').value;
        if (!customChars) {
            showStatus('Please enter custom characters', 'error');
            convertBtn.disabled = false;
            return;
        }
        params.custom_chars = customChars;
    }
    
    // Add video-specific parameters
    if (isVideo) {
        params.fps = parseInt(document.getElementById('fps').value);
        params.num_threads = 4; // Default thread count
    }
    
    // Create FormData
    const formData = new FormData();
    formData.append(isVideo ? 'video' : 'image', currentFile);
    
    // Append all parameters
    Object.keys(params).forEach(key => {
        formData.append(key, params[key]);
    });
    
    try {
        showStatus('Processing... This may take a moment for large files', 'loading');
        
        const endpoint = isVideo ? '/api/v2/convert-video' : '/api/v2/convert';
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.status === 'success') {
            resultData = result;
            showResult(result);
            showStatus('Conversion completed successfully!', 'success');
        } else {
            throw new Error(result.message || 'Conversion failed');
        }
        
    } catch (error) {
        console.error('Conversion error:', error);
        showStatus(`Error: ${error.message}`, 'error');
    } finally {
        convertBtn.disabled = false;
    }
}

// Show status
function showStatus(message, type) {
    const statusBar = document.getElementById('statusBar');
    const statusText = document.getElementById('statusText');
    
    statusBar.className = `status-bar ${type}`;
    statusText.textContent = message;
    
    if (type === 'success' || type === 'error') {
        setTimeout(() => {
            statusBar.className = 'status-bar';
        }, 5000);
    }
}

// Show result
function showResult(result) {
    const previewSection = document.getElementById('previewSection');
    previewSection.style.display = 'block';
    
    // Update export buttons based on color mode
    const ansiExportBtn = document.getElementById('ansiExportBtn');
    ansiExportBtn.style.display = result.meta.color_mode !== 'grayscale' ? 'block' : 'none';
    
    if (result.type === 'video') {
        // Video mode
        document.getElementById('videoControls').style.display = 'flex';
        currentFrame = 0;
        showFrame();
    } else {
        // Image mode
        document.getElementById('videoControls').style.display = 'none';
        showImageResult(result.data);
    }
    
    // Switch to preview tab
    switchTab('preview');
}

// Show image result
function showImageResult(data) {
    const artPreview = document.getElementById('artPreview');
    
    if (resultData.meta.color_mode === 'html' && data.colors) {
        // HTML color mode - render with colors
        renderColoredArt(data.art, data.colors);
    } else {
        // Plain text
        artPreview.textContent = data.art.join('\n');
    }
}

// Render colored art
function renderColoredArt(artLines, colors) {
    const artPreview = document.getElementById('artPreview');
    artPreview.innerHTML = '';
    
    // Preserve current font settings
    const currentFont = document.getElementById('previewFont').value;
    const currentSize = document.getElementById('previewFontSize').value;
    artPreview.style.fontFamily = currentFont;
    artPreview.style.fontSize = currentSize + 'px';
    
    artLines.forEach((line, rowIdx) => {
        const lineDiv = document.createElement('div');
        lineDiv.style.height = '1em';
        lineDiv.style.lineHeight = '1';
        
        for (let colIdx = 0; colIdx < line.length; colIdx++) {
            const char = line[colIdx];
            const span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char; // Non-breaking space
            
            if (colors && colors[rowIdx] && colors[rowIdx][colIdx]) {
                const color = colors[rowIdx][colIdx];
                if (Array.isArray(color) && color.length === 3) {
                    span.style.color = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
                }
            }
            
            lineDiv.appendChild(span);
        }
        
        artPreview.appendChild(lineDiv);
    });
}

// Show video frame
function showFrame() {
    if (!resultData || resultData.type !== 'video') return;
    
    const frames = resultData.data.frames;
    if (currentFrame >= frames.length) currentFrame = 0;
    if (currentFrame < 0) currentFrame = frames.length - 1;
    
    const frame = frames[currentFrame];
    const frameInfo = document.getElementById('frameInfo');
    
    // Show frame
    if (resultData.meta.color_mode === 'html' && frame.colors) {
        renderColoredArt(frame.art, frame.colors);
    } else {
        document.getElementById('artPreview').textContent = frame.art.join('\n');
    }
    
    // Update frame info
    frameInfo.textContent = `Frame ${currentFrame + 1} / ${frames.length} | Time: ${frame.timestamp.toFixed(2)}s`;
}

// Video controls
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
    const playIcon = document.getElementById('playIcon');
    playIcon.className = 'fas fa-pause';
    
    const fps = resultData.meta.fps || 24;
    const interval = 1000 / fps;
    
    playInterval = setInterval(() => {
        currentFrame++;
        if (currentFrame >= resultData.data.frames.length) {
            currentFrame = 0;
        }
        showFrame();
    }, interval);
}

function stopPlay() {
    isPlaying = false;
    const playIcon = document.getElementById('playIcon');
    playIcon.className = 'fas fa-play';
    
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

// Switch tabs
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Find and activate the clicked tab
    document.querySelectorAll('.tab').forEach(tab => {
        if (tab.textContent.toLowerCase().includes(tabName.toLowerCase()) || 
            (tabName === 'export' && tab.textContent.includes('Export')) ||
            (tabName === 'info' && tab.textContent.includes('Info'))) {
            tab.classList.add('active');
        }
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName + 'Tab').classList.add('active');
}

// Export functions
async function exportAs(format) {
    if (!resultData) {
        showStatus('No result to export', 'error');
        return;
    }
    
    try {
        let content = '';
        let filename = '';
        let mimeType = '';
        
        switch (format) {
            case 'text':
                if (resultData.type === 'video') {
                    // Export all frames as text
                    content = resultData.data.frames.map((frame, idx) => 
                        `Frame ${idx + 1} (${frame.timestamp}s):\n${frame.art.join('\n')}`
                    ).join('\n\n' + '='.repeat(80) + '\n\n');
                } else {
                    content = resultData.data.art.join('\n');
                }
                filename = 'character-art.txt';
                mimeType = 'text/plain';
                break;
                
            case 'html':
                content = await generateHTML();
                filename = 'character-art.html';
                mimeType = 'text/html';
                break;
                
            case 'svg':
                if (resultData.type === 'video') {
                    showStatus('SVG export not available for videos', 'error');
                    return;
                }
                content = generateSVG();
                filename = 'character-art.svg';
                mimeType = 'image/svg+xml';
                break;
                
            case 'json':
                content = JSON.stringify(resultData, null, 2);
                filename = 'character-art.json';
                mimeType = 'application/json';
                break;
                
            case 'ansi':
                if (resultData.meta.color_mode === 'grayscale') {
                    showStatus('ANSI export requires color mode', 'error');
                    return;
                }
                content = generateANSI();
                filename = 'character-art.ans';
                mimeType = 'text/plain';
                break;
                
            case 'gif':
                showStatus('GIF export coming soon!', 'info');
                return;
        }
        
        // Download file
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showStatus(`Exported as ${format.toUpperCase()}`, 'success');
        
    } catch (error) {
        console.error('Export error:', error);
        showStatus(`Export failed: ${error.message}`, 'error');
    }
}

// Generate HTML
async function generateHTML() {
    const fontFamily = "'Fira Code', 'Courier New', monospace";
    const fontSize = document.getElementById('previewFontSize').value;
    
    let htmlContent = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Character Art</title>
    <style>
        body {
            background-color: #000;
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .art-container {
            font-family: ${fontFamily};
            font-size: ${fontSize}px;
            line-height: 1.0;
            white-space: pre;
        }
        .frame {
            display: none;
        }
        .frame.active {
            display: block;
        }
    </style>
</head>
<body>
    <div class="art-container">
`;
    
    if (resultData.type === 'video') {
        // Video with animation
        resultData.data.frames.forEach((frame, idx) => {
            htmlContent += `<div class="frame ${idx === 0 ? 'active' : ''}" id="frame-${idx}">`;
            htmlContent += formatArtAsHTML(frame.art, frame.colors);
            htmlContent += '</div>\n';
        });
        
        // Add animation script
        htmlContent += `
    </div>
    <script>
        let currentFrame = 0;
        const totalFrames = ${resultData.data.frames.length};
        const fps = ${resultData.meta.fps || 24};
        
        setInterval(() => {
            document.getElementById('frame-' + currentFrame).classList.remove('active');
            currentFrame = (currentFrame + 1) % totalFrames;
            document.getElementById('frame-' + currentFrame).classList.add('active');
        }, 1000 / fps);
    </script>
`;
    } else {
        // Static image
        htmlContent += formatArtAsHTML(resultData.data.art, resultData.data.colors);
        htmlContent += '\n    </div>\n';
    }
    
    htmlContent += '</body>\n</html>';
    return htmlContent;
}

// Format art as HTML
function formatArtAsHTML(artLines, colors) {
    let html = '';
    
    artLines.forEach((line, rowIdx) => {
        html += '<div>';
        for (let colIdx = 0; colIdx < line.length; colIdx++) {
            const char = line[colIdx];
            const charEscaped = char === ' ' ? '&nbsp;' : escapeHtml(char);
            
            if (colors && colors[rowIdx] && colors[rowIdx][colIdx]) {
                const color = colors[rowIdx][colIdx];
                if (Array.isArray(color) && color.length === 3) {
                    html += `<span style="color: rgb(${color[0]}, ${color[1]}, ${color[2]})">${charEscaped}</span>`;
                } else {
                    html += `<span style="color: #00ff00">${charEscaped}</span>`;
                }
            } else {
                html += `<span style="color: #00ff00">${charEscaped}</span>`;
            }
        }
        html += '</div>';
    });
    
    return html;
}

// Generate SVG
function generateSVG() {
    const charWidth = 8;
    const charHeight = 12;
    const artLines = resultData.data.art;
    const colors = resultData.data.colors;
    
    const width = artLines[0].length * charWidth;
    const height = artLines.length * charHeight;
    
    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="#000000"/>
    <style>
        text {
            font-family: 'Courier New', monospace;
            font-size: ${charHeight}px;
            dominant-baseline: text-before-edge;
        }
    </style>
`;
    
    artLines.forEach((line, rowIdx) => {
        const y = rowIdx * charHeight;
        for (let colIdx = 0; colIdx < line.length; colIdx++) {
            const char = line[colIdx];
            if (char !== ' ') {
                const x = colIdx * charWidth;
                const charEscaped = escapeHtml(char);
                
                let fillColor = "#00ff00";
                if (colors && colors[rowIdx] && colors[rowIdx][colIdx]) {
                    const color = colors[rowIdx][colIdx];
                    if (Array.isArray(color) && color.length === 3) {
                        fillColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
                    }
                }
                
                svg += `    <text x="${x}" y="${y}" fill="${fillColor}">${charEscaped}</text>\n`;
            }
        }
    });
    
    svg += '</svg>';
    return svg;
}

// Generate ANSI
function generateANSI() {
    let ansi = '';
    
    if (resultData.type === 'video') {
        // Export first frame only for ANSI
        const frame = resultData.data.frames[0];
        ansi = formatArtAsANSI(frame.art, frame.colors);
    } else {
        ansi = formatArtAsANSI(resultData.data.art, resultData.data.colors);
    }
    
    return ansi;
}

// Format art as ANSI
function formatArtAsANSI(artLines, colors) {
    const ANSI_COLORS = {
        'black': 30,
        'red': 31,
        'green': 32,
        'yellow': 33,
        'blue': 34,
        'magenta': 35,
        'cyan': 36,
        'white': 37,
    };
    
    let ansi = '';
    
    artLines.forEach((line, rowIdx) => {
        for (let colIdx = 0; colIdx < line.length; colIdx++) {
            const char = line[colIdx];
            
            if (colors && colors[rowIdx] && colors[rowIdx][colIdx]) {
                const color = colors[rowIdx][colIdx];
                
                if (typeof color === 'string' && ANSI_COLORS[color]) {
                    // Basic ANSI color
                    ansi += `\x1b[${ANSI_COLORS[color]}m${char}\x1b[0m`;
                } else if (typeof color === 'number') {
                    // ANSI 256 color
                    ansi += `\x1b[38;5;${color}m${char}\x1b[0m`;
                } else if (Array.isArray(color) && color.length === 3) {
                    // True color
                    ansi += `\x1b[38;2;${color[0]};${color[1]};${color[2]}m${char}\x1b[0m`;
                } else {
                    ansi += char;
                }
            } else {
                ansi += char;
            }
        }
        ansi += '\n';
    });
    
    return ansi;
}

// Utility function
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}