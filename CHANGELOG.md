# Changelog

## Phase 1 — Base App

- Created the React + Vite + Tailwind frontend workspace
- Added the Express + SQLite backend foundation
- Introduced shared TypeScript contracts and the initial abandonment scoring engine

## Phase 2 — Map System

- Added the Leaflet map workspace
- Implemented click-to-scan behavior and radius-based scanning
- Added route previews with driving and walking modes
- Added heatmap overlays and mini map synchronization

## Phase 3 — UI + Dropdowns

- Established the GitHub-style dark dashboard theme
- Replaced the original navigation with dropdown-based header menus
- Added routed docs, about, legal, and download pages
- Refined layout spacing, card structure, and header polish

## Phase 4 — Animations

- Added radar card animation for recent scans
- Added fire, search, and warning stat-card overlays
- Added micro-interactions, hover glow, card lift, and smoother transitions
- Improved button feedback and interaction polish across the UI

## Phase 5 — Intelligence System

- Added signal storage and signal analysis scoring
- Added nearby signal lookup endpoints
- Added area intelligence and simulated candidate generation
- Added place enrichment using reverse geocoding plus Overpass metadata
- Refined abandonment scoring using location type and contextual activity cues

## Phase 6 — Finalization

- Added the desktop Download page with version info and release notes
- Added Vercel SPA deployment config for routed pages
- Added Tauri desktop packaging scaffold and Windows `.exe` build path
- Expanded README, API, installation, feature, and contribution documentation
