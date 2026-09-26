@echo off
chcp 65001 >nul
title 3개 창 한 번에 열기
REM ============================================================
REM  리부팅 뒤 **이것 하나만 누르십시오.**
REM  각 창은 열리면서 자기 번호와 설정폴더를 알고 그 대화를 이어 엽니다.
REM  ⚠ 한 번에 열면 동시에 git 을 건드립니다. 3초씩 띄웁니다.
REM ============================================================
echo.
echo   3개 창을 엽니다. 창마다 번호가 자동으로 붙습니다.
echo.

start "" "%~dp01번_KLifeMap.cmd"
timeout /t 3 /nobreak >nul
start "" "%~dp02번_조율.cmd"
timeout /t 3 /nobreak >nul
start "" "%~dp05번_케이컬처와이어.cmd"

echo.
echo   다 열었습니다. 이 창은 닫아도 됩니다.
timeout /t 5 /nobreak >nul
