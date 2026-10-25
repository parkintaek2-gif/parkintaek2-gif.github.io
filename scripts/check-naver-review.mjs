#!/usr/bin/env node
/**
 * check-naver-review.mjs — ASCII-named thin wrapper.
 *
 * WHY THIS EXISTS (5번, 2026-10-26)
 *   The real tool is `scripts/잰다-네이버검수-결과나왔나.mjs`. Windows `cmd` mangles
 *   Korean arguments and paths to CP949, so a scheduled .cmd cannot call it by name
 *   (the same reason `run-ga4-daily-log.cmd` says "ASCII ONLY").
 *   This file carries an ASCII name so the daily .cmd can reach it.
 *
 *   It does nothing of its own. Importing the tool runs it — keep it that way so there
 *   is only ONE place where the behaviour lives.
 */
await import('./잰다-네이버검수-결과나왔나.mjs');
