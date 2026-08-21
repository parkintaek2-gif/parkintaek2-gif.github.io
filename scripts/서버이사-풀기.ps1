# 서버 이사 — 짐 풀기 (새 데스크톱에서 돌린다)
#
#   powershell -ExecutionPolicy Bypass -File 서버이사-풀기.ps1
#
# 🔴 먼저 확인 — 이 PC 의 계정 이름이 «USER» 여야 한다.
#   대화록 폴더 이름(C--Users-USER-Desktop)이 «길 그 자체»다. 이름이 다르면
#   여섯 자리가 전부 「대화가 없다」며 새로 시작한다.
#   이름이 다르면 먼저:  mklink /J "C:\Users\USER" "C:\Users\<진짜이름>"
#
# 이 자가 하는 것
#   ① 설정폴더 일곱을 만든다(.claude + u2~u6) — settings·hooks·메모리
#   ② 세션 접속 폴더(00_세션입구)를 바탕화면에 놓는다   ← 사장님이 콕 집어 말씀하신 것
#   ③ 대화록을 «제 자리·제 슬러그»로 되돌린다(차림표.tsv 를 읽는다)
#   ④ .env 둘과 _tools 를 제자리에 놓는다
#   ⑤ 🔴 지킴이를 **윈도 예약작업**으로 등록한다 ← 추가 조치. 아래 왜 를 읽으라

$ErrorActionPreference = 'Continue'
$짐 = 'C:\Users\USER\OneDrive\_서버이사'
$LOG = 'C:\Users\USER\Desktop\서버이사-풀기.log'
function Say($s) { $l=(Get-Date -Format 'MM-dd HH:mm:ss')+'  '+$s; Write-Host $l; Add-Content $LOG $l -Encoding utf8 }
function 챠($p) { if (-not (Test-Path $p)) { New-Item -ItemType Directory -Force $p | Out-Null } }

Say '════ 짐 풀기 시작 ════'

# ── 0. 계정 이름을 먼저 잰다 ────────────────────────────────────────
# 🔴 [2026-08-21 사장님] 「대문자 User 로 돼있어」 — USER 가 아니라 **User** 다.
#    윈도는 길에서 대소문자를 안 가리지만, 대화록 폴더 «이름»은 글자 그대로 만들어진다.
#       C--Users-USER-Desktop   (노트북)   vs   C--Users-User-Desktop   (새 PC)
#    → 다른 폴더로 보고 「대화가 없다」며 새로 시작한다.
# ⭐ 그래서 둘을 다 한다 —
#    ① 접합점(junction)을 만들어 «C:\Users\USER» 라는 길도 살려 둔다
#       (실행파일·지킴이·배포락에 그 길이 스물 몇 군데 박혀 있다. 하나만 빠뜨려도 조용히 깨진다)
#    ② 대화록은 **슬러그 셋**에 다 깔아 둔다(USER·User·원래 것). 어느 쪽으로 열려도 찾는다
$진짜 = $env:USERPROFILE                       # 예: C:\Users\User
$진짜이름 = Split-Path $진짜 -Leaf
Say "이 PC 의 프로필: $진짜  (계정 이름 «$진짜이름»)"

# ⭐ 길은 고칠 것이 없다. 윈도는 길에서 대소문자를 안 가리므로
#    코드에 박힌 C:\Users\USER\... 가 C:\Users\User 에서 그대로 작동한다(접합점도 필요 없다).
if (-not (Test-Path 'C:\Users\USER\Desktop')) {
  Say '🔴 C:\Users\USER\Desktop 을 못 찾았다. 프로필 이름이 «User» 계열이 아닌 것으로 보인다.'
  Say ('   이 PC 의 프로필: ' + $진짜)
  Say '   ⛔ 여기서 멈춘다. 계정 이름을 User 로 만들거나, 아래 한 줄로 길을 맞춰라 —'
  Say ('   mklink /J "C:\Users\USER" "' + $진짜 + '"')
  exit 1
}
Say '✅ 길 확인 — C:\Users\USER\... 로 박힌 코드가 이 PC 에서 그대로 통한다'

# 🔴 갈릴 수 있는 것은 «대화록 폴더 이름» 하나다. 그것은 cwd 글자를 그대로 쓴다 —
#    C--Users-USER-Desktop  vs  C--Users-User-Desktop  → 다른 폴더로 본다
#    ⭐ 그래서 셋에 다 깔아 둔다. 어느 쪽으로 열려도 대화를 찾는다. 파일 하나 더 쓰는 값이 싸다.
#  ⛔ 여기서 «+» 를 쓰면 PowerShell 이 배열 이어붙임으로 읽어 세 토막으로 갈린다.
#     8/21 실측 —  C--Users- , USER , -Desktop   ← 시험을 돌려서 잡았다. 글자 끼움으로 쓴다.
$슬러그들 = @('C--Users-USER-Desktop', "C--Users-$진짜이름-Desktop") | Select-Object -Unique
Say ('대화록을 깔 폴더 이름: ' + ($슬러그들 -join ' , '))
if (-not (Test-Path $짐)) { Say "🔴 짐이 없다: $짐  (원드라이브 동기화가 끝났나?)"; exit 1 }

