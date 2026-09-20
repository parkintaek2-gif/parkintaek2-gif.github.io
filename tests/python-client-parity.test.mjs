/**
 * tests/python-client-parity.test.mjs
 * ─────────────────────────────────────────────────────────────────────────
 * 🔴 [2026-09-21 · 2번] 실측 — clients/python/seoulmarkets.py 는 원래 여섯
 * 메서드(hs·search·countries·meta·trade_flash·trade_exports)뿐이었다.
 * clients/js/seoulmarkets.mjs 는 2026-09-19에 열두 개를 더 감았는데(F7 API
 * 실물을 클라이언트가 못 따라가던 것을 고친 자리), Python 쪽은 «같은 날
 * 같은 일이 있었는지조차 몰랐다» — 두 클라이언트를 나란히 지키는 검사가
 * 없었기 때문이다.
 *
 * ⛔ 이 검사가 지키는 것 — Python 파일에 실제 Python 이 없어(이 기계) 실행은
 *   못 하지만, «메서드 이름 목록»은 텍스트만으로도 맞댈 수 있다. JS 의
 *   camelCase 이름을 snake_case 로 바꿔 Python 의 `def` 목록과 정확히
 *   같아야 한다 — 하나라도 빠지면 이 검사가 잡는다.
 * ⚠ 이것이 Python 실행 검사를 대신하지 않는다. clients/python/selftest.py
 *   는 여전히 «Python 이 있는 기계에서» 사람이 돌려야 한다(파일 머리글 참고).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const js길 = fileURLToPath(new URL('../clients/js/seoulmarkets.mjs', import.meta.url));
const py길 = fileURLToPath(new URL('../clients/python/seoulmarkets.py', import.meta.url));

const camel원뱀 = (s) => s.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());

test('🔴 JS 클라이언트의 모든 공개 메서드가 Python 클라이언트에도 (snake_case 로) 있다', () => {
  const js = fs.readFileSync(js길, 'utf8');
  const py = fs.readFileSync(py길, 'utf8');

  const js메서드 = [...js.matchAll(/^\s{2}(?:async\s+)?(\w+)\(/gm)]
    .map((m) => m[1])
    .filter((n) => n !== 'constructor');
  assert.ok(js메서드.length > 5, 'JS 메서드를 못 읽었다 — 정규식이 파일 구조와 어긋났다');

  const py메서드 = new Set(
    [...py.matchAll(/^\s{4}def (\w+)\(/gm)].map((m) => m[1]).filter((n) => !n.startsWith('_')),
  );

  const 빠진것 = js메서드.filter((m) => !py메서드.has(camel원뱀(m)));
  assert.deepStrictEqual(빠진것, [], 'Python 클라이언트에 없는 JS 메서드: ' + 빠진것.join(', '));
});
