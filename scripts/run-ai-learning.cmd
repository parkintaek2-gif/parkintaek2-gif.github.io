@echo off
rem SeoulMarkets - keep our own AIs learning during work hours (07:10-21:10, hourly).
rem Owner's instruction 2026-09-24: AI must keep learning in the background during work hours.
rem
rem WHY a Windows task and not a session cron:
rem   The invest-AI reader ran on session 6's cron. That seat disappeared and the cron
rem   vanished with it - the AI sat frozen from 2026-09-15 for 9 days and nobody knew.
rem   Session crons live only in session memory. This file does not.
rem
rem KEEP THIS FILE ASCII ONLY - comments AND arguments.
rem   A previous version passed a Korean argument (--<save in Korean>). cmd.exe read it as
rem   CP949, ate the following characters, and every line after it broke. The scheduled task
rem   still reported exit 0 while doing nothing at all. That is the worst kind of failure.
rem   Korean explanation: docs/jachae-ai-learning.md

setlocal
cd /d "%~dp0.."
if not exist logs mkdir logs
set LOG=logs\ai-learning.log

echo ---------- %DATE% %TIME% ---------->> "%LOG%"

rem 1) invest AI: read our market data, write "what kind of stock is this" signals
node scripts\invest-ai\read-market-data.mjs --save >> "%LOG%" 2>&1

rem 2) measure whether both AIs are actually learning
node scripts\check-ai-learning.mjs >> "%LOG%" 2>&1

rem 3) keep the log from growing without bound
powershell -NoProfile -Command "$p='logs\ai-learning.log'; if (Test-Path $p) { $l=Get-Content $p -Tail 2000; Set-Content $p $l -Encoding utf8 }"

endlocal
