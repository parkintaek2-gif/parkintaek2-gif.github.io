"""
seoulmarkets — Korean official statistics, normalised to English.

    pip install requests   # the only dependency
    from seoulmarkets import Client

    sm = Client()
    sm.hs("8542")          # -> Electronic integrated circuits
    sm.search("battery")   # -> [8506, 8507]
    sm.countries()

Why this file exists
--------------------
A data API is adopted by developers, not bought by procurement. The first thing a
developer does is look for a client library; if there is none, they weigh writing
one against using something else. Two hundred lines here removes that decision.

It also earns search traffic on its own — people find the library before they find
the API.

Design notes
------------
* One file, one dependency. Nothing to learn, nothing to break.
* No API key. The classification endpoints are free and stay free.
* Errors carry the server's own message rather than a generic HTTPError, because
  the server explains itself well (``503 collection_not_started`` tells you the
  series is not collected yet, which is different from "no data exists").

Status
------
⚠ **This file has not been executed.** It was written and reviewed, but the machine
it was authored on has no Python interpreter (Windows Store stub only), so neither
the tests nor a syntax check were run. The JavaScript client in ``../js`` was
verified end to end against the live API and shares the same behaviour.

Before publishing to PyPI, run::

    pip install requests
    python -m clients.python.selftest

Say it is tested only after that passes.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import requests

__version__ = "0.1.0"
BASE = "https://seoulmarkets.com/v1"


class SeoulMarketsError(RuntimeError):
    """Raised when the API returns an error envelope.

    ``code`` is the machine-readable reason. Branch on that, not on the message —
    messages are written for people and may be reworded.
    """

    def __init__(self, status: int, code: str, message: str, hint: str | None = None):
        self.status = status
        self.code = code
        self.message = message
        self.hint = hint
        super().__init__(f"[{status} {code}] {message}" + (f" ({hint})" if hint else ""))


@dataclass(frozen=True)
class HsCode:
    """One resolved HS code.

    ``resolved`` is False when our dictionary does not know the code. In that case
    ``label`` is None rather than a guess — check ``resolved`` before displaying.
    """

    code: str
    digits: int
    chapter_code: str
    chapter_name: str | None
    heading_code: str | None
    heading_name: str | None
    label: str | None
    resolved: bool

    @classmethod
    def _from(cls, d: dict[str, Any]) -> "HsCode":
        ch = d.get("chapter") or {}
        hd = d.get("heading") or {}
        return cls(
            code=d["code"],
            digits=d["digits"],
            chapter_code=ch.get("code"),
            chapter_name=ch.get("name"),
            heading_code=hd.get("code"),
            heading_name=hd.get("name"),
            label=d.get("label"),
            resolved=bool(d.get("resolved")),
        )

    def __str__(self) -> str:
        return self.label or f"{self.code} (not in dictionary)"


class Client:
    """Thin wrapper over the REST endpoints.

    Parameters
    ----------
    base:
        Override for self-hosted or staging deployments.
    timeout:
        Seconds. Applies per request.
    session:
        Pass your own ``requests.Session`` to control retries, proxies or pooling.
    """

    def __init__(
        self,
        base: str = BASE,
        timeout: float = 20.0,
        session: requests.Session | None = None,
    ):
        self.base = base.rstrip("/")
        self.timeout = timeout
        self._s = session or requests.Session()
        self._s.headers.setdefault("user-agent", f"seoulmarkets-python/{__version__}")

    # ── internals ────────────────────────────────────────────────────────────

    def _get(self, path: str, **params: Any) -> dict[str, Any]:
        r = self._s.get(f"{self.base}{path}", params=params or None, timeout=self.timeout)
        try:
            body = r.json()
        except ValueError:
            r.raise_for_status()
            raise SeoulMarketsError(r.status_code, "bad_response", "Response was not JSON")

        # The API reports problems in an envelope, including on 5xx. Read it rather
        # than raising a status error that throws the explanation away.
        if isinstance(body, dict) and "error" in body:
            e = body["error"]
            raise SeoulMarketsError(
                r.status_code, e.get("code", "unknown"), e.get("message", ""), e.get("hint")
            )
        r.raise_for_status()
        return body

    # ── endpoints ────────────────────────────────────────────────────────────

    def hs(self, code: str | int) -> HsCode:
        """Resolve an HS code of 2, 4, 6 or 10 digits.

        >>> Client().hs("8542").label
        'Electronic integrated circuits'
        """
        return HsCode._from(self._get(f"/hs/{code}"))

    def search(self, keyword: str) -> list[dict[str, Any]]:
        """Search the classification in English.

        Singular and plural both work — ``battery`` finds ``batteries``.
        """
        return self._get("/hs", q=keyword)["results"]

    def countries(self) -> list[dict[str, str]]:
        """Partner country codes with English names."""
        return self._get("/countries")["results"]

    def meta(self) -> dict[str, Any]:
        """Coverage, schema policy, and what has actually been collected.

        Check ``meta()["datasets"][name]["collected"]`` before relying on a series —
        it tells you whether the archive holds anything yet.
        """
        return self._get("/meta")

    def trade_flash(self, **params: Any) -> dict[str, Any]:
        """Korea's 10-day provisional trade figures.

        Raises ``SeoulMarketsError`` with ``code='collection_not_started'`` until
        collection begins. That is deliberate: an empty list would be
        indistinguishable from "there was no trade".
        """
        return self._get("/trade/flash", **params)

    def trade_exports(self, **params: Any) -> dict[str, Any]:
        """Exports and imports by HS code and partner country."""
        return self._get("/trade/exports", **params)


__all__ = ["Client", "HsCode", "SeoulMarketsError", "BASE", "__version__"]
