/**
 * 深板岩 / 矿石背景生成（guide.html / commands.html / season2.html / faq.html 共用）
 * 与首页同一套逻辑：上半部分是石头层，50% 以下渐变为深板岩，按 Minecraft 规则撒矿脉。
 * 首页和友链页各自内联了一份，这里抽出来给内容页复用。
 */
document.addEventListener('DOMContentLoaded', function () {
  var baseLayer = document.getElementById('baseLayer');
  var oresLayer = document.getElementById('oresLayer');
  if (!baseLayer || !oresLayer) return;

  var pageWidth = window.innerWidth;
  var pageHeight = window.innerHeight;
  var cols = Math.ceil(pageWidth / 32);
  var rows = Math.ceil(pageHeight / 32);
  var deepslateStartRow = Math.floor(rows * 0.5);

  function createBaseLayers() {
    for (var row = 0; row < rows; row++) {
      for (var col = 0; col < cols; col++) {
        var cell = document.createElement('div');
        cell.style.left = (col * 32) + 'px';
        cell.style.top = (row * 32) + 'px';

        if (row < deepslateStartRow) {
          cell.className = 'cell stone';
        } else if (row < deepslateStartRow + 6) {
          var probability = 1 - (row - deepslateStartRow) / 6;
          cell.className = Math.random() < probability ? 'cell stone' : 'cell deepslate';
        } else {
          cell.className = 'cell deepslate';
        }

        baseLayer.appendChild(cell);
      }
    }
  }

  function generateOreVein(oreClass, layer, veinCount, veinSize) {
    for (var v = 0; v < veinCount; v++) {
      var startY, endY;
      if (layer === 'stone') {
        startY = 0;
        endY = deepslateStartRow + 6;
      } else {
        startY = deepslateStartRow + 6;
        endY = rows;
      }
      if (startY >= endY) return;

      var startRowPos = startY + Math.floor(Math.random() * (endY - startY));
      var startColPos = Math.floor(Math.random() * cols);

      var queue = [{ row: startRowPos, col: startColPos }];
      var visited = new Set();
      visited.add(startRowPos + ',' + startColPos);
      var placedCount = 0;
      var directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

      while (queue.length > 0 && placedCount < veinSize) {
        var randomIndex = Math.floor(Math.random() * queue.length);
        var current = queue[randomIndex];
        queue.splice(randomIndex, 1);

        var row = current.row;
        var col = current.col;
        if (row < startY || row >= endY || col < 0 || col >= cols) continue;

        var oreElement = document.createElement('div');
        oreElement.className = 'ore ' + oreClass;
        oreElement.style.left = (col * 32) + 'px';
        oreElement.style.top = (row * 32) + 'px';
        oresLayer.appendChild(oreElement);
        placedCount++;

        for (var d = 0; d < directions.length; d++) {
          var newRow = row + directions[d][0];
          var newCol = col + directions[d][1];
          var key = newRow + ',' + newCol;
          if (!visited.has(key) && newRow >= startY && newRow < endY && newCol >= 0 && newCol < cols) {
            visited.add(key);
            if (Math.random() < 0.4) {
              queue.push({ row: newRow, col: newCol });
            }
          }
        }
      }
    }
  }

  createBaseLayers();

  generateOreVein('coal-ore-stone', 'stone', 8, 4 + Math.floor(Math.random() * 3));
  generateOreVein('iron-ore-stone', 'stone', 7, 3 + Math.floor(Math.random() * 3));
  generateOreVein('iron-ore-deepslate', 'deepslate', 2, 2 + Math.floor(Math.random() * 2));
  generateOreVein('redstone-ore-stone', 'stone', 6, 4 + Math.floor(Math.random() * 2));
  generateOreVein('gold-ore-stone', 'stone', 2, 3 + Math.floor(Math.random() * 2));
  generateOreVein('gold-ore-deepslate', 'deepslate', 2, 3 + Math.floor(Math.random() * 2));
  generateOreVein('diamond-ore-stone', 'stone', 1, 2 + Math.floor(Math.random() * 2));
  generateOreVein('diamond-ore-deepslate', 'deepslate', 4, 2 + Math.floor(Math.random() * 2));
  generateOreVein('lapis-ore-deepslate', 'deepslate', 5, 2 + Math.floor(Math.random() * 2));
});
