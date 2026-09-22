@echo off
rem ── 중부매일 스포츠 자동기사를 «거둬 메일로 보낸다» ──────────────────────────
rem
rem  🔴 왜 이 파일이 있나 (2026-09-22 · 5번)
rem    예약작업 아홉은 기사를 «대화에» 쓸 뿐이다. 그것을 읽어 사장님께 메일로 보내는 일은
rem    scripts/collect-jbnews-sports-articles.mjs 가 하는데, **그것을 부르는 것이 없었다.**
rem    수집기 머리글은 「늘 켜져 있는 이 서버가 읽어 보낸다」고 적어 두었지만 서버에는
rem    부르는 자리가 없다. 사장님이 못박으신 자리다 — 「내일 아침 9시부터 정상적으로
rem    받는게 중요」. ⇒ 윈도 작업 스케줄러에 걸어 세션이 죽어도 돌게 한다.
rem
rem  ⚠ 크롬이 9222 로 떠 있어야 한다 — 수집기가 로그인된 창에 붙어 대화를 읽는다.
rem  ⚠ 두 번 돌아도 안전하다 — 이미 보낸 회차는 «보낸 자국»을 보고 건너뛴다.
rem
rem  🔴🔴 [2026-09-22 17:2x] **창을 16:23 에서 끊었다** — 사장님 지시
rem      「기사 보내지마」 · 「5시가 마지막」
rem    그 전에는 /du 0008:10 이라 09:23~17:23 여덟 번이 돌았고, 마지막 17:23 이
rem    17시 회차를 보내려던 «도중»에 멈추라는 말씀을 받았다.
rem    ⇒ /du 0007:10 — 09:23 부터 16:23 까지 여덟 번(09~16시)에서 끝난다.
rem    ⭐ 자는 두 겹이다. 여기 창을 누가 다시 늘려도 수집기가 17시부터는 안 보낸다
rem      (collect-jbnews-sports-articles.mjs 의 보낼때인가()). 한 겹만 믿지 않는다.
rem
rem  거는 법 (관리자 아님)
rem    schtasks /create /tn "SeoulMarkets-중부매일스포츠-거두기" ^
rem      /tr "\"C:\Users\User\Documents\GitHub\dataeconomics\scripts\run-jbnews-sports-collect.cmd\"" ^
rem      /sc daily /st 09:23 /ri 60 /du 0007:10 /f
rem  푸는 법
rem    schtasks /delete /tn "SeoulMarkets-중부매일스포츠-거두기" /f
rem  손으로 한 번
rem    node scripts/collect-jbnews-sports-articles.mjs --시험
rem ──────────────────────────────────────────────────────────────────────────
cd /d "C:\Users\User\Documents\GitHub\dataeconomics"
node scripts\collect-jbnews-sports-articles.mjs >> "docs\고정업무-마커\중부매일-스포츠-거둠.log" 2>&1
