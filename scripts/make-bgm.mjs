#!/usr/bin/env node
/**
 * make-bgm.mjs — **숏영상에 깔 배경음악을 만든다.**
 *
 * 🔴 사장님(2026-08-09 02:2x) — *「숓영상에 목소리를 넣자. 배경음악은 네가 만들어」*
 * 🔴 사장님(2026-08-09 08:3x) — *「배경음악 장르의 느낌을 더 느낄 수 있도록 해」*
 *
 * ## ⛔ 첫 판이 왜 밋밋했나 — 적어 둔다
 * ```
 * 첫 판   네 결이 **화음과 빠르기만** 달랐다. 소리 내는 방식은 똑같았다
 *         (깔개 + 구슬, 둘 다 사인파, 퍼커션 **없음**, 베이스 **없음**)
 * ⛔ 그래서 넷이 다 「잔잔한 무엇」으로 들렸다. **장르를 가르는 것은 화음이 아니다**
 * ```
 * ⭐ 장르를 가르는 것은 **① 리듬 ② 악기 소리 ③ 저음** 셋이다. 그래서 셋을 새로 지었다.
 *
 * ```
 * 백년지도      어쿠스틱 — 부드러운 킥·쉐이커, 걷는 듯한 베이스, 나무 소리 아르페지오
 * 케이컬쳐와이어 신스팝  — 또렷한 킥·클랩·하이햇, 튕기는 신스 플럭, 굵은 신스 베이스
 * 서울마켓츠     또렷함  — 퍼커션은 째깍 하나, 마림바 스타카토, 짧은 울림
 * 케이라이프맵   앰비언트 — 퍼커션 없음, 긴 울림, 낮은 드론, 느리게 부푸는 소리
 * ```
 *
 * 쓰는 법
 *   node scripts/make-bgm.mjs --결 백년지도 --초 14 --낼곳 out/bgm.m4a
 *   node scripts/make-bgm.mjs --자가시험
 *
 * ⚠ 깃발이 `--자가시험` 이다. `--selftest` 로 하면 **가져다 쓰는 쪽 검사를 가로챈다.**
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

export const 소리결 = 48000;

/** 반음 수를 진동수로. 0 = 가온 도(261.63Hz) */
export const 음높이 = (반음) => 261.625565 * Math.pow(2, 반음 / 12);

/* ──────────────────────────────────────────────────────────────
 * 결 — ⭐ 화음만이 아니라 **편성·리듬·울림**이 다르다
 *
 * 리듬은 한 마디를 **열여섯 칸**으로 적는다. `1` 이면 친다.
 * ────────────────────────────────────────────────────────────── */

export const 결 = {
  백년지도: {
    이름: '따뜻하고 앞으로 나아가는 (어쿠스틱)',
    빠르기: 84,
    화음: [[0, 4, 7], [-5, 0, 4], [-3, 0, 4], [-7, -3, 0]],
    구슬: [0, 2, 4, 7, 9, 12],
    맑기: 2600,
    울림: 0.30,
    편성: { 깔개: 0.13, 나무: 0.10, 베이스: 0.16, 플럭: 0, 마림바: 0, 드론: 0 },
    리듬: {
      킥:   '1000000010000000',   // 두 번만 — 걷는 걸음
      쉐이커: '0010001000100010',
      하햇: '', 클랩: '', 째깍: '',
    },
    베이스무늬: '1000000010000000',
    킥세기: 0.20, 쉐이커세기: 0.055,
  },

  케이컬쳐와이어: {
    이름: '밝고 통통 튀는 (신스팝)',
    빠르기: 104,
    화음: [[0, 4, 7], [-3, 0, 4], [-7, -3, 0], [-5, -1, 2]],
    구슬: [0, 2, 4, 7, 9, 12, 14, 16],
    맑기: 4200,
    울림: 0.18,
    편성: { 깔개: 0.07, 나무: 0, 베이스: 0.20, 플럭: 0.13, 마림바: 0, 드론: 0 },
    리듬: {
      킥:   '1000000010000000',
      클랩: '0000100000001000',
      하햇: '0010101000101010',
      쉐이커: '', 째깍: '',
    },
    베이스무늬: '1001001010010010',   // 튕기는 저음
    킥세기: 0.28, 하햇세기: 0.05, 클랩세기: 0.10,
  },

  서울마켓츠: {
    이름: '차분하고 또렷한 (마림바)',
    빠르기: 88,
    화음: [[0, 3, 7], [-5, -2, 0], [-4, 0, 3], [-7, -4, 0]],
    구슬: [0, 3, 5, 7, 10, 12],
    맑기: 3000,
    울림: 0.12,                        // ⭐ 짧게 — 또렷해야 한다
    편성: { 깔개: 0.06, 나무: 0, 베이스: 0.11, 플럭: 0, 마림바: 0.14, 드론: 0 },
    리듬: {
      째깍: '1000100010001000',        // 시계처럼 하나만
      킥: '', 하햇: '', 클랩: '', 쉐이커: '',
    },
    베이스무늬: '1000000000001000',
    째깍세기: 0.035,
  },

  케이라이프맵: {
    이름: '잔잔하고 깊은 (앰비언트)',
    빠르기: 62,
    화음: [[0, 3, 7], [-4, 0, 3], [-7, -3, 0], [-9, -5, -2]],
    구슬: [0, 3, 7, 10, 12, 15],
    맑기: 1700,
    울림: 0.52,                        // ⭐ 길게 — 방이 넓게 들려야 한다
    편성: { 깔개: 0.16, 나무: 0, 베이스: 0, 플럭: 0, 마림바: 0, 드론: 0.10 },
    리듬: { 킥: '', 하햇: '', 클랩: '', 쉐이커: '', 째깍: '' },   // ⛔ 퍼커션 없음
    베이스무늬: '',
  },
};

