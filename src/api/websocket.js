import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { API_BASE_URL } from "./api";
import { getAccessToken } from "./tokenStorage";

// =======================
// GLOBAL STATE
// =======================
let stompClient = null;
let connectedUserId = null;

const callbacks = {
  onReceiveRequest: null,
  onReceiveAccept: null,
  onReceiveMessage: null,
  onSeenMessage: null,
  onPresenceChange: null,
  onConnected: null,
};

let seenSubscription = null;
let pendingSeen = null;

const WS_BASE_URL = API_BASE_URL;

// =======================
// CONNECT
// =======================
export const connectWebSocket = ({
  userId,
  onReceiveRequest,
  onReceiveAccept,
  onReceiveMessage,
  onSeenMessage,
  onPresenceChange,
  onConnected,
}) => {
  if (!userId) {
    console.warn("❌ Missing userId");
    return;
  }

if (onReceiveRequest !== undefined) callbacks.onReceiveRequest = onReceiveRequest;
if (onReceiveAccept !== undefined) callbacks.onReceiveAccept = onReceiveAccept;
if (onReceiveMessage !== undefined) callbacks.onReceiveMessage = onReceiveMessage;
if (onSeenMessage !== undefined) callbacks.onSeenMessage = onSeenMessage;
if (onPresenceChange !== undefined) callbacks.onPresenceChange = onPresenceChange;
if (onConnected !== undefined) callbacks.onConnected = onConnected;

  // ===== AVOID RECONNECT =====
  if (
    stompClient &&
    connectedUserId === userId &&
    stompClient.connected
  ) {
    return;
  }

  // ===== SWITCH USER =====
  if (stompClient && connectedUserId !== userId) {
    console.log("🔁 Switch user → disconnect old socket");
    stompClient.deactivate();
    stompClient = null;
  }

  connectedUserId = userId;

  // ===== CREATE SOCKET =====
  const token = getAccessToken();
  const socketUrl = `${WS_BASE_URL}/ws${token ? `?token=${token}` : ""}`;

  stompClient = new Client({
    webSocketFactory: () =>
      new SockJS(socketUrl, null, { withCredentials: true }),
    reconnectDelay: 2000,
    connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
  });

  // =======================
  // ON CONNECT
  // =======================
  stompClient.onConnect = () => {
    console.log("🟢 CONNECTED:", userId);

    // ===== FRIEND REQUEST =====
    stompClient.subscribe(`/topic/friend-request/${userId}`, (msg) => {
      callbacks.onReceiveRequest?.(JSON.parse(msg.body));
    });

    // ===== FRIEND ACCEPT =====
    stompClient.subscribe(`/topic/friend-accept/${userId}`, (msg) => {
      callbacks.onReceiveAccept?.(JSON.parse(msg.body));
    });

    // ===== CHAT =====
    stompClient.subscribe(`/topic/chat/${userId}`, (msg) => {
      callbacks.onReceiveMessage?.(JSON.parse(msg.body));
    });

    stompClient.subscribe(`/topic/chat-self/${userId}`, (msg) => {
      callbacks.onReceiveMessage?.(JSON.parse(msg.body));
    });

    // ===== SEEN =====
    stompClient.subscribe(`/user/${userId}/queue/seen`, (msg) => {
      callbacks.onSeenMessage?.(msg.body);
    });

    // ===== PRESENCE =====
    stompClient.subscribe(`/topic/presence`, (msg) => {
      callbacks.onPresenceChange?.(JSON.parse(msg.body));
    });

    // ✅ CHỈ GỬI ONLINE Ở ĐÂY
    sendUserOnline(userId);

    callbacks.onConnected?.(userId);

    // ===== HANDLE PENDING SEEN =====
    if (pendingSeen) {
      subscribeToConversationSeen(
        pendingSeen.conversationId,
        pendingSeen.callback
      );
      pendingSeen = null;
    }
  };

  // =======================
  // ERROR
  // =======================
  stompClient.onStompError = (frame) => {
    console.error("❌ STOMP ERROR:", frame);
  };

  // =======================
  // CLOSE
  // =======================
  stompClient.onWebSocketClose = () => {
    console.warn("🔌 WS CLOSED");

    // ❗ KHÔNG gửi OFFLINE
    connectedUserId = null;
  };

  stompClient.activate();
};

// =======================
// DISCONNECT
// =======================
export const disconnectWebSocket = () => {
  if (!stompClient) return;

  // ❗ KHÔNG gửi OFFLINE
  stompClient.deactivate();

  stompClient = null;
  connectedUserId = null;

  if (seenSubscription) {
    seenSubscription.unsubscribe();
    seenSubscription = null;
  }

  console.log("🔴 DISCONNECTED");
};

// =======================
// ONLINE
// =======================
export const sendUserOnline = (userId) => {
  if (!stompClient || !stompClient.connected) return;

  stompClient.publish({
    destination: "/app/online",
    body: JSON.stringify(userId),
  });
};
export const sendUserOffline = (userId) => {
  if (!stompClient || !stompClient.connected) return;

  stompClient.publish({
    destination: "/app/offline",
    body: JSON.stringify(userId),
  });
};
// =======================
// SEND DATA
// =======================
export const sendSocketData = (endpoint, body) => {
  if (!stompClient || !stompClient.connected) return;

  stompClient.publish({
    destination: endpoint,
    body: JSON.stringify(body),
  });
};

// =======================
// SEEN BY CONVERSATION
// =======================
export const subscribeToConversationSeen = (conversationId, callback) => {
  if (!stompClient || !stompClient.connected) {
    pendingSeen = { conversationId, callback };
    return;
  }

  if (seenSubscription) {
    seenSubscription.unsubscribe();
  }

  const topic = `/topic/conversations/${conversationId}/seen`;

  seenSubscription = stompClient.subscribe(topic, (msg) => {
    callback?.(msg.body);
  });

  console.log("👁️ Subscribed:", topic);
};

export const unsubscribeFromConversationSeen = () => {
  if (seenSubscription) {
    seenSubscription.unsubscribe();
    seenSubscription = null;
    console.log("👁️ Unsubscribed");
  }
};