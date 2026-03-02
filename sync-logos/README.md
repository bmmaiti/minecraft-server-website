# 同步 logo 到 Git 仓库

## 使用方法

### 1. 安装依赖
```bash
cd sync-logos
npm install
```

### 2. 运行脚本
```bash
npm run sync
```

### 3. 提交到 Git
```bash
cd ..
git add logos/
git commit -m "Update logo cache: $(date)"
git push
```

## 工作流程

1. **运行脚本** → 从友链网站下载 logo 到 `/logos/` 目录
2. **保存缓存信息** → 每个 logo 对应一个 `.json` 文件
3. **提交到 Git** → 推送到阿里云 Pages 和函数计算
4. **网站使用** → Pages 直接提供静态 logo 文件

## 定时任务

### Windows 任务计划程序

1. 打开任务计划程序
2. 创建基本任务
3. 触发器：每天凌晨 2 点
4. 操作：启动程序
   - 程序：`cmd.exe`
   - 参数：`/c cd /d C:\path\to\wwwroot\sync-logos && npm run sync`
5. 完成

### 推送脚本

创建 `sync-and-push.bat`：

```batch
@echo off
cd /d "%~dp0"
npm run sync
echo.
echo 提交到 Git...
cd ..
git add logos/
git commit -m "Update logo cache: %date% %time%"
git push
echo.
echo 完成！
pause
```

## 阿里云 Pages 配置

推送到 Git 后，阿里云 Pages 会自动：

1. 拉取最新代码
2. 部署到静态网站
3. Logo 文件可通过 `https://your-domain.com/logos/domain.com.png` 访问

## 网站配置

[links.html](file:///c:/Users/Administrator/OneDrive/文档/wwwroot/links.html) 已配置优先使用本地缓存：

```javascript
// 检查本地 logo 文件
const localLogoPath = `/logos/${domain}${ext}`;
const response = await fetch(localLogoPath, { method: 'HEAD' });
if (response.ok) {
    imgElement.src = localLogoPath; // 使用本地缓存
}
```
