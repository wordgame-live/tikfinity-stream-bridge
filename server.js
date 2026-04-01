const express = require('express');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');
const { Server } = require('socket.io');

const state = require('./src/bridge-state');
const { TickfinityClient } = require('./src/tickfinity-client');

const PORT = Number(process.env.STREAM_BRIDGE_PORT || 21420);
const HOST = process.env.STREAM_BRIDGE_HOST || '127.0.0.1';
const TICKFINITY_WS_URL = process.env.TIKFINITY_WS_URL || process.env.TICKFINITY_WS_URL || 'ws://127.0.0.1:21213';
const DEBUG_RAW_EVENTS = process.env.STREAM_BRIDGE_DEBUG_RAW === '1';
const SHOULD_OPEN_BROWSER = process.env.STREAM_BRIDGE_OPEN_BROWSER === '1' || Boolean(process.pkg);
const SHOULD_OPEN_LAUNCHER = process.env.STREAM_BRIDGE_OPEN_LAUNCHER !== '0';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(origin)) return callback(null, true);
      if (/^https:\/\/(rectangled\.live|erectangled\.com|searchle\.live)$/i.test(origin)) return callback(null, true);
      return callback(new Error('CORS rejected'));
    }
  }
});

const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

app.get('/health', (_req, res) => {
  res.json(state.snapshot());
});

app.get('/info', (_req, res) => {
  res.json({
    ok: true,
    source: 'tickfinity',
    localSocketIo: `http://${HOST}:${PORT}`,
    tickfinityUrl: TICKFINITY_WS_URL,
    features: ['bridge-status', 'chat-message', 'engagement', 'raw-event']
  });
});

io.on('connection', (socket) => {
  socket.emit('bridge-status', state.snapshot());
});

const tickfinity = new TickfinityClient({
  url: TICKFINITY_WS_URL,
  io,
  debugRaw: DEBUG_RAW_EVENTS
});

server.on('error', (error) => {
  if (error && error.code === 'EADDRINUSE') {
    const localUrl = `http://${HOST}:${PORT}`;
    console.warn(`[Streamer Bridge] ${localUrl} already in use; opening the existing bridge instead.`);
    setTimeout(() => {
      openClientWindow(localUrl);
    }, 150);
    setTimeout(() => {
      process.exit(0);
    }, 450);
    return;
  }
  throw error;
});

server.listen(PORT, HOST, () => {
  const localUrl = `http://${HOST}:${PORT}`;
  console.log(`[Streamer Bridge] Listening on ${localUrl}`);
  tickfinity.start();
  if (SHOULD_OPEN_LAUNCHER) {
    setTimeout(() => {
      openClientWindow(localUrl);
    }, 450);
  } else if (SHOULD_OPEN_BROWSER) {
    setTimeout(() => {
      openBrowser(localUrl);
    }, 450);
  }
});

function openClientWindow(url) {
  try {
    if (process.platform === 'win32') {
      const htaUrl = `${url}/launcher.hta`;
      try {
        const child = spawn('mshta.exe', [htaUrl], {
          detached: true,
          stdio: 'ignore',
          windowsHide: false
        });
        child.unref();
        return;
      } catch (_error) {
        // Fall back to opening the browser below.
      }
    }
    if (SHOULD_OPEN_BROWSER) openBrowser(url);
  } catch (error) {
    console.warn(`[Streamer Bridge] Failed to open launcher window: ${error.message}`);
    if (SHOULD_OPEN_BROWSER) openBrowser(url);
  }
}

function openBrowser(url) {
  try {
    if (process.platform === 'win32') {
      const launchers = [
        { command: process.env.ComSpec || 'C:\\Windows\\System32\\cmd.exe', args: ['/c', 'start', '""', url] },
        { command: 'powershell.exe', args: ['-NoProfile', '-WindowStyle', 'Hidden', '-Command', `Start-Process '${url.replace(/'/g, "''")}'`] },
        { command: 'explorer.exe', args: [url] }
      ];
      for (const launcher of launchers) {
        try {
          const child = spawn(launcher.command, launcher.args, {
            detached: true,
            stdio: 'ignore',
            windowsHide: true
          });
          child.unref();
          return;
        } catch (_error) {
          // Try the next launcher.
        }
      }
      return;
    }
    if (process.platform === 'darwin') {
      const child = spawn('open', [url], { detached: true, stdio: 'ignore' });
      child.unref();
      return;
    }
    const child = spawn('xdg-open', [url], { detached: true, stdio: 'ignore' });
    child.unref();
  } catch (error) {
    console.warn(`[Streamer Bridge] Failed to open browser: ${error.message}`);
  }
}

function shutdown() {
  tickfinity.stop();
  io.close(() => {
    server.close(() => process.exit(0));
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
