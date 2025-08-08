// Advanced compression methods for character art

// Method 1: Ultra Minimal - Only character positions
function ultraMinimalCompress(artLines) {
    const result = {};
    let pos = 0;
    
    artLines.forEach(line => {
        for (const char of line) {
            if (char !== ' ' && char !== '　') {
                if (!result[char]) result[char] = [];
                result[char].push(pos);
            }
            pos++;
        }
    });
    
    return result;
}

// Method 2: Delta Encoding - Store position differences
function deltaCompress(artLines) {
    const result = {};
    let pos = 0;
    
    artLines.forEach(line => {
        for (const char of line) {
            if (char !== ' ' && char !== '　') {
                if (!result[char]) result[char] = [];
                result[char].push(pos);
            }
            pos++;
        }
    });
    
    // Convert to delta encoding
    const deltaResult = {};
    for (const [char, positions] of Object.entries(result)) {
        deltaResult[char] = [positions[0]]; // First position absolute
        for (let i = 1; i < positions.length; i++) {
            deltaResult[char].push(positions[i] - positions[i-1]); // Store differences
        }
    }
    
    return deltaResult;
}

// Method 3: Run Length Encoding
function rleCompress(artLines) {
    const runs = [];
    let currentChar = null;
    let count = 0;
    
    artLines.forEach(line => {
        for (const char of line) {
            if (char === currentChar) {
                count++;
            } else {
                if (currentChar !== null) {
                    // Skip spaces in output
                    if (currentChar !== ' ' && currentChar !== '　') {
                        runs.push([currentChar, count]);
                    } else {
                        runs.push(['_', count]); // Use _ for space runs
                    }
                }
                currentChar = char;
                count = 1;
            }
        }
    });
    
    // Don't forget last run
    if (currentChar !== null) {
        if (currentChar !== ' ' && currentChar !== '　') {
            runs.push([currentChar, count]);
        } else {
            runs.push(['_', count]);
        }
    }
    
    return runs;
}

// Method 4: Bitmap + Dictionary (for small character sets)
function bitmapCompress(artLines, charset) {
    // Create character to index mapping
    const charToIndex = {};
    charset.forEach((char, idx) => {
        charToIndex[char] = idx;
    });
    
    // Convert to bitmap
    const bitmap = [];
    artLines.forEach(line => {
        for (const char of line) {
            const idx = charToIndex[char] || 0; // Default to first char if not found
            bitmap.push(idx);
        }
    });
    
    // Pack into base64 or hex string for compact storage
    return {
        c: charset,  // character set
        b: packBitmap(bitmap)  // packed bitmap
    };
}

// Method 5: Quad-tree compression (for sparse art)
function quadTreeCompress(artLines) {
    // Convert to 2D array
    const grid = artLines.map(line => Array.from(line));
    
    function buildQuadTree(x, y, w, h) {
        // Check if region is uniform
        const firstChar = grid[y][x];
        let isUniform = true;
        
        for (let dy = 0; dy < h && isUniform; dy++) {
            for (let dx = 0; dx < w && isUniform; dx++) {
                if (grid[y + dy] && grid[y + dy][x + dx] !== firstChar) {
                    isUniform = false;
                }
            }
        }
        
        if (isUniform) {
            // Don't store spaces
            if (firstChar === ' ' || firstChar === '　') {
                return null;
            }
            return firstChar;
        }
        
        // Subdivide
        if (w > 1 || h > 1) {
            const hw = Math.ceil(w / 2);
            const hh = Math.ceil(h / 2);
            
            return {
                tl: buildQuadTree(x, y, hw, hh),
                tr: buildQuadTree(x + hw, y, w - hw, hh),
                bl: buildQuadTree(x, y + hh, hw, h - hh),
                br: buildQuadTree(x + hw, y + hh, w - hw, h - hh)
            };
        }
        
        return grid[y][x];
    }
    
    return buildQuadTree(0, 0, grid[0].length, grid.length);
}

