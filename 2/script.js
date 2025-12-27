// 移动端菜单切换
const mobileMenuBtn = document.querySelector('.mobile-menu');
const navLinks = document.querySelector('.nav-links');

mobileMenuBtn.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});

// 平滑滚动
const smoothScroll = () => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 70, // 减去导航栏高度
                    behavior: 'smooth'
                });
                
                // 关闭移动端菜单
                navLinks.classList.remove('active');
            }
        });
    });
};

// 滚动监听，添加导航栏效果
const scrollHandler = () => {
    const header = document.querySelector('header');
    if (window.scrollY > 50) {
        header.style.backgroundColor = '#fff';
        header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    } else {
        header.style.backgroundColor = '#fff';
    }
};

// 表单提交处理
const handleFormSubmit = () => {
    const contactForm = document.querySelector('.contact-form form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // 获取表单数据
            const name = contactForm.querySelector('input[type="text"]').value;
            const email = contactForm.querySelector('input[type="email"]').value;
            const message = contactForm.querySelector('textarea').value;
            
            // 简单验证
            if (!name || !email || !message) {
                alert('请填写完整信息');
                return;
            }
            
            // 这里可以添加AJAX请求发送数据到服务器
            alert('留言已发送，谢谢！');
            contactForm.reset();
        });
    }
};

// 文章卡片鼠标悬停效果增强
const enhanceArticleCards = () => {
    const articleCards = document.querySelectorAll('.article-card');
    articleCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px)';
            card.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.15)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
        });
    });
};

// 页面加载完成后执行
window.addEventListener('DOMContentLoaded', () => {
    smoothScroll();
    handleFormSubmit();
    enhanceArticleCards();
});

// 滚动事件监听
window.addEventListener('scroll', scrollHandler);