/* ──────────────────────────────────────────────────────────────
 * 소리 — 밖에서 받아 오는 것이 하나도 없다
 * ────────────────────────────────────────────────────────────── */

/** 앞은 부드럽게 들어오고 뒤는 부드럽게 빠진다. ⛔ 안 하면 「딱」 소리가 난다 */
export function 감쌈(i, 길이, 들이 = 0.2, 빠짐 = 0.5) {
  const 들칸 = Math.max(1, Math.floor(들이 * 소리결));
  const 뺄칸 = Math.max(1, Math.floor(빠짐 * 소리결));
  if (i < 들칸) return i / 들칸;
  if (i > 길이 - 뺄칸) return Math.max(0, (길이 - i) / 뺄칸);
  return 1;
}

/** 씨앗으로만 도는 잡음 — ⛔ Math.random 을 안 쓴다. 같은 결은 늘 같은 소리여야 한다 */
export function 잡음만들기(칸수, 씨 = 12345) {
  const 소리 = new Float64Array(칸수);
  let s = 씨 >>> 0;
  for (let i = 0; i < 칸수; i += 1) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    소리[i] = (s / 4294967296) * 2 - 1;
  }
  return 소리;
}

/** 깔개 — 화음을 길게 깐다. 살짝 어긋난 셋을 겹쳐야 얇지 않다 */
export function 깔개(칸수, 진동수, 세기) {
  const 소리 = new Float64Array(칸수);
  const 어긋 = [1, 1.0013, 0.9987];
  for (let k = 0; k < 어긋.length; k += 1) {
    const w = (2 * Math.PI * 진동수 * 어긋[k]) / 소리결;
    for (let i = 0; i < 칸수; i += 1) {
      const t = w * i;
      소리[i] += (Math.sin(t) + 0.28 * Math.sin(2 * t) + 0.1 * Math.sin(3 * t)) / 어긋.length;
    }
  }
  for (let i = 0; i < 칸수; i += 1) 소리[i] *= 세기 * 감쌈(i, 칸수, 0.35, 0.9);
  return 소리;
}

/** 구슬 — 톡 치고 사그라든다 (모든 결에 조금씩 들어간다) */
export function 구슬(칸수, 진동수, 세기) {
  const 소리 = new Float64Array(칸수);
  const w = (2 * Math.PI * 진동수) / 소리결;
  for (let i = 0; i < 칸수; i += 1) {
    const 사그 = Math.exp(-i / (소리결 * 0.28));
    소리[i] = (Math.sin(w * i) + 0.35 * Math.sin(2.01 * w * i) * 사그) * 사그 * 세기;
  }
  return 소리;
}

/** ⭐ 나무 소리 — 어쿠스틱. 배음이 홀수로 서고 빨리 죽는다 */
export function 나무(칸수, 진동수, 세기) {
  const 소리 = new Float64Array(칸수);
  const w = (2 * Math.PI * 진동수) / 소리결;
  for (let i = 0; i < 칸수; i += 1) {
    const 사그 = Math.exp(-i / (소리결 * 0.42));
    소리[i] = (Math.sin(w * i) + 0.30 * Math.sin(3 * w * i) * 사그 + 0.12 * Math.sin(5 * w * i) * 사그 * 사그)
      * 사그 * 세기;
  }
  return 소리;
}

