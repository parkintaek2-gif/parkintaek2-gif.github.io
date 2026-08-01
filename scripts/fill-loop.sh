#!/usr/bin/env bash
# 리포트 상세 백필을 **끝까지** 돌린다.
#
# 왜 감싸는가 — 한 번에 3만 건은 몇 시간짜리다. 그 사이 node 가 조용히 죽는 일이
# 실제로 있었다(2026-08-02, 162건에서 종료·마지막 요약도 못 찍음). 원인을 캐는 것보다
# 죽으면 다시 붙이는 편이 싸다. `--fill` 은 「상세 파일이 있으면 건너뛴다」가 곧
# 진행 상태라, 몇 번을 다시 돌려도 같은 것을 두 번 받지 않는다.
#
#   bash scripts/fill-loop.sh            끝날 때까지
#   CHUNK=500 bash scripts/fill-loop.sh  한 번에 500건씩
set -u
cd "$(dirname "$0")/.."

CHUNK=${CHUNK:-2000}
LOG=${LOG:-archive/fill-loop.log}
mkdir -p "$(dirname "$LOG")"

prev=-1
while :; do
  have=$(find archive/raw/research -name '*.json' 2>/dev/null | wc -l)
  echo "[$(date +%H:%M:%S)] 확보 $have 건 — 다음 $CHUNK 건" >>"$LOG"

  # 진척이 없으면 멈춘다. 다 받았거나, 계속 실패하는 것이거나 —
  # 어느 쪽이든 무한히 두드릴 이유가 없다.
  if [ "$have" -le "$prev" ]; then
    echo "[$(date +%H:%M:%S)] 진척 없음. 종료." >>"$LOG"
    break
  fi
  prev=$have

  node scripts/collect-research.mjs --fill --limit="$CHUNK" >>"$LOG" 2>&1
done

echo "[$(date +%H:%M:%S)] 최종 $(find archive/raw/research -name '*.json' | wc -l) 건" >>"$LOG"
