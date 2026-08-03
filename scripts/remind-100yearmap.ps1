# 백년지도 착수 알림 — 2026-09-01
#
# 사장님 지시(2026-08-03): 「네가 알림을 설정해놔. 9월1일 백년지도 시작이라고.
#                          알림 뜨면 나한테도 알려줘」
#
# 알림을 세 곳에 남긴다. 한 곳만 쓰면 못 본다.
#   ① Windows 토스트        — 그 자리에서 눈에 띈다
#   ② 바탕화면 작업공유      — 두 세션이 보는 곳
#   ③ archive/log           — **세션 브리핑이 이걸 읽는다.** 그래야 내가 사장님께 알린다
#
# ⚠ UTF-8 BOM 으로 저장해야 한다. PowerShell 5.1 은 BOM 없는 UTF-8 을 ANSI 로 읽어
#   한글이 전부 깨진다(daily-desktop.ps1 에서 실제로 당했다).

#
# 시험은 반드시 -Test 로 한다.
#   powershell -File scripts\remind-100yearmap.ps1 -Test
# ⚠ 시험 실행이 진짜 알림과 같은 곳에 남으면 **양치기 소년이 된다.**
#   실제로 2026-08-03 에 시험 한 줄이 로그에 남아 사장님께 오발 알림이 갔다.
param([switch]$Test)

$ErrorActionPreference = 'Continue'
$repo = Split-Path -Parent $PSScriptRoot
$today = (Get-Date).ToString('yyyy-MM-dd')
$로그이름 = if ($Test) { 'alerts.test.log' } else { 'alerts.log' }

$본문 = @"
# 🔴 백년지도 착수일입니다 — $today

사장님 지시로 걸어 둔 알림입니다.

> 「9월 1일부터 백년지도 교육 컨설팅 사이트 구축을 해야 하니 작업을 그때부터 시작해」
> (docs/작업스케줄-2026하반기.md 의 9월 항목)

## 먼저 볼 것

- docs/신규사업/백년지도-API-확보목록.md   ← 미리 확보해 둔 API 상태
- docs/신규사업/교육-라이프맵-사업계획.md
- docs/신규사업/진로컨설팅AI-설계.md
- docs/작업스케줄-2026하반기.md  「9월 — 백년지도 착수」

## 9월 1~2주에 하기로 한 것

- 대학알리미 아카이빙 (커리어넷 승인과 무관하게 진행 가능)
- 「이 학과 나오면 어떻게 됐나」 무료 조회 — 도구가 기사보다 먼저다
- 교육통계(KEDI) 아카이빙

## ⚠ 잊지 말 것

- 100yearmap.com 에 noindex 가 걸려 있다. 내용이 채워지면 뗀다
- 보호자 동석이 구조다. 아이가 혼자 AI 와 대화하는 경로는 만들지 않는다
- 명리는 신강신약·성향·격국 셋만. 운세·대운·궁합·택일·합격예측은 안 가져온다
"@

# ② 바탕화면
$desk = [Environment]::GetFolderPath('Desktop')
$share = Join-Path $desk '작업공유'
if (Test-Path $share) {
    $본문 | Out-File -FilePath (Join-Path $share $(if ($Test) { "_시험_ 백년지도 착수 $today.md" } else { "🔴 백년지도 착수 $today.md" })) -Encoding utf8
}

# ③ 로그 — 세션 브리핑이 읽는 곳
#
# ⚠ 2026-08-03 KST 수정 — 여기가 **알림이 안 뜰 수 있는 자리**였다.
#   원래는 Out-File 한 줄이었는데, 파일이 다른 프로세스에 잡혀 있으면 그대로 실패했다.
#   실제로 시험 중에 실패했고, 더 나쁘게도 **에러 메시지가 로그 파일 안에 들어가** 있었다.
#   즉 9월 1일에 알림이 안 남고 대신 에러 덩어리가 남을 수 있었다.
#
#   알림은 **실패하면 안 되는 종류**다. 늦게 알면 늦게 시작하고, 그건 되돌릴 수 없다.
#   그래서 ⓐ 잠기면 잠깐 기다렸다 다시 쓴다 ⓑ 그래도 안 되면 별도 파일에 남긴다.
#   ⓒ 로그가 안 되더라도 토스트와 바탕화면은 계속 진행한다(아래 순서를 바꾼 이유).
$log = Join-Path $repo 'archive\log'
if (-not (Test-Path $log)) { New-Item -ItemType Directory -Force -Path $log | Out-Null }
$줄 = "[$today] 🔴 백년지도 착수일. docs/신규사업/백년지도-API-확보목록.md 부터 볼 것"
$기록됨 = $false
foreach ($시도 in 1..5) {
    try {
        # -ErrorAction Stop 이라야 catch 로 온다. 없으면 조용히 지나간다.
        Add-Content -Path (Join-Path $log $로그이름) -Value $줄 -Encoding UTF8 -ErrorAction Stop
        $기록됨 = $true
        break
    } catch {
        Start-Sleep -Milliseconds 400
    }
}
if (-not $기록됨) {
    # 본 파일이 끝내 안 열리면 **조용히 사라지게 두지 않는다.**
    # 세션 브리핑이 이 파일도 읽는다.
    try {
        Add-Content -Path (Join-Path $log "alerts-$today.log") -Value $줄 -Encoding UTF8 -ErrorAction Stop
    } catch { }
}

# ① 토스트
try {
    Add-Type -AssemblyName System.Windows.Forms
    $n = New-Object System.Windows.Forms.NotifyIcon
    $n.Icon = [System.Drawing.SystemIcons]::Information
    $n.Visible = $true
    $n.ShowBalloonTip(20000, '백년지도 착수일', '9월 1일입니다. 교육 컨설팅 사이트 구축을 시작합니다.', 'Info')
    Start-Sleep -Seconds 12
    $n.Dispose()
} catch { }
