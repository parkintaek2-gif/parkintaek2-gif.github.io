# 문서를 OneDrive\서울마켓 으로 동기화한다. 파일명에 작성 시각을 박는다.
#
# 왜 시각을 파일명에 넣는가 (2026-08-01 사장님 지시: 「문서명에 날짜와 시간을 써놔」)
#   같은 이름으로 덮어쓰면 사장님이 **무엇이 새로 바뀐 것인지 열어보기 전엔 모른다.**
#   파일명에 시각이 있으면 목록만 봐도 알 수 있다.
#
# 왜 저장소 쪽 파일명은 안 바꾸는가
#   문서끼리 서로를 이름으로 참조하고(사업전략 → 데이터-출처-라이선스), 코드도
#   경로를 쓴다. 이름을 바꾸면 그 참조가 전부 깨진다.
#   저장소는 git 이 이력을 들고 있으므로 시각이 파일명에 없어도 된다.
#   **읽는 사람이 보는 쪽(OneDrive)에만 시각을 붙인다.**
#
# 왜 옛 사본을 지우는가
#   안 지우면 같은 문서가 시각만 다르게 수십 개 쌓인다. 어느 것이 최신인지
#   또 헷갈린다. **문서당 하나만 두고, 그 하나의 이름이 언제 쓴 것인지 말해 준다.**
#   과거 판은 git 에 다 있다.
#
# 사용: npm run sync   또는   powershell -File scripts/sync-onedrive.ps1

$ErrorActionPreference = 'Stop'

$repo = Split-Path -Parent $PSScriptRoot
$root = 'C:\Users\USER\OneDrive\서울마켓'

# 저장소 경로 → OneDrive 하위 폴더
$map = @(
    @{ src = 'docs\사업보고-2026-08-01.md';                    dst = '' }
    @{ src = 'docs\매출계획-2026-2029.md';                      dst = '' }
    @{ src = 'docs\콘텐트-유통-콘택포인트.md';                   dst = '' }
    @{ src = 'docs\신규사업\한류매체-동남아-시장조사.md';        dst = '1. 한류 콘텐트 비즈' }
    @{ src = 'docs\신규사업\위키팁-klifemap-유입설계.md';        dst = '1. 한류 콘텐트 비즈' }
    @{ src = 'docs\사업전략-데이터제공업.md';                    dst = '2. 경제 데이터 가공 및 제공 비즈' }
    @{ src = 'docs\데이터-출처-라이선스.md';                     dst = '2. 경제 데이터 가공 및 제공 비즈' }
    @{ src = 'docs\데이터-지도.md';                              dst = '2. 경제 데이터 가공 및 제공 비즈' }
    @{ src = 'docs\발행-캘린더.md';                              dst = '2. 경제 데이터 가공 및 제공 비즈' }
    @{ src = 'docs\영업\proposal-data-api.md';                  dst = '3. 영업자료' }
    @{ src = 'docs\영업\가격표-초안.md';                         dst = '3. 영업자료' }
    @{ src = 'docs\영업\타깃과-아웃리치.md';                     dst = '3. 영업자료' }
)

$copied = 0
$skipped = @()

foreach ($m in $map) {
    $src = Join-Path $repo $m.src
    if (-not (Test-Path $src)) { $skipped += $m.src; continue }

    $dir = if ($m.dst) { Join-Path $root $m.dst } else { $root }
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }

    $base = [IO.Path]::GetFileNameWithoutExtension($src)
    # 이미 시각이 붙어 있으면 떼고 새로 붙인다. 그래야 중복 접미사가 안 생긴다.
    $base = $base -replace '\s*\(\d{4}-\d{2}-\d{2} \d{4}\)$', ''

    # 같은 문서의 옛 사본을 먼저 치운다 — 문서당 하나만 남긴다
    Get-ChildItem $dir -File -Filter "$base*.md" -ErrorAction SilentlyContinue |
        ForEach-Object { Remove-Item $_.FullName -Force }

    # 시각은 **원본 파일의 수정 시각**이다. 복사한 시각이 아니다 —
    # 복사 시각을 쓰면 내용이 안 바뀌었는데도 새 문서처럼 보인다.
    $stamp = (Get-Item $src).LastWriteTime.ToString('yyyy-MM-dd HHmm')
    $out = Join-Path $dir "$base ($stamp).md"
    Copy-Item $src $out -Force
    $copied++
}

Write-Output "동기화 $copied 건 → $root"
if ($skipped.Count) { Write-Output "건너뜀(원본 없음): $($skipped -join ', ')" }

Get-ChildItem $root -Recurse -File |
    Sort-Object DirectoryName, Name |
    ForEach-Object { "  " + $_.FullName.Replace("$root\", '') }
