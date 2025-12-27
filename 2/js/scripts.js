// 移动端菜单切换
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});

// 平滑滚动
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

// 监听滚动事件，更新导航栏高亮
window.addEventListener('scroll', () => {
    const scrollPosition = window.scrollY;
    
    // 为导航链接添加活跃状态
    document.querySelectorAll('nav a').forEach(link => {
        const section = document.querySelector(link.getAttribute('href'));
        const sectionTop = section.offsetTop - 100;
        const sectionBottom = sectionTop + section.offsetHeight;
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
            document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
            link.classList.add('active');
        }
    });
});