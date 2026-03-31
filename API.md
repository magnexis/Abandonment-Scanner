# API Reference

Base URL: `http://localhost:4000/api`

## Signals

### `POST /signals`

Stores a submitted signal, analyzes abandonment likelihood, and returns both the saved record and structured analysis.

Request:

```json
{
  "lat": 41.3,
  "lng": -72.9,
  "description": "Broken windows, overgrown yard",
  "confidence": 80
}
```

Response:

```json
{
  "data": {
    "signal": {
      "id": 12,
      "latitude": 41.3,
      "longitude": -72.9,
      "description": "Broken windows, overgrown yard",
      "confidence": 80,
      "score": 72,
      "createdAt": "2026-03-31 16:20:11",
      "riskLevel": "high",
      "reasoning": "The score is driven mainly by broken or boarded windows and overgrown vegetation. With 80% confidence, the report suggests a realistic high-risk abandonment pattern."
    },
    "analysis": {
      "abandonment_score": 72,
      "risk_level": "high",
      "reasoning": "The score is driven mainly by broken or boarded windows and overgrown vegetation. With 80% confidence, the report suggests a realistic high-risk abandonment pattern."
    }
  }
}
```

### `GET /signals`

Returns all stored signals ordered by newest first.

Response:

```json
{
  "data": [
    {
      "id": 12,
      "latitude": 41.3,
      "longitude": -72.9,
      "description": "Broken windows, overgrown yard",
      "confidence": 80,
      "score": 72,
      "createdAt": "2026-03-31 16:20:11",
      "riskLevel": "high",
      "reasoning": "The score is driven mainly by broken or boarded windows and overgrown vegetation. With 80% confidence, the report suggests a realistic high-risk abandonment pattern."
    }
  ]
}
```

### `GET /signals/nearby`

Returns signals within a requested radius of the given coordinate.

Query parameters:

- `lat`
- `lng`
- `radiusMeters` optional, default `500`

Example:

```text
GET /signals/nearby?lat=41.3&lng=-72.9&radiusMeters=750
```

Response:

```json
{
  "data": [
    {
      "id": 12,
      "latitude": 41.3,
      "longitude": -72.9,
      "description": "Broken windows, overgrown yard",
      "confidence": 80,
      "score": 72,
      "createdAt": "2026-03-31 16:20:11",
      "riskLevel": "high",
      "reasoning": "The score is driven mainly by broken or boarded windows and overgrown vegetation. With 80% confidence, the report suggests a realistic high-risk abandonment pattern."
    }
  ]
}
```

## Core App Endpoints

### `POST /scan`

Runs a location scan and returns the selected building, nearby candidates, resolved location, heatmap points, and route preview origin.

### `POST /scan-area`

Scans a larger area around a center coordinate and returns nearby or generated candidates.

### `POST /route`

Returns a route using the requested profile:

```json
{
  "from": { "lat": 42.3435, "lng": -83.0751 },
  "to": { "lat": 42.3315, "lng": -83.0671 },
  "profile": "walking"
}
```

### `POST /report`

Accepts `multipart/form-data` with:

- `buildingId`
- `reporter`
- `summary`
- `severity`
- `image` optional

### `GET /locations`

Returns tracked building records for map display and local search.
