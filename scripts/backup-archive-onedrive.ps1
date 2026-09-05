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
# 지우지 않는다(/MIR 를 쓰지 않는다). 백업이 원본의 삭제를 따라가면 백업이 아니다.
#
# ── 🔴🔴 [2026-09-06 · 5번] **손으로 적는 «넣을 목록»이었다. 그래서 17갈래가 빠져 있었다** ──
#
# 백업 폴더를 원본과 하나씩 대 보니 이랬다 —
# ```
#   newsdesk-korean-press   로컬 5개 · 백업 0개   ⛔ 소급이 «안 되는» 항목이다
#   community-desk          로컬 3개 · 백업 0개   ⛔ 같다
#   krx                     로컬 23개 · 백업 0개
#   culture-portal · kapt · hira-top-diseases · datago-* · kpop-agencies · dart-breaking …
#                                                        모두 백업 0개
# ```
# 까닭은 하나다 — 이 자가 **「넣을 갈래」를 손으로 적어 두는 꼴**이었다. 8/10 에 8번이
# 「로컬에만 있던 다섯」을 손으로 더한 자국이 남아 있는데, **그 뒤에 생긴 갈래는 아무도 안 더했다.**
# 오류가 안 난다. 조용히 안 될 뿐이다. 그 사이 신문 제목 다섯 날치가 이 PC 한 대에만 있었다.
#
# ⭐ 그래서 **뒤집었다** — 이제 `archive\` 밑을 «전부» 백업하고, R2 에 이미 있는 무거운 것만
#   «뺄 목록»에 적는다. 새 갈래가 생기면 **아무도 손대지 않아도 저절로 들어온다.**
#   ⛔ 사람이 기억해서 지키는 구조를 만들지 않는다 — 이 저장소의 오래된 규칙이다.
# ⚠ 뺄 목록은 «지금 R2 에 있다고 확인된 것»만 적는다. 확신이 없으면 빼지 말고 넣는다.
#   백업이 한 벌 더 있는 것은 손해가 아니고, 없는 것은 되돌릴 수 없다.

$src = 'C:\Users\USER\Documents\GitHub\dataeconomics\archive'
$dst = Join-Path $env:USERPROFILE 'OneDrive\서버백업\archive'
$log = 'C:\Users\USER\Documents\GitHub\dataeconomics\archive\log\backup-onedrive.log'

# ⛔ **뺄 것** — R2 에 이미 있어서 두 벌을 둘 까닭이 없는 무거운 갈래.
#   13만 개짜리 잔파일을 OneDrive 에 밀어 넣으면 동기화가 종일 돈다.
$뺄갈래 = @('research', 'research-list', 'kdi', 'riot', 'broker')
$뺄윗것 = @('log')      # 백업 기록 자체는 백업하지 않는다

New-Item -ItemType Directory -Force -Path (Split-Path $log) | Out-Null

$시작 = Get-Date
"[{0}] 시작" -f $시작.ToString('yyyy-MM-dd HH:mm:ss') | Add-Content -Path $log -Encoding utf8

# archive\ 바로 밑의 폴더를 «있는 그대로» 훑는다. raw\ 는 한 겹 더 들어가 갈래별로 나눈다.
$할것 = @()
foreach ($윗 in (Get-ChildItem $src -Directory -ErrorAction SilentlyContinue)) {
  if ($뺄윗것 -contains $윗.Name) { continue }
  if ($윗.Name -eq 'raw') {
    foreach ($g in (Get-ChildItem $윗.FullName -Directory -ErrorAction SilentlyContinue)) {
      if ($뺄갈래 -contains $g.Name) { continue }
      $할것 += "raw\$($g.Name)"
    }
  } else {
    $할것 += $윗.Name
  }
}

"  훑어서 찾은 갈래 {0}개 (뺀 것 {1}개)" -f $할것.Count, ($뺄갈래.Count + $뺄윗것.Count) |
  Add-Content -Path $log -Encoding utf8

$새로복사한갈래 = 0
foreach ($g in $할것) {
  $s = Join-Path $src $g
  if (-not (Test-Path $s)) { continue }
  $d = Join-Path $dst $g
  # /E 하위폴더 포함 · /XO 원본이 더 새 것일 때만 · /R:1 재시도 1회 · /NFL,/NDL 파일목록 안 찍음
  $out = robocopy $s $d /E /XO /R:1 /W:1 /NFL /NDL /NJH /NP 2>&1 | Out-String
  $복사 = ([regex]::Match($out, 'Files\s*:\s*\d+\s+(\d+)')).Groups[1].Value
  if ($복사 -and $복사 -ne '0') {
    "  $g  새로 복사 $복사" | Add-Content -Path $log -Encoding utf8
    $새로복사한갈래++
  }
}

# 🔴 **다 돌고 나서 「소급이 안 되는」 갈래가 정말 들어갔는지 «눈으로» 센다.**
#   「명령을 돌렸다」를 「받았다」로 읽지 않는다 — 이 저장소가 여러 번 데인 자리다.
$지켜볼것 = @('raw\newsdesk-korean-press', 'raw\community-desk', 'raw\krx')
foreach ($g in $지켜볼것) {
  $s = Join-Path $src $g
  if (-not (Test-Path $s)) { continue }
  $원 = (Get-ChildItem $s -Recurse -File -ErrorAction SilentlyContinue).Count
  $백 = (Get-ChildItem (Join-Path $dst $g) -Recurse -File -ErrorAction SilentlyContinue).Count
  $표 = if ($백 -ge $원) { 'OK' } else { '*** 모자란다 ***' }
  "  [확인] $g  원본 $원 · 백업 $백  $표" | Add-Content -Path $log -Encoding utf8
}

$끝 = Get-Date
$크기 = (Get-ChildItem $dst -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum)
"[{0}] 끝 · {1:N0}초 · 갈래 {2}개 중 {3}개에 새 파일 · 백업 합계 {4:N2}GB / {5:N0}개" -f `
  $끝.ToString('yyyy-MM-dd HH:mm:ss'), ($끝-$시작).TotalSeconds, $할것.Count, $새로복사한갈래,
  ($크기.Sum/1GB), $크기.Count | Add-Content -Path $log -Encoding utf8
