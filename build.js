const fs = require('fs');
const path = require('path');

// ==========================================
// 构建配置：只发布网站真正需要的东西
// ==========================================
const config = {
  srcDir: '.',
  buildDir: './dist',

  // 整目录排除（目录名精确匹配，构建时直接剪枝不遍历）
  excludeDirs: [
    'node_modules',
    'dist',
    '.git',
    '2',              // 遗留的另一套博客模板，与本站无关
    'sync-logos',     // 本地开发脚本
    'upload-to-oss',  // 本地开发脚本
    'aliyun-function' // 阿里云函数源码
  ],

  // 单文件排除（文件名精确匹配）
  excludeFiles: [
    // 运维/构建脚本，不应公开发布
    'build.js',
    'server.js',
    'package.json',
    'package-lock.json',
    'auto-download-logos.js',
    'upload-to-oss.js',
    'background-generator.js',
    // 部署配置与说明文档
    'esa.jsonc',
    'temp_esa.jsonc',
    'README.md',
    'BUILD.md',
    'links_README.md',
    'auto-download-logos-README.md',
    // 含本机信息的日志
    'Log1.txt',
    // IIS 配置，静态托管用不到（且会被 WAF 拦截）
    'web.config'
  ],

  // 文件名模式排除
  excludeFilePatterns: [
    /^test_.*\.html$/i,
    // 部署/开发脚本，会被 WAF 拦截，也不该出现在站点里
    /\.(bat|py|ps1|sh)$/i
  ],

  // 允许排除规则覆盖的内容文件（页面运行时会 fetch 这些 txt）
  keepFiles: ['公告内容.txt', '插件内容.txt', '赞助者名单.txt']
};

// ==========================================
// 是否排除某个相对路径
// ==========================================
function isExcluded(relPath) {
  const parts = relPath.split(/[\\/]/);
  if (parts.some(p => config.excludeDirs.includes(p))) return true;

  const name = parts[parts.length - 1];

  // 页面运行时需要的内容文件，永远保留
  if (config.keepFiles.includes(name)) return false;

  // 隐藏文件（.gitignore 等）
  if (name.startsWith('.')) return true;

  if (config.excludeFiles.includes(name)) return true;
  if (config.excludeFilePatterns.some(re => re.test(name))) return true;

  return false;
}

// ==========================================
// 递归收集源文件（剪枝：排除目录不再进入）
// ==========================================
function collectFiles(dir, base, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(base, full);

    if (entry.isDirectory()) {
      if (config.excludeDirs.includes(entry.name)) continue;
      if (isExcluded(rel)) continue;
      collectFiles(full, base, out);
    } else if (entry.isFile()) {
      if (isExcluded(rel)) continue;
      out.push({ full, rel });
    }
  }
  return out;
}

// ==========================================
// 生成图片清单（scenery/、photos/）
// 页面不再抓目录列表或盲猜文件名，改为读这个 manifest
// ==========================================
const IMAGE_EXT = /\.(jpe?g|png|webp|avif|gif)$/i;

function generateManifests() {
  for (const dir of ['scenery', 'photos']) {
    const full = path.join(config.srcDir, dir);
    if (!fs.existsSync(full)) continue;

    const files = fs.readdirSync(full, { withFileTypes: true })
      .filter(entry => entry.isFile() && IMAGE_EXT.test(entry.name))
      .map(entry => entry.name)
      .sort((a, b) => a.localeCompare(b, 'zh-CN', { numeric: true }));

    const target = path.join(full, 'manifest.json');
    fs.writeFileSync(target, JSON.stringify(files, null, 2) + '\n', 'utf8');
    console.log(`图片清单 ${dir}/manifest.json：${files.length} 张`);
  }
}

// ==========================================
// 检查 Tailwind 预编译产物是否比页面旧
// ==========================================
function checkStylesheetFreshness() {
  const css = path.join(config.srcDir, 'tailwind.css');
  if (!fs.existsSync(css)) {
    console.warn('警告：缺少 tailwind.css，页面会没有样式');
    return;
  }
  const cssTime = fs.statSync(css).mtimeMs;
  const stale = ['index.html', 'links.html']
    .map(f => path.join(config.srcDir, f))
    .filter(f => fs.existsSync(f) && fs.statSync(f).mtimeMs > cssTime);

  if (stale.length) {
    console.warn('提示：页面比 tailwind.css 新，新增的 class 可能没有生成样式');
    console.warn('      重新编译：node tools/build-css.js');
  }
}

