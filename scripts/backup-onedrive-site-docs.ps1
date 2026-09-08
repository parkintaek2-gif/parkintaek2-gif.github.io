# backup-onedrive-site-docs.ps1 — 「이 두 파일만 있으면 사이트를 다시 띄울 수 있다」 묶음
# ─────────────────────────────────────────────────────────────────────────────
# 사장님 지시 (2026-09-08, 원문 차례대로):
#   「원드라이브에 전체 백업해라. 내가 중요보관소에 보관할 용으로
#    "C:\Users\User\OneDrive\KLifeMap-문서-전체.zip"
#    "C:\Users\User\OneDrive\서울마켓-문서-전체.zip" 이 두파일 참조해서 만들어」
#   「원드라이브에 같은 파일명으로」
#   「이 두 파일만 있으면 언제든지 우리 사이트 전체를 서비스할 수 있어야 하는 게 만드는 목적야이」
#   「파일 수는 더 많아져도 무방하나 압축파일 하나로 해놔라」
#
# 🔴 20:13 에 있던 두 묶음은 «문서만» 담고 있었다(각 11MB · pdf·md·html·pptx).
#   코드도 자료도 영상도 DB도 없어서 **그것으로는 사이트를 못 띄운다.** 그래서 다시 만든다.
#
# ⭐ 그리고 「사이트별」로 쪼개면 목적을 못 채운다 — 재 보니 **한 저장소가 세 사이트를 낸다.**
#   server.mjs 233~234줄:
#     seoulmarkets.com → dist\ · 100yearmap.com → dist\100y\ · www.kculturewire.com → dist\wikitip\
#   ⇒ 「백년지도」 묶음을 따로 만들어도 그것만으로는 백년지도를 못 띄운다.
#   ⇒ 사장님이 말씀하신 «두 파일»이 정확히 맞는 갈래다. 저장소가 둘이기 때문이다.
#
#     KLifeMap-문서-전체.zip  ←  klifemap 저장소      (klifemap.ai)
#     서울마켓-문서-전체.zip   ←  dataeconomics 저장소  (seoulmarkets + 100yearmap + kculturewire)
#
# ⛔ 열쇠는 넣지 않는다 — .env 는 원드라이브로 옮기지 않는다.
#   대신 «필요한 변수 이름»만 적어 넣는다(값은 읽지도 쓰지도 않는다).
#   이름만 있어도 복구할 때 무엇을 채워야 하는지는 다 안다.
#
# 쓰는 법
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts\backup-onedrive-site-docs.ps1
#   powershell ... -Only klifemap        (하나만)
#   powershell ... -WhatIf               (담을 것만 세어 보고 만들지 않는다)

param(
  [string] $Only = '',
  [switch] $WhatIf
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)   # ...\GitHub
$oneDrive = 'C:\Users\USER\OneDrive'
$stamp = Get-Date -Format 'yyyy-MM-dd HH:mm'                        # 이 PC 는 이미 KST 다

# ⚠ 둘 다 실어야 한다. FileSystem 만 실으면 ZipFile 은 되지만
#   ZipArchive·ZipArchiveMode 를 못 찾는다 — 2026-09-08 에 그것으로 한 번 죽었다.
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

# 뺄 것 — 폴더 이름으로 뺀다
#   node_modules  npm ci 로 다시 받는다
#   dist          npm run build 가 다시 만든다
#   .git          GitHub 에 있다
#   archive       서비스에 필요 없다. backup-archive-onedrive.ps1 이 따로 맡는다
$뺄폴더 = @('node_modules', 'dist', '.git', 'archive', '.astro', '.cache', 'coverage', '.wrangler')
# 🔴 열쇠·비밀·큰 기록은 파일 이름으로 뺀다
$뺄파일무늬 = @('.env', '.env.*', '*.pem', '*.key', '*.p12', '*.pfx', 'id_rsa*', '*.log', '*.tmp')
# 🔴 살아 있는 SQLite 는 «걸어서» 담지 않는다 — 2026-09-08 에 여기서 죽었다.
#   「The process cannot access the file … being used by another process」
#   ⛔ 잠긴 것을 억지로 복사해도 «찢어진» DB 가 된다. 열리기는 해도 줄이 빠질 수 있고,
#     그것을 「백업했다」고 부르면 거짓이다.
#   ✅ 그래서 파일 훑기에서는 빼고, snapshot-klifemap-db.mjs 가 뜬 «온전한 사본»을 넣는다
#     (better-sqlite3 의 온라인 백업 — 서비스를 멈추지 않는다).
$뺄파일무늬 += @('*.sqlite3', '*.sqlite3-wal', '*.sqlite3-shm', '*.sqlite', '*.db-wal', '*.db-shm')