/** ⭐ 마림바 — 나무보다 더 빨리 죽고 배음이 하나(4배)만 또렷하다 */
export function 마림바(칸수, 진동수, 세기) {
  const 소리 = new Float64Array(칸수);
  const w = (2 * Math.PI * 진동수) / 소리결;
  for (let i = 0; i < 칸수; i += 1) {
    const 사그 = Math.exp(-i / (소리결 * 0.16));
    const 빠른사그 = Math.exp(-i / (소리결 * 0.045));
    소리[i] = (Math.sin(w * i) * 사그 + 0.5 * Math.sin(4 * w * i) * 빠른사그) * 세기;
  }
  return 소리;
}

/** ⭐ 플럭 — 신스. 톱니를 깎아 튕기는 소리를 만든다 */
export function 플럭(칸수, 진동수, 세기) {
  const 소리 = new Float64Array(칸수);
  const 주기 = 소리결 / 진동수;
  for (let i = 0; i < 칸수; i += 1) {
    const 사그 = Math.exp(-i / (소리결 * 0.13));
    const 톱니 = 2 * ((i % 주기) / 주기) - 1;
    소리[i] = 톱니 * 사그 * 세기;
  }
  return 맑기깎기(소리, 2400 + 6000 * Math.exp(-1));   // 처음엔 밝고 곧 어두워진다
}

/** ⭐ 베이스 — 낮고 두껍게. 사각파를 깎는다 */
export function 베이스(칸수, 진동수, 세기, 신스 = false) {
  const 소리 = new Float64Array(칸수);
  const w = (2 * Math.PI * 진동수) / 소리결;
  for (let i = 0; i < 칸수; i += 1) {
    const 사그 = Math.exp(-i / (소리결 * (신스 ? 0.22 : 0.45)));
    const 바탕 = 신스
      ? Math.sign(Math.sin(w * i)) * 0.6 + Math.sin(w * i) * 0.4
      : Math.sin(w * i) + 0.22 * Math.sin(2 * w * i);
    소리[i] = 바탕 * 사그 * 세기;
  }
  return 맑기깎기(소리, 신스 ? 900 : 600);
}

/** ⭐ 드론 — 앰비언트. 아주 낮게 계속 깔리고 천천히 부푼다 */
export function 드론(칸수, 진동수, 세기) {
  const 소리 = new Float64Array(칸수);
  const w = (2 * Math.PI * 진동수) / 소리결;
  const 부푸는속도 = (2 * Math.PI * 0.07) / 소리결;      // 14초에 한 번쯤 부푼다
  for (let i = 0; i < 칸수; i += 1) {
    const 부품 = 0.65 + 0.35 * Math.sin(부푸는속도 * i);
    소리[i] = (Math.sin(w * i) + 0.4 * Math.sin(2.002 * w * i)) * 부품 * 세기;
  }
  return 맑기깎기(소리, 700);
}

/* ── 퍼커션 ── */

/** ⭐ 킥 — 음이 아래로 훅 떨어진다. 그래서 「퉁」 하고 들린다 */
export function 킥(칸수, 세기, 부드럽게 = false) {
  const 소리 = new Float64Array(칸수);
  const 처음 = 부드럽게 ? 110 : 145;
  const 끝 = 부드럽게 ? 42 : 48;
  let 위상 = 0;
  for (let i = 0; i < 칸수; i += 1) {
    const t = i / 소리결;
    const 진동수 = 끝 + (처음 - 끝) * Math.exp(-t / (부드럽게 ? 0.035 : 0.022));
    위상 += (2 * Math.PI * 진동수) / 소리결;
    const 사그 = Math.exp(-t / (부드럽게 ? 0.20 : 0.14));
    소리[i] = Math.sin(위상) * 사그 * 세기;
  }
  return 소리;
}

/** ⭐ 하이햇 — 높은 잡음을 아주 짧게 */
export function 하햇(칸수, 세기, 씨 = 7) {
  const n = 잡음만들기(칸수, 씨);
  const 소리 = new Float64Array(칸수);
  for (let i = 0; i < 칸수; i += 1) 소리[i] = n[i] * Math.exp(-i / (소리결 * 0.018)) * 세기;
  return 높이깎기(소리, 6000);
}

