/**
 * 本地预览服务器（无第三方依赖）
 *   node server.js          默认端口 3000
 *   PORT=8080 node server.js
 *
 * 说明：原版本 require('./auto-compress-images.js') 这个文件并不存在，
 * 会导致 npm start 直接崩溃，这里去掉该依赖，只保留静态文件服务。
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT) || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
  '.wasm': 'application/wasm'
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    ...headers
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return send(res, 405, '405 Method Not Allowed', { Allow: 'GET, HEAD' });
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host || HOST}`).pathname);
  } catch {
    return send(res, 400, '400 Bad Request：URL 编码无效');
  }

  // 归一化后必须仍落在站点根目录内，防止 ../ 穿越
  const relative = pathname.replace(/^\/+/, '');
  const filePath = path.join(ROOT, relative);
  if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) {
    return send(res, 403, '403 Forbidden');
  }

  fs.stat(filePath, (err, stat) => {
    let target = filePath;

    // 目录 → 取其中的 index.html
    if (!err && stat.isDirectory()) {
      target = path.join(filePath, 'index.html');
    }

    fs.readFile(target, (readErr, content) => {
      if (readErr) {
        const code = readErr.code === 'ENOENT' || readErr.code === 'EISDIR' ? 404 : 500;
        if (code === 404) {
          return send(res, 404, `404 Not Found：${pathname}`);
        }
        console.error(`读取失败 ${target}:`, readErr);
        return send(res, 500, '500 Internal Server Error');
      }

      const type = MIME_TYPES[path.extname(target).toLowerCase()] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': type,
        'Content-Length': content.length,
        'Cache-Control': 'no-cache'
      });
      res.end(req.method === 'HEAD' ? undefined : content);
    });
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`端口 ${PORT} 已被占用，可换端口启动：PORT=3001 node server.js`);
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, HOST, () => {
  console.log(`本地预览已启动：http://${HOST}:${PORT}/`);
  console.log(`站点根目录：${ROOT}`);
});