$대상 = @(
  @{
    이름 = 'dataeconomics'
    저장소 = Join-Path $repoRoot 'dataeconomics'
    zip = '서울마켓-문서-전체.zip'
    사이트 = 'seoulmarkets.com · 100yearmap.com · www.kculturewire.com (한 저장소가 셋을 낸다)'
    띄우는법 = @(
      'npm ci',
      'npm run build',
      'npm start                      (또는 배포: ctype apply -f .cloudtype/app.yaml -t @parkintaek2/seoulmarkets:main)'
    )
  },
  @{
    이름 = 'klifemap'
    저장소 = Join-Path $repoRoot 'klifemap'
    zip = 'KLifeMap-문서-전체.zip'
    사이트 = 'klifemap.ai'
    띄우는법 = @(
      'npm ci',
      'node server.js                 (package.json 의 start)',
      '⚠ db\beomjin.sqlite3 이 회원·결제 자료다. 이 묶음에 «들어 있다» — 다루실 때 주의',
      '배포: ctype apply -f .cloudtype/app.yaml -t @parkintaek2/klifemap:main'
    )
  }
)

function 뺄것인가([string]$상대길, [string]$이름) {
  foreach ($d in $뺄폴더) {
    if ($상대길 -eq $d -or $상대길.StartsWith("$d\") -or $상대길.Contains("\$d\")) { return $true }
  }
  foreach ($m in $뺄파일무늬) { if ($이름 -like $m) { return $true } }
  return $false
}

# .env 의 «이름만» 뽑는다. ⛔ 값은 읽어서 어디에도 쓰지 않는다
function 변수이름만([string]$envPath) {
  if (-not (Test-Path $envPath)) { return @('(.env 가 없다)') }
  $names = @()
  foreach ($line in Get-Content $envPath) {
    if ($line -match '^\s*#') { continue }
    if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=') { $names += $Matches[1] }
  }
  return ($names | Sort-Object -Unique)
}

$결과 = @()

foreach ($t in $대상) {
  if ($Only -ne '' -and $t.이름 -ne $Only) { continue }
  if (-not (Test-Path $t.저장소)) { $결과 += "🔴 $($t.이름) — 저장소가 없다: $($t.저장소)"; continue }

  Write-Output "── $($t.이름) 담을 것을 고른다 …"
  $담을것 = New-Object System.Collections.ArrayList
  $바이트 = [long]0
  Push-Location $t.저장소
  try {
    foreach ($f in Get-ChildItem -Recurse -File -Force) {
      $rel = $f.FullName.Substring($t.저장소.Length + 1)
      if (뺄것인가 $rel $f.Name) { continue }
      [void]$담을것.Add(@{ 전체 = $f.FullName; 상대 = $rel })
      $바이트 += $f.Length
    }
  } finally { Pop-Location }

  $MB = [math]::Round($바이트 / 1MB, 1)
  Write-Output ("   파일 {0}개 · 압축 전 {1}MB" -f $담을것.Count, $MB)
  if ($WhatIf) { $결과 += "⬜ $($t.zip) — 담을 것 $($담을것.Count)개 · ${MB}MB (WhatIf 라 만들지 않았다)"; continue }

  # ⭐ 살아 있는 DB 는 «온전한 사본»을 먼저 뜬다 — 서비스를 멈추지 않는다
  #   ⛔ 뜨는 데 실패하면 DB 없이 묶고, 그 사실을 결과에 적는다. 「있는 척」하지 않는다
  if ($t.이름 -eq 'klifemap') {
    $사본자리 = Join-Path $env:TEMP 'klifemap-db-스냅샷.sqlite3'
    Write-Output '   DB 온전한 사본을 뜬다 (better-sqlite3 온라인 백업) …'
    $뜬결과 = & node (Join-Path $PSScriptRoot 'snapshot-klifemap-db.mjs') --낼곳 $사본자리 2>&1
    if ($LASTEXITCODE -eq 0 -and (Test-Path $사본자리)) {
      $t.DB사본 = $사본자리
      $요약 = ($뜬결과 | Where-Object { $_ -match '표 .*개 · 줄 합' } | Select-Object -First 1)
      Write-Output "      $요약"
    } else {
      Write-Output '      🔴 DB 사본을 못 떴다 — DB 없이 묶는다'
      $뜬결과 | Select-Object -Last 3 | ForEach-Object { Write-Output "      $_" }
    }
  }

  # 복구 안내를 묶음 뿌리에 넣는다
  $이름들 = 변수이름만 (Join-Path $t.저장소 '.env')
  $안내 = @"
이 묶음으로 사이트를 다시 띄우는 법 — $($t.이름)
만든 때: $stamp (한국시간) · 만든 것: scripts\backup-onedrive-site-docs.ps1 (5번)

사장님 지시(2026-09-08): 「이 두 파일만 있으면 언제든지 우리 사이트 전체를
서비스할 수 있어야 하는 게 만드는 목적」

이 묶음이 내는 사이트
  $($t.사이트)

띄우는 차례
$($t.띄우는법 | ForEach-Object { "  $_" } | Out-String)
🔴 열쇠는 이 묶음에 «없습니다»
  .env 를 원드라이브에 넣지 않았습니다. 결제·API 열쇠가 그대로 들어가기 때문입니다.
  채워야 하는 «변수 이름»은 아래입니다. 값은 각 서비스 관리화면에서 다시 받습니다.

$($이름들 | ForEach-Object { "  $_" } | Out-String)
여기 없는 것과 그 까닭
  node_modules  — `npm ci` 가 다시 받습니다 (package-lock.json 이 이 묶음에 있습니다)
  dist          — `npm run build` 가 다시 만듭니다
  .git          — GitHub 에 있습니다 (github.com/parkintaek2-gif)
  archive\raw\  — 서비스에 필요 없습니다. 원자료 백업은 backup-archive-onedrive.ps1 이 맡습니다
                  ⚠ 다만 그것은 «소급이 안 되는» 자료입니다. 이 묶음과 «따로» 보관하십시오

⚠ 이 묶음을 만든 뒤 실제로 풀어서 띄워 보았는지는 같은 날 보고에 적혀 있습니다.
  「만들었다」와 「띄워 봤다」는 다른 말입니다.
"@
  $안내파일 = Join-Path $env:TEMP ("복구하는-법-" + $t.이름 + ".txt")
  Set-Content -Path $안내파일 -Value $안내 -Encoding UTF8

  $zipPath = Join-Path $oneDrive $t.zip
  $임시zip = Join-Path $env:TEMP ($t.zip + '.만드는중')
  if (Test-Path $임시zip) { Remove-Item $임시zip -Force }

  Write-Output '   묶는다 …'
  $fs = [System.IO.File]::Open($임시zip, [System.IO.FileMode]::Create)
  $zip = New-Object System.IO.Compression.ZipArchive($fs, [System.IO.Compression.ZipArchiveMode]::Create)
  try {
    # ⛔ 한 파일이 잠겨서 «묶음 전체»가 죽지 않게 한다 — 못 담은 것은 세어 적는다
    foreach ($x in $담을것) {
      $안이름 = "$($t.이름)/" + ($x.상대 -replace '\\', '/')
      try {
        [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $x.전체, $안이름, [System.IO.Compression.CompressionLevel]::Optimal)
      } catch {
        $못담은것 += "$($x.상대) — $($_.Exception.Message.Split([char]10)[0])"
      }
    }
    # ⭐ DB 는 «온전한 사본»으로 넣는다 (위 주석 참조)
    if ($t.DB사본 -and (Test-Path $t.DB사본)) {
      [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $t.DB사본, "$($t.이름)/db/beomjin.sqlite3", [System.IO.Compression.CompressionLevel]::Optimal)
      $담은DB = $true
    }
    [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $안내파일, '복구하는-법.txt', [System.IO.Compression.CompressionLevel]::Optimal)
  } finally { $zip.Dispose(); $fs.Dispose() }

  # ⛔ 다 만든 «뒤에» 옮긴다. 만드는 중에 죽어도 옛 묶음이 남아 있게
  Move-Item -Path $임시zip -Destination $zipPath -Force
  $zipMB = [math]::Round((Get-Item $zipPath).Length / 1MB, 1)
  $안건수 = [System.IO.Compression.ZipFile]::OpenRead($zipPath) | ForEach-Object { $n = $_.Entries.Count; $_.Dispose(); $n }
  $덧 = ""
  if ($담은DB) { $덧 += " · DB 온전한 사본 넣음" }
  if ($못담은것.Count -gt 0) { $덧 += " · 🔴 못 담은 것 $($못담은것.Count)개" }
  # 🔴 [2026-09-09 · 5번] 여기 두 흠이 있었다.
  #   1. "$안건수개" — 파워셸이 «안건수개»라는 딴 변수로 읽어 «빈 칸»이 찍혔다.
  #      한글은 변수 이름에 쓸 수 있는 글자라 오류도 안 난다. ${안건수}개 로 감싼다.
  #   2. $덧 을 만들어 놓고 «안 붙이고» 있었다 — 그 안에 「🔴 못 담은 것 N개」가 들었다.
  #      담다가 빠뜨린 파일이 있어도 화면에 한 줄도 안 나왔다. 조용히 성공한 척하는 것이 제일 나쁘다.
  $결과 += "OK $($t.zip) — 안에 ${안건수}건 · ${zipMB}MB (압축 전 ${MB}MB)$덧"
  Remove-Item $안내파일 -Force -ErrorAction SilentlyContinue
}

Write-Output ''
Write-Output '=== 결과 ==='
$결과 | ForEach-Object { Write-Output "  $_" }
Write-Output ''
Write-Output '=== 원드라이브의 두 묶음 (지금) ==='
Get-ChildItem $oneDrive -Filter '*-문서-전체.zip' | Sort-Object Name | ForEach-Object {
  Write-Output ("  {0,-30} {1,8:N1}MB  {2}" -f $_.Name, ($_.Length / 1MB), $_.LastWriteTime.ToString('yyyy-MM-dd HH:mm'))
}
