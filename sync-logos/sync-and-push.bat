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
