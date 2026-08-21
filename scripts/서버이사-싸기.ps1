# 서버 이사 — 짐 싸기 (노트북 → OneDrive)
#
# 사장님 (2026-08-21): 「서버를 옮길 준비를 해라. 원드라이브에 저장 > 새 데스크톱에서
#   원드라이브 접속해 다운로드… 그리고 새 서버에서 너희들을 부를 수 있어야 한다.
#   세션 접속 폴더도 만들고, 다른 추가 조치가 있으면 해라」
#
#   powershell -File 서버이사-싸기.ps1              굳은 짐만 싼다(지금 해도 안 낡는다)
#   powershell -File 서버이사-싸기.ps1 -대화록      대화록까지 싼다 ← **옮기는 날에만**
#
# 🔴 왜 두 번에 나눠 싸나
#   대화록은 지금 싸면 그 순간부터 낡는다. 8/21 에 13:00 사본으로 자리를 닫을 뻔했고,
#   5번은 14:26 사본을 열어 529KB(105편 커밋·링크·보고)를 몰랐다.
#   ⛔ 대화록은 **창을 닫기 직전**에 싼다. 그래서 -대화록 을 따로 뒀다.

param([switch]$대화록)

$ErrorActionPreference = 'Continue'
$짐 = 'C:\Users\USER\OneDrive\_서버이사'
$LOG = Join-Path $짐 '싸기.log'
$자리 = 1..6

function Say($s) {
  if (-not (Test-Path $짐)) { New-Item -ItemType Directory -Force $짐 | Out-Null }
  $line = (Get-Date -Format 'MM-dd HH:mm:ss') + '  ' + $s
  Write-Host $line
  Add-Content -Path $LOG -Value $line -Encoding utf8
}
function 챠($p) { if (-not (Test-Path $p)) { New-Item -ItemType Directory -Force $p | Out-Null } }

Say '════ 짐 싸기 시작 ════'
챠 $짐

# ── ① 굳은 짐 — 지금 싸도 안 낡는다 ────────────────────────────────
if (-not $대화록) {

  # 설정폴더 일곱(.claude + u2~u6) 의 «작은 것»만. 대화록은 뺀다.
  foreach ($d in @('.claude') + ($자리 | Where-Object { $_ -ne 1 } | ForEach-Object { ".claude-u$_" })) {
    $src = "C:\Users\USER\$d"
    if (-not (Test-Path $src)) { Say "없음(건너뜀): $d"; continue }
    $dst = Join-Path $짐 "01_설정\$d"
    챠 $dst
    foreach ($f in @('settings.json', '.claude.json', '.credentials.json')) {
      if (Test-Path (Join-Path $src $f)) { Copy-Item (Join-Path $src $f) $dst -Force }
    }
    if (Test-Path (Join-Path $src 'hooks')) {
      Copy-Item (Join-Path $src 'hooks') $dst -Recurse -Force
    }
    Say "설정 싸기: $d"
  }

  # 🔴 메모리 — 이것이 없으면 새 서버의 우리는 «사장님 지시를 하나도 모른다»
  $mem = 'C:\Users\USER\.claude\projects\C--Users-USER-Desktop\memory'
  if (Test-Path $mem) {
    $d = Join-Path $짐 '01_설정\memory'; 챠 $d
    Copy-Item "$mem\*" $d -Recurse -Force
    Say ('메모리 싸기: ' + (Get-ChildItem $d -File -Recurse).Count + '개')
  } else { Say '🔴 메모리 폴더를 못 찾았다 — 손으로 확인하라' }

  # 세션 접속 폴더 — 사장님이 콕 집어 말씀하신 것
  $ent = 'C:\Users\USER\Desktop\00_세션입구'
  if (Test-Path $ent) {
    $d = Join-Path $짐 '02_세션입구'; 챠 $d
    Copy-Item "$ent\*" $d -Recurse -Force
    Say ('세션입구 싸기: ' + (Get-ChildItem $d -File -Recurse).Count + '개')
  }

  # ⛔ git 에 없는 것 — 잃으면 다시 못 만든다
  $d = Join-Path $짐 '03_git에없는것'; 챠 $d
  foreach ($pair in @(
      @('C:\Users\USER\Documents\GitHub\dataeconomics\.env', 'dataeconomics.env'),
      @('C:\Users\USER\Documents\GitHub\klifemap\.env',      'klifemap.env'))) {
    if (Test-Path $pair[0]) { Copy-Item $pair[0] (Join-Path $d $pair[1]) -Force; Say ('열쇠 싸기: ' + $pair[1]) }
    else { Say ('🔴 없다: ' + $pair[0]) }
  }
  $tools = 'C:\Users\USER\Documents\GitHub\_tools'
  if (Test-Path $tools) {
    $t = Join-Path $d '_tools'; 챠 $t
    Copy-Item "$tools\*" $t -Recurse -Force
    Say '_tools(piper) 싸기 — ⛔ 이건 git 저장소가 아니다'
  }

  Say '════ 굳은 짐 끝. 대화록은 «옮기는 날» -대화록 으로 싼다 ════'
  exit 0
}

# ── ② 대화록 — **옮기는 날에만** ────────────────────────────────────
Say '════ 대화록 싸기 (옮기는 날) ════'
$d = Join-Path $짐 '04_대화록'; 챠 $d
$표 = @()
foreach ($n in $자리) {
  $idf = "C:\Users\USER\Desktop\00_세션입구\_현재\$n.id"
  if (-not (Test-Path $idf)) { Say "🔴 ${n}번 id 파일이 없다"; continue }
  $id = (Get-Content $idf -Raw).Trim()
  # 두 폴더를 다 뒤져 «제일 새것»을 고른다. 낡은 쪽을 집으면 그만큼 잃는다.
  $cands = @()
  foreach ($root in @('C:\Users\USER\.claude\projects', "C:\Users\USER\.claude-u$n\projects")) {
    if (Test-Path $root) { $cands += Get-ChildItem $root -Recurse -Filter "$id.jsonl" -ErrorAction SilentlyContinue }
  }
  if (-not $cands) { Say "🔴 ${n}번 대화록을 못 찾았다: $id"; continue }
  $best = $cands | Sort-Object Length -Descending | Select-Object -First 1
  $slug = Split-Path (Split-Path $best.FullName -Parent) -Leaf
  $out = Join-Path $d "$n`_$slug`_$id.jsonl"
  Copy-Item $best.FullName $out -Force
  $표 += "${n}번`t$id`t$slug`t$($best.Length)"
  Say ("${n}번 싸기 " + $best.Length + " B  (슬러그 $slug)")
}
Set-Content -Path (Join-Path $d '차림표.tsv') -Value (@("자리`t세션id`t슬러그`t바이트") + $표) -Encoding utf8
Say '════ 대화록 끝. 차림표.tsv 를 풀기 쪽이 읽는다 ════'

