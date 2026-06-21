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
    
    Write-Host "Generated: $outputPath ($width x $height)"
}

$source = "C:\Users\rofiu\.gemini\antigravity-ide\brain\d8c02952-1bac-4d8b-b9f1-0c295f9fedff\media__1782001040160.png"
if (-not (Test-Path $source)) {
    Write-Error "Source icon not found at $source"
    exit 1
}

$resDir = "android/app/src/main/res"

# Standard / Legacy icons mapping
$densities = @(
    @{ name = "mipmap-mdpi"; size = 48; fgSize = 108 },
    @{ name = "mipmap-hdpi"; size = 72; fgSize = 162 },
    @{ name = "mipmap-xhdpi"; size = 96; fgSize = 216 },
    @{ name = "mipmap-xxhdpi"; size = 144; fgSize = 324 },
    @{ name = "mipmap-xxxhdpi"; size = 192; fgSize = 432 }
)

foreach ($d in $densities) {
    $dirPath = Join-Path $resDir $d.name
    
    # Legacy Square Icon
    $launcherPath = Join-Path $dirPath "ic_launcher.png"
    Resize-Image -sourcePath $source -outputPath $launcherPath -width $d.size -height $d.size
    
    # Legacy Round Icon
    $roundPath = Join-Path $dirPath "ic_launcher_round.png"
    Resize-Image -sourcePath $source -outputPath $roundPath -width $d.size -height $d.size
    
    # Adaptive Foreground Icon
    $fgPath = Join-Path $dirPath "ic_launcher_foreground.png"
    Resize-Image -sourcePath $source -outputPath $fgPath -width $d.fgSize -height $d.fgSize
}

Write-Host "Android launcher icons generation complete."
