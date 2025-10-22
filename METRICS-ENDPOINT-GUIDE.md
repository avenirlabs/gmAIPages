# Metrics Endpoint Implementation Guide

## Summary

✅ **Implemented:** `POST /api/metrics/gm-widget` endpoint for widget analytics

**File:** `api/api/metrics/gm-widget.js` (152 lines)

**Branch:** `feat/metrics-endpoint`

**Status:** Pushed to GitHub, ready for Vercel deployment

---

## File Path

```
api/api/metrics/gm-widget.js
```

**Location:** `/Users/amitsharma/Downloads/gmAIPages-designsdone/api/api/metrics/gm-widget.js`

**Size:** 152 lines (~4KB)

---

## Environment Variables Used

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `METRICS_WEBHOOK_URL` | No | `''` | Optional webhook URL to forward events (2s timeout) |

**Default behavior (no env vars):**
- Logs events to `console.log()` (Vercel captures these in logs)
- No external dependencies
- Works immediately without configuration

---

## Endpoint Specification

### Request

**Method:** `POST`

**Path:** `/api/metrics/gm-widget`

**Content-Type:** `application/json`

**Payload Schema:**
```typescript
{
  event: 'snapshot_view' | 'chip_click' | 'chat_open' | 'auto_open' | 'widget_loaded' | 'widget_error',
  ts?: number,               // Client timestamp (ms)
  page_path?: string,        // e.g., "/gifts-for-dad"
  snapshot_key?: string,     // e.g., "dad-birthday"
  relationship?: string,     // e.g., "dad"
  occasion?: string,         // e.g., "birthday"
  chip?: string,             // e.g., "Tech Lover"
  first_prompt_present?: boolean,
  auto_open?: boolean,
  lt?: string,               // Load time bucket: '<300', '300-600', etc.
  ua_mobile?: boolean,
  source?: string,           // e.g., "cta", "chip"
  code?: string              // Error code for widget_error event
}
```

### Response

**Success:** `204 No Content` (always, even on rate limit)

**Invalid event:** `400 Bad Request` with `{"error": "Invalid event"}`

**Headers:**
```
access-control-allow-origin: *
access-control-allow-methods: POST, OPTIONS
access-control-allow-headers: content-type
```

---

## Event Whitelist

Only these 6 events are accepted:

1. **`snapshot_view`** - Page view with widget present
2. **`chip_click`** - User clicked a chip
3. **`chat_open`** - User opened chat (CTA or chip click)
4. **`auto_open`** - Chat auto-opened from URL params
5. **`widget_loaded`** - Widget bundle loaded successfully
6. **`widget_error`** - Widget failed to load

**Any other event returns `400`**

---

## Rate Limiting

**Algorithm:** In-memory token bucket per IP

**Limit:** 100 events per 60 seconds per IP

**Behavior:**
- First 100 events within 60s: Processed normally (204)
- Events 101+: **Dropped silently** (still returns 204)
- Window resets after 60s

**Log message when rate limited:**
```
[Metrics] Rate limit: 192.168.1.1 - dropped
```

**Client experience:** No difference - always receives 204

---

## Field Sanitization

All string fields are:
1. **Trimmed** - Leading/trailing whitespace removed
2. **Length-capped** - Max 120 chars (except `lt`, `source`, `code`)

| Field | Max Length |
|-------|------------|
| `page_path` | 120 chars |
| `snapshot_key` | 120 chars |
| `relationship` | 120 chars |
| `occasion` | 120 chars |
| `chip` | 120 chars |
| `lt` | 20 chars |
| `source` | 20 chars |
| `code` | 50 chars |

**Booleans validated:** Only accepts `true` or `false` (not truthy/falsy)

---

## Test Commands & Expected Responses

### Test 1: Valid Event (snapshot_view)

**Command:**
```bash
curl -i -X POST \
  -H 'content-type: application/json' \
  -d '{"event":"snapshot_view","page_path":"/self-test"}' \
  https://gm-ai-pages.vercel.app/api/metrics/gm-widget
```

