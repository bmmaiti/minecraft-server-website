const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { JSDOM } = require('jsdom');

const LINKS_FILE = path.join(__dirname, 'links.json');
const LOGOS_DIR = path.join(__dirname, 'logos');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function downloadFile(url, filePath, originalUrl = url, redirectCount = 0) {
    const MAX_REDIRECTS = 5;
    
    if (redirectCount >= MAX_REDIRECTS) {
        reject(new Error(`重定向次数过多 (${MAX_REDIRECTS} 次)`));
        return;
    }
    
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        
        const request = client.request(url, { 
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                'Referer': originalUrl
            }
        }, (response) => {
            const statusCode = response.statusCode;
            
            // 处理重定向 (301, 302, 303, 307, 308)
            if (statusCode >= 300 && statusCode < 400) {
                const location = response.headers.location;
                if (location) {
                    // 将相对 URL 转换为绝对 URL
                    let redirectUrl;
                    try {
                        redirectUrl = new URL(location, url).href;
                    } catch (e) {
                        redirectUrl = new URL(location, originalUrl).href;
                    }
                    
                    // 检查是否是相同的 URL（防止无限循环）
                    if (redirectUrl === url) {
                        reject(new Error(`检测到重定向循环，停止尝试`));
                        return;
                    }
                    
                    console.log(`  ⚠️  收到 ${statusCode} 重定向到: ${redirectUrl}`);
                    // 自动跟随重定向
                    downloadFile(redirectUrl, filePath, originalUrl, redirectCount + 1).then(resolve).catch(reject);
                    return;
                }
            }
            
            if (statusCode !== 200) {
                reject(new Error(`下载失败，状态码: ${statusCode}`));
                return;
            }
            
            const fileStream = fs.createWriteStream(filePath);
            response.pipe(fileStream);
            
            fileStream.on('finish', () => {
                fileStream.close();
                resolve(true);
            });
            
            fileStream.on('error', reject);
        });
        
        request.on('error', reject);
        request.on('timeout', () => {
            request.destroy();
            reject(new Error('请求超时'));
        });
        
        request.end();
    });
}

