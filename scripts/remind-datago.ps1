# 공공데이터포털 인증키 신청 알림 (1회성)
#
# 2026-08-01 사장님 지시 — 공공데이터포털이 2026-08-02 18:00 까지 작업이라
# 그 이후에 회원가입·로그인이 열린다. 6시에 알려 달라고 하셨다.
#
# Claude 세션 안의 예약은 세션이 끊기면 사라진다. 33시간 뒤라 끊길 가능성이 높아
# 윈도우 작업 스케줄러에도 같은 알림을 걸어 둔다. 둘 중 하나는 반드시 뜬다.
#
# 등록   scripts/remind-datago.ps1 를 가리키는 작업을 schtasks 로 만든다 (아래 주석 참조)
# 해제   schtasks /delete /tn "SeoulMarkets-공공데이터-알림" /f
#
#   schtasks /create /tn "SeoulMarkets-공공데이터-알림" ^
#     /tr "powershell.exe -NoProfile -ExecutionPolicy Bypass -File \"<이 파일 경로>\"" ^
#     /sc once /st 18:06 /sd 2026/08/02 /it /f

$ErrorActionPreference = 'Stop'

$body = @'
공공데이터포털 점검이 끝났습니다.

1) data.go.kr 로그인
2) 활용신청
     15100475  품목별 국가별 수출입실적 (HS코드 × 국가)
     15157901  수입 주요품목별 10일 단위 잠정치
3) 마이페이지 > 오픈API > 인증키
     "일반 인증키(Decoding)" 를 복사
4) Claude 에게 키를 전달하면 바로 수집을 시작합니다.

개발계정 트래픽은 하루 1만 건입니다.
'@

# 사이트가 살아 있는지만 본다. **「가입이 열렸다」고 단정하지 않는다.**
# 점검 중에도 홈페이지는 HTTP 200 으로 뜨고(실제로 확인함) 점검 안내는
# 로그인·가입 화면에만 있는 경우가 많다. 홈페이지만 보고 "열렸습니다"라고
# 띄우면 헛걸음을 시키는 셈이라, 사실만 적고 판단은 사람이 하게 둔다.
$state = '사이트 응답을 확인하지 못했습니다 (네트워크 오류). 직접 확인해 주십시오.'
try {
    $r = Invoke-WebRequest 'https://www.data.go.kr/' -UseBasicParsing -TimeoutSec 20
    $state = "사이트 응답 HTTP $($r.StatusCode). 로그인 화면에서 점검 여부를 확인해 주십시오."
    if ($r.Content -match '점검|작업 중|서비스 일시') {
        $state = '⚠ 홈페이지에 점검 안내가 아직 보입니다. 조금 뒤 다시 시도해 주십시오.'
    }
} catch { }

Add-Type -AssemblyName PresentationFramework | Out-Null
[System.Windows.MessageBox]::Show(
    "$state`r`n`r`n$body",
    'SeoulMarkets — 공공데이터 인증키 신청',
    'OK',
    'Information'
) | Out-Null

Start-Process 'https://www.data.go.kr/data/15100475/openapi.do'
