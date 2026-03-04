from PIL import Image
import os

# 读取logo图片
logo_path = r"c:\Users\Administrator\OneDrive\文档\wwwroot\logos\yggdrasill_logo.png"
output_path = r"c:\Users\Administrator\OneDrive\文档\wwwroot\favicon.ico"

if os.path.exists(logo_path):
    img = Image.open(logo_path)
    
    # 转换为RGBA模式(如果需要)
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    # 创建不同尺寸的favicon
    sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]
    
    # 保存为ICO格式
    img.save(output_path, format='ICO', sizes=sizes)
    print(f"favicon.ico 创建成功: {output_path}")
else:
    print(f"图片文件不存在: {logo_path}")