async function extractFaviconFromHTML(url) {
    console.log(`  📄 正在从静态 HTML 页面提取 favicon...`);
    
    try {
        const dom = await JSDOM.fromURL(url, {
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        const doc = dom.window.document;
        
        console.log(`  ✅ 成功获取 HTML 页面`);
        
        const iconSelectors = [
            'link[rel="shortcut icon"]',
            'link[rel="icon"]',
            'link[rel="icon shortcut"]',
            'link[rel="apple-touch-icon"]',
            'link[rel="apple-touch-icon-precomposed"]',
            'link[rel*="icon"]',
            'link[rel="mask-icon"]',
            'link[rel="fluid-icon"]'
        ];
        
        let foundIcon = null;
        
        for (const selector of iconSelectors) {
            try {
                const iconLink = doc.querySelector(selector);
                if (iconLink) {
                    const href = iconLink.getAttribute('href');
                    if (href) {
                        let absoluteUrl;
                        try {
                            absoluteUrl = new URL(href, url).href;
                        } catch (e) {
                            continue;
                        }
                        
                        if (absoluteUrl && (absoluteUrl.endsWith('.png') || 
                                           absoluteUrl.endsWith('.jpg') || 
                                           absoluteUrl.endsWith('.jpeg') || 
                                           absoluteUrl.endsWith('.webp') ||
                                           absoluteUrl.endsWith('.svg') ||
                                           absoluteUrl.endsWith('.ico'))) {
                            foundIcon = absoluteUrl;
                            console.log(`  🎯 找到 favicon: ${absoluteUrl}`);
                            break;
                        }
                    }
                }
            } catch (e) {
                continue;
            }
        }
        
        if (foundIcon) {
            return foundIcon;
        }
        
        console.log(`  ⚠️  未在 HTML 中找到 favicon，尝试标准路径`);
        const standardFavicon = new URL('/favicon.ico', url).href;
        return standardFavicon;
        
    } catch (error) {
        console.log(`  ❌ 从 HTML 提取失败: ${error.message}`);
        const standardFavicon = new URL('/favicon.ico', url).href;
        return standardFavicon;
    }
}

async function getLogoUrlFromSite(siteUrl) {
    try {
        const urlObj = new URL(siteUrl);
        const domain = urlObj.hostname;
        
        console.log(`  🌐 正在访问网站: ${siteUrl}`);
        const logoUrl = await extractFaviconFromHTML(siteUrl);
        
        if (logoUrl && (logoUrl.endsWith('.png') || 
                       logoUrl.endsWith('.jpg') || 
                       logoUrl.endsWith('.jpeg') || 
                       logoUrl.endsWith('.webp') ||
                       logoUrl.endsWith('.svg') ||
                       logoUrl.endsWith('.ico'))) {
            console.log(`  ✅ 成功获取 logo URL: ${logoUrl}`);
            return logoUrl;
        }
        
        console.log(`  ❌ 未获取到有效的 logo URL`);
        return null;
        
    } catch (error) {
        console.log(`  ❌ 获取 ${siteUrl} 的 logo 失败: ${error.message}`);
        return null;
    }
}

async function downloadLogo(link) {
    const urlObj = new URL(link.url);
    const domain = urlObj.hostname.replace('www.', '');
    
    let logoUrl = null;
    
    if (link.logo) {
        try {
            const response = await fetch(link.logo, { method: 'HEAD' });
            if (response.ok) {
                logoUrl = link.logo;
                console.log(`  📋 使用 links.json 中配置的 logo: ${logoUrl}`);
            }
        } catch (e) {
            console.log(`  ⚠️  配置的 logo 无效，尝试 fallback logo`);
        }
    }
    
    if (!logoUrl && link.fallbackLogos && link.fallbackLogos.length > 0) {
        for (const fallbackUrl of link.fallbackLogos) {
            try {
                const response = await fetch(fallbackUrl, { method: 'HEAD' });
                if (response.ok) {
                    logoUrl = fallbackUrl;
                    console.log(`  📋 使用 fallback logo: ${logoUrl}`);
                    break;
                }
            } catch (e) {
                console.log(`  ⚠️  fallback logo 无效: ${fallbackUrl}`);
            }
        }
    }
    
    if (!logoUrl) {
        logoUrl = await getLogoUrlFromSite(link.url);
    }
    
    if (!logoUrl) {
        console.log(`  ❌ 无法获取 ${link.name} 的 logo`);
        return false;
    }
    
    try {
        const urlObj = new URL(logoUrl);
        const ext = path.extname(urlObj.pathname).toLowerCase();
        const validExts = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.ico'];
        
        if (!validExts.includes(ext)) {
            console.log(`  ⚠️  跳过非图片文件: ${ext}`);
            return false;
        }
        
        const fileName = `${domain}${ext}`;
        const filePath = path.join(LOGOS_DIR, fileName);
        
        console.log(`  💾 下载 logo 到: ${fileName}`);
        await downloadFile(logoUrl, filePath);
        
        const stats = fs.statSync(filePath);
        console.log(`  ✅ 成功下载: ${fileName} (${(stats.size / 1024).toFixed(2)} KB)`);
        
        // 保存缓存时间戳
        const cacheInfo = {
            downloadedAt: new Date().toISOString(),
            size: stats.size,
            url: logoUrl
        };
        const cacheInfoPath = path.join(LOGOS_DIR, `${domain}.json`);
        fs.writeFileSync(cacheInfoPath, JSON.stringify(cacheInfo, null, 2));
        console.log(`  📅 缓存时间戳: ${cacheInfo.downloadedAt}`);
        
        return true;
        
    } catch (error) {
        console.log(`  ❌ 下载失败: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('🚀 开始自动下载友链 logo...\n');
    
    if (!fs.existsSync(LINKS_FILE)) {
        console.error('❌ 找不到 links.json 文件');
        process.exit(1);
    }
    
    if (!fs.existsSync(LOGOS_DIR)) {
        fs.mkdirSync(LOGOS_DIR, { recursive: true });
        console.log(`✅ 创建 logo 目录: ${LOGOS_DIR}\n`);
    }
    
    const linksData = fs.readFileSync(LINKS_FILE, 'utf8');
    const links = JSON.parse(linksData);
    
    console.log(`📋 共找到 ${links.length} 个友链\n`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < links.length; i++) {
        const link = links[i];
        console.log(`[${i + 1}/${links.length}] 处理: ${link.name}`);
        
        const result = await downloadLogo(link);
        if (result) {
            successCount++;
        } else {
            failCount++;
        }
        
        await sleep(1000);
        console.log('');
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ 成功下载: ${successCount} 个`);
    console.log(`❌ 失败: ${failCount} 个`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch(error => {
    console.error('❌ 脚本执行出错:', error);
    process.exit(1);
});
