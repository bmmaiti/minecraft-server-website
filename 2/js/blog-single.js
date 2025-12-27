// 博客文章详情页特有的JavaScript功能

// 评论提交处理
const commentForm = document.querySelector('.comment-form form');

if (commentForm) {
    commentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // 获取评论数据
        const commentData = {
            name: document.getElementById('comment-name').value,
            email: document.getElementById('comment-email').value,
            comment: document.getElementById('comment-content').value
        };
        
        console.log('评论数据:', commentData);
        
        // 模拟评论提交成功
        const submitBtn = this.querySelector('.submit-comment');
        const originalBtnText = submitBtn.innerHTML;
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 提交中...';
        
        // 模拟网络请求延迟
        setTimeout(() => {
            // 重置评论表单
            commentForm.reset();
            
            // 恢复按钮状态
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;