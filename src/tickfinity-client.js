const WebSocket = require('ws');
const state = require('./bridge-state');
const { normalizeTickfinityEvent, eventPreview } = require('./normalize');

class TickfinityClient {
  constructor({ url, io, reconnectMs = 2500, debugRaw = false }) {
    this.url = url;
    this.io = io;
    this.reconnectMs = reconnectMs;
    this.debugRaw = debugRaw;
    this.ws = null;
    this.retryTimer = null;
    this.closed = false;
    state.setTickfinityUrl(url);
  }

  start() {
    this.closed = false;
    this.connect();
  }

  stop() {
    this.closed = true;
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
    state.setTickfinityConnected(false);
    this.emitStatus();
  }

  connect() {
    if (this.closed) return;
    state.setLastError(null);
    const ws = new WebSocket(this.url);
    this.ws = ws;

    ws.on('open', () => {
      state.setTickfinityConnected(true);
      state.setLastError(null);
      this.emitStatus();
      console.log(`[Streamer Bridge] Connected to Tickfinity at ${this.url}`);
    });

    ws.on('message', (buffer) => {
      let raw;
      try {
        raw = JSON.parse(String(buffer));
      } catch (error) {
        state.setLastError(`Invalid JSON from Tickfinity: ${error.message}`);
        this.emitStatus();
        return;
      }

      state.incrementCount('raw');
      const normalized = normalizeTickfinityEvent(raw);
      if (!normalized) return;

      if (normalized.kind === 'unknown' && !this.debugRaw) {
        state.recordEvent('unknown', 'unknown raw event');
        return;
      }

      state.recordEvent(normalized.kind, eventPreview(normalized));
      this.io.emit(normalized.channel, normalized.payload);
      this.emitStatus();
    });

    ws.on('close', () => {
      state.setTickfinityConnected(false);
      this.emitStatus();
      if (!this.closed) {
        this.scheduleReconnect();
      }
    });

    ws.on('error', (error) => {
      state.setTickfinityConnected(false);
      state.setLastError(error.message || 'Tickfinity connection error');
      this.emitStatus();
    });
  }

  scheduleReconnect() {
    if (this.retryTimer || this.closed) return;
    console.log(`[Streamer Bridge] Tickfinity disconnected; retrying in ${this.reconnectMs}ms`);
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      this.connect();
    }, this.reconnectMs);
  }

  emitStatus() {
    this.io.emit('bridge-status', state.snapshot());
  }
}

module.exports = {
  TickfinityClient
};
