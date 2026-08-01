/**
 * seoulmarkets — Korean official statistics, normalised to English.
 *
 *   import { Client } from './seoulmarkets.mjs';
 *   const sm = new Client();
 *   await sm.hs('8542');        // → Electronic integrated circuits
 *   await sm.search('battery'); // → [8506, 8507]
 *
 * Zero dependencies. Uses the built-in `fetch`, so it runs unchanged in Node 18+,
 * Deno, Bun, Cloudflare Workers and the browser.
 *
 * Why this file exists
 * --------------------
 * A data API is adopted by developers, not bought by procurement. The first thing
 * a developer looks for is a client; if there is none they weigh writing one
 * against using something else. This removes that decision — and the library
 * earns search traffic on its own, ahead of the API itself.
 */

export const VERSION = '0.1.0';
export const BASE = 'https://seoulmarkets.com/v1';

/**
 * Thrown when the API returns an error envelope.
 * Branch on `code`, not on `message` — messages are written for people and may be
 * reworded; codes are part of the contract.
 */
export class SeoulMarketsError extends Error {
  constructor(status, code, message, hint) {
    super(`[${status} ${code}] ${message}${hint ? ` (${hint})` : ''}`);
    this.name = 'SeoulMarketsError';
    this.status = status;
    this.code = code;
    this.hint = hint;
  }
}

export class Client {
  /**
   * @param {object} [opts]
   * @param {string} [opts.base]     override for staging or self-hosted
   * @param {number} [opts.timeout]  milliseconds, per request
   * @param {typeof fetch} [opts.fetch] inject your own fetch (tests, proxies)
   */
  constructor({ base = BASE, timeout = 20_000, fetch: f } = {}) {
    this.base = base.replace(/\/$/, '');
    this.timeout = timeout;
    this._fetch = f ?? globalThis.fetch;
    if (!this._fetch) {
      throw new Error('No fetch available. Use Node 18+ or pass { fetch }.');
    }
  }

  async #get(path, params) {
    const url = new URL(this.base + path);
    for (const [k, v] of Object.entries(params ?? {})) {
      if (v != null) url.searchParams.set(k, String(v));
    }

    const res = await this._fetch(url, {
      headers: { accept: 'application/json', 'user-agent': `seoulmarkets-js/${VERSION}` },
      signal: AbortSignal.timeout(this.timeout),
    });

    let body;
    try {
      body = await res.json();
    } catch {
      throw new SeoulMarketsError(res.status, 'bad_response', 'Response was not JSON');
    }

    // The API explains itself in an envelope, including on 5xx. Read it rather than
    // throwing a bare status error that discards the explanation — the difference
    // between "no trade happened" and "we have not collected it yet" lives there.
    if (body && body.error) {
      const e = body.error;
      throw new SeoulMarketsError(res.status, e.code ?? 'unknown', e.message ?? '', e.hint);
    }
    if (!res.ok) throw new SeoulMarketsError(res.status, 'http_error', res.statusText);
    return body;
  }

  /**
   * Resolve an HS code of 2, 4, 6 or 10 digits.
   * `resolved === false` means our dictionary does not know it — `label` is null
   * rather than a guess. Check before displaying.
   */
  hs(code) {
    return this.#get(`/hs/${encodeURIComponent(code)}`);
  }

  /** Search the classification in English. Singular and plural both work. */
  async search(keyword) {
    return (await this.#get('/hs', { q: keyword })).results;
  }

  /** Partner country codes with English names. */
  async countries() {
    return (await this.#get('/countries')).results;
  }

  /**
   * Coverage, schema policy, and what has actually been collected.
   * Check `datasets[name].collected` before relying on a series.
   */
  meta() {
    return this.#get('/meta');
  }

  /**
   * Korea's 10-day provisional trade figures.
   * Throws with `code: 'collection_not_started'` until collection begins — an empty
   * array would be indistinguishable from "there was no trade".
   */
  tradeFlash(params) {
    return this.#get('/trade/flash', params);
  }

  /** Exports and imports by HS code and partner country. */
  tradeExports(params) {
    return this.#get('/trade/exports', params);
  }
}

export default Client;