// Method 6: Pattern-based compression (for repeating patterns)
function patternCompress(artLines) {
    // Find repeating patterns
    const patterns = {};
    const minPatternLength = 3;
    const maxPatternLength = 20;
    
    // Extract all possible patterns
    artLines.forEach(line => {
        for (let len = minPatternLength; len <= maxPatternLength; len++) {
            for (let i = 0; i <= line.length - len; i++) {
                const pattern = line.substr(i, len);
                if (!pattern.includes(' ') && !pattern.includes('　')) {
                    patterns[pattern] = (patterns[pattern] || 0) + 1;
                }
            }
        }
    });
    
    // Keep only patterns that repeat
    const frequentPatterns = Object.entries(patterns)
        .filter(([_, count]) => count > 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 50); // Keep top 50 patterns
    
    // Encode using patterns
    // ... (implementation depends on specific needs)
    
    return {
        patterns: frequentPatterns.map(p => p[0]),
        encoded: "..." // Encoded data using pattern references
    };
}

// Helper function to pack bitmap
function packBitmap(bitmap) {
    // Simple hex encoding for now
    // Could use more efficient packing based on charset size
    return bitmap.map(idx => idx.toString(16)).join('');
}

// Decompression functions
function ultraMinimalDecompress(compressed, width, height) {
    const result = Array(height).fill(null).map(() => Array(width).fill(' '));
    
    for (const [char, positions] of Object.entries(compressed)) {
        positions.forEach(pos => {
            const row = Math.floor(pos / width);
            const col = pos % width;
            result[row][col] = char;
        });
    }
    
    return result.map(row => row.join(''));
}

function deltaDecompress(compressed, width, height) {
    // First, reconstruct absolute positions
    const absolute = {};
    for (const [char, deltas] of Object.entries(compressed)) {
        absolute[char] = [deltas[0]];
        for (let i = 1; i < deltas.length; i++) {
            absolute[char].push(absolute[char][i-1] + deltas[i]);
        }
    }
    
    return ultraMinimalDecompress(absolute, width, height);
}

function rleDecompress(runs, width) {
    let result = '';
    
    runs.forEach(([char, count]) => {
        const actualChar = char === '_' ? ' ' : char;
        result += actualChar.repeat(count);
    });
    
    // Split into lines
    const lines = [];
    for (let i = 0; i < result.length; i += width) {
        lines.push(result.substr(i, width));
    }
    
    return lines;
}

// Export functions
const CompressionMethods = {
    ultraMinimal: {
        compress: ultraMinimalCompress,
        decompress: ultraMinimalDecompress
    },
    delta: {
        compress: deltaCompress,
        decompress: deltaDecompress
    },
    rle: {
        compress: rleCompress,
        decompress: rleDecompress
    },
    bitmap: {
        compress: bitmapCompress
    },
    quadTree: {
        compress: quadTreeCompress
    },
    pattern: {
        compress: patternCompress
    }
};

// Compression analyzer
function analyzeCompression(artLines) {
    const original = JSON.stringify(artLines).length;
    const results = {};
    
    // Test ultra minimal
    const ultraMinimal = ultraMinimalCompress(artLines);
    results.ultraMinimal = {
        size: JSON.stringify(ultraMinimal).length,
        ratio: (JSON.stringify(ultraMinimal).length / original * 100).toFixed(1) + '%'
    };
    
    // Test delta
    const delta = deltaCompress(artLines);
    results.delta = {
        size: JSON.stringify(delta).length,
        ratio: (JSON.stringify(delta).length / original * 100).toFixed(1) + '%'
    };
    
    // Test RLE
    const rle = rleCompress(artLines);
    results.rle = {
        size: JSON.stringify(rle).length,
        ratio: (JSON.stringify(rle).length / original * 100).toFixed(1) + '%'
    };
    
    return results;
}