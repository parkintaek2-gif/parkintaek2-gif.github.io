@echo off
chcp 65001 >nul
REM Send the 23:00 report at 22:56 so it lands BEFORE the hour.
REM
REM WHY (2026-11-02): the owner said "the report time has passed" and then
REM "I told you not to be even one minute late". Three nights in a row the report
REM went out at 23:23-23:25 -- every time within 1-3 minutes of the session waking.
REM The wake-up for a daily job drifts up to 30 minutes, so the hour cannot be hit
REM by waking a session. The 16:00 report has never been late because a machine
REM sends it. This moves the 23:00 report to the same footing.
REM
REM The session still writes the draft (woken at 21:25). This only sends it.
REM It does nothing if the report already went out, so running it twice is safe.
REM
REM chcp 65001 above is REQUIRED: this file is UTF-8 and the paths below contain
REM Korean. Without it cmd reads them as CP949, cannot find the folder, SKIPS the
REM line and still returns 0. Index requests died silently for 9 days that way.
REM
REM CLAUDE_SEAT must be set -- send-mail.mjs otherwise falls back to a sender that
REM is not a real Workspace user and Google rejects the message while exiting 0.
REM
REM Remove this task with:
REM   schtasks /delete /tn "SeoulMarkets-Auto2300Report" /f

set "CLAUDE_SEAT=5"

cd /d "C:\Users\User\Documents\GitHub\dataeconomics"
node "scripts\auto-2300-report.mjs" --send >> ".auto-2300-report.log" 2>&1
exit /b %ERRORLEVEL%