/** ⭐ 쉐이커 — 하이햇보다 부드럽고 조금 길다 */
export function 쉐이커(칸수, 세기, 씨 = 13) {
  const n = 잡음만들기(칸수, 씨);
  const 소리 = new Float64Array(칸수);
  for (let i = 0; i < 칸수; i += 1) 소리[i] = n[i] * Math.exp(-i / (소리결 * 0.045)) * 세기;
  return 맑기깎기(높이깎기(소리, 3000), 9000);
}

/** ⭐ 클랩 — 잡음을 네 번 겹쳐 친다. 그래서 손뼉처럼 들린다 */
export function 클랩(칸수, 세기, 씨 = 29) {
  const n = 잡음만들기(칸수, 씨);
  const 소리 = new Float64Array(칸수);
  const 늦 = [0, 0.009, 0.017, 0.024].map((s) => Math.floor(s * 소리결));
  for (let k = 0; k < 늦.length; k += 1) {
    const d = 늦[k];
    for (let i = d; i < 칸수; i += 1) {
      소리[i] += n[i - d] * Math.exp(-(i - d) / (소리결 * (k === 3 ? 0.10 : 0.012))) * 세기 * (k === 3 ? 0.7 : 1);
    }
  }
  return 맑기깎기(높이깎기(소리, 1200), 7000);
}

/** ⭐ 째깍 — 아주 짧은 나무 소리 하나. 시계처럼 */
export function 째깍(칸수, 세기, 씨 = 41) {
  const n = 잡음만들기(칸수, 씨);
  const 소리 = new Float64Array(칸수);
  for (let i = 0; i < 칸수; i += 1) 소리[i] = n[i] * Math.exp(-i / (소리결 * 0.006)) * 세기;
  return 맑기깎기(높이깎기(소리, 2000), 8000);
}

/* ── 소리 다듬기 ── */

/** 높은 소리를 깎는다(로우패스) */
export function 맑기깎기(소리, 자름) {
  const rc = 1 / (2 * Math.PI * 자름);
  const a = (1 / 소리결) / (rc + 1 / 소리결);
  const 나온것 = new Float64Array(소리.length);
  let 앞 = 0;
  for (let i = 0; i < 소리.length; i += 1) { 앞 += a * (소리[i] - 앞); 나온것[i] = 앞; }
  return 나온것;
}

/** 낮은 소리를 깎는다(하이패스) — ⛔ 퍼커션이 웅웅거리면 말이 안 들린다 */
export function 높이깎기(소리, 자름) {
  const rc = 1 / (2 * Math.PI * 자름);
  const dt = 1 / 소리결;
  const a = rc / (rc + dt);
  const 나온것 = new Float64Array(소리.length);
  let 앞입력 = 0, 앞출력 = 0;
  for (let i = 0; i < 소리.length; i += 1) {
    나온것[i] = a * (앞출력 + 소리[i] - 앞입력);
    앞입력 = 소리[i]; 앞출력 = 나온것[i];
  }
  return 나온것;
}

/** 방에서 울리는 느낌 — 결마다 양이 다르다 */
export function 울림(소리, 세기 = 0.26) {
  if (세기 <= 0) return Float64Array.from(소리);
  const 늦 = [0.031, 0.057, 0.089, 0.131].map((s) => Math.floor(s * 소리결));
  const 나온것 = Float64Array.from(소리);
  for (let k = 0; k < 늦.length; k += 1) {
    const d = 늦[k];
    const g = 세기 * Math.pow(0.62, k);
    for (let i = d; i < 소리.length; i += 1) 나온것[i] += 나온것[i - d] * g;
  }
  return 나온것;
}

/* ──────────────────────────────────────────────────────────────
 * 곡
 * ────────────────────────────────────────────────────────────── */

/** 한 마디 열여섯 칸 무늬에서 치는 자리만 뽑는다 */
export function 칠자리(무늬) {
  const 글 = String(무늬 ?? '');
  const 자리 = [];
  for (let i = 0; i < 글.length; i += 1) if (글[i] === '1') 자리.push(i);
  return 자리;
}

/**
 * 한 곡을 만든다.
 * ⛔ **크게 만들지 않는다.** 목소리가 주인공이다 — 이 소리는 그 아래에 깔린다.
 */
