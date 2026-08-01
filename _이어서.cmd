@echo off
rem SeoulMarkets 세션을 연다.
rem 이어받을 대화가 있으면 잇고, 없으면 새로 시작한다.
rem   (--continue 는 이어갈 대화가 없으면 그냥 끝나 버린다 — 실제로 그래서 창만 뜨고 닫혔다)
title SeoulMarkets
cd "%~dp0"
claude --continue || claude
