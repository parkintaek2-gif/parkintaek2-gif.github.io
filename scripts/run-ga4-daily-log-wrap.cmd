@echo off
rem Set UTF-8 first -- this file is saved as UTF-8 and the log path below contains
rem Korean. Without this, cmd reads the path as CP949, cannot find the folder, and
rem SKIPS the whole line while still returning exit code 0. Index requests silently
rem stopped for 9 days this way (2026-10-23 .. 2026-11-01). The same fix went into
rem run-jbnews-sports-collect.cmd on 2026-10-15 and never reached this file.
chcp 65001 >nul
REM Thin wrapper -- schtasks cannot take a redirection in /tr. 5번 2026-10-17
call "C:\Users\User\Documents\GitHub\dataeconomics\scripts\run-ga4-daily-log.cmd" >> "C:\Users\User\Documents\GitHub\dataeconomics\docs\고정업무-마커\ga4-날마다.log" 2>&1
exit /b %ERRORLEVEL%