export function 곡만들기(결이름, 초, { 셈 = 0 } = {}) {
  const g = 결[결이름];
  if (!g) throw new Error(`⛔ 모르는 결: ${결이름} (있는 것: ${Object.keys(결).join(', ')})`);
  const 칸수 = Math.max(1, Math.floor(초 * 소리결));
  const 왼 = new Float64Array(칸수);
  const 오 = new Float64Array(칸수);
  const 편 = g.편성;

  const 한마디 = (60 / g.빠르기) * 4;
  const 한칸 = 한마디 / 16;
  const 마디수 = Math.ceil(초 / 한마디);

  const 얹기 = (소리, 시작, 왼몫 = 1, 오몫 = 1) => {
    const 끝 = Math.min(소리.length, 칸수 - 시작);
    for (let i = 0; i < 끝; i += 1) { 왼[시작 + i] += 소리[i] * 왼몫; 오[시작 + i] += 소리[i] * 오몫; }
  };

  // ⭐ 드론은 마디와 상관없이 통째로 깔린다
  if (편.드론 > 0) {
    const d = 드론(칸수, 음높이(g.화음[0][0] - 24), 편.드론);
    얹기(d, 0);
  }

  for (let m = 0; m < 마디수; m += 1) {
    const 마디시작 = Math.floor(m * 한마디 * 소리결);
    if (마디시작 >= 칸수) break;
    const 화 = g.화음[m % g.화음.length];
    const 칸 = (k) => 마디시작 + Math.floor(k * 한칸 * 소리결);

    // ① 깔개
    if (편.깔개 > 0) {
      for (const 반음 of 화) {
        const 길 = Math.min(Math.floor(한마디 * 1.15 * 소리결), 칸수 - 마디시작);
        if (길 <= 0) continue;
        얹기(맑기깎기(깔개(길, 음높이(반음 - 12), 편.깔개), g.맑기), 마디시작, 0.92, 1);
      }
    }

    // ② 저음
    if (편.베이스 > 0) {
      const 신스 = 결이름 === '케이컬쳐와이어';
      for (const k of 칠자리(g.베이스무늬)) {
        const 자리 = 칸(k);
        if (자리 >= 칸수) break;
        const 길 = Math.min(Math.floor(한칸 * 4 * 소리결), 칸수 - 자리);
        얹기(베이스(길, 음높이(화[0] - 24), 편.베이스, 신스), 자리);
      }
    }

    // ③ 가락 — 결마다 악기가 다르다
    const 가락악기 = 편.플럭 > 0 ? 플럭 : 편.마림바 > 0 ? 마림바 : 편.나무 > 0 ? 나무 : 구슬;
    const 가락세기 = 편.플럭 || 편.마림바 || 편.나무 || 0.085;
    const 가락자리 = 편.마림바 > 0 ? [0, 6, 10] : 편.플럭 > 0 ? [0, 3, 6, 8, 11, 14] : [0, 4, 7, 10, 13];
    for (let b = 0; b < 가락자리.length; b += 1) {
      const 자리 = 칸(가락자리[b]);
      if (자리 >= 칸수) break;
      const 반음 = g.구슬[(m * 3 + b * 2 + 셈) % g.구슬.length];
      const 길 = Math.min(Math.floor(0.8 * 소리결), 칸수 - 자리);
      if (길 <= 0) continue;
      const 쪽 = b % 2 === 0 ? 0.78 : 1;
      얹기(가락악기(길, 음높이(반음 + 12), 가락세기), 자리, 쪽, 1.78 - 쪽);
    }

    // ④ 퍼커션
    const 퍼 = [
      ['킥', g.리듬.킥, (n) => 킥(n, g.킥세기 ?? 0.22, 결이름 === '백년지도')],
      ['하햇', g.리듬.하햇, (n) => 하햇(n, g.하햇세기 ?? 0.05, 7 + m)],
      ['쉐이커', g.리듬.쉐이커, (n) => 쉐이커(n, g.쉐이커세기 ?? 0.055, 13 + m)],
      ['클랩', g.리듬.클랩, (n) => 클랩(n, g.클랩세기 ?? 0.10, 29 + m)],
      ['째깍', g.리듬.째깍, (n) => 째깍(n, g.째깍세기 ?? 0.035, 41 + m)],
    ];
    for (const [, 무늬, 짓기] of 퍼) {
      if (!무늬) continue;
      for (const k of 칠자리(무늬)) {
        const 자리 = 칸(k);
        if (자리 >= 칸수) break;
        const 길 = Math.min(Math.floor(0.35 * 소리결), 칸수 - 자리);
        if (길 <= 0) continue;
        얹기(짓기(길), 자리);
      }
    }
  }

  const 왼울 = 울림(왼, g.울림);
  const 오울 = 울림(오, g.울림);
  for (let i = 0; i < 칸수; i += 1) {
    const e = 감쌈(i, 칸수, 0.6, 1.2);
    왼울[i] *= e; 오울[i] *= e;
  }
  return { 왼: 왼울, 오: 오울 };
}