# ── ① 설정폴더 ──────────────────────────────────────────────────────
Get-ChildItem (Join-Path $짐 '01_설정') -Directory -ErrorAction SilentlyContinue | ForEach-Object {
  # ⛔ 짐 안의 이름은 «_memory» 다(밑줄 붙은 것). 'memory' 라고 적으면 이 걸름이 안 걸려
  #    메모리 300개가 C:\Users\USER\_memory 라는 엉뚱한 자리에 한 번 더 깔린다.
  if ($_.Name -eq '_memory') { return }
  $dst = "C:\Users\USER\$($_.Name)"; 챠 $dst
  Copy-Item "$($_.FullName)\*" $dst -Recurse -Force
  Say "설정 풀기: $($_.Name)"
}
# 🔴🔴 메모리 — 슬러그마다 따로 있다. 여섯 곳 172개였다(8/21 실측).
#    ⛔ 한 곳만 풀면 나머지가 「지시를 모르는 채로」 조용히 일한다. 있는 대로 다 되돌린다.
#    ⭐ 그리고 슬러그 이름에 든 «USER» 를 이 PC 이름으로 바꾼 자리에도 같이 깐다.
#       1번 것이 C--Users-USER-Documents-GitHub-klifemap 에 있어 이 갈아끼움이 꼭 필요하다.
$memRoot = Join-Path $짐 '01_설정\_memory'
if (Test-Path $memRoot) {
  $합 = 0
  Get-ChildItem $memRoot -Directory | ForEach-Object {      # .claude / .claude-uN
    $설정 = $_.Name
    Get-ChildItem $_.FullName -Directory | ForEach-Object {  # 슬러그
      $이름들 = @($_.Name, ($_.Name -replace '-USER(?=-|$)', "-$진짜이름")) | Select-Object -Unique
      foreach ($nm in $이름들) {
        $d = "C:\Users\USER\$설정\projects\$nm\memory"; 챠 $d
        Copy-Item "$($_.FullName)\*" $d -Recurse -Force
      }
      $c = (Get-ChildItem $_.FullName -File -Recurse).Count
      $합 += $c
      Say ("메모리 풀기: $설정 \ " + ($이름들 -join ' + ') + "  ${c}개")
    }
  }
  Say "메모리 합계 ${합}개  ← 이게 없으면 우리는 사장님 지시를 다 잊는다"
} else { Say '🔴 메모리 짐이 없다 — 싸기를 다시 돌려라' }

# ── ①-2 터미널 글자크기 ────────────────────────────────────────────
# 사장님 (2026-08-21) 「글자를 크게 내가 볼 수 있게 해줘」 → 20 으로 맞춘 것을 그대로 옮긴다.
# ⛔ 이걸 빠뜨리면 새 PC 는 기본 12 다. 화면을 못 읽으시면 우리가 한 일이 안 보인다.
$wtDir = 'C:\Users\USER\AppData\Local\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState'
$wtSrc = Join-Path $짐 '05_터미널\settings.json'
if (Test-Path $wtSrc) {
  if (Test-Path $wtDir) {
    $wtDst = Join-Path $wtDir 'settings.json'
    if (Test-Path $wtDst) { Copy-Item $wtDst "$wtDst.bak-이사전" -Force }
    Copy-Item $wtSrc $wtDst -Force
    Say '✅ 터미널 글자크기 20 되돌렸다 (원래 것은 settings.json.bak-이사전)'
  } else { Say '🔴 윈도 터미널이 아직 안 깔렸다 — 깔고 나서 이 자를 한 번 더 돌려라' }
}

# ── ② 세션 접속 폴더 ────────────────────────────────────────────────
$ent = 'C:\Users\USER\Desktop\00_세션입구'; 챠 $ent
if (Test-Path (Join-Path $짐 '02_세션입구')) {
  Copy-Item (Join-Path $짐 '02_세션입구\*') $ent -Recurse -Force
  Say ('세션입구 풀기: ' + (Get-ChildItem $ent -File -Recurse).Count + '개')
}

