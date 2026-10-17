@echo off
REM Thin wrapper -- schtasks cannot take a redirection in /tr. 5번 2026-10-17
call "C:\Users\User\Documents\GitHub\dataeconomics\scripts\run-ga4-daily-log.cmd" >> "C:\Users\User\Documents\GitHub\dataeconomics\docs\고정업무-마커\ga4-날마다.log" 2>&1
exit /b %ERRORLEVEL%
