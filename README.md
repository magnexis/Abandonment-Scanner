# Abandonment Scanner

Abandonment Scanner is a geospatial intelligence product for discovering, analyzing, and routing to potentially abandoned properties. It combines a React + Leaflet SaaS dashboard, an Express + SQLite backend, public mapping enrichment services, and a Tauri desktop packaging path for Windows distribution.

## Overview

The platform is built around a map-first workflow. Users can click the map or search for a location, run a radius-based scan, review abandonment scoring factors, submit field signals, and enrich results with place intelligence from public geospatial sources. The same product can be deployed as a web app or packaged as a desktop application.

## Features

- Leaflet map workspace with click-to-scan behavior
- Radius scanning and nearby candidate generation
- Heatmap visualization and route previews
- Driving and walking route modes
- Signal submission and analyzer-backed scoring
- Area intelligence and place enrichment
- GitHub-style dark UI with animated dashboard interactions
- Download page for desktop release distribution
- Tauri desktop packaging scaffold for Windows `.exe` builds

See [FEATURES.md](/mnt/c/Users/matth/Desktop/abandonment-scanner/FEATURES.md) for a categorized feature breakdown.

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, Leaflet
- Backend: Node.js, Express
- Persistence: SQLite via `sql.js`
- Geospatial services: Nominatim, Overpass API, OSRM
- Shared contracts: TypeScript in `shared/`
- Desktop packaging: Tauri

## Setup

```bash
git clone <your-repo-url>
cd abandonment-scanner
npm install
cp .env.example .env
npm run dev
```

- Client: `http://localhost:5173`
- API: `http://localhost:4000/api`

Detailed setup steps live in [INSTALL.md](/mnt/c/Users/matth/Desktop/abandonment-scanner/INSTALL.md).

## Deployment

### GitHub

1. Push the monorepo to GitHub.
2. Keep `client`, `server`, `shared`, `src-tauri`, and the root docs together in the repo.
3. Publish packaged desktop binaries through GitHub Releases if you want the in-app Download page to point to release artifacts.

### Vercel

- Deploy the `client/` directory as the Vercel project root.
- Run `npm run build` in `client/`.
- The SPA rewrite config is included in [client/vercel.json](/mnt/c/Users/matth/Desktop/abandonment-scanner/client/vercel.json) so `/docs`, `/about`, and `/download` work as direct URLs.
- Host the Express backend separately and set `VITE_API_BASE_URL` in Vercel to your deployed API base.

## Desktop Build (Tauri EXE)

The repository includes a Tauri scaffold in [src-tauri/Cargo.toml](/mnt/c/Users/matth/Desktop/abandonment-scanner/src-tauri/Cargo.toml) and [src-tauri/tauri.conf.json](/mnt/c/Users/matth/Desktop/abandonment-scanner/src-tauri/tauri.conf.json).

Typical flow:

```bash
npm install @tauri-apps/cli --save-dev
npm run desktop:icon
npm run desktop:build
```

The Windows executable and installer bundles are generated under:

```text
src-tauri/target/release/
src-tauri/target/release/bundle/
```

For Tauri prerequisites on Windows, install Microsoft C++ Build Tools and WebView2 Runtime, then install Rust. This follows the current Tauri prerequisites and distribution guidance.

## Download

The app includes an in-product Download page at `/download` where users can review version info, release notes, system requirements, and retrieve the Windows installer when a packaged `.exe` is published.

## API

Signals, scans, routing, reports, and nearby lookups are documented in [API.md](/mnt/c/Users/matth/Desktop/abandonment-scanner/API.md).

## Website



## Additional Docs

- [CHANGELOG.md](/mnt/c/Users/matth/Desktop/abandonment-scanner/CHANGELOG.md)
- [FEATURES.md](/mnt/c/Users/matth/Desktop/abandonment-scanner/FEATURES.md)
- [API.md](/mnt/c/Users/matth/Desktop/abandonment-scanner/API.md)
- [INSTALL.md](/mnt/c/Users/matth/Desktop/abandonment-scanner/INSTALL.md)
- [CONTRIBUTING.md](/mnt/c/Users/matth/Desktop/abandonment-scanner/CONTRIBUTING.md)