/** 제일 큰 소리를 정해진 높이에 맞춘다. ⭐ 0.16 = 말 아래로 들어가는 높이 */
export function 높이맞추기(왼, 오, 목표 = 0.16) {
  let 꼭 = 0;
  for (let i = 0; i < 왼.length; i += 1) 꼭 = Math.max(꼭, Math.abs(왼[i]), Math.abs(오[i]));
  if (꼭 === 0) return 1;
  return 목표 / 꼭;
}

/* ── 파일로 굽기 ── */

/** 16비트 스테레오 WAV 로 만든다 */
export function 웨이브(왼, 오, 곱 = 1) {
  const 칸수 = 왼.length;
  const 몸 = Buffer.alloc(칸수 * 4);
  for (let i = 0; i < 칸수; i += 1) {
    const l = Math.max(-1, Math.min(1, 왼[i] * 곱));
    const r = Math.max(-1, Math.min(1, 오[i] * 곱));
    몸.writeInt16LE(Math.round(l * 32767), i * 4);
    몸.writeInt16LE(Math.round(r * 32767), i * 4 + 2);
  }
  const 머리 = Buffer.alloc(44);
  머리.write('RIFF', 0); 머리.writeUInt32LE(36 + 몸.length, 4); 머리.write('WAVE', 8);
  머리.write('fmt ', 12); 머리.writeUInt32LE(16, 16); 머리.writeUInt16LE(1, 20);
  머리.writeUInt16LE(2, 22); 머리.writeUInt32LE(소리결, 24);
  머리.writeUInt32LE(소리결 * 4, 28); 머리.writeUInt16LE(4, 32); 머리.writeUInt16LE(16, 34);
  머리.write('data', 36); 머리.writeUInt32LE(몸.length, 40);
  return Buffer.concat([머리, 몸]);
}

export const ff = () => {
  const require = createRequire(path.join(process.cwd(), 'package.json'));
  return require('ffmpeg-static');
};

/* ──────────────────────────────────────────────────────────────
 * 검사 — ⛔ 깃발이 `--자가시험`
 * ────────────────────────────────────────────────────────────── */
