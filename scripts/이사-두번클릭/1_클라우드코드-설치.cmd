@echo off
chcp 65001 >nul
title Claude Code 설치
echo.
echo  ==== Claude Code 를 설치합니다 ====
echo.
echo  1) winget 으로 설치를 시도합니다
echo.
winget install --id Anthropic.ClaudeCode --accept-source-agreements --accept-package-agreements
if errorlevel 1 goto NPM
goto DONE

:NPM
echo.
echo  winget 이 안 됐습니다. npm 으로 다시 시도합니다.
echo.
call npm i -g @anthropic-ai/claude-code
if errorlevel 1 goto FAIL
powershell -ExecutionPolicy Bypass -Command "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force"

:DONE
echo.
echo  ==== 설치가 끝났습니다. 확인합니다 ====
set "PATH=%PATH%;%USERPROFILE%\.local\bin"
call claude --version
echo.
echo  위에 번호(2.1.xxx)가 보이면 성공입니다.
echo  이 창을 닫고 2번에게 「설치 끝」이라고 알려 주십시오.
goto END

:FAIL
echo.
echo  [X] 둘 다 안 됐습니다. 이 창의 글자를 그대로 2번에게 보여 주십시오.

:END
echo.
pause
