const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { JSDOM } = require('jsdom');

const LINKS_FILE = '/tmp/links.json';
const LOGOS_DIR = '/tmp/logos';

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function downloadFile(url, filePath) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        
        const request = client.request(url, { 
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                'Referer': url
            }
        }, (response) => {
            const statusCode = response.statusCode;
            
            if (statusCode >= 300 && statusCode < 400) {
                const location = response.headers.location;
                if (location) {
                    let redirectUrl;
                    try {
                        redirectUrl = new URL(location, url).href;
                    } catch (e) {
                        redirectUrl = new URL(location, url).href;
                    }
                    
                    if (redirectUrl === url) {
                        reject(new Error('检测到重定向循环'));
                        return;
                    }
                    
                    console.log(`收到 ${statusCode} 重定向到: ${redirectUrl}`);
                    downloadFile(redirectUrl, filePath).then(resolve).catch(reject);
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
    try {
        const dom = await JSDOM.fromURL(url, {
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        const doc = dom.window.document;
        
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
                            return absoluteUrl;
                        }
                    }
                }
            } catch (e) {
                continue;
            }
        }
        
        const standardFavicon = new URL('/favicon.ico', url).href;
        return standardFavicon;
        
    } catch (error) {
        const standardFavicon = new URL('/favicon.ico', url).href;
        return standardFavicon;
    }
}

async function getLogoUrlFromSite(siteUrl) {
    try {
        const logoUrl = await extractFaviconFromHTML(siteUrl);
        
        if (logoUrl && (logoUrl.endsWith('.png') || 
                       logoUrl.endsWith('.jpg') || 
                       logoUrl.endsWith('.jpeg') || 
                       logoUrl.endsWith('.webp') ||
                       logoUrl.endsWith('.svg') ||
                       logoUrl.endsWith('.ico'))) {
            return logoUrl;
        }
        
        return null;
        
    } catch (error) {
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
            }
        } catch (e) {}
    }
    
    if (!logoUrl) {
        logoUrl = await getLogoUrlFromSite(link.url);
    }
    
    if (!logoUrl) {
        console.log(`无法获取 ${link.name} 的 logo`);
        return false;
    }
    
    try {
        const urlObj = new URL(logoUrl);
        const ext = path.extname(urlObj.pathname).toLowerCase();
        const validExts = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.ico'];
        
        if (!validExts.includes(ext)) {
            return false;
        }
        
        const fileName = `${domain}${ext}`;
        const filePath = path.join(LOGOS_DIR, fileName);
        
        await downloadFile(logoUrl, filePath);
        
        const stats = fs.statSync(filePath);
        
        const cacheInfo = {
            downloadedAt: new Date().toISOString(),
            size: stats.size,
            url: logoUrl
        };
        const cacheInfoPath = path.join(LOGOS_DIR, `${domain}.json`);
        fs.writeFileSync(cacheInfoPath, JSON.stringify(cacheInfo, null, 2));
        
        console.log(`成功下载: ${fileName} (${(stats.size / 1024).toFixed(2)} KB)`);
        return true;
        
    } catch (error) {
        console.log(`下载失败: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('开始自动下载友链 logo...');
    
    if (!fs.existsSync(LOGOS_DIR)) {
        fs.mkdirSync(LOGOS_DIR, { recursive: true });
    }
    
    const linksData = fs.readFileSync(LINKS_FILE, 'utf8');
    const links = JSON.parse(linksData);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const link of links) {
        const result = await downloadLogo(link);
        if (result) {
            successCount++;
        } else {
            failCount++;
        }
        
        await sleep(1000);
    }
    
    console.log(`成功: ${successCount}, 失败: ${failCount}`);
    
    return {
        statusCode: 200,
        body: JSON.stringify({
            success: true,
            downloaded: successCount,
            failed: failCount,
            timestamp: new Date().toISOString()
        })
    };
}

exports.handler = async (event, context) => {
    try {
        return await main();
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                error: error.message
            })
        };
    }
};
