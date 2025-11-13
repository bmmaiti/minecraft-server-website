# Simple Image Compression Script
# Using PowerShell's .NET functionality to compress images

# Load System.Drawing assembly
Add-Type -AssemblyName System.Drawing

function Compress-Image {
    param(
        [string]$InputPath,
        [string]$OutputPath,
        [int]$Quality = 80
    )
    
    try {
        # Create Bitmap object
        $bitmap = [System.Drawing.Bitmap]::FromFile($InputPath)
        
        # Create EncoderParameter object to set quality
        $encoder = [System.Drawing.Imaging.Encoder]::Quality
        $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
        $encoderParam = New-Object System.Drawing.Imaging.EncoderParameter($encoder, [long]$Quality)
        $encoderParams.Param[0] = $encoderParam
        
        # Get JPEG encoder
        $imageCodecInfo = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
        
        # If JPEG encoder is not found, use default encoder
        if ($null -eq $imageCodecInfo) {
            $imageCodecInfo = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Select-Object -First 1
        }
        
        # Save compressed image
        $bitmap.Save($OutputPath, $imageCodecInfo, $encoderParams)
        
        # Release resources
        $bitmap.Dispose()
        
        return $true
    }
    catch {
        Write-Host "Error: $($_.Exception.Message)"
        return $false
    }
}

# Create directory for compressed images
$compressedDir = ".\compressed"
if (!(Test-Path $compressedDir)) {
    New-Item -ItemType Directory -Path $compressedDir | Out-Null
}

# Get all image files
$images = Get-ChildItem -Path ".\scenery\", ".\photos\" -Recurse -Include "*.jpg", "*.jpeg", "*.png"

Write-Host "Found $($images.Count) image files to compress"

# Compress each image
$compressedCount = 0
foreach ($image in $images) {
    $outputPath = Join-Path $compressedDir $image.Name
    Write-Host "Compressing: $($image.Name)"
    
    if (Compress-Image -InputPath $image.FullName -OutputPath $outputPath -Quality 70) {
        $compressedCount++
        Write-Host "Compressed: $($image.Name)"
    } else {
        Write-Host "Compression failed: $($image.Name)"
    }
}

Write-Host "Image compression completed! Successfully compressed $compressedCount / $($images.Count) files"