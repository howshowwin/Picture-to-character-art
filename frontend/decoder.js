class ArtDecoder {
    constructor() {
        this.decoders = {
            ultraMinimal: this.decodeUltraMinimal.bind(this),
            delta: this.decodeDelta.bind(this),
            rle: this.decodeRLE.bind(this),
            bitmap: this.decodeBitmap.bind(this),
            quadTree: this.decodeQuadTree.bind(this),
            hybrid: this.decodeHybrid.bind(this)
        };
    }

    async fetchAndDecode(url, options = {}) {
        try {
            const response = await fetch(url, {
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.type || !data.data) {
                throw new Error('Invalid compressed data format');
            }

            const decoder = this.decoders[data.type];
            if (!decoder) {
                throw new Error(`Unknown compression type: ${data.type}`);
            }

            return decoder(data.data, data.metadata);
        } catch (error) {
            console.error('Decode error:', error);
            throw error;
        }
    }

    decodeUltraMinimal(compressed, metadata) {
        const { width, height } = metadata;
        const result = Array(height).fill(null).map(() => Array(width).fill(' '));
        
        for (const [char, positions] of Object.entries(compressed)) {
            positions.forEach(pos => {
                const row = Math.floor(pos / width);
                const col = pos % width;
                if (row < height && col < width) {
                    result[row][col] = char;
                }
            });
        }
        
        return result.map(row => row.join(''));
    }

    decodeDelta(compressed, metadata) {
        const { width, height } = metadata;
        const absolute = {};
        
        for (const [char, deltas] of Object.entries(compressed)) {
            absolute[char] = [deltas[0]];
            for (let i = 1; i < deltas.length; i++) {
                absolute[char].push(absolute[char][i-1] + deltas[i]);
            }
        }
        
        return this.decodeUltraMinimal(absolute, metadata);
    }

    decodeRLE(runs, metadata) {
        const { width } = metadata;
        let result = '';
        
        runs.forEach(([char, count]) => {
            const actualChar = char === '_' ? ' ' : char;
            result += actualChar.repeat(count);
        });
        
        const lines = [];
        for (let i = 0; i < result.length; i += width) {
            lines.push(result.substr(i, width));
        }
        
        return lines;
    }

    decodeBitmap(data, metadata) {
        const { charset, bitmap } = data;
        const { width, height } = metadata;
        const unpacked = this.unpackBitmap(bitmap, charset.length);
        
        const result = [];
        let line = '';
        
        unpacked.forEach((idx, pos) => {
            line += charset[idx] || ' ';
            if ((pos + 1) % width === 0) {
                result.push(line);
                line = '';
            }
        });
        
        if (line) result.push(line);
        return result;
    }

    decodeQuadTree(tree, metadata) {
        const { width, height } = metadata;
        const result = Array(height).fill(null).map(() => Array(width).fill(' '));
        
        const traverse = (node, x, y, w, h) => {
            if (!node) return;
            
            if (typeof node === 'string') {
                for (let dy = 0; dy < h; dy++) {
                    for (let dx = 0; dx < w; dx++) {
                        if (y + dy < height && x + dx < width) {
                            result[y + dy][x + dx] = node;
                        }
                    }
                }
                return;
            }
            
            if (typeof node === 'object') {
                const hw = Math.ceil(w / 2);
                const hh = Math.ceil(h / 2);
                
                if (node.tl) traverse(node.tl, x, y, hw, hh);
                if (node.tr) traverse(node.tr, x + hw, y, w - hw, hh);
                if (node.bl) traverse(node.bl, x, y + hh, hw, h - hh);
                if (node.br) traverse(node.br, x + hw, y + hh, w - hw, h - hh);
            }
        };
        
        traverse(tree, 0, 0, width, height);
        return result.map(row => row.join(''));
    }

    decodeHybrid(data, metadata) {
        const { method1, method2, data1, data2, mask } = data;
        
        const result1 = this.decoders[method1](data1, metadata);
        const result2 = this.decoders[method2](data2, metadata);
        
        if (!mask) return result1;
        
        const combined = [];
        for (let i = 0; i < result1.length; i++) {
            let line = '';
            for (let j = 0; j < result1[i].length; j++) {
                line += mask[i] && mask[i][j] ? result2[i][j] : result1[i][j];
            }
            combined.push(line);
        }
        
        return combined;
    }

    unpackBitmap(packed, base) {
        const result = [];
        
        if (base <= 16) {
            for (let i = 0; i < packed.length; i++) {
                result.push(parseInt(packed[i], 16));
            }
        } else if (base <= 64) {
            const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/';
            for (let i = 0; i < packed.length; i++) {
                result.push(chars.indexOf(packed[i]));
            }
        } else {
            const bytes = atob(packed);
            for (let i = 0; i < bytes.length; i++) {
                result.push(bytes.charCodeAt(i));
            }
        }
        
        return result;
    }

    async fetchStream(url, onChunk, options = {}) {
        const response = await fetch(url, options);
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const chunk = JSON.parse(line);
                        if (chunk.type && chunk.data) {
                            const decoded = this.decoders[chunk.type](chunk.data, chunk.metadata);
                            onChunk(decoded, chunk.metadata);
                        }
                    } catch (e) {
                        console.warn('Failed to parse chunk:', e);
                    }
                }
            }
        }

        if (buffer.trim()) {
            try {
                const chunk = JSON.parse(buffer);
                if (chunk.type && chunk.data) {
                    const decoded = this.decoders[chunk.type](chunk.data, chunk.metadata);
                    onChunk(decoded, chunk.metadata);
                }
            } catch (e) {
                console.warn('Failed to parse final chunk:', e);
            }
        }
    }

    async fetchBatch(urls, options = {}) {
        const promises = urls.map(url => this.fetchAndDecode(url, options));
        return Promise.all(promises);
    }

    async fetchWithCache(url, options = {}) {
        const cacheKey = `art_${url}`;
        const cached = localStorage.getItem(cacheKey);
        
        if (cached && options.useCache !== false) {
            try {
                const data = JSON.parse(cached);
                if (data.timestamp && Date.now() - data.timestamp < (options.cacheTime || 3600000)) {
                    return data.result;
                }
            } catch (e) {
                localStorage.removeItem(cacheKey);
            }
        }

        const result = await this.fetchAndDecode(url, options);
        
        if (options.useCache !== false) {
            localStorage.setItem(cacheKey, JSON.stringify({
                result,
                timestamp: Date.now()
            }));
        }
        
        return result;
    }

    validateCompressed(data) {
        if (!data || typeof data !== 'object') {
            return { valid: false, error: 'Invalid data format' };
        }

        if (!data.type || !data.data) {
            return { valid: false, error: 'Missing required fields' };
        }

        if (!this.decoders[data.type]) {
            return { valid: false, error: `Unknown compression type: ${data.type}` };
        }

        if (!data.metadata || !data.metadata.width || !data.metadata.height) {
            return { valid: false, error: 'Missing metadata' };
        }

        return { valid: true };
    }

    async fetchAndValidate(url, options = {}) {
        const response = await fetch(url, options);
        const data = await response.json();
        
        const validation = this.validateCompressed(data);
        if (!validation.valid) {
            throw new Error(validation.error);
        }
        
        return this.decoders[data.type](data.data, data.metadata);
    }
}

const decoder = new ArtDecoder();

export { ArtDecoder, decoder as default };