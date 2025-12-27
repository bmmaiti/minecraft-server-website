// 深板岩矿物背景生成代码
// ==========================================

// 在DOM内容加载完成后执行背景生成
document.addEventListener('DOMContentLoaded', function() {
    // 检查页面上是否存在背景容器
    const baseLayer = document.getElementById('baseLayer');
    const oresLayer = document.getElementById('oresLayer');
    
    // 如果没有找到相关容器，则不执行背景生成
    if (!baseLayer || !oresLayer) {
        return;
    }
    
    // 页面尺寸计算
    const pageWidth = window.innerWidth;
    const pageHeight = window.innerHeight;
    
    // 计算网格行列数（基于32px的方块尺寸）
    const cols = Math.ceil(pageWidth / 32);
    const rows = Math.ceil(pageHeight / 32);
    
    // 计算分界线（深板岩从这里开始）
    const deepslateStartRow = Math.floor(rows * 0.5); // 深板岩从50%位置开始
    
    // 创建基岩层（石头和深板岩，石头可以随机深入深板岩6格）
    function createBaseLayers() {
        // 创建石头层（上部）和随机深入深板岩的部分
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const cell = document.createElement('div');
                cell.style.left = `${col * 32}px`;
                cell.style.top = `${row * 32}px`;
                
                // 判断应该使用哪种材质
                if (row < deepslateStartRow) {
                    // 在深板岩层开始前，全部使用石头
                    cell.className = 'cell stone';
                } else if (row < deepslateStartRow + 6) {
                    // 在深板岩层开始后的6格内，随机决定使用石头还是深板岩
                    // 越靠近分界线，使用石头的概率越高
                    const probability = 1 - (row - deepslateStartRow) / 6;
                    if (Math.random() < probability) {
                        cell.className = 'cell stone';
                    } else {
                        cell.className = 'cell deepslate';
                    }
                } else {
                    // 深板岩层主体部分，全部使用深板岩
                    cell.className = 'cell deepslate';
                }
                
                baseLayer.appendChild(cell);
            }
        }
    }
    
    // 创建矿物生成函数（严格限制在指定层中）
    function generateOreVein(oreClass, layer, veinCount, veinSize) {
        for (let v = 0; v < veinCount; v++) {
            // 根据层确定生成范围
            let startY, endY;
            if (layer === 'stone') {
                // 石头层范围（包括可能延伸到深板岩的6格）
                startY = 0;
                endY = deepslateStartRow + 6;
            } else if (layer === 'deepslate') {
                // 深板岩层范围（不包括被石头延伸的部分）
                startY = deepslateStartRow + 6;
                endY = rows;
            }
            
            // 确保范围有效
            if (startY >= endY) return;
            
            // 随机选择一个起始点（在指定Y范围内）
            const startRowPos = startY + Math.floor(Math.random() * (endY - startY));
            const startColPos = Math.floor(Math.random() * cols);
            
            // 使用BFS算法生成连接的矿脉
            const queue = [{row: startRowPos, col: startColPos}];
            const visited = new Set();
            visited.add(`${startRowPos},${startColPos}`);
            let placedCount = 0;
            
            // 四个方向：上、下、左、右
            const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            
            while (queue.length > 0 && placedCount < veinSize) {
                // 随机选择队列中的一个点
                const randomIndex = Math.floor(Math.random() * queue.length);
                const current = queue[randomIndex];
                queue.splice(randomIndex, 1);
                
                const {row, col} = current;
                
                // 检查边界和层限制
                if (row < startY || row >= endY || col < 0 || col >= cols) continue;
                
                // 创建矿物元素
                const oreElement = document.createElement('div');
                oreElement.className = `ore ${oreClass}`;
                oreElement.style.left = `${col * 32}px`;
                oreElement.style.top = `${row * 32}px`;
                oresLayer.appendChild(oreElement);
                placedCount++;
                
                // 添加相邻位置到队列中
                for (const [dr, dc] of directions) {
                    const newRow = row + dr;
                    const newCol = col + dc;
                    const key = `${newRow},${newCol}`;
                    
                    // 检查是否已访问过和层限制
                    if (!visited.has(key) && newRow >= startY && newRow < endY && newCol >= 0 && newCol < cols) {
                        visited.add(key);
                        // 降低添加到队列的概率，使矿物更加分散
                        if (Math.random() < 0.4) { // 从0.7降低到0.4，使矿物更分散
                            queue.push({row: newRow, col: newCol});
                        }
                    }
                }
            }
        }
    }
    
    // 初始化基岩层
    createBaseLayers();
    
    // 按照Minecraft真实规则严格生成矿物（确保矿物只在其对应的基岩类型中生成）
    // 煤矿石 - 严格只在石头层中生成（包括延伸部分）
    generateOreVein('coal-ore-stone', 'stone', 8, 4 + Math.floor(Math.random() * 3)); // 增加矿脉数量，减小单个矿脉大小
    
    // 铁矿石 - 主要在石头层中生成，少量在深板岩层中生成
    generateOreVein('iron-ore-stone', 'stone', 7, 3 + Math.floor(Math.random() * 3)); // 增加矿脉数量，减小单个矿脉大小
    generateOreVein('iron-ore-deepslate', 'deepslate', 2, 2 + Math.floor(Math.random() * 2)); // 增加深板岩层矿脉数量
    
    // 红石矿石 - 严格只在石头层中生成（包括延伸部分）
    generateOreVein('redstone-ore-stone', 'stone', 6, 4 + Math.floor(Math.random() * 2)); // 增加矿脉数量，减小单个矿脉大小
    
    // 金矿石 - 石头层和深板岩层都有生成
    generateOreVein('gold-ore-stone', 'stone', 2, 3 + Math.floor(Math.random() * 2)); // 增加石头层矿脉数量
    generateOreVein('gold-ore-deepslate', 'deepslate', 2, 3 + Math.floor(Math.random() * 2)); // 增加深板岩层矿脉数量
    
    // 钻石矿石 - 主要在深板岩层中生成，少量在石头层中生成
    generateOreVein('diamond-ore-stone', 'stone', 1, 2 + Math.floor(Math.random() * 2)); // 减小石头层矿脉大小
    generateOreVein('diamond-ore-deepslate', 'deepslate', 4, 2 + Math.floor(Math.random() * 2)); // 增加深板岩层矿脉数量从2个到4个
    
    // 青金石矿石 - 严格只在深板岩层中生成
    generateOreVein('lapis-ore-deepslate', 'deepslate', 5, 2 + Math.floor(Math.random() * 2)); // 增加矿脉数量从3个到5个
    
    // 背景生成完成后触发自定义事件
    setTimeout(() => {
        const event = new CustomEvent('backgroundGenerationComplete');
        document.dispatchEvent(event);
    }, 100);
});