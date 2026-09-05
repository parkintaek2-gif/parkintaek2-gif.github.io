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
#   (2) The whole repo docs\ folder (already safe in git/GitHub, this is a second safety net)
#
# Retention: keeps the last 14 dated folders, deletes older ones so this doesn't grow forever.
#
# 2026-09-06 fix (5번's archive-backup finding applied here too): (2) used to be a hand-picked
# list of two filenames (docs\세션간-메모.md, docs\사장님-할일.md). Any new doc created later
# (e.g. docs\키워드-찾는법.md, created this same day) would have silently never been backed up --
# no error, just quietly missing. Switched to robocopy'ing the whole docs\ folder so new files
# are included automatically, matching (1)'s already-correct pattern.
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

  # (2) Whole repo docs folder (not a hand-picked list -- see 2026-09-06 note above)
  $repoDir = 'C:\Users\USER\Documents\GitHub\dataeconomics'
  $docsDir = Join-Path $repoDir 'docs'
  if (Test-Path $docsDir) {
    $destDocsDir = Join-Path $todayDir 'repo-docs'
    robocopy $docsDir $destDocsDir /E /NFL /NDL /NJH /NJS /NC /NS /NP | Out-Null
    Write-Log "docs dir copied -> $destDocsDir"
  } else {
    Write-Log "WARNING: docs dir not found -- $docsDir"
  }

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
