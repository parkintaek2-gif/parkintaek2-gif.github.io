/**
 * 아카이브 저장소 — 로컬 디스크와 S3 호환 오브젝트 스토리지(Cloudflare R2).
 *
 * ── 왜 필요한가. 이게 잠재 사고였다 ─────────────────────────────
 * 수집기는 `archive/` 로 파일을 쓴다. 그런데 **Cloudtype 컨테이너에는 영구 디스크가 없다.**
 * 재배포하면 파일시스템이 통째로 새로 뜬다.
 *
 * 인증키가 나온 뒤 그대로 수집을 시작했으면, 배포 한 번에 아카이브가 사라진다.
 * 그리고 관세청 10일 잠정치는 **다시 못 받는다** — 확정치로 덮인 뒤에는 원본이 없다.
 * 사업 전체가 「아카이브가 해자」라는 전제 위에 서 있는데, 그 해자가 재배포마다
 * 비워지는 구조였다.
 *
 * klifemap 세션이 SQLite 를 R2 로 복제(litestream)하는 것을 보고 같은 길로 간다.
 * **다만 그쪽 버킷·키는 쓰지 않는다.** 남의 데이터와 섞이면 사고가 났을 때 둘 다 죽는다.
 *
 * ── 왜 SDK 를 안 쓰는가 ─────────────────────────────────────────
 * 이 저장소의 런타임 의존성은 0개다. Cloudtype 메모리가 0.25GB 로 묶여 있고 실측이
 * 47.6MB 라 여유가 그리 크지 않다. AWS SDK 는 그 균형을 깬다.
 * S3 PUT 하나에 필요한 것은 SigV4 서명뿐이고, 그건 node:crypto 로 100줄이면 된다.
 * ──────────────────────────────────────────────────────────────
 *
 * 환경변수 (없으면 로컬 디스크로만 저장한다 — 개발 중에는 그게 정상이다)
 *   ARCHIVE_S3_ENDPOINT    예: https://<account>.r2.cloudflarestorage.com
 *   ARCHIVE_S3_BUCKET
 *   ARCHIVE_S3_KEY_ID
 *   ARCHIVE_S3_SECRET
 *   ARCHIVE_S3_REGION      기본 'auto' (R2)
 *   ARCHIVE_DIR            로컬 경로. 기본 ./archive
 */

import { createHash, createHmac } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const CFG = {
  endpoint: process.env.ARCHIVE_S3_ENDPOINT ?? '',
  bucket: process.env.ARCHIVE_S3_BUCKET ?? '',
  keyId: process.env.ARCHIVE_S3_KEY_ID ?? '',
  secret: process.env.ARCHIVE_S3_SECRET ?? '',
  region: process.env.ARCHIVE_S3_REGION ?? 'auto',
  dir: path.resolve(process.env.ARCHIVE_DIR ?? 'archive'),
};

export const remoteEnabled = Boolean(CFG.endpoint && CFG.bucket && CFG.keyId && CFG.secret);

const sha256hex = (s) => createHash('sha256').update(s).digest('hex');
const hmac = (key, s) => createHmac('sha256', key).update(s).digest();

/** SigV4 서명키. 날짜·리전·서비스로 단계별로 파생시킨다. */
function signingKey(secret, date, region, service) {
  return hmac(hmac(hmac(hmac(`AWS4${secret}`, date), region), service), 'aws4_request');
}

/**
 * S3 키를 URI 인코딩한다.
 *
 * ⚠ encodeURIComponent 를 그대로 쓰면 `/` 까지 %2F 로 바뀌어 경로가 깨진다.
 *   구분자는 남기고 각 조각만 인코딩한다. 그리고 S3 는 `!'()*` 도 인코딩하길 요구한다 —
 *   안 하면 서명 불일치(SignatureDoesNotMatch)가 나는데, 원인을 찾기가 대단히 어렵다.
 */