**Expected Response:**
```
HTTP/2 204
access-control-allow-origin: *
access-control-allow-methods: POST, OPTIONS
access-control-allow-headers: content-type
```

**Console Log:**
```json
[Metrics] {"event":"snapshot_view","ts":1698012345678,"page_path":"/self-test","server_ts":1698012345680}
```

---

### Test 2: Invalid Event

**Command:**
```bash
curl -i -X POST \
  -H 'content-type: application/json' \
  -d '{"event":"bad_event"}' \
  https://gm-ai-pages.vercel.app/api/metrics/gm-widget
```

**Expected Response:**
```
HTTP/2 400
content-type: application/json

{"error":"Invalid event"}
```

**Console Log:**
```
[Metrics] Invalid event: bad_event
```

---

### Test 3: OPTIONS Preflight (CORS)

**Command:**
```bash
curl -i -X OPTIONS \
  -H 'Origin: https://www.giftsmate.net' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type' \
  https://gm-ai-pages.vercel.app/api/metrics/gm-widget
```

**Expected Response:**
```
HTTP/2 204
access-control-allow-origin: *
access-control-allow-methods: POST, OPTIONS
access-control-allow-headers: content-type
```

---

### Test 4: Full Payload (all fields)

**Command:**
```bash
curl -i -X POST \
  -H 'content-type: application/json' \
  -d '{
    "event": "chip_click",
    "ts": 1698012345678,
    "page_path": "/gifts-for-dad",
    "snapshot_key": "dad-birthday",
    "relationship": "dad",
    "occasion": "birthday",
    "chip": "Tech Lover",
    "ua_mobile": false
  }' \
  https://gm-ai-pages.vercel.app/api/metrics/gm-widget
```

**Expected Response:**
```
HTTP/2 204
```

**Console Log:**
```json
[Metrics] {"event":"chip_click","ts":1698012345678,"page_path":"/gifts-for-dad","snapshot_key":"dad-birthday","relationship":"dad","occasion":"birthday","chip":"Tech Lover","ua_mobile":false,"server_ts":1698012345680}
```

---

## Rate Limit Behavior Test

### Sending 120 Quick Events

**Script:**
```bash
#!/bin/bash
for i in {1..120}; do
  curl -s -X POST \
    -H 'content-type: application/json' \
    -d '{"event":"snapshot_view","page_path":"/test"}' \
    https://gm-ai-pages.vercel.app/api/metrics/gm-widget &
done
wait
```

**Expected Console Logs:**
```
[Metrics] {"event":"snapshot_view",...}  (×100 times)
[Metrics] Rate limit: <IP> - dropped     (×20 times)
```

**All 120 requests receive `204`** ✅

**Only first 100 are logged to console**

**Events 101-120 are dropped (not processed, not forwarded to webhook)**

---

## Webhook Forwarding (Optional)

### Configuration

**Environment Variable:**
```
METRICS_WEBHOOK_URL=https://your-analytics-service.com/events
```

**Behavior:**
- Forwards enriched event as POST with JSON body
- 2 second timeout (AbortController)
- Fire-and-forget (no retry, no await)
- Failures are silently ignored
- Does NOT block 204 response

### Example Webhook Payload

```json
{
  "event": "chip_click",
  "ts": 1698012345678,
  "page_path": "/gifts-for-dad",
  "snapshot_key": "dad-birthday",
  "relationship": "dad",
  "occasion": "birthday",
  "chip": "Tech Lover",
  "ua_mobile": false,
  "server_ts": 1698012345680
}
```

### Compatible Services

- **Supabase:** Point to a Postgres table via PostgREST
- **BigQuery:** Use Cloud Functions to proxy
- **Logflare:** Direct webhook URL
- **Webhook.site:** For testing
- **Custom endpoint:** Any JSON POST endpoint

### Test with Webhook.site

