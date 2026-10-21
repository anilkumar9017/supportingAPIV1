# Geofence Webhook Integration

This document describes how the tracking provider can send geofence events to
our API.

## Endpoint

```text
POST https://ng_supporting_api.dcctz.com/v1/api/geofence/events
```

Replace `<our-api-host>` with the API host provided by our team. The endpoint
accepts JSON over HTTPS.

## Authentication and tenant

Every request must include both headers:

| Header | Required | Description |
| --- | --- | --- |
| `X-Webhook-Key` | Yes | Shared secret provided securely by our team. |
| `X-Domain` | Yes | Tenant subdomain/domain used to resolve the customer's database. Our team must confirm the exact value. |
| `Content-Type` | Yes | Set to `application/json`. |

The webhook key must be sent as a header, not in the URL or request body. Do not
include it in logs or share it over email or chat. Requests without a valid key
are rejected.

## Request body

Send one event per request with these fields:

| Field | Type | Required | Validation |
| --- | --- | --- | --- |
| `trackingNumber` | String | Yes | Must not be empty; maximum 100 characters. |
| `geofenceStatus` | String | Yes | Must not be empty; maximum 100 characters. For example, `entered` or `exited`. |
| `latitude` | Number | Yes | From `-90` to `90`. |
| `longitude` | Number | Yes | From `-180` to `180`. |
| `eventTimestamp` | String | Yes | A date/time string parseable by the API. ISO 8601 UTC is recommended. |

Example:

```json
{
  "trackingNumber": "TRACK-123456",
  "geofenceStatus": "entered",
  "latitude": 40.7128,
  "longitude": -74.006,
  "eventTimestamp": "2026-10-21T06:00:00Z"
}
```

Send coordinates as JSON numbers, not quoted strings.

## Example request

```bash
curl --request POST \
  --url "https://<our-api-host>/api/geofence/events" \
  --header "X-Webhook-Key: <key-provided-by-our-team>" \
  --header "X-Domain: <tenant-domain-provided-by-our-team>" \
  --header "Content-Type: application/json" \
  --data '{
    "trackingNumber": "TRACK-123456",
    "geofenceStatus": "entered",
    "latitude": 40.7128,
    "longitude": -74.006,
    "eventTimestamp": "2026-10-21T06:00:00Z"
  }'
```

## Responses

### Accepted

HTTP `200`

```json
{
  "success": true,
  "message": "Geofence event received",
  "trackingNumber": "TRACK-123456"
}
```

The API returns success only after the database update succeeds.

### Errors

| HTTP status | Meaning | Suggested action |
| --- | --- | --- |
| `400` | Invalid event body or tenant database could not be resolved. | Correct the payload or confirm the `X-Domain` value with our team. |
| `401` | Missing/invalid webhook key or missing domain header. | Check the required headers and ask our team to confirm the key/domain. |
| `404` | No tracking record matched the supplied tracking number. | Confirm the tracking number and tenant. |
| `500` | Server configuration or database update failed. | Retry later for transient failures; contact our team if the error continues. |

Do not repeatedly retry `400`, `401`, or `404` responses without correcting the
request. For a `500` or network timeout, retry with a bounded backoff and contact
our team if failures persist.

## Go-live details to confirm

Before production integration, our team and the tracking provider must confirm:

- Production and test API hostnames.
- The exact `X-Domain` value for each tenant.
- The webhook key, exchanged through a secure channel.
- The real database table and columns for tracking/geofence updates.
- Whether the provider will send `entered`, `exited`, or other status values.

**Current implementation note:** the database table and column names in the
service are placeholders (`tracking_geofence_status`, `tracking_number`,
`geofence_status`, `latitude`, `longitude`, and `event_timestamp`). The API
must be updated to match the real tracking database schema before production
use.
