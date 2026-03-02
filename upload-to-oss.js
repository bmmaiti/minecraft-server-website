const { OSS } = require('ali-oss');
const fs = require('fs');
const path = require('path');

const client = new OSS({
  region: 'oss-cn-hangzhou',
  accessKeyId: process.env.ACCESS_KEY_ID,
  accessKeySecret: process.env.ACCESS_KEY_SECRET,
  bucket: 'your-bucket-name'
});

async function uploadLogos() {
    const logosDir = './logos';
    const files = fs.readdirSync(logosDir);
    
    for (const file of files) {
        if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg') || 
            file.endsWith('.webp') || file.endsWith('.svg') || file.endsWith('.ico')) {
            const filePath = path.join(logosDir, file);
            const stats = fs.statSync(filePath);
            
            console.log(`上传: ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
            
            try {
                await client.put(`logos/${file}`, filePath);
                console.log(`✅ 上传成功: ${file}`);
            } catch (error) {
                console.error(`❌ 上传失败: ${file} - ${error.message}`);
            }
        }
    }
    
    console.log('上传完成！');
}

uploadLogos();
