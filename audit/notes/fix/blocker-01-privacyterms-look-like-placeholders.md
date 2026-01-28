# fix/blocker-01-privacyterms-look-like-placeholders

## Blocker
- Title: Privacy/Terms look like placeholders
- Why: Stores typically require valid hosted policy URLs and in-app access if data is collected.

## Plan
- [x] Identify root cause (placeholder detection too naive, legal URLs not validated)
- [ ] Implement safe URL validation + fallback to in-app legal docs
- [ ] Run checks (lint/test/build if available)
- [ ] Update related docs/config

## Evidence
See audit/ASSESSMENT.json entry #1.
