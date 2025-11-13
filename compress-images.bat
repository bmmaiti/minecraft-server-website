@echo off
REM 图片压缩批处理脚本

REM 创建压缩目录
if not exist "compressed" mkdir "compressed"

REM 使用PowerShell命令压缩图片
powershell -Command ^
$images = Get-ChildItem -Path '.\scenery\', '.\photos\' -Recurse -Include '*.jpg', '*.jpeg', '*.png'; ^
foreach ($image in $images) { ^
    $outputPath = Join-Path '.\compressed' $image.Name; ^
    Write-Host ('正在压缩: ' + $image.Name); ^
    try { ^
        Add-Type -AssemblyName System.Drawing; ^
        $bitmap = [System.Drawing.Bitmap]::FromFile($image.FullName); ^
        $encoder = [System.Drawing.Imaging.Encoder]::Quality; ^
        $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1); ^
        $encoderParam = New-Object System.Drawing.Imaging.EncoderParameter($encoder, [long]80); ^
        $encoderParams.Param[0] = $encoderParam; ^
        $imageCodecInfo = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }; ^
        $bitmap.Save($outputPath, $imageCodecInfo, $encoderParams); ^
        $bitmap.Dispose(); ^
        Write-Host ('已压缩: ' + $image.Name); ^
    } catch { ^
        Write-Host ('压缩失败: ' + $image.Name + ' - ' + $_.Exception.Message); ^
    } ^
}; ^
Write-Host '图片压缩完成!'