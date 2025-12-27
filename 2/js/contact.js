// 联系页面特有的JavaScript功能

// 表单提交处理
const contactForm = document.getElementById('contact-form');

if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // 获取表单数据
        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            subject: document.getElementById('subject').value,
            message: document.getElementById('message').value
        };
        
        console.log('表单数据:', formData);
        
        // 模拟表单提交成功
        const submitBtn = this.querySelector('.submit-btn');
        const originalBtnText = submitBtn.innerHTML;
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 发送中...';
        
        // 模拟网络请求延迟
        setTimeout(() => {
            // 重置表单
            contactForm.reset();
            
            // 恢复按钮状态并显示成功消息
            submitBtn.innerHTML = '<i class="fas fa-check"></i> 发送成功';
            
            // 3秒后恢复按钮原始状态
            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }, 3000);
            
            // 显示成功提示
            alert('消息发送成功，我会尽快回复您！');
        }, 1500);
    });
}