function encodeKey(key) {
  return key
    .split('/')
    .map((seg) =>
      encodeURIComponent(seg).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`),
    )
    .join('/');
}

/** S3 호환 PUT. 성공하면 저장된 키를 돌려준다. */
async function putRemote(key, body, contentType) {
  const url = new URL(`${CFG.endpoint.replace(/\/$/, '')}/${CFG.bucket}/${encodeKey(key)}`);
  const payload = Buffer.isBuffer(body) ? body : Buffer.from(body, 'utf8');
  const payloadHash = createHash('sha256').update(payload).digest('hex');

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, ''); // 20260801T091500Z
  const date = amzDate.slice(0, 8);

  const headers = {
    host: url.host,
    'content-type': contentType,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
  };
  const signedHeaders = Object.keys(headers).sort().join(';');
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map((h) => `${h}:${headers[h]}\n`)
    .join('');

  const canonicalRequest = [
    'PUT',
    url.pathname,
    '', // 쿼리스트링 없음
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const scope = `${date}/${CFG.region}/s3/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    scope,
    sha256hex(canonicalRequest),
  ].join('\n');

  const signature = hmac(signingKey(CFG.secret, date, CFG.region, 's3'), stringToSign).toString('hex');

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      ...headers,
      authorization: `AWS4-HMAC-SHA256 Credential=${CFG.keyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    },
    body: payload,
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    // 본문에 실제 원인이 들어 있다(SignatureDoesNotMatch 등). 잘라서 남긴다.
    const detail = (await res.text().catch(() => '')).slice(0, 300);
    throw new Error(`S3 PUT ${res.status}: ${detail}`);
  }
  return key;
}

/**
 * 한 건을 저장한다.
 *
 * **로컬과 원격 양쪽에 쓴다.** 원격이 설정돼 있어도 로컬을 건너뛰지 않는다 —
 * 네트워크가 죽은 날 수집이 통째로 빠지는 것보다, 디스크에라도 남는 편이 낫다.
 * 원격 실패는 던지지 않고 결과에 담아 돌려준다. 수집기가 그걸 매니페스트에 적는다.
 */
export async function put(key, body, contentType = 'application/octet-stream') {
  const out = { key, local: null, remote: null, remoteError: null };

  const full = path.join(CFG.dir, key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, body);
  out.local = full;

  if (remoteEnabled) {
    try {
      out.remote = await putRemote(key, body, contentType);
    } catch (e) {
      out.remoteError = e.message;
    }
  }
  return out;
}

/**
 * 설정 상태.
 *
 * ⚠ **공개 API(/v1/meta)에 그대로 실린다.** 두 가지를 지킨다.
 *
 *   ① 키·시크릿 값을 담지 않는다 — 존재 여부만.
 *      이 세션에서 `ctype ls -o json` 이 klifemap 환경변수를 통째로 뱉는 것을 두 번
 *      겪었다. 같은 실수를 우리 코드가 하면 안 된다.
 *
 *   ② **서버 절대경로를 담지 않는다.** 처음엔 local_dir 을 넣었는데
 *      `C:\Users\USER\Documents\...` 가 그대로 나갔다 — 사용자명과 디렉터리 구조가
 *      공개된다. 운영에 필요한 것은 「로컬 저장이 되고 있는가」뿐이고, 경로 자체는
 *      바깥사람에게 아무 쓸모가 없다. 필요하면 로그에서 본다.
 */
export function storeStatus() {
  return {
    local_enabled: true,
    remote_enabled: remoteEnabled,
    remote_endpoint_host: CFG.endpoint ? new URL(CFG.endpoint).host : null,
    remote_bucket: CFG.bucket || null,
    remote_region: CFG.region,
    credentials_present: Boolean(CFG.keyId && CFG.secret),
    /**
     * 원격이 꺼져 있으면 그 사실이 곧 경고다. 아카이브가 이 사업의 해자인데
     * 재배포마다 비워지는 상태라는 뜻이기 때문이다.
     */
    warning: remoteEnabled
      ? null
      : 'Remote object storage is not configured; the archive is not durable across redeploys.',
  };
}

/** 운영용 — 경로가 필요할 때만 쓴다. **공개 응답에 넣지 말 것.** */
export function localDir() {
  return CFG.dir;
}
