@echo off
chcp 65001 >nul
title 2번 SeoulMarkets 개발 분담 · 조율
REM ============================================================
REM  2번 SeoulMarkets 개발 분담 · 조율
REM
REM  더블클릭하면 **새 세션이 아니라 그 대화를 다시 연다** (--resume).
REM  PC 재시작 / 정전 / 창 닫힘 뒤 여기로 돌아온다.
REM
REM  이 파일은 손으로 고치지 않는다. 자리가 바뀌면 이렇게 다시 짓는다 —
REM    node scripts\build-session-entry.mjs --짓는다
REM  자리 목록의 정본은 scripts\lib\seats.mjs 하나다.
REM
REM  시험하려면 인자를 하나 준다. 창을 열지 않고 무엇을 열지만 찍는다 —
REM    2번_*.cmd 진단
REM ============================================================

REM -- 자리 번호를 심는다 --------------------------------------
REM  창이 열리면 SessionStart 훅이 이 값을 읽어 역할 카드를 띄운다.
REM  그래서 사장님이 「너는 N번이다」라고 말해 줄 필요가 없다.
set CLAUDE_SEAT=2

REM -- 🔴 설정폴더를 심는다 ------------------------------------
REM  이 줄이 없으면 기본 .claude 가 열려 **그 자리의 대화가 없는 빈 창**이 뜬다.
REM  2026-08 에 그 병으로 나흘치 대화를 잃었다. 지우지 않는다.
set CLAUDE_CONFIG_DIR=C:\Users\USER\.claude-u2

cd /d C:\Users\USER\Desktop

REM -- 창이 스스로 적어 둔 ID 가 정본이다 ----------------------
REM  창이 열릴 때마다 훅이 _현재\N.id 에 자기 ID 한 줄을 적는다.
REM  ⛔ 여기에 ID 를 박아 두지 않는다. 박아 두면 한 달 뒤 죽은 ID 로 열려 한다.
set LIVEID=
if exist "%~dp0_현재\%CLAUDE_SEAT%.id" set /p LIVEID=<"%~dp0_현재\%CLAUDE_SEAT%.id"

REM -- 진단 모드: 열지 않고 무엇을 열지만 찍는다 ----------------
if /i "%~1"=="진단" goto :diag
if /i "%~1"=="--diag" goto :diag

if defined LIVEID (
  claude --resume %LIVEID%
  if not errorlevel 1 goto :eof
)

REM -- 못 열렸다. 실물 세션을 찾아 한 번 더 --------------------
REM  ⚠ 여기서 이 .cmd 를 고치지 않는다. 실행 중인 배치 파일을 고치면
REM     cmd.exe 가 바이트 위치로 다음 줄을 읽어 엉뚱한 줄이 돈다.
echo.
echo  [.] 이어서 열지 못했습니다. 실물 세션을 찾는 중입니다...
set SID=
for /f "usebackq delims=" %%i in (`node "%~dp0_세션ID-찾기.mjs" --id %CLAUDE_SEAT%`) do set SID=%%i
if not defined SID goto :fresh
echo  [+] 찾았습니다. 다시 엽니다: %SID%
claude --resume %SID%
if not errorlevel 1 goto :eof

:fresh
echo.
echo  [!] 2번 세션이 없어졌습니다. 새 대화를 엽니다.
echo      붙여 넣을 것은 없습니다. 창이 열리면 스스로 2번인 것을 압니다.
echo.
REM  ⛔ pause 를 두지 않는다. 리부팅 뒤 창마다 키를 기다리면 그게 사장님 일이 된다
claude
goto :eof

:diag
echo.
echo  [진단] 2번 SeoulMarkets 개발 분담 · 조율
echo   CLAUDE_SEAT       = %CLAUDE_SEAT%
echo   CLAUDE_CONFIG_DIR = %CLAUDE_CONFIG_DIR%
if defined LIVEID (echo   이어서 열 ID       = %LIVEID%) else (echo   이어서 열 ID       = 없음 - 실물을 찾는다)
if exist "%CLAUDE_CONFIG_DIR%\projects" (echo   설정폴더           = 있다) else (echo   설정폴더           = 🔴 없다)
echo.
goto :eof
