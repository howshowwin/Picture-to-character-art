/**
 * Standalone Character Art Animation Player with GSAP
 * 
 * Usage:
 * playCharacterArt({
 *     path: '/path/to/animation.json',
 *     width: 80,
 *     canvasClass: 'my-canvas-class'
 * });
 */

class CharacterArtPlayer {
    constructor(options) {
        this.path = options.path;
        this.charsPerLine = options.width || 80;
        this.canvasClass = options.canvasClass || 'art-canvas';
        this.fps = options.fps || 30;
        this.loop = options.loop !== undefined ? options.loop : true;
        this.fontColor = options.color || '#00ff00';
        this.fontSize = options.fontSize || 12;
        this.backgroundColor = options.backgroundColor || '#000000';
        this.onComplete = options.onComplete || null;
        this.onFrame = options.onFrame || null;
        this.autoplay = options.autoplay !== undefined ? options.autoplay : true;
        
        this.frames = [];
        this.currentFrame = 0;
        this.timeline = null;
        this.canvas = null;
        this.ctx = null;
        this.isPlaying = false;
    }

    async init() {
        try {
            // Find or create canvas
            this.canvas = document.querySelector(`.${this.canvasClass}`);
            if (!this.canvas) {
                this.canvas = document.createElement('canvas');
                this.canvas.className = this.canvasClass;
                document.body.appendChild(this.canvas);
            }
            
            this.ctx = this.canvas.getContext('2d');
            
            // Load animation data
            const response = await fetch(this.path);
            if (!response.ok) {
                throw new Error(`Failed to load: ${response.status}`);
            }
            
            const data = await response.json();
            this.frames = this.parseAnimationData(data);
            
            if (this.frames.length > 0) {
                this.setupCanvas();
                if (this.autoplay) {
                    this.play();
                } else {
                    this.renderFrame(0);
                }
            }
            
            return this;
        } catch (error) {
            console.error('CharacterArtPlayer error:', error);
            throw error;
        }
    }

    parseAnimationData(data) {
        let frames = [];
        
        if (Array.isArray(data)) {
            // Array of frames
            frames = data.map(frame => this.parseFrame(frame));
        } else if (data.frames) {
            // Has frames property
            frames = data.frames.map(frame => this.parseFrame(frame));
        } else {
            // Single frame
            frames = [this.parseFrame(data)];
        }
        
        return frames;
    }

    parseFrame(frameData) {
        // Extract character positions and metadata
        let charPositions, totalChars;
        
        if (frameData.w && frameData.h) {
            totalChars = frameData.w * frameData.h;
            this.charsPerLine = frameData.w;
            charPositions = frameData.c || frameData;
        } else if (frameData.meta) {
            const width = frameData.meta.width || this.charsPerLine;
            const height = frameData.meta.height || 25;
            totalChars = width * height;
            this.charsPerLine = width;
            charPositions = frameData.data || frameData;
        } else {
            // Plain character positions
            let maxPos = 0;
            for (const positions of Object.values(frameData)) {
                if (Array.isArray(positions)) {
                    maxPos = Math.max(maxPos, ...positions);
                }
            }
            totalChars = maxPos + 1;
            charPositions = frameData;
        }
        
        return {
            charPositions,
            totalChars
        };
    }

    setupCanvas() {
        // Calculate canvas dimensions (square)
        const firstFrame = this.frames[0];
        const numRows = Math.ceil(firstFrame.totalChars / this.charsPerLine);
        
        const charWidth = this.fontSize * 0.6;
        const lineHeight = this.fontSize * 1.2;
        
        const canvasSize = Math.max(
            this.charsPerLine * charWidth,
            numRows * lineHeight
        );
        
        this.canvas.width = canvasSize;
        this.canvas.height = canvasSize;
        
        // Set canvas styles
        this.canvas.style.imageRendering = 'pixelated';
        this.canvas.style.imageRendering = '-moz-crisp-edges';
        this.canvas.style.imageRendering = 'crisp-edges';
    }

