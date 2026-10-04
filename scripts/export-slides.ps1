# Export PowerPoint slides to PNG.
#
# NOTE: This file is ASCII on purpose. Windows PowerShell 5.1 reads a BOM-less
# file as the system ANSI codepage, so Korean comments here get mangled and the
# script fails to parse. The reasoning for this tool is written in Korean in its
# companion .mjs wrapper in this same folder -- find it by searching scripts/ for
# "export-slides.ps1" and read that one first. (Its name is Korean, so it cannot
# be written here either.)
#
# Do NOT touch the boss's own PowerPoint window: we create our own Application
# object, open the file read-only with no window, and close only what we opened.
#
#   powershell -NoProfile -File scripts/export-slides.ps1 -Pptx <path> -Out <dir> [-From n] [-To n]

param(
  [Parameter(Mandatory = $true)][string]$Pptx,
  [Parameter(Mandatory = $true)][string]$Out,
  [int]$From = 0,
  [int]$To = 0
)

if (-not (Test-Path $Pptx)) { Write-Output "ERR no such file: $Pptx"; exit 1 }
if (-not (Test-Path $Out)) { New-Item -ItemType Directory -Force $Out | Out-Null }

$pptxFull = (Resolve-Path $Pptx).Path
$outFull = (Resolve-Path $Out).Path

$app = $null
$pres = $null
try {
  $app = New-Object -ComObject PowerPoint.Application
  $pres = $app.Presentations.Open($pptxFull, $true, $false, $false)
  $total = $pres.Slides.Count
  $a = 1
  if ($From -gt 0) { $a = $From }
  $b = $total
  if ($To -gt 0) { $b = [Math]::Min($To, $total) }
  Write-Output "TOTAL $total EXPORT $a..$b"
  for ($i = $a; $i -le $b; $i++) {
    $n = ([string]$i).PadLeft(3, '0')
    $dest = Join-Path $outFull ("slide-" + $n + ".png")
    $pres.Slides.Item($i).Export($dest, 'PNG', 1600, 900)
  }
  Write-Output "OK $outFull"
} catch {
  Write-Output ("ERR " + $_.Exception.Message)
  exit 1
} finally {
  if ($pres) { try { $pres.Close() } catch {} }
  if ($app) { try { $app.Quit() } catch {} }
}