const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  let 통과 = 0, 실패 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(실제) : JSON.stringify(실제) === JSON.stringify(바람);
    if (ok) 통과 += 1; else { 실패 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제).slice(0, 120)}`); }
  };

  재본다('가온 도가 261.63Hz', Math.round(음높이(0) * 100) / 100, 261.63);
  재본다('한 옥타브 위는 두 배', Math.round(음높이(12)), Math.round(음높이(0) * 2));
  재본다('결이 넷 있다', Object.keys(결).length, 4);
  재본다('감쌈은 처음과 끝이 0에 가깝다', 감쌈(0, 48000) < 0.01 && 감쌈(47999, 48000) < 0.05, true);

  /* ── 🔴 사장님 「장르의 느낌을 더 느낄 수 있도록」 — 넷이 진짜로 다른가 ── */
  재본다('결마다 빠르기가 다르다',
    new Set(Object.values(결).map((g) => g.빠르기)).size, 4);
  재본다('결마다 울림이 다르다',
    new Set(Object.values(결).map((g) => g.울림)).size, 4);
  재본다('⭐ 결마다 편성이 다르다', (() => {
    const 짜임 = Object.values(결).map((g) =>
      Object.entries(g.편성).filter(([, v]) => v > 0).map(([k]) => k).sort().join(','));
    return new Set(짜임).size === 4;
  })(), true);
  재본다('⭐ 결마다 리듬이 다르다', (() => {
    const 무늬 = Object.values(결).map((g) => Object.values(g.리듬).join('|'));
    return new Set(무늬).size === 4;
  })(), true);
  재본다('⛔ 앰비언트에는 퍼커션이 없다',
    Object.values(결.케이라이프맵.리듬).every((v) => !v), true);
  재본다('⭐ 신스팝에는 퍼커션이 셋 있다',
    Object.values(결.케이컬쳐와이어.리듬).filter(Boolean).length, 3);
  재본다('⭐ 마림바 결에는 퍼커션이 하나뿐',
    Object.values(결.서울마켓츠.리듬).filter(Boolean).length, 1);
  재본다('리듬 무늬는 열여섯 칸이고 0과 1뿐', (() => {
    for (const g of Object.values(결)) {
      for (const v of Object.values(g.리듬)) { if (!v) continue; if (v.length !== 16 || /[^01]/.test(v)) return false; }
      if (g.베이스무늬 && (g.베이스무늬.length !== 16 || /[^01]/.test(g.베이스무늬))) return false;
    }
    return true;
  })(), true);
  재본다('칠자리를 제대로 읽는다', 칠자리('1000100010001000'), [0, 4, 8, 12]);
  재본다('빈 무늬는 안 친다', 칠자리(''), []);

  /* ── 소리가 진짜로 다른가 — 파형으로 잰다 ── */
  const 넷 = Object.keys(결).map((n) => ({ n, s: 곡만들기(n, 3) }));
  재본다('⭐ 네 결의 파형이 서로 다르다', (() => {
    for (let i = 0; i < 넷.length; i += 1) for (let j = i + 1; j < 넷.length; j += 1) {
      let 같나 = true;
      for (let k = 0; k < 넷[i].s.왼.length; k += 4800) {
        if (Math.abs(넷[i].s.왼[k] - 넷[j].s.왼[k]) > 1e-6) { 같나 = false; break; }
      }
      if (같나) return false;
    }
    return true;
  })(), true);
  /* ⭐ 퍼커션이 있으면 소리가 **들쭉날쭉**하고, 앰비언트는 **고르다**.
   *   그걸 「가장 큰 값 ÷ 평균」으로 잰다 — 리듬이 있는지 수로 확인한다 */
  const 뾰족함 = (소리) => {
    let 꼭 = 0, 합 = 0;
    for (let i = 0; i < 소리.length; i += 1) { const v = Math.abs(소리[i]); if (v > 꼭) 꼭 = v; 합 += v; }
    return 꼭 / ((합 / 소리.length) || 1e-9);
  };
  const 뾰 = Object.fromEntries(넷.map(({ n, s }) => [n, 뾰족함(s.왼)]));
  재본다('⭐ 신스팝이 앰비언트보다 들쭉날쭉하다', 뾰.케이컬쳐와이어 > 뾰.케이라이프맵, true);
  재본다('⭐ 앰비언트가 제일 고르다',
    Object.entries(뾰).every(([n, v]) => n === '케이라이프맵' || v > 뾰.케이라이프맵), true);

  /* ── 악기 하나하나 ── */
  재본다('킥은 음이 아래로 떨어진다', (() => {
    const k = 킥(Math.floor(0.3 * 소리결), 0.3);
    return Math.abs(k[100]) > 0 && Math.abs(k[k.length - 100]) < Math.abs(k[100]);
  })(), true);
  재본다('하이햇은 아주 짧다', (() => {
    const h = 하햇(Math.floor(0.3 * 소리결), 0.3);
    return Math.abs(h[Math.floor(0.005 * 소리결)]) > Math.abs(h[Math.floor(0.15 * 소리결)]) * 5;
  })(), true);
  재본다('클랩은 여러 번 겹쳐 친다', (() => {
    const c = 클랩(Math.floor(0.2 * 소리결), 0.3);
    let 봉우리 = 0;
    for (let i = 1; i < Math.floor(0.03 * 소리결); i += 1) {
      if (Math.abs(c[i]) > Math.abs(c[i - 1]) && Math.abs(c[i]) > 0.05) 봉우리 += 1;
    }
    return 봉우리 > 20;
  })(), true);
  재본다('잡음은 씨앗이 같으면 늘 같다', (() => {
    const a = 잡음만들기(100, 5), b = 잡음만들기(100, 5);
    return a.every((v, i) => v === b[i]);
  })(), true);
  재본다('잡음은 씨앗이 다르면 다르다', (() => {
    const a = 잡음만들기(100, 5), b = 잡음만들기(100, 6);
    return a.some((v, i) => v !== b[i]);
  })(), true);
  재본다('높이깎기가 낮은 소리를 줄인다', (() => {
    const 칸 = 소리결;
    const 낮은 = new Float64Array(칸);
    for (let i = 0; i < 칸; i += 1) 낮은[i] = Math.sin((2 * Math.PI * 60 * i) / 소리결);
    const 깎은 = 높이깎기(낮은, 3000);
    let a = 0, b = 0;
    for (let i = 1000; i < 칸; i += 1) { a += Math.abs(낮은[i]); b += Math.abs(깎은[i]); }
    return b < a * 0.2;
  })(), true);

  /* ── 크기·모양 ── */
  const 짧 = 곡만들기('백년지도', 2);
  재본다('길이가 초에 맞는다', 짧.왼.length, 2 * 소리결);
  재본다('소리가 실제로 난다', 짧.왼.some((v) => Math.abs(v) > 0.001), true);
  재본다('좌우가 다르다 — 넓게 들린다', 짧.왼.some((v, i) => Math.abs(v - 짧.오[i]) > 1e-9), true);
  const 곱 = 높이맞추기(짧.왼, 짧.오);
  let 꼭 = 0;
  for (let i = 0; i < 짧.왼.length; i += 1) 꼭 = Math.max(꼭, Math.abs(짧.왼[i] * 곱), Math.abs(짧.오[i] * 곱));
  재본다('높이를 맞추면 0.16 이 된다', Math.round(꼭 * 1000) / 1000, 0.16);
  재본다('말보다 작다 — 0.2 를 안 넘는다', 꼭 < 0.2, true);
  재본다('맨 앞이 조용하다', Math.abs(짧.왼[0]) < 0.001, true);
  재본다('맨 뒤가 조용하다', Math.abs(짧.왼[짧.왼.length - 1]) < 0.001, true);

  const 웨 = 웨이브(짧.왼, 짧.오, 곱);
  재본다('웨이브 머리가 RIFF/WAVE', 웨.slice(0, 4).toString() + 웨.slice(8, 12).toString(), 'RIFFWAVE');
  재본다('48kHz 로 적혔다', 웨.readUInt32LE(24), 48000);
  재본다('두 갈래(스테레오)로 적혔다', 웨.readUInt16LE(22), 2);
  재본다('소리가 안 깨진다', (() => {
    for (let i = 44; i < 웨.length; i += 2) if (Math.abs(웨.readInt16LE(i)) >= 32767) return false;
    return true;
  })(), true);
  재본다('같은 결은 몇 번을 만들어도 같다', (() => {
    const a = 곡만들기('백년지도', 1).왼, b = 곡만들기('백년지도', 1).왼;
    return a.every((v, i) => v === b[i]);
  })(), true);
  재본다('모르는 결이면 죽는다', (() => {
    try { 곡만들기('없는결', 1); return false; } catch { return true; }
  })(), true);
  재본다('0초를 달라 해도 안 죽는다', typeof 곡만들기('백년지도', 0).왼.length, 'number');

  console.log(실패 ? `\n⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 자가시험 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

