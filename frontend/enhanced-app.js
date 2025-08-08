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

// Compress art data to ultra-optimized format
function compressArtData(artLines, colors, artType) {
    // Build position map for each character (excluding spaces)
    const charPositions = {};
    let position = 0;
    
    artLines.forEach((line, rowIdx) => {
        for (let colIdx = 0; colIdx < line.length; colIdx++) {
            const char = line[colIdx];
            // Skip spaces and full-width spaces
            if (char !== ' ' && char !== '　') {
                if (!charPositions[char]) {
                    charPositions[char] = [];
                }
                charPositions[char].push(position);
            }
            position++;
        }
    });
    
    // Build compressed color data if available
    let compressedColors = null;
    if (colors) {
        compressedColors = {};
        position = 0;
        
        colors.forEach((row, rowIdx) => {
            if (row) {
                row.forEach((color, colIdx) => {
                    if (color) {
                        const colorKey = Array.isArray(color) ? color.join(',') : String(color);
                        if (!compressedColors[colorKey]) {
                            compressedColors[colorKey] = [];
                        }
                        compressedColors[colorKey].push(position);
                    }
                    position++;
                });
            } else {
                // Skip positions for null rows
                position += artLines[rowIdx].length;
            }
        });
    }
    
    // Return ultra-compressed format
    return {
        w: artLines[0].length,  // width
        h: artLines.length,     // height
        c: charPositions,        // character positions
        p: compressedColors      // color positions (optional)
    };
}

// Run-Length Encoding compression
function rleCompress(artLines) {
    const runs = [];
    
    artLines.forEach(line => {
        let currentChar = null;
        let count = 0;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === currentChar) {
                count++;
            } else {
                if (currentChar !== null) {
                    runs.push([currentChar, count]);
                }
                currentChar = char;
                count = 1;
            }
        }
        
        // Don't forget the last run in the line
        if (currentChar !== null) {
            runs.push([currentChar, count]);
        }
        
        // Add line break marker
        runs.push(['\n', 1]);
    });
    
    // Remove the last line break
    if (runs.length > 0 && runs[runs.length - 1][0] === '\n') {
        runs.pop();
    }
    
    return runs;
}

// RLE decompression (for reference)
function rleDecompress(runs) {
    let result = '';
    
    runs.forEach(([char, count]) => {
        result += char.repeat(count);
    });
    
    return result.split('\n');
}

// Create ultra-compressed JSON format
function createUltraCompressedJSON(resultData) {
    const meta = {
        v: '2.0',  // version
        t: resultData.meta.art_type,  // type
        m: resultData.meta.color_mode  // color mode
    };
    
    if (resultData.type === 'video') {
        // Video format
        const frames = resultData.data.frames.map(frame => 
            compressArtData(frame.art, frame.colors, resultData.meta.art_type)
        );
        
        return {
            meta: meta,
            fps: resultData.meta.fps,
            frames: frames,
            timestamps: resultData.data.frames.map(f => f.timestamp)
        };
    } else {
        // Image format - just return the compressed data directly
        const compressed = compressArtData(
            resultData.data.art, 
            resultData.data.colors,
            resultData.meta.art_type
        );
        
        return {
            meta: meta,
            data: compressed
        };
    }
}

// Decompress art data from optimized format
function decompressArtData(compressedData) {
    // Handle both old and new format
    let width, height, charPositions, colorPositions;
    
    if (compressedData.dimensions) {
        // Old format
        const { dimensions, charset, charPositions: chars, colors } = compressedData;
        width = dimensions.width;
        height = dimensions.height;
        charPositions = chars;
        colorPositions = colors;
    } else {
        // New ultra-compressed format
        width = compressedData.w;
        height = compressedData.h;
        charPositions = compressedData.c;
        colorPositions = compressedData.p;
    }
    
    // Initialize art array with spaces (default to full-width space for Japanese)
    const defaultSpace = ' ';  // Can be changed to '　' if needed
    const artLines = Array(height).fill(null).map(() => Array(width).fill(defaultSpace));
    
    // Fill in characters based on positions
    Object.entries(charPositions).forEach(([char, positions]) => {
        positions.forEach(pos => {
            const row = Math.floor(pos / width);
            const col = pos % width;
            artLines[row][col] = char;
        });
    });
    
    // Convert to string lines
    const artStringLines = artLines.map(row => row.join(''));
    
    // Decompress colors if available
    let colorArray = null;
    if (colorPositions) {
        colorArray = Array(height).fill(null).map(() => Array(width).fill(null));
        
        Object.entries(colorPositions).forEach(([colorKey, positions]) => {
            const color = colorKey.includes(',') 
                ? colorKey.split(',').map(Number) 
                : colorKey;
            
            positions.forEach(pos => {
                const row = Math.floor(pos / width);
                const col = pos % width;
                colorArray[row][col] = color;
            });
        });
    }
    
    return {
        art: artStringLines,
        colors: colorArray
    };
}

