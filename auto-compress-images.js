const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// 配置参数
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB in bytes
const QUALITY = 70; // 压缩质量

// 图片文件夹路径
const imageFolders = ['./scenery', './photos'];

// 检查文件是否为图片
function isImageFile(file) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
  return imageExtensions.includes(path.extname(file).toLowerCase());
}

// 获取文件大小
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (err) {
    console.error(`无法获取文件大小: ${filePath}`, err);
    return 0;
  }
}

// 压缩图片的PowerShell脚本
function createCompressionScript(inputPath, outputPath, quality) {
  return `
  Add-Type -AssemblyName System.Drawing
  $inputPath = "${inputPath}"
  $outputPath = "${outputPath}"
  $quality = ${quality}
  
  try {
    $bitmap = [System.Drawing.Bitmap]::FromFile($inputPath)
    $encoder = [System.Drawing.Imaging.Encoder]::Quality
    $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $encoderParam = New-Object System.Drawing.Imaging.EncoderParameter($encoder, [long]$quality)
    $encoderParams.Param[0] = $encoderParam
    
    $imageCodecInfo = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
    if ($null -eq $imageCodecInfo) {
      $imageCodecInfo = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Select-Object -First 1
    }
    
    $bitmap.Save($outputPath, $imageCodecInfo, $encoderParams)
    $bitmap.Dispose()
    Write-Host "压缩完成: $outputPath"
  }
  catch {
    Write-Host "压缩失败: $($_.Exception.Message)"
  }
  `;
}

// 压缩单个图片
function compressImage(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    // 为PowerShell脚本创建临时文件
    const scriptPath = path.join(__dirname, 'temp_compress.ps1');
    const scriptContent = createCompressionScript(inputPath, outputPath, QUALITY);
    
    fs.writeFileSync(scriptPath, scriptContent);
    
    // 执行PowerShell脚本
    const command = `powershell -ExecutionPolicy Bypass -File "${scriptPath}"`;
    exec(command, (error, stdout, stderr) => {
      // 清理临时文件
      fs.unlinkSync(scriptPath);
      
      if (error) {
        console.error(`执行PowerShell脚本时出错: ${error}`);
        reject(error);
      } else {
        console.log(stdout);
        if (stderr) {
          console.error(`PowerShell错误: ${stderr}`);
        }
        resolve();
      }
    });
  });
}

// 检查并压缩大图片
async function checkAndCompressImages() {
  console.log('开始检查图片文件...');
  
  for (const folder of imageFolders) {
    if (!fs.existsSync(folder)) {
      console.log(`文件夹不存在: ${folder}`);
      continue;
    }
    
    const files = fs.readdirSync(folder);
    for (const file of files) {
      if (!isImageFile(file)) continue;
      
      const filePath = path.join(folder, file);
      const fileSize = getFileSize(filePath);
      
      console.log(`检查文件: ${file} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);
      
      if (fileSize > MAX_IMAGE_SIZE) {
        console.log(`文件 ${file} 超过2MB，开始压缩...`);
        
        try {
          // 创建临时输出文件路径
          const tempOutputPath = path.join(folder, `temp_${file}`);
          
          // 压缩图片
          await compressImage(filePath, tempOutputPath);
          
          // 检查压缩后的文件是否存在
          if (fs.existsSync(tempOutputPath)) {
            // 替换原始文件
            fs.renameSync(tempOutputPath, filePath);
            const newSize = getFileSize(filePath);
            console.log(`压缩完成: ${file} - 原始大小: ${(fileSize / 1024 / 1024).toFixed(2)} MB, 压缩后: ${(newSize / 1024 / 1024).toFixed(2)} MB`);
          } else {
            console.log(`压缩失败: ${file}`);
            // 清理临时文件（如果存在）
            if (fs.existsSync(tempOutputPath)) {
              fs.unlinkSync(tempOutputPath);
            }
          }
        } catch (error) {
          console.error(`压缩图片时出错 ${file}:`, error);
        }
      } else {
        console.log(`文件 ${file} 小于2MB，无需压缩`);
      }
    }
  }
  
  console.log('图片检查和压缩完成');
}

// 导出函数供其他模块使用
module.exports = { checkAndCompressImages, MAX_IMAGE_SIZE };

// 如果直接运行此脚本，则执行检查和压缩
if (require.main === module) {
  checkAndCompressImages().catch(console.error);
}