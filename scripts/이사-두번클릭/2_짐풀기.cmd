@echo off
chcp 65001 >nul
title 서버이사 - 짐 풀기
echo.
echo  ==== 짐을 풉니다. 아무것도 누르지 마시고 기다리십시오 ====
echo.
echo  원드라이브에 구름 표시가 남아 있어도 됩니다 - 읽는 동안 알아서 내려받습니다.
echo  다만 처음이면 몇 분 걸립니다.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0서버이사-풀기.ps1"
echo.
echo  ==== 끝났습니다 ====
echo  위에 빨간 표시가 있으면 그 줄을 2번에게 보여 주십시오.
echo  없으면 바탕화면 00_세션입구 에서 1번~6번 을 두 번 클릭하십시오.
echo.
pause
