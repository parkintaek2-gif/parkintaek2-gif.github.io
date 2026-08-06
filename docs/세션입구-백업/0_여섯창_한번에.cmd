@echo off
chcp 65001 >nul
title 여섯 창 한 번에 열기
REM ────────────────────────────────────────────────────────────
REM  리부팅 뒤 **이것 하나만 누르십시오.**
REM
REM  1~6번 창을 차례로 엽니다. 각 창은 열리면서
REM    ① 자기 번호를 압니다 (CLAUDE_SEAT 를 심어 보냅니다)
REM    ② 역할 카드를 읽습니다 (00_세션입구\역할\N.md)
REM    ③ 저장소를 당겨 세션간 메모 꼬리를 읽습니다
REM  그래서 사장님이 창마다 「너는 N번이다」라고 말할 일이 없습니다.
REM
REM  ⚠ 한 번에 열면 여섯이 동시에 git 을 건드립니다. 3초씩 띄웁니다.
REM ────────────────────────────────────────────────────────────
echo.
echo   여섯 창을 엽니다. 창마다 번호가 자동으로 붙습니다.
echo.

start "" "%~dp01번_KLifeMap.cmd"
timeout /t 3 /nobreak >nul
start "" "%~dp02번_조율.cmd"
timeout /t 3 /nobreak >nul
start "" "%~dp03번_백년지도.cmd"
timeout /t 3 /nobreak >nul
start "" "%~dp04번_KLifeMap보조.cmd"
timeout /t 3 /nobreak >nul
start "" "%~dp05번_케이컬처와이어.cmd"
timeout /t 3 /nobreak >nul
start "" "%~dp06번_서울마켓.cmd"

echo.
echo   여섯 창을 다 열었습니다. 이 창은 닫아도 됩니다.
timeout /t 5 /nobreak >nul
