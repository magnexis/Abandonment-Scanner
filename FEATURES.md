# Features

## Map + Scanning

- Leaflet-based dark map workspace with click-to-scan interaction
- Radius-driven scanning from `100m` to `2000m`
- Heatmap overlay for low, medium, and high abandonment concentrations
- Route previews with driving and walking modes
- Mini map preview synced to the selected result

## Intelligence Engine

- Abandonment scoring model with factor breakdowns
- Signal submission and analyzer-backed scoring
- Area intelligence with nearby candidate generation
- Place enrichment using Nominatim and Overpass
- Residential filtering to reduce false positives

## UI System

- GitHub-inspired dark dashboard styling
- Animated stat cards with radar, fire, search, and warning overlays
- Dropdown navigation with docs, about, download, and legal content
- Download page for desktop distribution details
- Hover, click, and glow micro-interactions across controls and cards

## Backend System

- Express API with shared TypeScript contracts
- SQLite persistence via `sql.js`
- Signals API for storage, scoring, and nearby lookup
- Community reports and voting
- Public geocoding, routing, and enrichment service integration

## Desktop Support

- Tauri desktop packaging scaffold
- Windows `.exe` build path documented for release workflows
- Vercel-ready frontend routing configuration for SaaS deployment
