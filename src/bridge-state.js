const state = {
  startedAt: Date.now(),
  tickfinityConnected: false,
  tickfinityUrl: '',
  lastEventAt: null,
  lastError: null,
  eventCounts: {
    raw: 0,
    chatMessage: 0,
    engagement: 0,
    unknown: 0
  },
  lastEvents: []
};

const MAX_RECENT_EVENTS = 20;

function snapshot() {
  return {
    ok: true,
    source: 'tickfinity',
    bridgeVersion: '0.1.0',
    tickfinityConnected: state.tickfinityConnected,
    tickfinityUrl: state.tickfinityUrl,
    lastEventAt: state.lastEventAt,
    lastError: state.lastError,
    uptimeSec: Math.max(0, Math.floor((Date.now() - state.startedAt) / 1000)),
    eventCounts: { ...state.eventCounts },
    recentEvents: state.lastEvents.slice()
  };
}

function setTickfinityUrl(url) {
  state.tickfinityUrl = url;
}

function setTickfinityConnected(connected) {
  state.tickfinityConnected = !!connected;
}

function setLastError(error) {
  state.lastError = error ? String(error) : null;
}

function recordEvent(kind, preview) {
  state.lastEventAt = Date.now();
  if (state.eventCounts[kind] == null) state.eventCounts[kind] = 0;
  state.eventCounts[kind] += 1;
  state.lastEvents.unshift({
    at: state.lastEventAt,
    kind,
    preview: preview || null
  });
  if (state.lastEvents.length > MAX_RECENT_EVENTS) {
    state.lastEvents.length = MAX_RECENT_EVENTS;
  }
}

function incrementCount(kind) {
  state.lastEventAt = Date.now();
  if (state.eventCounts[kind] == null) state.eventCounts[kind] = 0;
  state.eventCounts[kind] += 1;
}

module.exports = {
  snapshot,
  setTickfinityUrl,
  setTickfinityConnected,
  setLastError,
  recordEvent,
  incrementCount
};
