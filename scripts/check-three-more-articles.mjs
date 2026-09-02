/**
 * 2026-08-08 03:4x 에 낸 **세 편**을 자료에 대고 맞춘다. (2번 지시 — 32 → 35편)
 *
 *   korean-casting-barely-repeats-itself           people   — 짝이 두 번 만나나
 *   music-and-broadcast-exports-are-the-same-size  industry — 두 수출이 같은 크기인가
 *   what-it-costs-to-be-top-300                    esports  — 같은 등수, 다른 LP
 *
 * ⛔ 수를 손으로 안 적는다. 자료에서 **다시 세서** 기사와 맞춘다.
 * ⚠ 셋 다 「우리가 못 재는 것」을 같이 말한다. 그 문장이 사라지면 그것도 잡는다.
 */
import fs from 'node:fs';
/* ⭐ 귀무모형은 «자로» 다시 센다 — 수를 이 파일에 손으로 적지 않는다 */
import { 재기 } from './measure-kcw-casting-shuffle.mjs';

const CD = 'content/kculturewire';
const 읽기 = (slug) => {
  const 원 = fs.readFileSync(`${CD}/${slug}.md`, 'utf8');
  return { 원, 한줄: 원.replace(/\s+/g, ' ') };
};
const 천 = (n) => Number(n).toLocaleString('en-US');
/** 기사는 문장 첫머리 수를 낱말로 쓴다. 숫자와 낱말을 **둘 다** 받는다. */
const 낱 = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen'];
/** ⚠ 기사의 음수 부호는 **U+2212(−)**, 계산 결과는 ASCII 하이픈이다. 둘 다 받는다. */
const 부호무시 = (s) => String(s).replace(/[−–—]/g, '-');
/** 백만 단위 표기 — `$381.0m` 처럼 **소수 한 자리를 그대로** 쓴다. Number 로 감싸면 .0 이 사라진다. */
const 백만 = (v) => `$${(v / 1000).toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}m`;

/** 한 작품에 같이 이름을 올린 두 사람 — 몇 번 만났나. */
export function 짝세기(작품별출연) {
  const m = new Map();
  for (const ns of 작품별출연) {
    const s = [...new Set(ns)].sort();
    for (let i = 0; i < s.length; i++) {
      for (let j = i + 1; j < s.length; j++) m.set(`${s[i]}|${s[j]}`, (m.get(`${s[i]}|${s[j]}`) || 0) + 1);
    }
  }
  return m;
}

