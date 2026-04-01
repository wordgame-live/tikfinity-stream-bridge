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
- `STREAM_BRIDGE_NO_BROWSER=1` (sidecar mode; suppresses launcher/browser auto-open for embedded app shells)

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

## macOS wrapper scaffold

The repo now includes a first-pass Tauri launcher scaffold in:

- `mac-app/`

This is intended to become the native-ish macOS shell for the bridge. The plan is:

- keep the current bridge at repo root
- package Mac bridge binaries as sidecars
- have the Tauri app launch the bridge with `STREAM_BRIDGE_NO_BROWSER=1`
- ship a signed/notarized `.dmg` later for public Mac users

Current helper scripts:

```powershell
npm run package:mac:aarch64
npm run package:mac:x64
npm run mac:prepare-sidecars
```

Then from `mac-app/`:

```powershell
npm install
npm run tauri:dev
```

This scaffold is not a finished public Mac release yet. It is the first implementation slice for the launcher wrapper.

## macOS status

macOS support is now scaffolded in-progress in:

- `mac-app/`

Current state:

- Tauri launcher scaffold is in place
- Mac sidecar preparation scripts are in place
- the bridge now supports sidecar mode via `STREAM_BRIDGE_NO_BROWSER=1`

What is still needed before public Mac release:

- build and test on a real Mac
- sign the app with Developer ID
- notarize and staple the DMG

So the repo now includes the first real macOS implementation work, but the Mac app should still be treated as pre-release until it is built and tested on macOS.

## Intended consumer routes

- `https://rectangled.live/stream`
- `https://erectangled.com/stream`
- `https://searchle.live/stream`

## Notes

- The bridge runs locally on your computer.
- It does not expose your local TikFinity connection to the public internet.
- The `/stream` game pages still use the normal hosted game servers for game state; the bridge only provides local chat input.
