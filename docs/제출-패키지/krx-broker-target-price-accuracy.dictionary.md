# KRX Broker Price-Target Accuracy — data dictionary

One row per brokerage. Every Korean broker report's 12-month price target scored against the
actual close ~12 months later, aggregated by house. First-party archive, 2020–.

| column | meaning |
|---|---|
| house | brokerage name (Korean) |
| reports_scored | number of the house's reports with a target that could be joined to a 12-month close |
| hit_rate_pct | share of those reports where the stock reached the target within 12 months (%) |
| avg_target_upside_pct | mean implied upside of the target vs price at publication (%) |
| avg_realized_return_pct | mean actual stock return over the 12 months (%) |

- As of 20260805. Report universe 21,407; joined 19,499.
- ⚠ Small n is noisy — read hit_rate only where reports_scored is large (e.g. 100+); low-n houses are shown for completeness, not ranking.
- ⚠ Survivorship: delisted/renamed tickers drop out (upward bias). Not investment advice.
- Source: SeoulMarkets broker-research archive + KRX close. Derived from data.go.kr ("unrestricted"), redistributable.
- Live product page: https://seoulmarkets.com/data/target-price-accuracy