/* ── 실행 ── */
if (내가실행됐다 && !process.argv.includes('--자가시험')) {
  const argv = process.argv.slice(2);
  const 받기 = (이름, 기본) => { const i = argv.indexOf(이름); return i >= 0 ? argv[i + 1] : 기본; };
  const 결이름 = 받기('--결', '백년지도');
  const 초 = Number(받기('--초', '14'));
  const 낼곳 = 받기('--낼곳', `out/bgm-${결이름}-${초}s.m4a`);

  if (!결[결이름]) {
    console.error(`⛔ 모르는 결: ${결이름}\n   있는 것: ${Object.keys(결).map((k) => `${k}(${결[k].이름})`).join(' · ')}`);
    process.exit(2);
  }

  fs.mkdirSync(path.dirname(낼곳), { recursive: true });
  const { 왼, 오 } = 곡만들기(결이름, 초);
  const 곱 = 높이맞추기(왼, 오);
  const 임시 = 낼곳.replace(/\.[^.]+$/, '') + '.wav';
  fs.writeFileSync(임시, 웨이브(왼, 오, 곱));

  if (/\.wav$/i.test(낼곳)) {
    console.log(`✅ ${낼곳}  ·  ${결이름}(${결[결이름].이름}) · ${초}초`);
  } else {
    execFileSync(ff(), ['-y', '-i', 임시, '-c:a', 'aac', '-b:a', '192k', 낼곳], { stdio: 'pipe' });
    fs.unlinkSync(임시);
    console.log(`✅ ${낼곳}  ·  ${결이름}(${결[결이름].이름}) · ${초}초 · ${(fs.statSync(낼곳).size / 1024).toFixed(0)}KB`);
  }
  console.log('⛔ 이 소리는 **말 아래로** 들어가게 만들어져 있다. 볼륨을 더 올리지 마라.');
}
