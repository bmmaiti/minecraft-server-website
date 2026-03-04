from PIL import Image
import os

# 打开原始图片
img = Image.open('logos/yggdrasill_logo.png')

# 调整尺寸到 128x128
img_resized = img.resize((128, 128), Image.Resampling.LANCZOS)

# 保存为 favicon.ico
img_resized.save('favicon.ico', format='ICO', sizes=[(128, 128)])

print('favicon.ico 已调整为 128x128 尺寸')
