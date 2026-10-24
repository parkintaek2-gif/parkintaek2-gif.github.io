@echo off
chcp 65001 >nul
REM 일요일(2026-10-25) 저녁, 야구 PO 1차전 기사가 실제로 나갔는지 보고 안 갔으면 외친다.
REM 「열어 뒀다」를 「나갔다」로 읽지 않는다.
cd /d C:\Users\User\Documents\GitHub\dataeconomics
echo ===== %DATE% %TIME% ===== >> "docs\고정업무-마커\야구PO-나갔나.log"
node scripts\야구PO-나갔나.mjs >> "docs\고정업무-마커\야구PO-나갔나.log" 2>&1
