@echo off
REM Daily weather article for Jungbu Maeil -- owner's instruction 2026-10-17:
REM   "write a weather article, [tomorrow's weather] at the front of the headline,
REM    keywords must include Daejeon weather and Cheongju weather,
REM    schedule it so I get the article every day at 10"
REM
REM Runs at 09:20 so the desk pass finishes before 10:00.
REM It does NOT send -- a human looks at it first (owner's standing rule).
REM
REM ASCII ONLY -- Korean arguments get mangled to CP949.
REM Remove with:  schtasks /delete /tn "SeoulMarkets-WeatherArticle" /f

cd /d "C:\Users\User\Documents\GitHub\dataeconomics"
node "scripts\auto-weather-article.mjs" >> "docs\고정업무-마커\날씨기사.log" 2>&1
exit /b %ERRORLEVEL%
