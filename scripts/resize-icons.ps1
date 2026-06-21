Add-Type -AssemblyName System.Drawing

function Resize-Image {
    param (
        [string]$sourcePath,
        [string]$outputPath,
        [int]$width,
        [int]$height
    )
    $srcImage = [System.Drawing.Image]::FromFile($sourcePath)
    $destBitmap = New-Object System.Drawing.Bitmap($width, $height)
    $graphics = [System.Drawing.Graphics]::FromImage($destBitmap)
    
    # Configure high quality resizing
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    $graphics.DrawImage($srcImage, 0, 0, $width, $height)
    
    $destBitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $graphics.Dispose()
    $destBitmap.Dispose()
    $srcImage.Dispose()
    
    Write-Host "Resized to $width x $height and saved to $outputPath"
}

$source = "C:\Users\rofiu\.gemini\antigravity-ide\brain\d8c02952-1bac-4d8b-b9f1-0c295f9fedff\media__1782001040160.png"
if (-not (Test-Path $source)) {
    Write-Error "Source icon not found at $source"
    exit 1
}

Resize-Image -sourcePath $source -outputPath "public/icon.png" -width 48 -height 48
Resize-Image -sourcePath $source -outputPath "public/apple-icon.png" -width 180 -height 180
Resize-Image -sourcePath $source -outputPath "public/icon-192x192.png" -width 192 -height 192
Resize-Image -sourcePath $source -outputPath "public/icon-512x512.png" -width 512 -height 512

Write-Host "Icon generation completed."
