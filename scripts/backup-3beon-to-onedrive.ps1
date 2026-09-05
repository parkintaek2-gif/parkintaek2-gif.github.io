# backup-3beon-to-onedrive.ps1 - 3-beon(100yearmap unit) session transcripts + memory + key docs, backed up to OneDrive daily
#
# Owner instruction (2026-09-05, ~22:00 KST): worried that if a Claude session dies,
# its conversation transcript is lost. Answer: back it up to OneDrive daily at 01:00.
#
# We register this via Windows Task Scheduler (schtasks), NOT via CronCreate inside a
# Claude Code session -- a session-internal cron dies with the session, which defeats
# the whole point. schtasks runs independent of any Claude session as long as the PC is on.
#
# What gets backed up:
#   (1) Full 3-beon Claude session folder (transcripts *.jsonl + memory/*.md)
#       C:\Users\USER\.claude-u3\projects\C--Users-User-OneDrive-Desktop
#   (2) Two key shared repo docs (already safe in git/GitHub, this is a second safety net)
#       docs\세션간-메모.md, docs\사장님-할일.md
#
# Retention: keeps the last 14 dated folders, deletes older ones so this doesn't grow forever.
#
# One-time registration:
#   schtasks /create /tn "3beon-OneDrive-Backup" /tr "powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:\Users\USER\Documents\GitHub\dataeconomics\scripts\backup-3beon-to-onedrive.ps1" /sc daily /st 01:00 /f
# Check it:
#   schtasks /query /tn "3beon-OneDrive-Backup" /v /fo list
# Test it right now:
#   schtasks /run /tn "3beon-OneDrive-Backup"

$ErrorActionPreference = 'Stop'
$today = Get-Date -Format 'yyyy-MM-dd'
$backupRoot = 'C:\Users\User\OneDrive\3beon-backup'
$todayDir = Join-Path $backupRoot $today
$logFile = Join-Path $backupRoot 'backup-log.txt'

function Write-Log($msg) {
  $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $msg"
  Add-Content -Path $logFile -Value $line -Encoding utf8
}

try {
  New-Item -ItemType Directory -Force -Path $todayDir | Out-Null

  # (1) Claude session transcripts + memory
  $sessionDir = 'C:\Users\USER\.claude-u3\projects\C--Users-User-OneDrive-Desktop'
  if (Test-Path $sessionDir) {
    $destSessionDir = Join-Path $todayDir 'claude-session'
    robocopy $sessionDir $destSessionDir /E /NFL /NDL /NJH /NJS /NC /NS /NP | Out-Null
    Write-Log "session dir copied -> $destSessionDir"
  } else {
    Write-Log "WARNING: session dir not found -- $sessionDir"
  }

  # (2) Key shared repo docs
  $repoDir = 'C:\Users\USER\Documents\GitHub\dataeconomics'
  $destDocsDir = Join-Path $todayDir 'repo-key-docs'
  New-Item -ItemType Directory -Force -Path $destDocsDir | Out-Null
  $docsToBackup = @('docs\세션간-메모.md', 'docs\사장님-할일.md')
  foreach ($doc in $docsToBackup) {
    $src = Join-Path $repoDir $doc
    if (Test-Path $src) {
      Copy-Item $src -Destination $destDocsDir -Force
    } else {
      Write-Log "WARNING: doc not found -- $src"
    }
  }
  Write-Log "key docs copied -> $destDocsDir"

  # (3) Prune backups older than 14 days
  Get-ChildItem $backupRoot -Directory -ErrorAction SilentlyContinue | Where-Object {
    $_.Name -match '^\d{4}-\d{2}-\d{2}$' -and [datetime]$_.Name -lt (Get-Date).AddDays(-14)
  } | ForEach-Object {
    Remove-Item $_.FullName -Recurse -Force
    Write-Log "pruned old backup -- $($_.Name)"
  }

  Write-Log "OK: $today backup finished"
} catch {
  Write-Log "FAILED: $($_.Exception.Message)"
  throw
}
