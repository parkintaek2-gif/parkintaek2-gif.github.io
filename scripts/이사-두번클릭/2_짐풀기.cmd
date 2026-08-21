@echo off
title 서버이사 - 짐 풀기
echo.
echo  ==== 짐을 풉니다. 아무것도 누르지 마시고 기다리십시오 ====
echo.
echo  원드라이브에 구름 표시가 남아 있어도 됩니다 - 읽는 동안 알아서 내려받습니다.
echo.
rem  이 폴더의 ps1 을 ≪이름을 적지 않고≫ 찾아 부른다.
rem  까닭: 배치 안에 한글 파일명을 적으면 콘솔 코드페이지가 다를 때 길을 못 찾는다.
rem       이 폴더에 ps1 은 하나뿐이라 골라잡을 필요가 없다.
set "PS1="
for %%f in ("%~dp0*.ps1") do set "PS1=%%~ff"
if not defined PS1 goto NOPS1
powershell -NoProfile -ExecutionPolicy Bypass -File "%PS1%"
goto END

:NOPS1
echo  [X] 이 폴더에서 풀기 자(.ps1)를 못 찾았습니다.
echo      원드라이브 동기화가 끝났는지 보고, 2번에게 알려 주십시오.

:END
echo.
echo  ==== 끝났습니다 ====
echo  빨간 표시가 있으면 그 줄을 2번에게 보여 주십시오.
echo  없으면 바탕화면 00_세션입구 에서 1번~6번 을 두 번 클릭하십시오.
echo.
pause
