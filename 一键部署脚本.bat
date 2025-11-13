@echo off
chcp 65001 >nul
cls

echo ==================================================
echo 赞助者名单网站一键部署脚本
echo ==================================================
echo.

echo 正在设置赞助者名单文件权限...
echo.

echo 正在为IIS_IUSRS组设置读取权限...
icacls "赞助者名单.txt" /grant "IIS_IUSRS:(R)" >nul 2>&1
if %errorlevel% equ 0 (
    echo IIS_IUSRS组权限设置成功
) else (
    echo IIS_IUSRS组权限设置失败
)

echo 正在为Everyone组设置读取权限...
icacls "赞助者名单.txt" /grant "Everyone:(R)" >nul 2>&1
if %errorlevel% equ 0 (
    echo Everyone组权限设置成功
) else (
    echo Everyone组权限设置失败
)

echo.
echo 正在重启IIS服务...
iisreset >nul 2>&1
if %errorlevel% equ 0 (
    echo IIS服务重启成功
) else (
    echo IIS服务重启失败
)

echo.
echo 部署完成！
echo 请在浏览器中访问网站测试赞助者名单显示
echo.

echo 按任意键退出...
pause >nul
