@echo off
rem SeoulMarkets - keep the brokerage-research archive current (target prices are the product).
rem
rem WHY a Windows task and not a session cron:
rem   This collector had NO scheduled task at all (checked 2026-09-26). It likely ran off a
rem   session cron that no longer exists. Session crons vanish with the session - this
rem   collector sat frozen at 2026-08-03 for about 8 weeks and nobody noticed, because
rem   the old source (finance.naver.com) 302-redirected to a new site and the scraper
rem   returned "0 found" with no error. See scripts/collect-research.mjs header for the
rem   2026-09-26 migration note (new source: stock.naver.com/api/stockSecurity/researches/v2/company).
rem
rem KEEP THIS FILE ASCII ONLY - comments AND arguments (see run-ai-learning.cmd for why).

setlocal
cd /d "%~dp0.."
if not exist logs mkdir logs
set LOG=logs\collect-research.log

echo ---------- %DATE% %TIME% ---------->> "%LOG%"

node scripts\collect-research.mjs --pages=20 >> "%LOG%" 2>&1

rem Get-Content without -Encoding guessed the wrong codepage here and mangled the
rem Korean log lines (2026-09-26, first real run - checked with `file`, bytes were
rem valid UTF-8 but content was garbled, meaning the read step mis-decoded it).
rem Force UTF8 on both the read and the write.
powershell -NoProfile -Command "$p='logs\collect-research.log'; if (Test-Path $p) { $l=Get-Content $p -Tail 2000 -Encoding UTF8; Set-Content $p $l -Encoding UTF8 }"

endlocal