// ==========================================
// 清理构建目录
// ==========================================
function cleanBuildDir() {
  if (!fs.existsSync(config.buildDir)) return;
  let tries = 0;
  // OneDrive / 杀毒软件可能短暂占用目录，重试几次
  while (tries < 3) {
    try {
      fs.rmSync(config.buildDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
      console.log('清理构建目录完成');
      return;
    } catch (e) {
      tries++;
      if (tries >= 3) throw e;
      console.warn(`清理构建目录失败（${e.code}），重试 ${tries}/3`);
    }
  }
}

// ==========================================
// 复制文件到构建目录
// ==========================================
function copyFiles() {
  const files = collectFiles(config.srcDir, config.srcDir, []);
  let bytes = 0;

  for (const { full, rel } of files) {
    const dest = path.join(config.buildDir, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(full, dest);
    bytes += fs.statSync(full).size;
  }

  console.log(`复制 ${files.length} 个文件，共 ${(bytes / 1024 / 1024).toFixed(1)} MB`);
  return files.length;
}

// ==========================================
// HTML：去掉注释、合并多余空白
// 只保留含特定关键词的注释（页面上的手写说明用）
// ==========================================
const KEEP_COMMENT = /本链接由|保留本地引用作为备用|赞助者|插件|公告/;

function optimizeHTML() {
  let count = 0;
  for (const file of walkBuildDir(config.buildDir)) {
    if (path.extname(file) !== '.html') continue;

    let content = fs.readFileSync(file, 'utf8');

    // 逐条判断注释：先匹配单条注释，再决定是否保留
    // 旧写法用 (?![\s\S]*关键词) 会一直扫到文档末尾，导致判断失效
    content = content.replace(/<!--(?:(?!-->)[\s\S])*?-->/g, (comment) =>
      KEEP_COMMENT.test(comment) ? comment : ''
    );

    content = content.replace(/[ \t]+/g, ' ');
    content = content.replace(/\n{3,}/g, '\n\n');
    content = content.trim();

    fs.writeFileSync(file, content, 'utf8');
    count++;
  }
  console.log(`优化 HTML：${count} 个文件`);
}

// ==========================================
// CSS：去掉注释、压缩空白
// ==========================================
function optimizeCSS() {
  let count = 0;
  for (const file of walkBuildDir(config.buildDir)) {
    if (path.extname(file) !== '.css') continue;

    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/\/\*(?:(?!\*\/)[\s\S])*?\*\//g, '');
    content = content.replace(/[ \t]+/g, ' ');
    content = content.replace(/\s*([{}:;,])\s*/g, '$1');
    content = content.replace(/;}/g, '}');

    fs.writeFileSync(file, content, 'utf8');
    count++;
  }
  console.log(`优化 CSS：${count} 个文件`);
}

// ==========================================
// 检查 HTML 引用的本地资源是否真的存在
// 只提示，不阻断构建（避免误伤模板字符串）
// ==========================================
function verifyAssets() {
  const missing = [];
  const remote = new Set();

  for (const file of walkBuildDir(config.buildDir)) {
    const ext = path.extname(file);
    if (ext !== '.html' && ext !== '.css') continue;

    const content = fs.readFileSync(file, 'utf8');
    const refs = [];

    if (ext === '.html') {
      for (const m of content.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/gi)) refs.push(m[1]);
    }
    for (const m of content.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) refs.push(m[1]);

    for (const raw of refs) {
      const ref = raw.trim();
      if (!ref) continue;
      if (/^(https?:)?\/\//i.test(ref) || /^(data|mailto|tel|javascript):/i.test(ref)) {
        if (/^https?:/i.test(ref)) remote.add(new URL(ref).host);
        continue;
      }
      if (ref.startsWith('#') || ref.includes('${') || ref.includes('(')) continue;

      const clean = ref.split('#')[0].split('?')[0];
      if (!clean) continue;

      // 只检查看起来像静态资源路径的引用，过滤掉 JS 模板里拼接的变量名
      const looksLikeAsset =
        /\.(html?|css|js|mjs|json|png|jpe?g|gif|webp|svg|ico|txt|woff2?|ttf|otf|eot|wasm|webmanifest|mp[34]|wav)$/i.test(clean) ||
        clean.endsWith('/');
      if (!looksLikeAsset) continue;

      const target = path.join(config.buildDir, decodeURIComponent(clean.replace(/^\/+/, '')));
      let exists = fs.existsSync(target);
      if (!exists && !path.extname(target)) {
        exists = fs.existsSync(path.join(target, 'index.html'));
      }
      if (!exists) {
        missing.push(`${path.relative(config.buildDir, file)} → ${ref}`);
      }
    }
  }

  if (remote.size) {
    console.log(`提示：页面运行时依赖 ${remote.size} 个外部域名 —— ${[...remote].join(', ')}`);
  }

  if (missing.length) {
    console.warn('\n警告：以下本地资源在构建产物中不存在：');
    for (const m of [...new Set(missing)]) console.warn('  - ' + m);
  } else {
    console.log('资源检查通过：所有本地引用都存在');
  }
}

// ==========================================
// 工具：遍历构建目录下的所有文件
// ==========================================
function walkBuildDir(dir) {
  const out = [];
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else out.push(full);
    }
  };
  walk(dir);
  return out;
}

// ==========================================
// 主流程
// ==========================================
function build() {
  const startedAt = Date.now();
  console.log('开始构建项目...');

  cleanBuildDir();
  fs.mkdirSync(config.buildDir, { recursive: true });

  generateManifests();
  copyFiles();
  optimizeHTML();
  optimizeCSS();
  verifyAssets();
  checkStylesheetFreshness();

  const files = walkBuildDir(config.buildDir);
  const size = files.reduce((sum, f) => sum + fs.statSync(f).size, 0);
  console.log(`\n构建完成：${files.length} 个文件，${(size / 1024 / 1024).toFixed(1)} MB，用时 ${Date.now() - startedAt} ms`);
  console.log('构建结果位于:', config.buildDir);
}

build();
