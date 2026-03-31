# Architecture Notes

## Overview

Abandonment Scanner is organized as a small monorepo:

- `client/`: React + Vite + Tailwind application
- `server/`: Express API and SQLite persistence
- `shared/`: scoring logic and shared TypeScript contracts

## Data Flow

1. The frontend fetches buildings and dashboard metrics from the API.
2. The shared scoring engine defines the abandonment scoring model.
3. The server seeds initial building records and persists scans, reports, and votes in SQLite.
4. Routing calls OSRM first and falls back to a simulated route preview if needed.
5. Reverse geocoding uses Nominatim to normalize clicked map locations.

## Simulation Strategy

The simulation engine uses:

- years since last sale
- vegetation intensity
- broken-window and decay signals
- community reports
- permit and utility silence
- nearby context for generated scan-area records

This keeps the product believable even when live imagery or routing credentials are not configured.