1. Go to https://webhook.site/
2. Copy your unique URL
3. Set `METRICS_WEBHOOK_URL` in Vercel
4. Send test event
5. See event in Webhook.site dashboard

---

## Implementation Highlights

✅ **Zero dependencies** - Native JavaScript only
✅ **Fast response** - Target <5ms (204 is instant)
✅ **Never blocks UX** - Always returns 204 (except invalid event = 400)
✅ **Rate limiting** - In-memory per-IP (100/60s)
✅ **Field sanitization** - Trims and caps all strings
✅ **Privacy-first** - No IP/user agent stored in payload
✅ **Fire-and-forget** - Webhook failures don't affect response
✅ **Production-safe** - Try/catch wraps everything
✅ **Size discipline** - 152 lines total

---

## WordPress Plugin Integration

The plugin sends events from:

### 1. Server-Side (PHP)

**File:** `wordpress-plugin/includes/shortcode.php`

**Function:** `giftsmate_output_snapshot_view_beacon()`

**Event:** `snapshot_view`

```javascript
// Line 690-696
navigator.sendBeacon(
  'https://gm-ai-pages.vercel.app/api/metrics/gm-widget',
  new Blob([JSON.stringify({
    event: 'snapshot_view',
    ts: Date.now(),
    page_path: location.pathname,
    snapshot_key: 'dad-birthday'
  })], {type: 'application/json'})
);
```

---

### 2. Client-Side (JavaScript)

**File:** `wordpress-plugin/assets/gm-bootstrap.js`

**Function:** `emit(event, data)`

**Events:** All 6 types

```javascript
// Line 81-100
function emit(event, data) {
  try {
    const url = window.GIFTSMATE_METRICS_URL ||
                'https://gm-ai-pages.vercel.app/api/metrics/gm-widget';
    const payload = JSON.stringify({ event: event, ts: Date.now(), ...data });

    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
    } else {
      fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: payload,
        keepalive: true
      }).catch(function() {});
    }
  } catch (_e) {}
}
```

---

## Privacy & Security

### No PII Collected

❌ **NOT stored:**
- IP addresses (only used for rate limiting in memory)
- User agents (logged but not in payload)
- Cookies
- User IDs
- Email addresses
- Personal data

✅ **Only collected:**
- Page paths (content context)
- Event names (interaction type)
- Snapshot keys (content identifiers)
- Generic categories (relationship, occasion)
- User selections (chip text)
- Performance metrics (load time buckets)
- Device type (mobile boolean)

### CORS Policy

**Origin:** `*` (wildcard)

**Why:** Public analytics endpoint, no sensitive data

**Alternative:** If you want to restrict origins, change line 104:
```javascript
res.setHeader('access-control-allow-origin', 'https://www.giftsmate.net');
```

---

## Git & Deployment

**Branch:** `feat/metrics-endpoint`

**Commit:** `d19b8b7` - "feat: Add metrics endpoint for widget analytics"

**Status:** ✅ Pushed to GitHub

**GitHub URL:** https://github.com/avenirlabs/gmAIPages/tree/feat/metrics-endpoint

**Deployment:** Auto-deploys from branch or merge to main

**Deployment URL (after merge):**
```
https://gm-ai-pages.vercel.app/api/metrics/gm-widget
```

---

## Performance Metrics

| Metric | Value |
|--------|-------|
| **File size** | 152 lines, ~4KB |
| **Response time** | <5ms (target) |
| **No blocking** | Always 204 immediately |
| **Dependencies** | 0 (zero) |
| **Memory** | Minimal (Map for rate limiter) |
| **Rate limit** | 100 events/60s per IP |

---

## Troubleshooting

### Issue: Events not appearing in console

**Cause:** Rate limited or invalid event

**Debug:**
1. Check response status (should be 204 for valid events)
2. Check Vercel logs for rate limit warnings
3. Verify event name is in whitelist

---

### Issue: Webhook not receiving events

**Cause:** Webhook URL not configured or failing

