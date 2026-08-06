@echo off
chcp 65001 >nul
title 2번 조율 (전사 총괄)
REM ────────────────────────────────────────────────────────────
REM  2번 조율 (전사 총괄)
REM  3·5·6번을 지휘한다. 배포·공유파일·검색색인·보고가 이쪽 몫이다.
REM
REM  더블클릭하면 **새 세션이 아니라 그 대화를 다시 연다** (--resume).
REM  PC 재시작·정전·창 닫힘 뒤 여기로 복귀한다.
REM
REM  ⚠ 세션 ID 가 바뀌어도 **손으로 고칠 필요가 없다.**
REM     못 열리면 아래가 실물을 찾아 다시 연다.
REM     파일에 굳히려면 0_ID새로고침.cmd 를 누른다.
REM ────────────────────────────────────────────────────────────
REM  ── 자리 번호를 심는다 ─────────────────────────────────────
REM   창이 열리면 SessionStart 훅이 이 값을 읽어 역할 카드를 띄운다.
REM   그래서 사장님이 「너는 N번이다」라고 말해 줄 필요가 없다.
REM   ⚠ 이 줄을 지우면 그 창은 자기가 누구인지 모른다.
set CLAUDE_SEAT=2
cd /d C:\Users\USER\Desktop
REM  ── 창이 스스로 적어 둔 ID 를 먼저 쓴다 ──────────────────
REM   창이 열릴 때마다 훅이 _현재\N.id 에 자기 ID 한 줄을 적는다.
REM   그 파일이 있으면 그것이 사실이다. 아래에 박힌 ID 는 어제 것일 수 있다.
set LIVEID=
if exist "%~dp0_현재\%CLAUDE_SEAT%.id" set /p LIVEID=<"%~dp0_현재\%CLAUDE_SEAT%.id"
if defined LIVEID (
  claude --resume %LIVEID%
  if not errorlevel 1 goto :eof
)
claude --resume 8a76e77a-36c9-48da-a868-b795ab728a0c
if not errorlevel 1 goto :eof

REM ── 못 열렸다. 실물 세션을 찾아 한 번 더 해 본다 ─────────────
REM  ⚠ 여기서 이 .cmd 를 고치지 않는다. 실행 중인 배치 파일을 고치면
REM     cmd.exe 가 바이트 위치로 다음 줄을 읽어 엉뚱한 줄이 돈다.
REM     파일에 굳히는 것은 0_ID새로고침.cmd 가 한다.
echo.
echo  [.] 이어서 열지 못했습니다. 실물 세션을 찾는 중입니다...
set SID=
for /f "usebackq delims=" %%i in (`node "%~dp0_세션ID-찾기.mjs" --id 2`) do set SID=%%i
if not defined SID goto :fresh
if /i "%SID%"=="8a76e77a-36c9-48da-a868-b795ab728a0c" goto :eof
echo  [+] 찾았습니다. 다시 엽니다: %SID%
claude --resume %SID%
if not errorlevel 1 goto :eof

:fresh
echo.
echo  [!] 2번 세션이 없어졌습니다. 새 대화를 엽니다.
echo      붙여 넣을 것은 없습니다. 창이 열리면 스스로 2번인 것을 압니다.
echo.
REM  ⛔ pause 를 두지 않는다. 리부팅 뒤 여섯 창이 각각 키를 기다리면 그게 사장님 일이 된다
claude
