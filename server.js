const http = require('http');
const fs = require('fs');
const path = require('path');
const { checkAndCompressImages, MAX_IMAGE_SIZE } = require('./auto-compress-images.js');

const hostname = '127.0.0.1';
const port = 3000;

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm'
};

// 检查是否为图片请求
function isImageRequest(url) {
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif'];
  return imageExtensions.some(ext => url.toLowerCase().endsWith(ext));
}

const server = http.createServer(async (req, res) => {
  let filePath = '.' + req.url;
  
  // 如果请求根目录，返回index.html
  if (filePath === './') {
    filePath = './index.html';
  }
  
  // 如果是图片请求，检查文件大小
  if (isImageRequest(filePath)) {
    try {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        // 如果图片超过2MB，触发压缩检查
        if (stats.size > MAX_IMAGE_SIZE) {
          console.log(`检测到大图片: ${filePath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
          // 在后台执行压缩检查
          checkAndCompressImages().catch(err => {
            console.error('后台压缩任务出错:', err);
          });
        }
      }
    } catch (err) {
      console.error('检查文件大小时出错:', err);
    }
  }
  
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';
  
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // 文件未找到
        fs.readFile('./404.html', (err, content) => {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end(content, 'utf-8');
        });
      } else {
        // 服务器错误
        res.writeHead(500);
        res.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
      }
    } else {
      // 成功
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(port, hostname, () => {
  console.log(`服务器运行在 http://${hostname}:${port}/`);
  console.log('自动图片压缩功能已启用');
  
  // 启动时检查一次图片
  checkAndCompressImages().catch(err => {
    console.error('初始图片检查出错:', err);
  });
});