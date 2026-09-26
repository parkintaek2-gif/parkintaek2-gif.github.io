@echo off
REM Send the 16:00 report automatically if unit 5 has not sent it.
REM
REM WHY (2026-09-26): the owner asked "why don't you report at 4?" -- unit 2 had
REM filed and unit 5 had not. A nag script existed and fired twice that day, but it
REM only wrote to a repo memo, so nobody saw it. Alerting harder does not work.
REM The script sends the report itself instead.
REM
REM It does nothing when the report has already gone out, so running it twice is safe.
REM ASCII ONLY -- Korean arguments get mangled to CP949 and the script then exits 0
REM having done nothing. Use the English alias --send.
REM
REM Remove this task with:
REM   schtasks /delete /tn "SeoulMarkets-Auto1600Report" /f

cd /d "C:\Users\User\Documents\GitHub\dataeconomics"
node "scripts\auto-1600-report.mjs" --send >> ".auto-1600-report.log" 2>&1
exit /b %ERRORLEVEL%