**Debug:**
1. Verify `METRICS_WEBHOOK_URL` is set in Vercel
2. Test webhook URL manually with curl
3. Check Vercel logs for webhook errors (silently ignored)
4. Ensure webhook accepts POST with JSON body

**Test webhook:**
```bash
curl -X POST \
  -H 'content-type: application/json' \
  -d '{"event":"test","ts":123456789}' \
  $METRICS_WEBHOOK_URL
```

---

### Issue: CORS errors from browser

**Cause:** Preflight not handled or wrong headers

**Debug:**
1. Check OPTIONS request returns 204
2. Verify CORS headers present
3. Check browser console for specific error

**Should work from any origin** (wildcard CORS)

---

### Issue: Rate limit too aggressive

**Solution:** Increase `RATE_LIMIT_MAX` in code:

```javascript
// Line 18
const RATE_LIMIT_MAX = 200; // Increase from 100
```

Or decrease window:
```javascript
// Line 17
const RATE_LIMIT_WINDOW = 30000; // 30 seconds instead of 60
```

---

## Monitoring & Analytics

### Vercel Logs

View all events in Vercel dashboard:

1. Go to Vercel project
2. Click "Logs" tab
3. Filter by `[Metrics]`
4. See all events in real-time

**Example log line:**
```
[Metrics] {"event":"chip_click","ts":1698012345678,"page_path":"/gifts-for-dad","chip":"Tech Lover","server_ts":1698012345680}
```

---

### Export Logs

**Option 1:** Vercel Log Drains (Pro plan)
- Connect to Datadog, Logtail, etc.

**Option 2:** Webhook to your database
- Set `METRICS_WEBHOOK_URL` to your endpoint
- Store in Supabase, Firebase, etc.

**Option 3:** Parse Vercel logs
- Download logs via Vercel CLI
- Parse JSON lines
- Import to analytics tool

---

## Testing Checklist

After deployment, verify:

- [ ] `POST /api/metrics/gm-widget` with valid event returns 204
- [ ] Console shows `[Metrics]` log with enriched payload
- [ ] Invalid event returns 400 with error message
- [ ] OPTIONS preflight returns 204 with CORS headers
- [ ] Rate limit works (101st event in 60s is dropped but returns 204)
- [ ] All 6 event types accepted
- [ ] Field sanitization works (120 char limit)
- [ ] Webhook forwarding works (if configured)
- [ ] WordPress plugin sends events successfully
- [ ] No errors in Vercel logs

---

## WordPress Plugin Compatibility

✅ **Fully compatible** with WordPress plugin Step 5 implementation

**Plugin sends:**
- ✅ Valid event names from whitelist
- ✅ Sanitized fields
- ✅ sendBeacon first, fetch fallback
- ✅ Silent failures (try/catch)
- ✅ No blocking on errors

**Endpoint accepts:**
- ✅ All plugin event types
- ✅ All plugin fields
- ✅ Cross-origin requests (CORS)
- ✅ Best-effort fire-and-forget

**No plugin changes needed** - endpoint matches expectations exactly.

---

## Next Steps

1. **Merge branch** to main (or deploy from feature branch)
2. **Verify deployment** completes successfully
3. **Test endpoint** with curl commands above
4. **Configure webhook** (optional) for persistent storage
5. **Monitor Vercel logs** to see events flowing
6. **Set up analytics dashboard** (Grafana, Metabase, etc.)
7. **Create alerts** for high error rates

---

## Summary

✅ **Endpoint created:** `POST /api/metrics/gm-widget`
✅ **Zero dependencies:** Native JavaScript only
✅ **Production-safe:** Always 204, never blocks UX
✅ **Rate limited:** 100 events/60s per IP
✅ **Privacy-first:** No PII stored
✅ **WordPress compatible:** Matches plugin expectations
✅ **Size discipline:** 152 lines total
✅ **Committed & pushed:** Branch `feat/metrics-endpoint`

**Ready for deployment!** 🚀