if (process.argv[1] && process.argv[1].endsWith('check-three-more-articles.mjs')) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험++; if (참) 통과++; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  자가('두 사람이 한 번 만나면 짝 하나', 짝세기([['a', 'b']]).size === 1);
  자가('세 사람이면 짝 셋', 짝세기([['a', 'b', 'c']]).size === 3);
  자가('두 번 만나면 2', 짝세기([['a', 'b'], ['a', 'b']]).get('a|b') === 2);
  자가('한 작품에 두 번 적혀도 한 번', 짝세기([['a', 'b', 'a']]).get('a|b') === 1);
  console.log(`더 낸 세 편 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  let 틀림 = 0;
  const 본다 = (무엇, ok, 값) => { if (!ok) 틀림++; console.log(`${ok ? '  ' : '❌'} ${String(무엇).padEnd(30)} ${값}`); };

  /* ── ① 짝이 두 번 만나나 ── */
  {
    const { 한줄, 원 } = 읽기('korean-casting-barely-repeats-itself');
    const c = JSON.parse(fs.readFileSync('archive/raw/netflix-top10/korean-cast-joined.json', 'utf8'));
    const 사람 = Object.values(c.배우);
    /**
     * 🔴 [2026-09-03] 여기서 사람을 **이름**으로 묶고 있었다 — `작품.get(q).push(p.이름)`.
     *   같은 이름을 쓰는 다른 사람이 하나로 뭉쳐져 짝 수가 14,144 → 14,140 으로 줄었다.
     *   ⚠ 우리 원칙은 「사람과 작품은 **Q번호**로 잇는다, 제목·이름 글자로 안 잇는다」다
     *     (같은 이름 문제를 `wikitip-people.json` 의 `sameNameSplit` 에서 이미 다룬다).
     *   ⇒ 열쇠로 묶는다. 수가 0.03% 움직이지만, 두 군데가 다른 방식으로 세는 것이 더 나쁘다 —
     *     `measure-kcw-casting-shuffle.mjs` 가 귀무모형을 «열쇠로» 세기 때문이다.
     *     시점도 방식도 같아야 두 수를 견줄 수 있다.
     */
    const 작품 = new Map();
    for (const [열쇠, p] of Object.entries(c.배우)) {
      for (const q of p.작품) { if (!작품.has(q)) 작품.set(q, []); 작품.get(q).push(열쇠); }
    }
    const 짝 = 짝세기([...작품.values()]);
    const v = [...짝.values()];
    const 자리 = [...작품.values()].reduce((s, a) => s + a.length, 0);
    본다('① 작품·사람·자리', 한줄.includes(`**${작품.size} titles, ${천(사람.length)} people, ${천(자리)} credited roles**`),
      `${작품.size} · ${사람.length} · ${자리}`);
    본다('① 짝·2회 이상', 한줄.includes(`**${천(짝.size)} distinct pairs**`) && 한줄.includes(`**${v.filter((x) => x > 1).length} have worked together more than once.**`),
      `${짝.size} · ${v.filter((x) => x > 1).length}`);
    본다('① 몫', 한줄.includes(`**${(+((100 * v.filter((x) => x > 1).length) / 짝.size).toFixed(1))}%**`),
      `${(100 * v.filter((x) => x > 1).length / 짝.size).toFixed(1)}%`);
    for (const [n, 말] of [[1, 'Once'], [2, 'Twice'], [3, 'Three times'], [4, 'Four times']]) {
      const 수 = v.filter((x) => x === n).length;
      본다(`① 표 ${말}`, new RegExp(`\\| ${말} \\| ${천(수)} \\|`).test(원), 수);
    }
    본다('① 다섯 번은 없다', Math.max(...v) === 4 && /same person five times/.test(한줄), `최다 ${Math.max(...v)}`);
    /* 이름을 댄 두 짝이 정말 네 번인가.
       ⚠ [2026-09-03] 짝 열쇠가 «이름»에서 «Q번호»로 바뀌었다(위 주석 참고).
         그래서 이름 → 열쇠 표를 만들어 찾는다. 기사는 사람 이름으로 말하고
         자료는 열쇠로 잇는다 — 둘을 잇는 자리가 여기다. */
    const 이름열쇠 = new Map(Object.entries(c.배우).map(([열쇠, p]) => [p.이름, 열쇠]));
    for (const [a, b] of [['Jo Woo-jin', 'Kim Eui-sung'], ['Ma Dong-seok', 'Park Ji-hwan']]) {
      const ka = 이름열쇠.get(a);
      const kb = 이름열쇠.get(b);
      const k = ka && kb ? [ka, kb].sort().join('|') : null;
      본다(`① 짝 «${a}»`, 짝.get(k) === 4 && 한줄.includes(a) && 한줄.includes(b),
        k ? 짝.get(k) : `이름을 열쇠로 못 바꿨다(${a}·${b})`);
    }
    /**
     * 🔴 [2026-09-03] 여기 귀무모형 수(208·1.2배)가 **손으로 박혀** 있었다.
     *   자료가 바뀌면 자와 기사가 «같이» 틀린다 — 이 파일이 다른 자리에 적어 둔 바로 그 함정이다.
     *   ⇒ `measure-kcw-casting-shuffle.mjs` 로 **다시 세서** 기사가 그 수를 말하는지 본다.
     *   ⚠ 씨앗을 못박아 두었으므로 돌릴 때마다 같은 답이 나온다.
     */
    const 섞어잰것 = 재기([...작품.values()]);
    본다('① 귀무모형을 말하나',
      한줄.includes(`median of ${섞어잰것.중앙}`) && 한줄.includes(`${섞어잰것.배수} times chance`),
      `중앙 ${섞어잰것.중앙} · ${섞어잰것.배수}배`);
    본다('① 어느 쪽으로 틀리나', /higher than\s*1\.8%, not lower/.test(한줄), '방향 적음');
  }

  /* ── ② 두 수출이 같은 크기인가 ── */
  {
    const { 한줄, 원 } = 읽기('music-and-broadcast-exports-are-the-same-size');
    const b = JSON.parse(fs.readFileSync('src/data/wikitip-broadcast-export.json', 'utf8'));
    const m = JSON.parse(fs.readFileSync('src/data/wikitip-music-export.json', 'utf8'));
    const mm = new Map(m.rows.map((r) => [r.year, r.total]));
    const 해 = b.rows.map((r) => r.year).filter((y) => mm.has(y));
    본다('② 겹치는 해', 한줄.includes(`${해.length} years`) || /thirteen years/.test(한줄), 해.length);
    const 비 = 해.map((y) => mm.get(y) / b.rows.find((r) => r.year === y).total);
    const 안 = 비.filter((x) => x >= 0.8 && x <= 1.2).length;
    본다('② 20% 안에 든 해',
      new RegExp(`\\*\\*(${안}|${낱[안]}) of the (${해.length}|${낱[해.length]}) years the two are within 20%`).test(한줄),
      `${안}/${해.length}`);
    본다('② 음악이 큰 해', 한줄.includes(`above 1 in\n${['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'][비.filter((x) => x > 1).length] ?? 'x'} years`.replace('\n', ' '))
      || 한줄.includes(`above 1 in ${['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'][비.filter((x) => x > 1).length] ?? 'x'} years`),
    비.filter((x) => x > 1).length);
    /* 표 다섯 줄 */
    for (const y of [2012, 2015, 2018, 2021, 2024]) {
      const B = b.rows.find((r) => r.year === y).total; const M = mm.get(y);
      const 줄 = 원.split('\n').find((l) => l.startsWith(`| ${y} |`));
      const ok = !!줄 && 줄.includes(백만(B)) && 줄.includes(백만(M)) && 줄.includes((M / B).toFixed(2));
      본다(`② 표 ${y}`, ok, `${(B / 1000).toFixed(1)} · ${(M / 1000).toFixed(1)} · ${(M / B).toFixed(2)}`);
    }
    /* 성장률 상관 */
    const B = 해.map((y) => b.rows.find((r) => r.year === y).total); const M = 해.map((y) => mm.get(y));
    const gb = []; const gm = [];
    for (let i = 1; i < 해.length; i++) { gb.push((100 * (B[i] - B[i - 1])) / B[i - 1]); gm.push((100 * (M[i] - M[i - 1])) / M[i - 1]); }
    const r = (() => {
      const n = gb.length; const mx = gb.reduce((a, c) => a + c, 0) / n; const my = gm.reduce((a, c) => a + c, 0) / n;
      let c = 0; let sx = 0; let sy = 0;
      for (let i = 0; i < n; i++) { c += (gb[i] - mx) * (gm[i] - my); sx += (gb[i] - mx) ** 2; sy += (gm[i] - my) ** 2; }
      return (c / Math.sqrt(sx * sy)).toFixed(2);
    })();
    본다('② 성장률 상관', 부호무시(한줄).includes(`r = ${r}`), r);
    const 반대 = gb.filter((x, i) => Math.sign(x) !== Math.sign(gm[i])).length;
    본다('② 반대로 간 해', new RegExp(`(${반대}|${낱[반대]}) of (${gb.length}|${낱[gb.length]})`).test(한줄), `${반대}/${gb.length}`);
    본다('② 2024 비율', 한줄.includes(`**${(mm.get(2024) / b.rows.find((x) => x.year === 2024).total).toFixed(2)} in 2024**`),
      (mm.get(2024) / b.rows.find((x) => x.year === 2024).total).toFixed(2));
    본다('② 게임은 뺐다고 말하나', /Games are larger than both/.test(한줄), '문장 있음');
  }

  /**
   * ── ③ 같은 등수, 다른 LP ── 🔴 [2026-09-01] **이 검사를 걷어냈다.**
   *
   * 재던 기사 `what-it-costs-to-be-top-300` 과 자료 `wikitip-ladder-gap.json`,
   * 원자료 `archive/raw/riot-ladder/` 가 **사장님 지시로 다 사라졌다.**
   * ⛔ 검사만 남겨 두면 파일이 없어 자가 죽고, 그러면 **위의 ①·② 도 같이 침묵한다.**
   *   (검사 묶음은 끝까지 돌아야 검사다 — 앞에서 죽으면 뒤가 안 돈다.)
   * ⚠ 그래서 자를 통째로 지우지 않고 ③만 뗐다. ①·② 두 편은 살아 있고 계속 지켜야 한다.
   */

  if (틀림) { console.error(`\n❌ ${틀림}개가 기사와 자료가 어긋난다. 자를 먼저 의심한다.`); process.exit(1); }
  console.log('\n✅ 더 낸 세 편 전부 기사와 자료가 맞는다');
}
