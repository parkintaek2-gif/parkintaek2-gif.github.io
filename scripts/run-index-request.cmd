@echo off
REM Daily "ask Google to come back" run -- owner's instruction 2026-10-17:
REM   "are you spending 2/3 of your work on what I told you to? do it" (visitor growth)
REM
REM Measured that day: 15,903 pages in our sitemaps, 2,074 ever shown by Google in 28 days (13%).
REM Of a 30-page sample, 16 had "never been crawled". The bottleneck is discovery, not volume.
REM A closed hub locks everything under it -- /school alone has 2,525 school pages below it.
REM
REM Two steps, in this order:
REM   1. demand-pages.mjs  -- which company pages already get impressions but are not indexed.
REM                           It checks every URL is really 200 before writing them down.
REM   2. auto-index-request.mjs -- asks Google which hubs are closed, then requests indexing:
REM                           hubs first (one hub unlocks thousands), demand pages after,
REM                           biggest-first, until the daily quota runs out.
REM
REM Runs at 11:10, after the morning article work. The quota is small so this takes many days.
REM It needs the shared Chrome on port 9222 (Search Console has no API for requesting indexing).
REM It never closes the browser -- it disconnects.
REM
REM ASCII ONLY -- Korean arguments get mangled to CP949.
REM Remove with:  schtasks /delete /tn "SeoulMarkets-IndexRequest" /f

cd /d "C:\Users\User\Documents\GitHub\dataeconomics"
node "scripts\demand-pages.mjs" >> "docs\고정업무-마커\색인요청.log" 2>&1
node "scripts\auto-index-request.mjs" >> "docs\고정업무-마커\색인요청.log" 2>&1
exit /b %ERRORLEVEL%
