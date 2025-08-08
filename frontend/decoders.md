# 字符藝術解碼器範例

## JavaScript 解碼器

```javascript
// 極簡格式解碼
function decodeUltraMinimal(compressed, width, height) {
    // 初始化空白陣列
    const result = Array(height).fill(null).map(() => Array(width).fill(' '));
    
    // 填入字符
    for (const [char, positions] of Object.entries(compressed)) {
        positions.forEach(pos => {
            const row = Math.floor(pos / width);
            const col = pos % width;
            if (row < height && col < width) {
                result[row][col] = char;
            }
        });
    }
    
    // 轉換為字串陣列
    return result.map(row => row.join(''));
}

// 使用範例
const compressed = {"つ": [0, 50, 100], "の": [25, 75, 125]};
const art = decodeUltraMinimal(compressed, 50, 10);
console.log(art.join('\n'));
```

## C++ 解碼器

```cpp
#include <iostream>
#include <vector>
#include <map>
#include <string>

std::vector<std::string> decodeUltraMinimal(
    const std::map<char, std::vector<int>>& compressed, 
    int width, 
    int height) {
    
    // 初始化空白圖像
    std::vector<std::string> result(height, std::string(width, ' '));
    
    // 填入字符
    for (const auto& pair : compressed) {
        char ch = pair.first;
        for (int pos : pair.second) {
            int row = pos / width;
            int col = pos % width;
            if (row < height && col < width) {
                result[row][col] = ch;
            }
        }
    }
    
    return result;
}

// 使用範例
int main() {
    std::map<char, std::vector<int>> compressed = {
        {'A', {0, 50, 100}},
        {'B', {25, 75, 125}}
    };
    
    auto art = decodeUltraMinimal(compressed, 50, 10);
    for (const auto& line : art) {
        std::cout << line << std::endl;
    }
    
    return 0;
}
```

## Java 解碼器

```java
import java.util.*;

public class CharacterArtDecoder {
    
    public static List<String> decodeUltraMinimal(
            Map<Character, List<Integer>> compressed, 
            int width, 
            int height) {
        
        // 初始化空白圖像
        char[][] grid = new char[height][width];
        for (char[] row : grid) {
            Arrays.fill(row, ' ');
        }
        
        // 填入字符
        for (Map.Entry<Character, List<Integer>> entry : compressed.entrySet()) {
            char ch = entry.getKey();
            for (int pos : entry.getValue()) {
                int row = pos / width;
                int col = pos % width;
                if (row < height && col < width) {
                    grid[row][col] = ch;
                }
            }
        }
        
        // 轉換為字串列表
        List<String> result = new ArrayList<>();
        for (char[] row : grid) {
            result.add(new String(row));
        }
        
        return result;
    }
    
    // 使用範例
    public static void main(String[] args) {
        Map<Character, List<Integer>> compressed = new HashMap<>();
        compressed.put('A', Arrays.asList(0, 50, 100));
        compressed.put('B', Arrays.asList(25, 75, 125));
        
        List<String> art = decodeUltraMinimal(compressed, 50, 10);
        for (String line : art) {
            System.out.println(line);
        }
    }
}
```

## Go 解碼器

```go
package main

import "fmt"

func decodeUltraMinimal(compressed map[rune][]int, width, height int) []string {
    // 初始化空白圖像
    grid := make([][]rune, height)
    for i := range grid {
        grid[i] = make([]rune, width)
        for j := range grid[i] {
            grid[i][j] = ' '
        }
    }
    
    // 填入字符
    for char, positions := range compressed {
        for _, pos := range positions {
            row := pos / width
            col := pos % width
            if row < height && col < width {
                grid[row][col] = char
            }
        }
    }
    
    // 轉換為字串切片
    result := make([]string, height)
    for i, row := range grid {
        result[i] = string(row)
    }
    
    return result
}

// 使用範例
func main() {
    compressed := map[rune][]int{
        'A': {0, 50, 100},
        'B': {25, 75, 125},
    }
    
    art := decodeUltraMinimal(compressed, 50, 10)
    for _, line := range art {
        fmt.Println(line)
    }
}
```

## Rust 解碼器

```rust
use std::collections::HashMap;

fn decode_ultra_minimal(
    compressed: &HashMap<char, Vec<usize>>, 
    width: usize, 
    height: usize
) -> Vec<String> {
    // 初始化空白圖像
    let mut grid = vec![vec![' '; width]; height];
    
    // 填入字符
    for (ch, positions) in compressed {
        for &pos in positions {
            let row = pos / width;
            let col = pos % width;
            if row < height && col < width {
                grid[row][col] = *ch;
            }
        }
    }
    
    // 轉換為字串向量
    grid.into_iter()
        .map(|row| row.into_iter().collect())
        .collect()
}

// 使用範例
fn main() {
    let mut compressed = HashMap::new();
    compressed.insert('A', vec![0, 50, 100]);
    compressed.insert('B', vec![25, 75, 125]);
    
    let art = decode_ultra_minimal(&compressed, 50, 10);
    for line in art {
        println!("{}", line);
    }
}
```

## Ruby 解碼器

```ruby
def decode_ultra_minimal(compressed, width, height)
  # 初始化空白圖像
  grid = Array.new(height) { Array.new(width, ' ') }
  
  # 填入字符
  compressed.each do |char, positions|
    positions.each do |pos|
      row = pos / width
      col = pos % width
      if row < height && col < width
        grid[row][col] = char
      end
    end
  end
  
  # 轉換為字串陣列
  grid.map(&:join)
end

# 使用範例
compressed = {
  'つ' => [0, 50, 100],
  'の' => [25, 75, 125]
}

art = decode_ultra_minimal(compressed, 50, 10)
puts art
```

## 字串格式解碼器 (Python)

```python
def decode_from_string(compressed_str, width, height):
    """
    解碼字串格式: "字符:位置1,位置2;字符:位置1,位置2"
    """
    # 初始化空白圖像
    grid = [[' ' for _ in range(width)] for _ in range(height)]
    
    # 解析字串
    if compressed_str:
        parts = compressed_str.split(';')
        for part in parts:
            if ':' in part:
                char, positions_str = part.split(':', 1)
                positions = [int(p) for p in positions_str.split(',') if p]
                
                # 填入字符
                for pos in positions:
                    row = pos // width
                    col = pos % width
                    if 0 <= row < height and 0 <= col < width:
                        grid[row][col] = char
    
    return [''.join(row) for row in grid]
```

## 注意事項

1. **寬高資訊**：解碼時必須知道原始圖像的寬度和高度
2. **字符編碼**：確保正確處理 Unicode 字符（如中文、日文）
3. **邊界檢查**：始終檢查位置是否在有效範圍內
4. **空白字符**：預設使用空格填充，可根據需要改為全形空格

## 效能優化建議

1. **預分配空間**：先分配整個陣列，避免動態擴展
2. **批量處理**：對於動畫，可以平行處理多個幀
3. **快取結果**：對於重複使用的圖案，可以快取解碼結果
4. **使用適當的資料結構**：根據語言特性選擇最有效的資料結構