// Render character art to canvas
function renderArtToCanvas(artLines, colors, canvas, fontSize = 12, userTextColor = null) {
    const ctx = canvas.getContext('2d');
    const canvasSize = 1000; // Fixed size 1000x1000
    
    // Set canvas size
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    
    // Clear canvas with black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    
    // Get user-selected color from preview settings
    const previewTextColor = userTextColor || document.getElementById('previewTextColor')?.value || '#00ff00';
    
    // Set font
    ctx.font = `${fontSize}px 'Courier New', monospace`;
    ctx.textBaseline = 'top';
    
    // Calculate scaling to fit art in 1000x1000
    const charWidth = fontSize * 0.6; // Approximate character width
    const lineHeight = fontSize * 1.2;
    const artWidth = artLines[0].length * charWidth;
    const artHeight = artLines.length * lineHeight;
    
    // Calculate scale to fit
    const scale = Math.min(canvasSize * 0.9 / artWidth, canvasSize * 0.9 / artHeight);
    const scaledFontSize = Math.floor(fontSize * scale);
    const scaledCharWidth = scaledFontSize * 0.6;
    const scaledLineHeight = scaledFontSize * 1.2;
    
    // Update font with scaled size
    ctx.font = `${scaledFontSize}px 'Courier New', monospace`;
    
    // Calculate centered position
    const totalWidth = artLines[0].length * scaledCharWidth;
    const totalHeight = artLines.length * scaledLineHeight;
    const offsetX = (canvasSize - totalWidth) / 2;
    const offsetY = (canvasSize - totalHeight) / 2;
    
    // Check if we're in color mode
    const isColorMode = resultData && resultData.meta && resultData.meta.color_mode !== 'grayscale';
    
    // Draw each character
    artLines.forEach((line, rowIdx) => {
        const y = offsetY + rowIdx * scaledLineHeight;
        
        for (let colIdx = 0; colIdx < line.length; colIdx++) {
            const char = line[colIdx];
            const x = offsetX + colIdx * scaledCharWidth;
            
            // Set color
            if (isColorMode && colors && colors[rowIdx] && colors[rowIdx][colIdx]) {
                const color = colors[rowIdx][colIdx];
                if (Array.isArray(color) && color.length === 3) {
                    ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
                } else {
                    ctx.fillStyle = previewTextColor;
                }
            } else {
                // Use user-selected color for grayscale mode
                ctx.fillStyle = previewTextColor;
            }
            
            // Draw character
            if (char !== ' ' && char !== '　') {
                ctx.fillText(char, x, y);
            }
        }
    });
}

