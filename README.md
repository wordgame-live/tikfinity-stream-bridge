# Tycoon Stream Bridge

Lightweight local bridge for streamer-mode game pages.

## What it does

- connects to TikFinity at `ws://127.0.0.1:21213`
- normalizes incoming events
- exposes a local Socket.IO feed on `http://127.0.0.1:21420`
- serves a tiny local launcher and status page

## Run locally

From `C:\Chat Relay\tools\streamer-bridge`:

```powershell
npm install
npm start
```

or

```powershell
node server.js
```

Then open:

- `http://127.0.0.1:21420`

## Environment variables

- `STREAM_BRIDGE_PORT`
- `STREAM_BRIDGE_HOST`
- `TIKFINITY_WS_URL`
- `TICKFINITY_WS_URL` (legacy fallback)
- `STREAM_BRIDGE_DEBUG_RAW=1`
- `STREAM_BRIDGE_OPEN_BROWSER=1`
- `STREAM_BRIDGE_OPEN_LAUNCHER=0` (optional override if you only want the browser dashboard)

## Build a Windows app

From `C:\Chat Relay\tools\streamer-bridge`:

```powershell
npm install
npm run package:win
```

That produces:

- `dist\TycoonStreamBridge.exe`

When you open the EXE, it should now open a small launcher window automatically.
From there you can open the dashboard or jump straight into the supported `/stream` game pages.

For a portable folder version instead of a single EXE:

```powershell
npm run package:folder
```

## Intended consumer routes

- `https://rectangled.live/stream`
- `https://erectangled.com/stream`
- `https://searchle.live/stream`

## Notes

- The bridge runs locally on your computer.
- It does not expose your local TikFinity connection to the public internet.
- The `/stream` game pages still use the normal hosted game servers for game state; the bridge only provides local chat input.
