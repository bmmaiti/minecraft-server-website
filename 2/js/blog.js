// 博客页面特有的JavaScript功能

// 分页功能
const pageLinks = document.querySelectorAll('.page-link');
pageLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        
        // 移除所有活跃状态
        pageLinks.forEach(pl => pl.classList.remove('active'));
        
        // 添加活跃状态到当前点击的链接
        this.classList.add('active');
        
        // 这里可以添加加载对应页面内容的逻辑
        console.log('跳转到页面:', this.textContent.trim());
    });
});

// 搜索功能
const searchInput = document.querySelector('.search-input');
const searchBtn = document.querySelector('.search-btn');

function handleSearch() {
    const searchTerm = searchInput.value.trim();
    if (searchTerm) {
        console.log('搜索内容:', searchTerm);
        // 这里可以添加实际的搜索逻辑
        alert(`正在搜索: ${searchTerm}`);
    }
}

searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        handleSearch();
    }
});

// 分类筛选功能
const categoryLinks = document.querySelectorAll('.categories-list a');
categoryLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const category = this.textContent.trim().split(' ')[0];
        console.log('筛选分类:', category);
        // 这里可以添加实际的分类筛选逻辑
        alert(`筛选分类: ${category}`);
    });
});

// 标签点击功能
const tagLinks = document.querySelectorAll('.tags-cloud a');
tagLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const tag = this.textContent.trim();
        console.log('点击标签:', tag);
        // 这里可以添加实际的标签筛选逻辑
        alert(`筛选标签: ${tag}`);
    });
});