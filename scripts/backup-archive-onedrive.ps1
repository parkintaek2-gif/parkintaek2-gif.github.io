# 아카이브 중 **R2 에 안 올라가는 것만** OneDrive 로 매일 복사한다.
#
# ── 왜 만들었나 (2026-08-06) ──────────────────────────────────────────────
# 서버 이전을 준비하다 R2 버킷을 전수(134,098건)로 세어 봤더니, 원격에 있는 것은
# 0.04GB 뿐이고 **4.67GB 가 이 PC 한 대에만** 있었다. store.mjs 는 양쪽에 쓰게 돼 있는데
# 시세 계열 수집기가 store 를 안 거치고 파일로 바로 쓴다. 오류가 안 나서 아무도 몰랐다.
#
# 제대로 된 수정은 수집기를 store.put 으로 옮기는 것이고 그건 6번 소관이다.
# 그때까지 **한 대뿐인 사본**으로 두지 않기 위한 안전망이다.
#
# ⚠ R2 에 이미 있는 갈래(research 66,255 · research-list 66,071 · kdi · riot · broker)는
#   **일부러 뺐다.** 13만 개짜리 잔파일을 OneDrive 에 밀어 넣으면 동기화가 종일 돈다.
#   빠진 것이 아니라 이미 원격에 있는 것이다.
#
# 지우지 않는다(/MIR 를 쓰지 않는다). 백업이 원본의 삭제를 따라가면 백업이 아니다.

$src = 'C:\Users\USER\Documents\GitHub\dataeconomics\archive'
$dst = Join-Path $env:USERPROFILE 'OneDrive\서버백업\archive'
$log = 'C:\Users\USER\Documents\GitHub\dataeconomics\archive\log\backup-onedrive.log'

# R2 에 없어서 이 PC 에만 있는 갈래
$갈래 = @(
  'raw\stocks','raw\derivatives','raw\products','raw\bonds','raw\indices','raw\commodities',
  'raw\nps','raw\netflix-top10','raw\funds','raw\dart','raw\dart-company','raw\dart-corpcode',
  'raw\dart-employment','raw\dart-executives','raw\dart-issuance','raw\neis','raw\kosis',
  'raw\alimi','raw\univ','raw\work24','raw\star-pageviews','raw\kasfo',
  # 2026-08-10 8번이 더함 — 로컬에만 있던 다섯. 백업 목록에서 통째로 빠져 있었다
  'raw\kedi','raw\kosis-expl','raw\procure','raw\traffic','raw\wikidata',
  'index','meta','manifest','report','100yearmap','outreach','probe'
)

$시작 = Get-Date
"[{0}] 시작" -f $시작.ToString('yyyy-MM-dd HH:mm:ss') | Add-Content -Path $log -Encoding utf8

foreach ($g in $갈래) {
  $s = Join-Path $src $g
  if (-not (Test-Path $s)) { continue }
  $d = Join-Path $dst $g
  # /E 하위폴더 포함 · /XO 원본이 더 새 것일 때만 · /R:1 재시도 1회 · /NFL,/NDL 파일목록 안 찍음
  $out = robocopy $s $d /E /XO /R:1 /W:1 /NFL /NDL /NJH /NP 2>&1 | Out-String
  $복사 = ([regex]::Match($out, 'Files\s*:\s*\d+\s+(\d+)')).Groups[1].Value
  if ($복사 -and $복사 -ne '0') { "  $g  새로 복사 $복사" | Add-Content -Path $log -Encoding utf8 }
}

$끝 = Get-Date
$크기 = (Get-ChildItem $dst -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum)
"[{0}] 끝 · {1:N0}초 · 백업 합계 {2:N2}GB / {3:N0}개" -f `
  $끝.ToString('yyyy-MM-dd HH:mm:ss'), ($끝-$시작).TotalSeconds, ($크기.Sum/1GB), $크기.Count |
  Add-Content -Path $log -Encoding utf8
