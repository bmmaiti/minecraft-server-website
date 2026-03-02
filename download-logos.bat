@echo off
echo ========================================
echo 自动下载友链 Logo 脚本
echo ========================================
echo.

cd /d "%~dp0"

echo 检查 Node.js 是否安装...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未找到 Node.js
    echo 请先安装 Node.js: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js 已安装
echo.

echo 安装依赖包...
npm install >nul 2>&1
if errorlevel 1 (
    echo ⚠️  依赖安装可能失败，但继续尝试运行
    echo.
)

echo.
echo 开始下载 logo...
echo.

node auto-download-logos.js

echo.
pause
