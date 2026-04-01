(function () {
  var socket = io();

  // DOM refs
  var headerDot = document.getElementById('header-dot');
  var headerLabel = document.getElementById('header-label');
  var headerStatus = document.getElementById('header-status');
  var connBanner = document.getElementById('conn-banner');
  var connIcon = document.getElementById('conn-icon');
  var connTitle = document.getElementById('conn-title');
  var connSub = document.getElementById('conn-sub');
  var connUrl = document.getElementById('conn-url');
  var nudge = document.getElementById('nudge');
  var statChat = document.getElementById('stat-chat');
  var statEngagement = document.getElementById('stat-engagement');
  var statRaw = document.getElementById('stat-raw');
  var statLast = document.getElementById('stat-last');
  var eventsBody = document.getElementById('events-body');
  var eventsEmpty = document.getElementById('events-empty');
  var eventsTotal = document.getElementById('events-total');
  var copyBtn = document.getElementById('copy-url');

  function formatTime(ts) {
    if (!ts) return null;
    return new Date(ts).toLocaleTimeString();
  }

  function badgeClass(kind) {
    if (!kind) return 'other';
    var k = kind.toLowerCase();
    if (k.indexOf('chat') !== -1) return 'chat';
    if (k.indexOf('engage') !== -1 || k.indexOf('gift') !== -1 || k.indexOf('like') !== -1 || k.indexOf('follow') !== -1) return 'engagement';
    return 'other';
  }

  function renderStatus(snapshot) {
    var connected = snapshot.tickfinityConnected;

    // Header pill
    headerDot.className = 'dot ' + (connected ? 'good' : 'bad');
    headerLabel.textContent = connected ? 'Connected' : 'Disconnected';

    // Connection banner
    connBanner.className = 'conn-banner ' + (connected ? 'connected' : 'disconnected');
    connIcon.textContent = connected ? '\u26A1' : '\uD83D\uDD0C';
    connTitle.textContent = connected ? 'Connected to Tickfinity' : 'Not connected to Tickfinity';
    connSub.textContent = connected
      ? 'Receiving live events \u2014 your game pages will get chat data automatically'
      : 'Waiting for Tickfinity on ' + (snapshot.tickfinityUrl || 'ws://127.0.0.1:21213');
    if (connUrl) connUrl.textContent = snapshot.tickfinityUrl || 'ws://127.0.0.1:21213';

    // Nudge (show when disconnected)
    nudge.className = 'nudge' + (connected ? '' : ' visible');

    // Stats
    var c = snapshot.eventCounts || {};
    statChat.textContent = (c.chatMessage || 0).toLocaleString();
    statEngagement.textContent = (c.engagement || 0).toLocaleString();
    statRaw.textContent = (c.raw || 0).toLocaleString();
    var total = (c.chatMessage || 0) + (c.engagement || 0) + (c.raw || 0);
    eventsTotal.textContent = total.toLocaleString() + ' event' + (total === 1 ? '' : 's');

    var t = formatTime(snapshot.lastEventAt);
    statLast.textContent = t || 'Waiting...';
    statLast.className = 'stat-value' + (t ? '' : ' waiting');

    // Recent events
    var recent = snapshot.recentEvents || [];
    if (recent.length === 0) {
      eventsEmpty.style.display = '';
      // Remove any event rows but keep the empty state
      var rows = eventsBody.querySelectorAll('.event-row');
      for (var i = 0; i < rows.length; i++) rows[i].remove();
    } else {
      eventsEmpty.style.display = 'none';
      // Rebuild event rows
      var rows = eventsBody.querySelectorAll('.event-row');
      for (var i = 0; i < rows.length; i++) rows[i].remove();

      for (var j = 0; j < recent.length; j++) {
        var ev = recent[j];
        var row = document.createElement('div');
        row.className = 'event-row';
        var bc = badgeClass(ev.kind);
        row.innerHTML =
          '<span class="event-badge ' + bc + '">' + (ev.kind || 'event') + '</span>' +
          '<span class="event-text">' + escapeHtml(ev.preview || 'No preview') + '</span>' +
          '<span class="event-time">' + (formatTime(ev.at) || '') + '</span>';
        eventsBody.appendChild(row);
      }
    }
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Initial fetch
  fetch('/health')
    .then(function (res) { return res.json(); })
    .then(renderStatus)
    .catch(function () {});

  // Live updates
  socket.on('bridge-status', renderStatus);

  // Copy button
  copyBtn.addEventListener('click', function () {
    try {
      navigator.clipboard.writeText('http://127.0.0.1:21420').then(function () {
        copyBtn.textContent = 'Copied!';
        setTimeout(function () { copyBtn.textContent = 'Copy Bridge URL'; }, 1500);
      });
    } catch (e) {
      copyBtn.textContent = 'Copy failed';
      setTimeout(function () { copyBtn.textContent = 'Copy Bridge URL'; }, 1500);
    }
  });
})();
