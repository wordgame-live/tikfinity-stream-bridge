function pickFirst(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return null;
}

function unwrapPayload(raw = {}) {
  if (raw && typeof raw === 'object' && raw.data && typeof raw.data === 'object') {
    return {
      envelope: raw,
      payload: raw.data
    };
  }
  return {
    envelope: raw,
    payload: raw
  };
}

function normalizeUser(rawUser = {}, root = {}) {
  const merged = { ...root, ...rawUser };
  return {
    id: pickFirst(
      merged.id,
      merged.userId,
      merged.user_id,
      merged.uniqueId,
      merged.unique_id,
      merged.secUid,
      merged.sec_uid
    ),
    username: pickFirst(
      merged.username,
      merged.uniqueId,
      merged.unique_id,
      merged.userName,
      merged.user_name
    ),
    displayName: pickFirst(
      merged.displayName,
      merged.nickname,
      merged.nickName,
      merged.userNickname,
      merged.user_nickname,
      merged.username,
      merged.uniqueId
    ),
    profilePictureUrl: pickFirst(
      merged.profilePictureUrl,
      merged.profileImageUrl,
      merged.avatarUrl,
      merged.avatar,
      merged.photo,
      merged.image,
      merged.profilePicture,
      merged.profileImage
    )
  };
}

function detectEventKind(raw) {
  const { envelope, payload } = unwrapPayload(raw || {});
  const kind = String(
    pickFirst(
      envelope.event,
      envelope.eventType,
      envelope.type,
      payload.event,
      payload.eventType,
      payload.type,
      payload.messageType,
      payload.msgType,
      payload.action
    ) || ''
  ).toLowerCase();

  if (kind === 'config' || kind === 'connected') return 'ignore';
  if (kind.includes('chat') || kind.includes('comment')) return 'chat';
  if (kind.includes('gift')) return 'gift';
  if (kind.includes('follow')) return 'follow';
  if (kind.includes('share')) return 'share';
  if (kind.includes('like')) return 'like';
  if (kind.includes('join') || kind.includes('member')) return 'join';
  if (kind.includes('sub')) return 'subscribe';

  if (pickFirst(payload.comment, payload.message, payload.text, payload.content)) return 'chat';
  if (pickFirst(payload.giftName, payload.gift_name, payload.giftId, payload.gift_id)) return 'gift';
  return 'unknown';
}

function normalizeChat(raw) {
  const { envelope, payload } = unwrapPayload(raw || {});
  const user = normalizeUser(payload.user || payload.from || payload.author || {}, payload);
  const message = pickFirst(payload.comment, payload.message, payload.text, payload.content);
  if (!message) return null;
  return {
    platform: 'tiktok',
    message: String(message),
    user,
    isJoin: false,
    timestamp: Number(pickFirst(payload.createTime, envelope.createTime, Date.now())) || Date.now(),
    source: 'tickfinity'
  };
}

function normalizeEngagement(raw, type) {
  const { envelope, payload } = unwrapPayload(raw || {});
  const user = normalizeUser(payload.user || payload.from || payload.author || {}, payload);
  const normalized = {
    platform: 'tiktok',
    type,
    user,
    timestamp: Number(pickFirst(payload.createTime, envelope.createTime, Date.now())) || Date.now(),
    source: 'tickfinity'
  };

  if (type === 'gift') {
    normalized.giftName = pickFirst(
      payload.giftName,
      payload.gift_name,
      payload.name,
      payload.repeatEnd ? payload.describe : null
    );
    normalized.giftCount = Number(
      pickFirst(
        payload.repeatCount,
        payload.repeat_count,
        payload.count,
        payload.giftCount,
        payload.gift_count,
        1
      )
    ) || 1;
  }

  return normalized;
}

function normalizeTickfinityEvent(raw) {
  const kind = detectEventKind(raw || {});
  if (kind === 'ignore') return null;
  if (kind === 'chat') {
    const normalized = normalizeChat(raw);
    return normalized ? { channel: 'chat-message', kind: 'chatMessage', payload: normalized } : null;
  }
  if (['gift', 'follow', 'share', 'like', 'join', 'subscribe'].includes(kind)) {
    return {
      channel: 'engagement',
      kind: 'engagement',
      payload: normalizeEngagement(raw, kind)
    };
  }
  return {
    channel: 'raw-event',
    kind: 'unknown',
    payload: {
      kind: 'unknown',
      payload: raw,
      timestamp: Date.now(),
      source: 'tickfinity'
    }
  };
}

function eventPreview(normalized) {
  if (!normalized) return null;
  if (normalized.channel === 'chat-message') {
    return `${normalized.payload.user.displayName || normalized.payload.user.username || 'user'}: ${normalized.payload.message}`;
  }
  if (normalized.channel === 'engagement') {
    const user = normalized.payload.user.displayName || normalized.payload.user.username || 'user';
    if (normalized.payload.type === 'gift') {
      return `${user} sent ${normalized.payload.giftCount || 1} ${normalized.payload.giftName || 'gift'}`;
    }
    return `${user} ${normalized.payload.type}`;
  }
  return 'raw event';
}

module.exports = {
  normalizeTickfinityEvent,
  eventPreview
};
