const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 构建配置
const config = {
  srcDir: './',
  buildDir: './dist',
  assets: ['*.html', 'css/*.css', 'js/*.js', 'logos/*', 'logo/*', 'fonts/*', '*.svg', '*.json', 'lizi/*', 'photos/*', 'scenery/*', 'tietu3/*'],
  exclude: ['node_modules', 'dist', 'build.js', 'package-lock.json', '*.log', '.git', '*.bat', '*.py', 'web.config', 'start_server.py']
};

// 清理构建目录
function cleanBuildDir() {
  if (fs.existsSync(config.buildDir)) {
    fs.rmSync(config.buildDir, { recursive: true });
    console.log('清理构建目录完成');
  }
}

// 复制文件到构建目录
function copyFiles() {
  // 创建构建目录
  if (!fs.existsSync(config.buildDir)) {
    fs.mkdirSync(config.buildDir, { recursive: true });
  }

  // 复制所有文件
  const allFiles = getAllFiles(config.srcDir);
  
  allFiles.forEach(file => {
    const relativePath = path.relative(config.srcDir, file);
    
    // 检查是否为排除的文件
    const shouldExclude = config.exclude.some(excludePattern => {
      return simpleMatch(relativePath, excludePattern) || file.includes(excludePattern);
    });
    
    if (!shouldExclude) {
      const destPath = path.join(config.buildDir, relativePath);
      const destDir = path.dirname(destPath);
      
      // 创建目标目录
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      
      // 复制文件
      fs.copyFileSync(file, destPath);
      console.log(`复制: ${relativePath}`);
    }
  });
}

// 获取所有文件
function getAllFiles(dir) {
  const files = [];
  
  function walk(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    items.forEach(item => {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walk(fullPath);
      } else {
        files.push(fullPath);
      }
    });
  }
  
  walk(dir);
  return files;
}

// 优化HTML文件（移除注释、空白等，但保留中文字符）
function optimizeHTML() {
  const htmlFiles = getAllFiles(config.buildDir).filter(file => path.extname(file) === '.html');
  
  htmlFiles.forEach(file => {
    // 以二进制模式读取文件，避免编码转换问题
    let contentBuffer = fs.readFileSync(file);
    let content = contentBuffer.toString('utf8');
    
    // 移除HTML注释，但保留包含中文的注释
    content = content.replace(/<!--(?![\s\S]*本链接由)(?![\s\S]*保佑本地引用作为备用)(?![\s\S]*赞助者)(?![\s\S]*插件)(?![\s\S]*公告)[\s\S]*?-->/g, '');
    
    // 移除多余的空白，但保留必要的换行和格式
    content = content.replace(/[ \t]+/g, ' ');  // 只替换空格和制表符
    content = content.trim();
    
    // 以UTF-8编码写入文件
    fs.writeFileSync(file, content, 'utf8');
    console.log(`优化HTML: ${path.relative(config.buildDir, file)}`);
  });
}

// 优化CSS文件
function optimizeCSS() {
  const cssFiles = getAllFiles(config.buildDir).filter(file => path.extname(file) === '.css');
  
  cssFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // 移除CSS注释，但保留包含中文的注释
    content = content.replace(/\/\*(?![\s\S]*中文)[\s\S]*?\*\//g, '');
    
    // 压缩空白，但避免影响中文字符
    content = content.replace(/[ \t]+/g, ' ');  // 只替换空格和制表符
    content = content.replace(/\s*([{}:;,])\s*/g, '$1');
    
    fs.writeFileSync(file, content, 'utf8');
    console.log(`优化CSS: ${path.relative(config.buildDir, file)}`);
  });
}

// 检查依赖
function checkDependencies() {
  try {
    execSync('npm --version', { stdio: 'ignore' });
    console.log('npm 可用');
    return true;
  } catch (e) {
    console.log('npm 不可用，跳过依赖安装');
    return false;
  }
}

// 安装依赖
function installDependencies() {
  if (checkDependencies() && fs.existsSync('./package.json')) {
    console.log('安装依赖...');
    execSync('npm install', { stdio: 'inherit' });
  }
}

// 简单的模式匹配函数
function simpleMatch(path, pattern) {
  // 简单的模式匹配实现
  const regexPattern = pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*');
  
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(path);
}

// 主构建函数
function build() {
  console.log('开始构建项目...');
  
  // 安装依赖
  installDependencies();
  
  // 清理构建目录
  cleanBuildDir();
  
  // 复制文件
  copyFiles();
  
  // 优化文件
  optimizeHTML();
  optimizeCSS();
  
  console.log('构建完成！构建结果位于:', config.buildDir);
}

// 执行构建
build();