# ── ③ 대화록 — 차림표를 읽어 제 자리로 ──────────────────────────────
$차 = Join-Path $짐 '04_대화록\차림표.tsv'
if (Test-Path $차) {
  foreach ($row in (Get-Content $차 | Select-Object -Skip 1)) {
    $c = $row -split "`t"; if ($c.Count -lt 4) { continue }
    $n = ($c[0] -replace '번',''); $id = $c[1]; $slug = $c[2]
    $src = Join-Path $짐 ("04_대화록\$n" + "_" + $slug + "_" + $id + ".jsonl")
    if (-not (Test-Path $src)) { Say "🔴 ${n}번 짐이 없다: $src"; continue }
    # 자리폴더: 1번은 .claude(9/2 에 옮긴다) · 나머지는 .claude-uN
    $home = if ($n -eq '1') { 'C:\Users\USER\.claude' } else { "C:\Users\USER\.claude-u$n" }
    # ⭐ 슬러그를 다 넣는다 — USER · User(이 PC 이름) · 원래 있던 것 · **그것의 이름 갈아끼운 것**
    #    🔴 1번은 원래 슬러그가 C--Users-USER-Documents-GitHub-klifemap 이다(8/21 · 386MB).
    #       그 안의 USER 도 갈아끼워 둬야 새 PC 에서 찾는다.
    $slug2 = $slug -replace '-USER(?=-|$)', "-$진짜이름"
    foreach ($s in ($슬러그들 + $slug + $slug2) | Select-Object -Unique) {
      $d = Join-Path $home "projects\$s"; 챠 $d
      Copy-Item $src (Join-Path $d "$id.jsonl") -Force
    }
    Set-Content -Path (Join-Path $ent "_현재\$n.id") -Value $id -NoNewline -Encoding ascii
    Say "${n}번 대화록 풀기 → $home  (슬러그 두 자리 · id 이름표까지)"
  }
} else { Say '⚠ 대화록 차림표가 없다 — 옮기는 날 -대화록 으로 다시 싸라' }

# ── ④ git 에 없는 것 ────────────────────────────────────────────────
$g = Join-Path $짐 '03_git에없는것'
if (Test-Path $g) {
  foreach ($pair in @(@('dataeconomics.env','C:\Users\USER\Documents\GitHub\dataeconomics\.env'),
                      @('klifemap.env',     'C:\Users\USER\Documents\GitHub\klifemap\.env'))) {
    $s = Join-Path $g $pair[0]
    if (Test-Path $s) {
      챠 (Split-Path $pair[1] -Parent)
      Copy-Item $s $pair[1] -Force; Say ('열쇠 풀기: ' + $pair[1])
    }
  }
  if (Test-Path (Join-Path $g '_tools')) {
    $t = 'C:\Users\USER\Documents\GitHub\_tools'; 챠 $t
    Copy-Item (Join-Path $g '_tools\*') $t -Recurse -Force; Say '_tools 풀기'
  }
}

# ── ⑤ 🔴 지킴이를 «윈도 예약작업»으로 — 추가 조치 ───────────────────
# 왜: 지금 지킴이는 «어느 세션의 매시 예약»으로 돈다. 그 창이 닫히면 지킴이도 죽고,
#     그러면 죽은 자리를 아무도 안 깨운다. 8/21 에 9·10번이 다섯 시간 그렇게 있었다.
#     ⭐ 윈도 예약작업으로 두면 «세션 밖»에서 도니, 어느 창이 죽어도 지킴이는 산다.
$wd = 'C:\Users\USER\Documents\GitHub\dataeconomics\scripts\seat-watchdog.mjs'
if (Test-Path $wd) {
  $act = New-ScheduledTaskAction -Execute 'node.exe' -Argument "`"$wd`"" `
           -WorkingDirectory 'C:\Users\USER\Documents\GitHub\dataeconomics'
  $trg = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(2) `
           -RepetitionInterval (New-TimeSpan -Minutes 15)
  $set = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew
  try {
    Register-ScheduledTask -TaskName '자리지킴이' -Action $act -Trigger $trg -Settings $set -Force | Out-Null
    Say '✅ 지킴이를 윈도 예약작업(자리지킴이)으로 등록했다 — 15분마다. 세션이 죽어도 산다'
  } catch { Say ('⚠ 예약작업 등록 실패(관리자로 다시 돌려라): ' + $_.Exception.Message) }
} else { Say "⚠ 지킴이 자를 못 찾았다: $wd  (저장소를 먼저 clone 하라)" }

Say '════ 끝 ════'
Say '남은 것: ① git clone 넷 → npm ci  ② Chrome 로그인 다섯 · Cloudtype 로그인'
Say '        ③ 창 여섯을 00_세션입구 에서 연다  ④ 각 자리가 매시 예약을 다시 건다'
Say '        ⑤ 「auto mode 를 기본으로?」 물으면 **2**(keep bypass)'




