# Refinements v1 — QA Checklist

**Purpose**: Must-pass criteria before proceeding to Step 6.
**Date**: 2025-10-03

---

## Quick Checks

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| 1 | **Relation detection**: "gifts for dad" → dad personas, "gifts for father" → same (alias) | ⏳ | Manual test required |
| 2 | **Fallback chips**: Non-relation query → fallback personas appear | ⏳ | Manual test required |
| 3 | **Apply chip**: Click chip → input updates with hashtags → search fires immediately | ⏳ | Manual test required |
| 4 | **"Refined by" badges**: After applying chip → badges appear with × buttons + Clear link | ⏳ | Manual test required |
| 5 | **Remove single refinement**: Click × on badge → tag removed → re-search fires | ⏳ | Manual test required |
| 6 | **Clear all refinements**: Click Clear → all badges disappear → input stripped → re-search | ⏳ | Manual test required |
| 7 | **"Refine more" drawer**: Opens with overlay, multi-select chips, Clear/Apply actions | ⏳ | Manual test required |
| 8 | **Drawer multi-select**: Click 2 personas → both outlined → Apply → tags merged in input | ⏳ | Manual test required |
| 9 | **Persistence across turns**: Tags remain in input and badges across multiple messages | ⏳ | Manual test required |
| 10 | **Re-ranking visible**: Products with matching tags appear first (check network _gmScore) | ⏳ | Manual test required |
| 11 | **CSP compliance**: No eval/new Function in bundle, no inline sourcemaps, no console warnings | ✅ | Static checks passed |
| 12 | **Bundle size**: Widget < 300 KB raw, < 90 KB gzipped | ✅ | 297.52 KB raw, 84.74 KB gzipped |
| 13 | **TypeScript clean**: `npm run typecheck` passes with no new errors | ⏳ | Needs verification |
| 14 | **All tests pass**: Unit tests (client + API) pass | ⏳ | Needs verification |
| 15 | **CORS allowlist**: API enforces allowlist, proper headers on cross-origin requests | ⏳ | Manual WordPress test required |
| 16 | **Mobile layout**: Drawer responsive, chips wrap, no horizontal scroll | ⏳ | Manual mobile test required |
| 17 | **Performance**: First interaction < 2s, no JS errors in console | ⏳ | Manual test required |
| 18 | **No regressions**: Existing chat functionality unaffected (send message, scroll, etc.) | ⏳ | Manual test required |

---

## Sign-Off

**Automated Checks**: ✅ / ⏳ / ❌
**Manual Checks**: ✅ / ⏳ / ❌
**WordPress Test**: ✅ / ⏳ / ❌

**Ready for Step 6?** ⏳ (Pending manual verification)

---

**Note**: Items marked ⏳ require manual testing on dev server and/or WordPress staging before final sign-off.
