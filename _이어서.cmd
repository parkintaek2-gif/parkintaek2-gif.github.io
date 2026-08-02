@echo off
rem ─────────────────────────────────────────────────────────────────────────────
rem SeoulMarkets 세션을 연다.
rem   · 이어받을 대화가 있으면 잇고, 없으면 **첫 지시와 함께** 새로 시작한다.
rem     (--continue 는 이어갈 대화가 없으면 그냥 끝나 버린다 — 실제로 그래서 창만 뜨고 닫혔다)
rem
rem [2026-08-02] 권한 설정이 전역으로 바뀌었다(~/.claude/settings.json)
rem   bypassPermissions + deny 9건 + ctype -t 강제 훅.
rem   ⚠ 설정은 **세션이 시작할 때** 읽는다. 이미 떠 있던 창에는 안 붙으므로
rem     바꾼 뒤에는 이 입구로 **새로 열어야** 적용된다.
rem   ⚠ ctype 은 -t 없이는 아예 안 나간다. 이 프로젝트 스테이지는
rem     @parkintaek2/seoulmarkets:main 이다.
rem ─────────────────────────────────────────────────────────────────────────────
title SeoulMarkets
cd "%~dp0"
claude --continue || claude "CLAUDE.md 를 먼저 읽고, docs/세션간-메모.md 끝부분에서 KLifeMap 세션이 남긴 인계를 확인해라. 그 다음 남은 우선순위대로 이어서 작업해라."
