#!/usr/bin/env bash
# 공공데이터포털이 열릴 때까지 지켜본다.
#
# 왜 감싸는가 — watch-datago.mjs --watch 를 백그라운드로 띄우면 프로세스가
# 조용히 죽는 일이 있었다(백필에서도 같았다). 원인을 캐는 것보다 다시 붙이는 편이 싸다.
# 한 번 확인하고 끝나는 모드를 반복해서 부른다 — 죽을 프로세스가 아예 없다.
#
#   bash scripts/watch-loop.sh              10분 간격
#   GAP=1800 bash scripts/watch-loop.sh     30분 간격
set -u
cd "$(dirname "$0")/.."

GAP=${GAP:-600}
LOG=${LOG:-archive/datago-watch.log}
mkdir -p "$(dirname "$LOG")"

echo "[$(date '+%Y-%m-%d %H:%M KST')] 감시 시작 — ${GAP}초 간격" >>"$LOG"

while :; do
  OUT=$(node scripts/watch-datago.mjs 2>&1 | head -2)
  echo "[$(date '+%m-%d %H:%M KST')] $OUT" >>"$LOG"

  # 열리면 멈춘다. 계속 찔러 봐야 소용없고, 열린 뒤엔 사람이 가입해야 한다.
  if ! echo "$OUT" | grep -q "점검 중"; then
    echo "[$(date '+%Y-%m-%d %H:%M KST')] ✅ 열렸다. 감시 종료." >>"$LOG"
    break
  fi
  sleep "$GAP"
done
