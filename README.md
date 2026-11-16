<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/aa0ee1e4-ac17-427e-a8c3-f0bf70bcf660

## Run Locally

**Prerequisites:** Node.js 22.12+ (verified locally with Node.js 24.20.0) and npm.


1. Install dependencies:
   `npm ci` (uses the included npm lockfile)
2. Optional AI features require `GEMINI_API_KEY` in the server environment or `.env`. Never put this secret in a `VITE_` variable. Offline drafting, document imports, and USGS retrieval work without it. Live AI requests may incur charges and require operator consent.
3. Run the app:
   `npm run dev`

The server defaults to `http://127.0.0.1:3000`. `PORT` overrides the port; `HOST` overrides the loopback bind address only when intentionally deploying to another interface.

For isolated local verification in PowerShell:

```powershell
$env:HOST = '127.0.0.1'
$env:PORT = '3107'
$env:EQP_STORAGE_ROOT = 'verification/test-storage'
npm run dev
```

`EQP_STORAGE_ROOT` defaults to `eqp_solutions` beside `server.ts`. Use a separate path for testing. PRIMER drafts/rules use browser localStorage; sources, findings, transfer logs, revisions, and reviews use IndexedDB. Use a fresh browser profile for verification.

Checks: `npm run lint`, `npm test`, and `npm run build`. The `start` script uses native Node TypeScript support; development uses `npm run dev` with tsx.
