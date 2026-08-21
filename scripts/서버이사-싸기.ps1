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

  # 🔴🔴 메모리 — 이것이 없으면 새 서버의 우리는 «사장님 지시를 하나도 모른다»
  #
  # [2026-08-21 20:0x] 사장님 「참 1번도 서버이전 확실히 준비해라」 — 그 한마디가 이걸 잡았다.
  # 나는 C--Users-USER-Desktop\memory (61개) 하나만 싸고 있었다. 그런데 재 보니 —
  #   C--Users-USER-Documents-GitHub-klifemap\memory      52개  ← 🔴 **1번 것**
  #   C--Users-USER-Documents-GitHub-dataeconomics\memory 28개
  #   C--Users-USER-Desktop-00-----\memory                20개
  #   C--Users-USER-Desktop-----\memory                    8개
  #   C--Users-USER\memory                                 3개
  # ⛔ **메모리는 슬러그마다 따로 있다.** 하나만 싸면 나머지 111개를 통째로 잃는다.
  #    오류가 안 난다 — 새 서버의 그 자리가 「지시를 모르는 채로」 조용히 일한다.
  # ⭐ 그래서 «있는 대로 다» 싼다. 슬러그 이름을 그대로 살려 둔다(풀 때 제자리로 돌려야 한다).
  $memRoots = @('C:\Users\USER\.claude\projects') +
              ($자리 | Where-Object { $_ -ne 1 } | ForEach-Object { "C:\Users\USER\.claude-u$_\projects" })
  $memN = 0; $memDirs = 0
  foreach ($root in $memRoots) {
    if (-not (Test-Path $root)) { continue }
    Get-ChildItem $root -Directory -ErrorAction SilentlyContinue | ForEach-Object {
      $m = Join-Path $_.FullName 'memory'
      if (-not (Test-Path $m)) { return }
      $설정이름 = Split-Path (Split-Path $root -Parent) -Leaf      # .claude 또는 .claude-uN
      $d = Join-Path $짐 "01_설정\_memory\$설정이름\$($_.Name)"; 챠 $d
      Copy-Item "$m\*" $d -Recurse -Force
      $c = (Get-ChildItem $d -File -Recurse).Count
      $memN += $c; $memDirs++
      Say ("메모리 싸기: $설정이름 \ $($_.Name)  ${c}개")
    }
  }
  if ($memDirs -eq 0) { Say '🔴 메모리 폴더를 하나도 못 찾았다 — 손으로 확인하라' }
  else { Say "메모리 합계: 폴더 ${memDirs}곳 · 파일 ${memN}개" }

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
  # 🔴🔴 wikitip — **GitHub 에 없다.** [2026-08-21 20:2x 실측] remote 가 아예 비어 있다.
  #    사장님 「3, 코드는 어떻게 해야 하지?」 물으셔서 clone 할 저장소를 세다가 잡았다.
  #    차례표에 「git clone 넷」이라 적혀 있었는데 실제로 remote 가 있는 것은 **둘**뿐이다
  #    (dataeconomics=seoulmarkets.git · klifemap). wikitip 은 clone 할 데가 없다.
  # ⛔ 이걸 안 싸면 커밋 이력까지 통째로 사라진다. 되살릴 데가 없다.
  #    node_modules·.next 는 뺀다(npm ci 로 다시 만든다). .git 은 **반드시** 넣는다.
  $wiki = 'C:\Users\USER\Documents\GitHub\wikitip'
  if (Test-Path $wiki) {
    $t = Join-Path $d 'wikitip'; 챠 $t
    robocopy $wiki $t /E /XD node_modules .next /NFL /NDL /NJH /NJS /NP | Out-Null
    $c = (Get-ChildItem $t -File -Recurse -Force -EA SilentlyContinue)
    Say ("wikitip 싸기 {0}개 {1:N1} MB — ⛔ 이건 GitHub 에 없다. 잃으면 끝이다" -f $c.Count, (($c|Measure-Object Length -Sum).Sum/1MB))
  } else { Say '🔴 wikitip 이 없다' }

  $tools = 'C:\Users\USER\Documents\GitHub\_tools'
  if (Test-Path $tools) {
    $t = Join-Path $d '_tools'; 챠 $t
    Copy-Item "$tools\*" $t -Recurse -Force
    Say '_tools(piper) 싸기 — ⛔ 이건 git 저장소가 아니다'
  }

  # 터미널 글자크기 — 사장님 (2026-08-21) 「글자를 크게 내가 볼 수 있게 해줘」 → 20 으로 맞췄다.
  # ⛔ 이걸 안 싸면 새 PC 에서 기본 12 로 돌아간다. 사장님이 화면을 못 읽으신다.
  $wt = 'C:\Users\USER\AppData\Local\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState\settings.json'
  if (Test-Path $wt) {
    $d = Join-Path $짐 '05_터미널'; 챠 $d
    Copy-Item $wt (Join-Path $d 'settings.json') -Force
    Say '터미널 설정 싸기 (글자크기 20)'
  } else { Say '🔴 터미널 settings.json 이 없다' }

  # sessions — 자리마다 든 작은 열쇠(83B). 값이 싸서 그냥 같이 싼다.
  # ⛔ file-history 는 뺀다: .claude 것만 376MB 인데 되살릴 수 있는 것(편집 되돌리기)이다.
  foreach ($d0 in @('.claude') + ($자리 | Where-Object { $_ -ne 1 } | ForEach-Object { ".claude-u$_" })) {
    $src = "C:\Users\USER\$d0\sessions"
    if (-not (Test-Path $src)) { continue }
    $dst = Join-Path $짐 "01_설정\$d0\sessions"; 챠 $dst
    Copy-Item "$src\*" $dst -Recurse -Force -ErrorAction SilentlyContinue
  }
  Say 'sessions 열쇠 싸기'

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


