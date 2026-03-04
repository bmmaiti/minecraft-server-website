from PIL import Image
import os

# 打开原始图片
img = Image.open('logos/yggdrasill_logo.png')

# 调整尺寸到 64x64
img_resized = img.resize((64, 64), Image.Resampling.LANCZOS)

# 保存为 favicon.ico
img_resized.save('favicon.ico', format='ICO', sizes=[(64, 64)])

print('favicon.ico 已调整为 64x64 尺寸')
