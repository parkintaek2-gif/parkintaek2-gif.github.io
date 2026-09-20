"""Self-test for the Python client. Run once a Python interpreter is available.

    pip install requests
    python clients/python/selftest.py                 # against production
    python clients/python/selftest.py http://127.0.0.1:3999/v1   # against a local server

Exits non-zero on the first failure so it can be wired into CI unchanged.

This exists because the client was authored on a machine without Python and is
therefore **unverified**. Do not describe it as tested until this passes.
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from seoulmarkets import Client, HsCode, SeoulMarketsError  # noqa: E402

BASE = sys.argv[1] if len(sys.argv) > 1 else None
sm = Client(base=BASE) if BASE else Client()

failures = []


def check(label, condition, detail=""):
    mark = "ok  " if condition else "FAIL"
    print(f"  {mark}  {label}" + (f"  — {detail}" if detail else ""))
    if not condition:
        failures.append(label)


print("seoulmarkets python client — self-test")
print(f"  base: {sm.base}\n")

# 1. A code the dictionary knows.
a = sm.hs("8542")
check("hs('8542') returns HsCode", isinstance(a, HsCode))
check("  resolved is True", a.resolved is True)
check("  label is populated", bool(a.label), a.label or "")
check("  chapter is 85", a.chapter_code == "85", a.chapter_code)

# 2. A code the dictionary does not know — must not invent a label.
b = sm.hs("9999")
check("hs('9999') resolved is False", b.resolved is False)
check("  label is None, not a guess", b.label is None)
check("  str() explains itself", "not in dictionary" in str(b), str(b))

# 3. Search must handle singular/plural.
sing = {r["code"] for r in sm.search("battery")}
plur = {r["code"] for r in sm.search("batteries")}
check("search singular finds results", len(sing) > 0, f"{len(sing)} hits")
check("search singular == plural", sing == plur, f"{sorted(sing)} vs {sorted(plur)}")

# 4. Countries.
c = sm.countries()
check("countries() returns a list", isinstance(c, list) and len(c) > 0, f"{len(c)} entries")
check("  entries have code and name", all("code" in x and "name" in x for x in c))

# 5. Meta must state what is collected — clients depend on this to branch.
m = sm.meta()
check("meta() has datasets", "datasets" in m)
check("meta() has contract policy", "contract" in m)
check("meta() has archive status", "archive" in m)
check(
    "meta() leaks no filesystem path",
    "local_dir" not in (m.get("archive") or {}),
    "archive keys: " + ",".join((m.get("archive") or {}).keys()),
)

# 6. Unavailable series must raise a typed error, not return an empty list.
try:
    sm.trade_flash()
    check("trade_flash() raises while uncollected", False, "returned instead of raising")
except SeoulMarketsError as e:
    check(
        "trade_flash() raises SeoulMarketsError",
        e.code in ("collection_not_started", "not_implemented"),
        f"{e.status} {e.code}",
    )

# 7. [2026-09-21 · 2번] The eleven methods added the same day as this line —
#    each should return the API's own envelope shape (a dict with "results"
#    or a dataset-specific top-level key), not raise on a bare call.
for name, method in [
    ("research", lambda: sm.research()),
    ("institutions", lambda: sm.institutions()),
    ("financials", lambda: sm.financials()),
    ("valuation", lambda: sm.valuation()),
    ("index_tape", lambda: sm.index_tape()),
    ("indices", lambda: sm.indices()),
    ("consensus", lambda: sm.consensus()),
    ("ownership", lambda: sm.ownership()),
    ("people", lambda: sm.people()),
    ("mezzanine", lambda: sm.mezzanine()),
    ("account_dictionary", lambda: sm.account_dictionary()),
    ("uae_financials", lambda: sm.uae_financials()),
]:
    try:
        r = method()
        check(f"{name}() returns a dict", isinstance(r, dict), f"got {type(r).__name__}")
    except SeoulMarketsError as e:
        check(f"{name}() call", False, f"{e.status} {e.code} {e.message}")

print()
if failures:
    print(f"FAILED: {len(failures)} check(s) — " + "; ".join(failures))
    sys.exit(1)
print("all checks passed")
