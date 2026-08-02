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

# ⚠ **손으로 관리하는 목록을 두지 않는다.**
#   2026-08-02 에 새 문서를 만들고 이 목록에 넣는 것을 **세 번** 잊었다.
#   그러면 문서는 저장소에만 있고 사장님께는 안 간다. **만들어 놓고 안 보내면 없는 것과 같다.**
#
#   그래서 docs\ 아래 .md 를 **전부** 가져온다. 아래 $folder 는 「어느 칸에 넣을까」를
#   정하는 것뿐이고, **여기 없는 문서도 루트로 간다.** 최악이 「엉뚱한 칸」이지
#   「안 감」이 아니다.
$folder = @{
    '영업' = '3. 영업자료'
}
# docs\신규사업\ 안에 성격이 다른 것이 섞여 있다. 파일 이름으로 갈라 넣는다.
$byName = @(
    @{ pat = '교육|라이프맵';           dst = '4. 교육 라이프맵' }
    @{ pat = '한류|위키팁|wikitip';     dst = '1. 한류 콘텐트 비즈' }
)
# 루트에 있는 문서 중 데이터·전략류는 2번 칸으로. 이름으로 알아본다.
$toBiz2 = '사업전략|데이터-|발행-캘린더|연구-|검색등록|배포-가이드'

$exclude = @('취재')   # 발행 전 취재 초고. .gitignore 대상이라 여기도 안 내보낸다

$copied  = 0
$skipped = @()
$written = @()   # 이번에 쓴 파일. 아래에서 나머지를 치우는 데 쓴다

$docsRoot = Join-Path $repo 'docs'
$files = Get-ChildItem $docsRoot -Recurse -Filter *.md -File | Where-Object {
    $rel = $_.FullName.Substring($docsRoot.Length).TrimStart('\')
    $exclude -notcontains ($rel -split '\\')[0]
}

foreach ($f in $files) {
    $src = $f.FullName
    $rel = $src.Substring($docsRoot.Length).TrimStart('\')
    $sub = if ($rel -match '\\') { ($rel -split '\\')[0] } else { '' }

    # 이름으로 갈 곳이 정해지는 것을 먼저 본다 (신규사업 폴더 안이 섞여 있어서)
    $hit = $byName | Where-Object { $f.BaseName -match $_.pat } | Select-Object -First 1

    $dstName =
        if ($hit) { $hit.dst }
        elseif ($sub -and $folder.ContainsKey($sub)) { $folder[$sub] }
        elseif ($sub) { $sub }                                   # 모르는 하위폴더는 그 이름 그대로
        elseif ($f.BaseName -match $toBiz2) { '2. 경제 데이터 가공 및 제공 비즈' }
        else { '' }

    $dir = if ($dstName) { Join-Path $root $dstName } else { $root }
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
    $script:written += $out
    $copied++
}

# ── 없어지거나 이름이 바뀐 문서를 치운다 ────────────────────────────────
#
# ⚠ 위의 「같은 이름 옛 사본 제거」는 **이름이 그대로일 때만** 듣는다.
#   2026-08-02 에 매출계획-2026-2029 → 2026-2033 으로 바꿨더니 옛 파일이 그대로 남았다.
#   **사장님이 그걸 여시면 폐기된 계획을 읽으신다.** 문서가 없는 것보다 나쁘다.
#   그래서 이번에 쓰지 않은 .md 는 전부 치운다. 과거 판은 git 에 있다.
$removed = 0
Get-ChildItem $root -Recurse -Filter *.md -File | ForEach-Object {
    if ($written -notcontains $_.FullName) {
        Remove-Item $_.FullName -Force
        Write-Output "  치움: $($_.FullName.Replace("$root\", ''))"
        $removed++
    }
}

Write-Output "동기화 $copied 건 → $root"
if ($skipped.Count) { Write-Output "건너뜀(원본 없음): $($skipped -join ', ')" }

Get-ChildItem $root -Recurse -File |
    Sort-Object DirectoryName, Name |
    ForEach-Object { "  " + $_.FullName.Replace("$root\", '') }
