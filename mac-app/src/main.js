import './style.css';

const statusPill = document.getElementById('bridge-status-pill');
const statusBanner = document.getElementById('status-banner');
const statusTitle = document.getElementById('status-title');
const statusCopy = document.getElementById('status-copy');
const lastEvent = document.getElementById('last-event');
const statChat = document.getElementById('stat-chat');
const statEngagement = document.getElementById('stat-engagement');
const statRaw = document.getElementById('stat-raw');
const statBridge = document.getElementById('stat-bridge');

for (const button of document.querySelectorAll('[data-url]')) {
  button.addEventListener('click', () => {
    const url = button.getAttribute('data-url');
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  });
}

async function refreshHealth() {
  try {
    const response = await fetch('http://127.0.0.1:21420/health', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Health check failed: ${response.status}`);
    const snapshot = await response.json();
    renderSnapshot(snapshot);
  } catch (_error) {
    renderOffline();
  }
}

function renderSnapshot(snapshot) {
  const connected = Boolean(snapshot.connected);
  statusPill.textContent = connected ? 'Connected to TikFinity' : 'Bridge running';
  statusPill.dataset.state = connected ? 'ok' : 'warn';
  statusBanner.dataset.state = connected ? 'ok' : 'warn';
  statusTitle.textContent = connected ? 'TikFinity connected' : 'Waiting for TikFinity';
  statusCopy.textContent = connected
    ? `Receiving live events from ${snapshot.tickfinityUrl || 'ws://127.0.0.1:21213'}.`
    : 'The bridge is running, but TikFinity is not connected yet.';
  lastEvent.textContent = snapshot.lastEventAt ? `Last event: ${new Date(snapshot.lastEventAt).toLocaleTimeString()}` : 'No events yet';
  statChat.textContent = String(snapshot.chatMessages || 0);
  statEngagement.textContent = String(snapshot.engagements || 0);
  statRaw.textContent = String(snapshot.rawEvents || 0);
  statBridge.textContent = connected ? 'Live' : 'Idle';
}

function renderOffline() {
  statusPill.textContent = 'Bridge unavailable';
  statusPill.dataset.state = 'error';
  statusBanner.dataset.state = 'error';
  statusTitle.textContent = 'Bridge not running yet';
  statusCopy.textContent = 'The launcher will keep polling the local bridge. If this stays red, the sidecar did not start.';
  lastEvent.textContent = 'Waiting for local bridge';
  statChat.textContent = '0';
  statEngagement.textContent = '0';
  statRaw.textContent = '0';
  statBridge.textContent = 'Down';
}

refreshHealth();
setInterval(refreshHealth, 2000);
