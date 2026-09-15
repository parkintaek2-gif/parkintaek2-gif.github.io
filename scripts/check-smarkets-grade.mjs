#!/usr/bin/env node
/* 우리가 매기는 등급의 자가시험을 npm test 가 부르게 하는 자.
   ⛔ 기준선·가중치가 바뀌면 여기서 걸린다 — 어제 등급과 오늘 등급이 «다른 자»가 낸 것이 되면 안 된다. */
import { 자가시험 } from '../src/lib/smarkets-grade.mjs';
console.log('SMarkets Grade — 등급 엔진');
process.exit(자가시험() ? 0 : 1);
