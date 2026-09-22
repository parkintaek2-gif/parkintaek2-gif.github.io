/**
 * pptx-꾸러미.mjs — **pptx(=zip) 를 읽고 쓴다.** 라이브러리 없이 손으로 다룬다.
 *
 * 🔴 왜 손으로 하나 (2026-09-22 · 5번)
 *   사장님: 「셀프사주 1권 교재와 강의(파일명 중 이마트 포함) ppt를 원드라이브에서 찾아서
 *            **거기 스타일에 맞춰서** 만들어」
 *   ⇒ 스타일을 «눈으로 흉내내지» 않는다. 원본 꾸러미에서 서식 부품(theme·slideMaster·
 *     slideLayout·presProps·tableStyles)을 **그대로 물려받고** 슬라이드만 새로 넣는다.
 *     그래야 글꼴·색·머리글 장식이 어긋날 «여지»가 없다.
 *   ⚠ klifemap 의 `build-selfsaju-vol2.mjs` 가 docx 에 같은 수를 쓴다 — 그것을 pptx 로 옮긴 것이다.
 *
 * ⛔ 사장님 원본 파일을 고치지 않는다. 읽기만 하고 새 파일로 낸다.
 */
import zlib from 'node:zlib';

/** zip 중앙 디렉터리를 읽어 부품 목록을 낸다 */
export function 집목록(b) {
  if (!Buffer.isBuffer(b) || b.length < 22) return [];
  const 끝 = b.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (끝 < 0) return [];
  const 수 = b.readUInt16LE(끝 + 10);
  let p = b.readUInt32LE(끝 + 16);
  const 것 = [];
  for (let i = 0; i < 수; i++) {
    if (p + 46 > b.length || b.readUInt32LE(p) !== 0x02014b50) break;
    const 압축 = b.readUInt16LE(p + 10);
    const 압축크기 = b.readUInt32LE(p + 20);
    const 원크기 = b.readUInt32LE(p + 24);
    const n = b.readUInt16LE(p + 28);
    const m = b.readUInt16LE(p + 30);
    const k = b.readUInt16LE(p + 32);
    const off = b.readUInt32LE(p + 42);
    것.push({ 이름: b.slice(p + 46, p + 46 + n).toString('utf8'), 압축, 압축크기, 원크기, off });
    p += 46 + n + m + k;
  }
  return 것;
}

/** 부품 하나를 꺼낸다. 못 꺼내면 null — ⛔ 빈 것으로 «속이지» 않는다 */
export function 집에서꺼내기(b, e) {
  if (!e) return null;
  try {
    const n = b.readUInt16LE(e.off + 26);
    const m = b.readUInt16LE(e.off + 28);
    const s = e.off + 30 + n + m;
    const 몸 = b.slice(s, s + e.압축크기);
    return e.압축 === 0 ? Buffer.from(몸) : zlib.inflateRawSync(몸);
  } catch { return null; }
}

/** 이름으로 꺼낸다 (글자로) */
export function 글로꺼내기(b, 다, 이름) {
  const v = 집에서꺼내기(b, 다.find((x) => x.이름 === 이름));
  return v ? v.toString('utf8') : null;
}

/* ── zip 쓰기 ────────────────────────────────────────────────
   ⚠ CRC-32 를 직접 만든다. 틀리면 파워포인트가 «복구할까요?»를 띄운다. */
let 표 = null;
export function crc32(buf) {
  if (!표) {
    표 = new Int32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      표[i] = c;
    }
  }
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = 표[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

/**
 * [{이름, 몸(Buffer|string)}] → zip Buffer
 * ⛔ 이름이 겹치면 «나중 것»이 이긴다 — 조용히 둘 다 넣으면 파워포인트가 못 연다.
 */
export function 집만들기(부품들) {
  const 본것 = new Set();
  const 것 = [];
  for (const x of 부품들 || []) {
    if (!x || !x.이름) continue;
    if (본것.has(x.이름)) { 것[것.findIndex((y) => y.이름 === x.이름)] = x; continue; }
    본것.add(x.이름);
    것.push(x);
  }
  const 앞들 = [];
  const 가운데 = [];
  let 자리 = 0;
  for (const x of 것) {
    const 몸 = Buffer.isBuffer(x.몸) ? x.몸 : Buffer.from(String(x.몸 ?? ''), 'utf8');
    const 눌린것 = zlib.deflateRawSync(몸, { level: 9 });
    const 이름 = Buffer.from(x.이름, 'utf8');
    const c = crc32(몸);
    const 머리 = Buffer.alloc(30);
    머리.writeUInt32LE(0x04034b50, 0);
    머리.writeUInt16LE(20, 4);            /* 풀려면 2.0 */
    머리.writeUInt16LE(0x0800, 6);        /* 이름이 UTF-8 이다 */
    머리.writeUInt16LE(8, 8);             /* deflate */
    머리.writeUInt16LE(0, 10); 머리.writeUInt16LE(0x21, 12);   /* 시각은 안 쓴다 — 늘 같은 파일이 나오게 */
    머리.writeUInt32LE(c, 14);
    머리.writeUInt32LE(눌린것.length, 18);
    머리.writeUInt32LE(몸.length, 22);
    머리.writeUInt16LE(이름.length, 26);
    머리.writeUInt16LE(0, 28);
    앞들.push(머리, 이름, 눌린것);

    const 가 = Buffer.alloc(46);
    가.writeUInt32LE(0x02014b50, 0);
    가.writeUInt16LE(20, 4); 가.writeUInt16LE(20, 6);
    가.writeUInt16LE(0x0800, 8);
    가.writeUInt16LE(8, 10);
    가.writeUInt16LE(0, 12); 가.writeUInt16LE(0x21, 14);
    가.writeUInt32LE(c, 16);
    가.writeUInt32LE(눌린것.length, 20);
    가.writeUInt32LE(몸.length, 24);
    가.writeUInt16LE(이름.length, 28);
    가.writeUInt32LE(자리, 42);
    가운데.push(가, 이름);
    자리 += 30 + 이름.length + 눌린것.length;
  }
  const 앞 = Buffer.concat(앞들);
  const 중 = Buffer.concat(가운데);
  const 끝 = Buffer.alloc(22);
  끝.writeUInt32LE(0x06054b50, 0);
  끝.writeUInt16LE(것.length, 8);
  끝.writeUInt16LE(것.length, 10);
  끝.writeUInt32LE(중.length, 12);
  끝.writeUInt32LE(앞.length, 16);
  return Buffer.concat([앞, 중, 끝]);
}

/** XML 에 글자를 넣을 때 — ⛔ & 를 먼저 바꾸지 않으면 두 번 바뀐다 */
export function 엑스엠엘(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