// Export character art as video
async function exportAsVideo() {
    if (!resultData) {
        showStatus('No result to export', 'error');
        return;
    }
    
    showStatus('Preparing video export...', 'loading');
    
    try {
        // Create canvas
        const canvas = document.createElement('canvas');
        const stream = canvas.captureStream(30); // 30 FPS
        
        // Check supported codecs
        let mimeType = 'video/webm';
        let fileExtension = 'webm';
        
        // Try to use MP4 format (H.264)
        if (MediaRecorder.isTypeSupported('video/mp4')) {
            mimeType = 'video/mp4';
            fileExtension = 'mp4';
        } else if (MediaRecorder.isTypeSupported('video/webm; codecs=h264')) {
            // WebM with H.264 codec (better compatibility)
            mimeType = 'video/webm; codecs=h264';
            fileExtension = 'webm';
        } else if (MediaRecorder.isTypeSupported('video/webm; codecs=vp9')) {
            mimeType = 'video/webm; codecs=vp9';
            fileExtension = 'webm';
        }
        
        // Create media recorder
        const mediaRecorder = new MediaRecorder(stream, {
            mimeType: mimeType,
            videoBitsPerSecond: 5000000 // 5 Mbps
        });
        
        const chunks = [];
        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunks.push(e.data);
            }
        };
        
        mediaRecorder.onstop = async () => {
            // Create video blob
            const blob = new Blob(chunks, { type: mimeType });
            
            // If we got WebM but user wants MP4, we'll need to inform them
            if (fileExtension === 'webm' && !mimeType.includes('h264')) {
                showStatus('Note: MP4 format not supported by browser, exported as WebM', 'info');
            }
            
            // Download video
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `character-art-1000x1000.${fileExtension}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            showStatus(`Video exported successfully as ${fileExtension.toUpperCase()}!`, 'success');
        };
        
        // Start recording
        mediaRecorder.start();
        
        if (resultData.type === 'video') {
            // Animate frames
            const frames = resultData.data.frames;
            const fps = resultData.meta.fps || 24;
            const frameDuration = 1000 / fps;
            let frameIndex = 0;
            
            const renderFrame = () => {
                if (frameIndex >= frames.length) {
                    // Stop recording after all frames
                    setTimeout(() => {
                        mediaRecorder.stop();
                    }, 100);
                    return;
                }
                
                const frame = frames[frameIndex];
                renderArtToCanvas(frame.art, frame.colors, canvas);
                frameIndex++;
                
                setTimeout(renderFrame, frameDuration);
            };
            
            renderFrame();
        } else {
            // Static image - create a 3 second video
            renderArtToCanvas(resultData.data.art, resultData.data.colors, canvas);
            
            setTimeout(() => {
                mediaRecorder.stop();
            }, 3000); // 3 seconds
        }
        
    } catch (error) {
        console.error('Video export error:', error);
        showStatus(`Video export failed: ${error.message}`, 'error');
    }
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
                
            case 'json-compressed':
                // Ultra minimal format - only character positions
                if (resultData.type === 'video') {
                    // For video: array of frames, each frame is character positions
                    const frames = resultData.data.frames.map(frame => {
                        const compressed = {};
                        let pos = 0;
                        frame.art.forEach(line => {
                            for (const char of line) {
                                if (char !== ' ' && char !== '　') {
                                    if (!compressed[char]) compressed[char] = [];
                                    compressed[char].push(pos);
                                }
                                pos++;
                            }
                        });
                        return compressed;
                    });
                    content = JSON.stringify(frames);
                } else {
                    // For image: just character positions
                    const compressed = {};
                    let pos = 0;
                    resultData.data.art.forEach(line => {
                        for (const char of line) {
                            if (char !== ' ' && char !== '　') {
                                if (!compressed[char]) compressed[char] = [];
                                compressed[char].push(pos);
                            }
                            pos++;
                        }
                    });
                    content = JSON.stringify(compressed);
                }
                filename = 'art-ultra.json';
                mimeType = 'application/json';
                break;
                
            case 'rle':
                // Run-Length Encoding format
                if (resultData.type === 'video') {
                    // For video: include metadata and compressed frames
                    const rleData = {
                        type: 'video',
                        fps: resultData.meta.fps,
                        width: resultData.data.frames[0].art[0].length,
                        height: resultData.data.frames[0].art.length,
                        frames: resultData.data.frames.map(frame => ({
                            timestamp: frame.timestamp,
                            runs: rleCompress(frame.art)
                        }))
                    };
                    content = JSON.stringify(rleData, null, 2);
                } else {
                    // For image: include basic metadata and runs
                    const rleData = {
                        type: 'image',
                        width: resultData.data.art[0].length,
                        height: resultData.data.art.length,
                        runs: rleCompress(resultData.data.art)
                    };
                    content = JSON.stringify(rleData, null, 2);
                }
                filename = 'art-rle.json';
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
                
            case 'video':
                await exportAsVideo();
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