# 바탕화면 공유 폴더 갱신 — 매일 23:00
#
# 사장님 지시 (2026-08-01):
#   「모든 문서는 바탕화면에 만들어. 언제든지 너희들이 다른 세션에서 한 걸 볼 수 있도록.
#    매일 23:00 체크 — 오늘의 작업 목록 / 오늘의 작업지시서 /
#    문서 저장은 최신 문서로 덮어쓰기 / 00:00부터 할 일 리스트」
#
# 왜 바탕화면인가
#   OneDrive 는 사장님이 보시는 곳이고, 여기는 **두 세션이 서로를 보는 곳**이다.
#   세션 간 메모(git)는 저장소 안에 있어 klifemap 세션이 pull 해야 보인다.
#   바탕화면은 둘 다 즉시 읽고 쓸 수 있다.
#
# 파일 이름 규칙 두 가지가 섞여 있다 — 의도한 것이다
#   · **날짜 문서**(작업목록·작업지시서·할일)는 **날짜가 곧 정체성**이다.
#     8/1 작업목록과 8/2 작업목록은 다른 문서다. 날짜를 이름에 넣고 남긴다.
#   · **일반 문서**(전략·조사)는 **최신본 하나만** 둔다. 사장님 지시대로 덮어쓴다.
#     과거 판은 git 에 있다.
#
# ⚠ 이 파일은 **UTF-8 BOM** 으로 저장해야 한다. PowerShell 5.1 은 BOM 없는 UTF-8 을
#   ANSI 로 읽어 한글 경로가 전부 깨진다(실제로 당했다).

$ErrorActionPreference = 'Stop'

$repo = Split-Path -Parent $PSScriptRoot
$desk = [Environment]::GetFolderPath('Desktop')
$root = Join-Path $desk '작업공유'
$docs = Join-Path $root '문서'
$log  = Join-Path $root '일지'

foreach ($d in @($root, $docs, $log)) {
    if (-not (Test-Path $d)) { New-Item -ItemType Directory -Force -Path $d | Out-Null }
}

$now      = Get-Date
$today    = $now.ToString('yyyy-MM-dd')
$tomorrow = $now.AddDays(1).ToString('yyyy-MM-dd')

# ── 1. 일반 문서 — 최신본으로 덮어쓴다 ───────────────────────────
$map = @(
    'docs\사업보고-2026-08-01.md'
    'docs\매출추정-2026-2028.md'
    'docs\콘텐트-유통-콘택포인트.md'
    'docs\사업전략-데이터제공업.md'
    'docs\데이터-출처-라이선스.md'
    'docs\데이터-지도.md'
    'docs\발행-캘린더.md'
    'docs\세션간-메모.md'
    'docs\신규사업\한류매체-동남아-시장조사.md'
    'docs\신규사업\위키팁-klifemap-유입설계.md'
    'docs\영업\proposal-data-api.md'
    'docs\영업\가격표-초안.md'
    'docs\영업\타깃과-아웃리치.md'
)

$copied = 0
foreach ($rel in $map) {
    $src = Join-Path $repo $rel
    if (-not (Test-Path $src)) { continue }
    # 같은 이름으로 덮어쓴다 — 사장님 지시
    Copy-Item $src (Join-Path $docs ([IO.Path]::GetFileName($src))) -Force
    $copied++
}

# ── 2. 오늘의 작업목록 틀 — 없으면 만든다 ───────────────────────
# **있으면 덮지 않는다.** 세션이 하루 종일 여기에 적어 나가는 파일이라
# 23:00 에 덮으면 그날 기록이 통째로 날아간다.
$listPath = Join-Path $log "$today 작업목록.md"
if (-not (Test-Path $listPath)) {
    @"
# $today 작업목록

> 두 세션이 같이 적는다. **자기 몫만 적고 남의 줄을 지우지 않는다.**
> 23:00 에 스크립트가 이 파일을 만들지만, 이미 있으면 건드리지 않는다.

## seoulmarkets 세션

- [ ]

## klifemap 세션

- [ ]

---
## 오늘 막힌 것 (다음 날로 넘어가는 것)

- [ ]
"@ | Set-Content -Path $listPath -Encoding UTF8
}

# ── 3. 오늘의 작업지시서 틀 ─────────────────────────────────────
$orderPath = Join-Path $log "$today 작업지시서.md"
if (-not (Test-Path $orderPath)) {
    @"
# $today 작업지시서

> 사장님이 내리신 지시를 **받은 순서대로** 적는다.
> 말로 하신 것도 적는다 — 적지 않으면 다음 날 두 세션이 다르게 기억한다.

| 시각 | 지시 | 받은 세션 | 처리 |
|---|---|---|---|
|  |  |  |  |
"@ | Set-Content -Path $orderPath -Encoding UTF8
}

# ── 4. 내일 할 일 — 00:00 부터 ─────────────────────────────────
$todoPath = Join-Path $log "$tomorrow 할일.md"
if (-not (Test-Path $todoPath)) {
    @"
# $tomorrow 할 일 (00:00 부터)

> 전날 23:00 에 만든다. **막힌 것을 맨 위에 둔다** — 그게 하루를 결정한다.

## 막혀 있는 것 (풀리면 즉시)

- [ ]

## 오늘 할 것

- [ ]

## 대기 (남이 해줘야 하는 것)

- [ ]
"@ | Set-Content -Path $todoPath -Encoding UTF8
}

# ── 5. 안내문 — 이 폴더가 뭔지 ──────────────────────────────────
@"
# 작업공유 — 두 Claude 세션이 함께 쓰는 곳

**갱신: $($now.ToString('yyyy-MM-dd HH:mm'))**

## 폴더

| 경로 | 무엇 | 규칙 |
|---|---|---|
| ``일지\`` | 날짜별 작업목록·작업지시서·할일 | **날짜가 정체성.** 남긴다 |
| ``문서\`` | 전략·조사·영업 문서 | **최신본 하나.** 덮어쓴다 |

## 규칙

1. **자기 몫만 적고 남의 줄을 지우지 않는다.**
2. 지시를 받으면 그날 ``작업지시서`` 에 **받은 순서대로** 적는다.
   말로 들은 것도 적는다 — 안 적으면 다음 날 두 세션이 다르게 기억한다.
3. 막힌 것은 ``작업목록`` 맨 아래에 적고, 23:00 에 다음 날 ``할일`` 맨 위로 옮긴다.
4. 매일 23:00 에 이 폴더가 자동 갱신된다.
   **이미 있는 일지는 덮지 않는다** — 하루치 기록이 날아가면 안 된다.

## 세션

| 세션 | 저장소 | 맡은 것 |
|---|---|---|
| seoulmarkets | ``Documents\GitHub\dataeconomics`` | SeoulMarkets(금융 데이터) · WikiTip(한류) |
| klifemap | ``Documents\GitHub\klifemap`` | KLifeMap(사주·명리) |

git 의 ``docs\세션간-메모.md`` 도 계속 쓴다. 그건 **기술 인계**용이고,
여기는 **하루 단위 진행 공유**용이다.
"@ | Set-Content -Path (Join-Path $root '읽어주세요.md') -Encoding UTF8

Write-Output "바탕화면 작업공유 갱신 — 문서 $copied 건"
Write-Output "  $root"
Get-ChildItem $root -Recurse -File | ForEach-Object {
    "    " + $_.FullName.Replace("$root\", '')
}
