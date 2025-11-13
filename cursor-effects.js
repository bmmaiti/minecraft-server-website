// 光标拖尾效果JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('初始化光标拖尾效果...');
    
    // 创建光标拖尾容器
    const trailContainer = document.createElement('div');
    trailContainer.id = 'cursor-trail';
    document.body.appendChild(trailContainer);
    console.log('已创建拖尾容器');
    
    // 创建粒子散落效果容器
    const particleContainer = document.createElement('div');
    particleContainer.id = 'particle-container';
    document.body.appendChild(particleContainer);
    
    // 拖尾元素数组和相关变量
    const trails = [];
    const trailCount = 50; // 增加拖尾元素数量到50个
    let mouseX = 0;
    let mouseY = 0;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let lastTrailTime = 0;
    const trailDelay = 20; // 缩短创建间隔到20ms，增加生成密度
    let mouseMoving = false;
    let mouseMoveTimer = null;
    
    // 粒子散落效果相关变量
    const particles = [];
    // 根据屏幕尺寸动态调整粒子数量和生成频率，增加大屏幕上的粒子密度
    const baseParticleCount = 80; // 增加基础粒子数量
    // 根据屏幕面积调整粒子数量，使用更敏感的计算方式
    const screenArea = window.innerWidth * window.innerHeight;
    let particleCount;
    if (screenArea > 2000000) { // 大于2K分辨率
        particleCount = Math.max(baseParticleCount, Math.floor(screenArea / 80000)); // 增加密度计算因子
    } else {
        particleCount = Math.max(baseParticleCount, Math.floor(screenArea / 100000)); // 保持原有计算方式
    }
    let lastParticleTime = 0;
    // 根据屏幕宽度调整粒子生成间隔，屏幕越宽间隔越短，大屏幕上生成更频繁
    const baseParticleDelay = 50;
    let particleDelay;
    if (window.innerWidth > 2560) { // 4K及以上分辨率
        particleDelay = Math.max(10, baseParticleDelay - Math.floor((window.innerWidth - 1920) / 50)); // 更激进的延迟减少
    } else if (window.innerWidth > 1920) { // 2K及以上分辨率
        particleDelay = Math.max(15, baseParticleDelay - Math.floor((window.innerWidth - 1920) / 75)); // 中等延迟减少
    } else {
        particleDelay = Math.max(20, baseParticleDelay - Math.floor((window.innerWidth - 1920) / 100)); // 原有计算方式
    }
    
    // 初始化拖尾元素
    for (let i = 0; i < trailCount; i++) {
        const trail = document.createElement('div');
        trail.className = 'trail-element';
        trail.style.backgroundImage = "url('logos/effect.gif')"; // 默认使用effect.gif
        trail.style.opacity = 0;
        trailContainer.appendChild(trail);
        trails.push({
            element: trail,
            x: 0,
            y: 0,
            opacity: 0,
            scale: 1,
            active: false
        });
    }
    console.log('已初始化拖尾元素');
    
    // 初始化粒子元素
    // 定义lizi文件夹中的贴图数组
    const particleImages = [
        'lizi/dripping_obsidian_tear.png',
        'lizi/dripping_water.png',
        'lizi/fishing.png',
        'lizi/portal.png',
        'lizi/splash.png'
    ];
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle-element';
        // 随机选择一个lizi贴图
        const randomImage = particleImages[Math.floor(Math.random() * particleImages.length)];
        particle.style.backgroundImage = `url('${randomImage}')`;
        particle.style.opacity = 0;
        particleContainer.appendChild(particle);
        particles.push({
            element: particle,
            x: 0,
            y: 0,
            opacity: 0,
            scale: 1,
            active: false,
            vx: 0, // 水平速度
            vy: 0  // 垂直速度
        });
    }
    console.log('已初始化粒子元素');
    
    // 鼠标移动事件监听器
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        // 检查鼠标是否在移动
        if (Math.abs(mouseX - lastMouseX) > 1 || Math.abs(mouseY - lastMouseY) > 1) {
            mouseMoving = true;
            lastMouseX = mouseX;
            lastMouseY = mouseY;
            
            // 清除之前的定时器
            if (mouseMoveTimer) {
                clearTimeout(mouseMoveTimer);
            }
            
            // 设置新的定时器，在鼠标停止移动后一段时间标记为不移动
            mouseMoveTimer = setTimeout(() => {
                mouseMoving = false;
            }, 100); // 鼠标停止移动100ms后认为不移动
        }
    });
    
    // 预加载图片以减少资源请求
    const preloadImages = [
        'lizi/dripping_obsidian_tear.png',
        'lizi/dripping_water.png',
        'lizi/fishing.png',
        'lizi/portal.png',
        'lizi/splash.png'
    ];
    const preloadedImages = {};
    
    preloadImages.forEach(src => {
        const img = new Image();
        img.onload = function() {
            preloadedImages[src] = img;
            console.log('成功预加载图片:', src);
        };
        img.onerror = function() {
            console.error('无法预加载图片:', src);
        };
        img.src = src;
    });
    
    // 动画循环
    function animate() {
        const now = Date.now();
        
        // 只有在鼠标移动时才创建新的拖尾元素
        if (mouseMoving && now - lastTrailTime > trailDelay) {
            lastTrailTime = now;
            
            // 找到一个未激活的拖尾元素或使用最旧的元素
            let trailIndex = trails.findIndex(t => !t.active);
            if (trailIndex === -1) {
                // 如果所有元素都被激活，使用第一个元素（最旧的）
                trailIndex = 0;
                // 将后面的元素向前移动
                for (let i = 0; i < trailCount - 1; i++) {
                    trails[i].x = trails[i + 1].x;
                    trails[i].y = trails[i + 1].y;
                    trails[i].opacity = trails[i + 1].opacity;
                    trails[i].scale = trails[i + 1].scale;
                }
            } else {
                // 激活找到的元素
                trails[trailIndex].active = true;
            }
            
            // 设置新拖尾元素的位置和初始属性
              if (trailIndex !== -1) {
                  trails[trailIndex].x = mouseX;
                  trails[trailIndex].y = mouseY;
                  trails[trailIndex].opacity = 1.0; // 提高初始透明度到1.0（完全不透明）
                  trails[trailIndex].scale = 1;
                
                // 随机选择一个GIF作为拖尾效果
                const gifs = ['logos/effect.gif', 'logos/firework.gif'];
                const randomGif = gifs[Math.floor(Math.random() * gifs.length)];
                trails[trailIndex].element.style.backgroundImage = `url('${randomGif}')`;
            }
        }
        
        // 随机生成粒子散落效果（不依赖于鼠标移动）
        if (now - lastParticleTime > particleDelay) {
            lastParticleTime = now;
            
            // 找到一个未激活的粒子元素
            let particleIndex = particles.findIndex(p => !p.active);
            if (particleIndex !== -1) {
                // 激活粒子元素
                particles[particleIndex].active = true;
                
                // 在屏幕两侧随机生成粒子，增加顶部和底部的粒子生成区域
                const side = Math.random();
                const screenWidth = window.innerWidth;
                const screenHeight = window.innerHeight;
                
                if (side < 0.25) {
                    // 左侧
                    particles[particleIndex].x = 0;
                    particles[particleIndex].y = Math.random() * screenHeight;
                } else if (side < 0.5) {
                    // 右侧
                    particles[particleIndex].x = screenWidth;
                    particles[particleIndex].y = Math.random() * screenHeight;
                } else if (side < 0.75) {
                    // 顶部
                    particles[particleIndex].x = Math.random() * screenWidth;
                    particles[particleIndex].y = 0;
                } else {
                    // 底部
                    particles[particleIndex].x = Math.random() * screenWidth;
                    particles[particleIndex].y = screenHeight;
                }
                
                // 设置随机速度，使粒子向屏幕中心飞入
                const targetX = screenWidth / 2;
                const targetY = screenHeight / 2;
                const dx = targetX - particles[particleIndex].x;
                const dy = targetY - particles[particleIndex].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // 标准化方向并设置随机速度，根据屏幕尺寸调整速度
                const baseSpeed = 0.5 + Math.random() * 1.5; // 降低基础速度
                const speedMultiplier = Math.max(0.5, Math.min(2, window.innerWidth / 1920)); // 调整速度倍增器
                particles[particleIndex].vx = (dx / distance) * baseSpeed * speedMultiplier;
                particles[particleIndex].vy = (dy / distance) * baseSpeed * speedMultiplier;
                
                particles[particleIndex].opacity = 1.0;
                particles[particleIndex].scale = 1.2 + Math.random() * 0.8; // 进一步增大初始缩放范围
                
                // 随机选择一个lizi贴图作为粒子效果
                const randomImage = particleImages[Math.floor(Math.random() * particleImages.length)];
                particles[particleIndex].element.style.backgroundImage = `url('${randomImage}')`;
            }
        }
        
        // 更新所有拖尾元素的位置、透明度和缩放
        for (let i = 0; i < trailCount; i++) {
            const trail = trails[i];
            if (trail.active) {
                trail.element.style.left = trail.x + 'px';
                trail.element.style.top = trail.y + 'px';
                trail.element.style.opacity = trail.opacity;
                trail.element.style.transform = `translate(-50%, -50%) scale(${trail.scale})`;
                
                // 逐渐减小透明度和尺寸（调整参数以进一步延长消失时间）
                trail.opacity *= 0.97; // 进一步减缓透明度降低速度，从0.95调整为0.97
                trail.scale *= 0.98; // 进一步减缓缩放速度，从0.97调整为0.98
                
                // 当透明度降到极低时，才取消激活元素，延长存在时间
                if (trail.opacity < 0.02) {
                    trail.active = false;
                    trail.element.style.opacity = 0;
                }
            }
        }
        
        // 更新所有粒子元素的位置、透明度和缩放
        for (let i = 0; i < particleCount; i++) {
            const particle = particles[i];
            if (particle.active) {
                // 更新位置
                particle.x += particle.vx;
                particle.y += particle.vy;
                
                // 更新透明度和缩放
                particle.opacity *= 0.98;
                particle.scale *= 0.98;
                
                // 应用新的位置、透明度和缩放
                particle.element.style.left = particle.x + 'px';
                particle.element.style.top = particle.y + 'px';
                particle.element.style.opacity = particle.opacity;
                particle.element.style.transform = `translate(-50%, -50%) scale(${particle.scale})`;
                
                // 当透明度降到极低时，取消激活元素
                if (particle.opacity < 0.02) {
                    particle.active = false;
                    particle.element.style.opacity = 0;
                }
            }
        }
        
        requestAnimationFrame(animate);
    }
    
    // 启动动画循环
    animate();
    console.log('光标拖尾效果已启动');
});