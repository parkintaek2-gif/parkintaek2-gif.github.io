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

$ErrorActionPreference = 'Continue'
$repo = Split-Path -Parent $PSScriptRoot
$today = (Get-Date).ToString('yyyy-MM-dd')

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
    $본문 | Out-File -FilePath (Join-Path $share "🔴 백년지도 착수 $today.md") -Encoding utf8
}

# ③ 로그 — 세션 브리핑이 읽는 곳
$log = Join-Path $repo 'archive\log'
if (-not (Test-Path $log)) { New-Item -ItemType Directory -Force -Path $log | Out-Null }
"[$today] 🔴 백년지도 착수일. docs/신규사업/백년지도-API-확보목록.md 부터 볼 것" |
    Out-File -FilePath (Join-Path $log 'alerts.log') -Encoding utf8 -Append

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
