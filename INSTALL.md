# Install

## Requirements

- Node.js 20+
- npm 10+
- For Windows desktop packaging: Rust, Microsoft C++ Build Tools, and WebView2 Runtime

## Local Web Development

### Root workspace

```bash
git clone <your-repo-url>
cd abandonment-scanner
npm install
cp .env.example .env
npm run dev
```

### Client only

```bash
cd client
npm install
npm run dev
```

### Server only

```bash
cd server
npm install
npm run dev
```

For a compiled server start:

```bash
cd server
npm install
npm run build
node dist/index.js
```

## Environment

```env
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
VITE_API_BASE_URL=http://localhost:4000/api
DATABASE_PATH=./server/data/abandonment-scanner.sqlite
UPLOADS_PATH=./server/uploads
```

## Vercel Frontend Deploy

1. Create a Vercel project with `client/` as the root directory.
2. Set the build command to `npm run build`.
3. Set the output directory to `dist`.
4. Add `VITE_API_BASE_URL` pointing to your deployed backend.
5. Keep [client/vercel.json](/mnt/c/Users/matth/Desktop/abandonment-scanner/client/vercel.json) in place so routed pages resolve correctly.

## Windows Desktop Build

```bash
npm install @tauri-apps/cli --save-dev
npm run desktop:icon
npm run desktop:build
```

Expected output:

```text
src-tauri/target/release/
src-tauri/target/release/bundle/
```