    renderFrame(frameIndex) {
        if (frameIndex < 0 || frameIndex >= this.frames.length) return;
        
        const frame = this.frames[frameIndex];
        const numRows = Math.ceil(frame.totalChars / this.charsPerLine);
        
        // Clear canvas
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Set font
        this.ctx.font = `${this.fontSize}px "Courier New", monospace`;
        this.ctx.fillStyle = this.fontColor;
        this.ctx.textBaseline = 'top';
        
        const charWidth = this.fontSize * 0.6;
        const lineHeight = this.fontSize * 1.2;
        
        // Create character grid
        const grid = Array(numRows).fill(null).map(() => 
            Array(this.charsPerLine).fill(' ')
        );
        
        // Fill characters
        for (const [char, positions] of Object.entries(frame.charPositions)) {
            if (Array.isArray(positions)) {
                positions.forEach(pos => {
                    const row = Math.floor(pos / this.charsPerLine);
                    const col = pos % this.charsPerLine;
                    if (row < numRows && col < this.charsPerLine) {
                        grid[row][col] = char;
                    }
                });
            }
        }
        
        // Draw characters
        for (let row = 0; row < numRows; row++) {
            for (let col = 0; col < this.charsPerLine; col++) {
                const char = grid[row][col];
                if (char && char !== ' ') {
                    const x = col * charWidth;
                    const y = row * lineHeight;
                    this.ctx.fillText(char, x, y);
                }
            }
        }
        
        this.currentFrame = frameIndex;
        
        if (this.onFrame) {
            this.onFrame(frameIndex, this.frames.length);
        }
    }

    play() {
        if (this.frames.length === 0) return;
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        
        // Create GSAP timeline
        this.timeline = gsap.timeline({
            repeat: this.loop ? -1 : 0,
            onComplete: () => {
                this.isPlaying = false;
                if (this.onComplete) {
                    this.onComplete();
                }
            }
        });
        
        // Add frame animations
        const frameDuration = 1 / this.fps;
        
        this.frames.forEach((frame, index) => {
            this.timeline.to({}, {
                duration: frameDuration,
                onStart: () => {
                    this.renderFrame(index);
                }
            });
        });
        
        this.timeline.play();
    }

    pause() {
        if (this.timeline) {
            this.timeline.pause();
            this.isPlaying = false;
        }
    }

    resume() {
        if (this.timeline) {
            this.timeline.resume();
            this.isPlaying = true;
        }
    }

    stop() {
        if (this.timeline) {
            this.timeline.kill();
            this.timeline = null;
            this.isPlaying = false;
            this.currentFrame = 0;
            this.renderFrame(0);
        }
    }

    seek(frameIndex) {
        frameIndex = Math.max(0, Math.min(frameIndex, this.frames.length - 1));
        this.renderFrame(frameIndex);
        
        if (this.timeline) {
            const time = frameIndex / this.fps;
            this.timeline.seek(time);
        }
    }

    setSpeed(speed) {
        if (this.timeline) {
            this.timeline.timeScale(speed);
        }
    }

    destroy() {
        this.stop();
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        this.canvas = null;
        this.ctx = null;
        this.frames = [];
    }
}

// Main function to play character art
async function playCharacterArt(options) {
    // Ensure GSAP is loaded
    if (typeof gsap === 'undefined') {
        console.error('GSAP is required. Please include GSAP library.');
        
        // Auto-load GSAP if not present
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js';
        script.onload = async () => {
            const player = new CharacterArtPlayer(options);
            await player.init();
            return player;
        };
        document.head.appendChild(script);
    } else {
        const player = new CharacterArtPlayer(options);
        await player.init();
        return player;
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CharacterArtPlayer, playCharacterArt };
}

// Export for ES6 modules
if (typeof exports !== 'undefined') {
    exports.CharacterArtPlayer = CharacterArtPlayer;
    exports.playCharacterArt = playCharacterArt;
}

// Add to window for browser usage
if (typeof window !== 'undefined') {
    window.CharacterArtPlayer = CharacterArtPlayer;
    window.playCharacterArt = playCharacterArt;
}