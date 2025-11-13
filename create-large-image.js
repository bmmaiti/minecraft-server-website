const fs = require('fs');
const path = require('path');

// 创建一个大文件的函数
function createLargeImage() {
  // 选择一个现有的图片作为基础
  const sourceImagePath = './scenery/5.png';
  
  if (!fs.existsSync(sourceImagePath)) {
    console.log('源图片不存在，请确保scenery/5.png存在');
    return;
  }
  
  // 创建一个大的目标文件路径
  const largeImagePath = './scenery/large-test-image.png';
  
  // 复制原始图片多次以创建大文件
  const sourceData = fs.readFileSync(sourceImagePath);
  const multiplier = 10; // 增加10倍大小
  
  // 创建一个大的缓冲区
  const largeBuffer = Buffer.alloc(sourceData.length * multiplier);
  
  // 填充缓冲区
  for (let i = 0; i < multiplier; i++) {
    sourceData.copy(largeBuffer, i * sourceData.length);
  }
  
  // 写入大文件
  fs.writeFileSync(largeImagePath, largeBuffer);
  
  const stats = fs.statSync(largeImagePath);
  console.log(`已创建大图片文件: ${largeImagePath}`);
  console.log(`文件大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  
  // 同时在photos目录创建副本
  const largeImagePhotoPath = './photos/large-test-image.png';
  fs.writeFileSync(largeImagePhotoPath, largeBuffer);
  console.log(`已在photos目录创建副本: ${largeImagePhotoPath}`);
}

// 运行函数
createLargeImage();