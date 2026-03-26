import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { API_BASE_URL } from "./api";
import { logout } from "./service/authService";

// =======================
// BIẾN TOÀN CỤC
// =======================
let stompClient = null;
let connectedUserId = null;

// nơi lưu các callback từ component
const callbacks = {
  onReceiveRequest: null,
  onReceiveAccept: null,
  onReceiveMessage: null,
  onSeenMessage: null,
  onPresenceChange: null,
  onConnected: null,
};

// dùng cho seen
let seenSubscription = null;
let pendingSeen = null;

const WS_BASE_URL = API_BASE_URL;

// =======================
// CONNECT WEBSOCKET
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
    console.warn("❌ Không có userId");
    return;
  }

  // =======================
  // LƯU CALLBACK
  // =======================
  if (onReceiveRequest) callbacks.onReceiveRequest = onReceiveRequest;
  if (onReceiveAccept) callbacks.onReceiveAccept = onReceiveAccept;
  if (onReceiveMessage) callbacks.onReceiveMessage = onReceiveMessage;
  if (onSeenMessage) callbacks.onSeenMessage = onSeenMessage;
  if (onPresenceChange) callbacks.onPresenceChange = onPresenceChange;
  if (onConnected) callbacks.onConnected = onConnected;

  // =======================
  // TRÁNH CONNECT LẠI
  // =======================
  if (stompClient && connectedUserId === userId && stompClient.active) {
    return;
  }

  // =======================
  // NGẮT USER CŨ
  // =======================
  if (stompClient && connectedUserId !== userId) {
    console.log("🔁 Đổi user → disconnect user cũ");
    stompClient.deactivate();
    stompClient = null;
  }

  connectedUserId = userId;

  // =======================
  // TẠO KẾT NỐI
  // =======================
  const token = sessionStorage.getItem("token");
  const socketUrl = `${WS_BASE_URL}/ws${token ? `?token=${token}` : ""}`;

  stompClient = new Client({
    webSocketFactory: () =>
      new SockJS(socketUrl, null, { withCredentials: true }),
    reconnectDelay: 1000,
    connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
  });

  // =======================
  // KHI CONNECT THÀNH CÔNG
  // =======================
  stompClient.onConnect = () => {
    console.log("🟢 CONNECTED:", userId);

    // ===== FRIEND REQUEST =====
    stompClient.subscribe(`/topic/friend-request/${userId}`, (msg) => {
      const data = JSON.parse(msg.body);
      if (callbacks.onReceiveRequest) {
        callbacks.onReceiveRequest(data);
      }
    });

    // ===== FRIEND ACCEPT =====
    stompClient.subscribe(`/topic/friend-accept/${userId}`, (msg) => {
      const data = JSON.parse(msg.body);
      if (callbacks.onReceiveAccept) {
        callbacks.onReceiveAccept(data);
      }
    });

    // ===== CHAT =====
    stompClient.subscribe(`/topic/chat/${userId}`, (msg) => {
      const data = JSON.parse(msg.body);
      if (callbacks.onReceiveMessage) {
        callbacks.onReceiveMessage(data);
      }
    });

    stompClient.subscribe(`/topic/chat-self/${userId}`, (msg) => {
      const data = JSON.parse(msg.body);
      if (callbacks.onReceiveMessage) {
        callbacks.onReceiveMessage(data);
      }
    });

    // ===== SEEN =====
    stompClient.subscribe(`/user/${userId}/queue/seen`, (msg) => {
      if (callbacks.onSeenMessage) {
        callbacks.onSeenMessage(msg.body);
      }
    });

    // ===== ONLINE/OFFLINE =====
    stompClient.subscribe(`/topic/presence`, (msg) => {
      const data = JSON.parse(msg.body);
      if (callbacks.onPresenceChange) {
        callbacks.onPresenceChange(data);
      }
    });

    // gửi online
    sendUserOnline(userId);

    // báo đã connect
    if (callbacks.onConnected) {
      callbacks.onConnected(userId);
    }

    // xử lý pending seen
    if (pendingSeen) {
      subscribeToConversationSeen(
        pendingSeen.conversationId,
        pendingSeen.callback,
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
  stompClient.onWebSocketClose = async () => {
    console.warn("🔌 WS CLOSED");
    connectedUserId = null;
  };

  stompClient.activate();
};

// =======================
// DISCONNECT
// =======================
export const disconnectWebSocket = async () => {
  if (!stompClient) return;

  if (connectedUserId) {
    sendUserOffline(connectedUserId);
  }

  stompClient.deactivate();

  stompClient = null;
  connectedUserId = null;
  seenSubscription = null;
  console.log("🔴 DISCONNECTED");
};

// =======================
// ONLINE / OFFLINE
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

// Sử dụng sendBeacon để gửi offline khi đóng tab (đảm bảo gửi được)
export const sendUserOfflineBeacon = (userId) => {
  const token = sessionStorage.getItem("token");
  const base = (process.env.REACT_APP_WS_BASE_URL || API_BASE_URL).replace(
    /\/$/,
    "",
  );
  const url = `${base}/api/presence/offline`;

  const data = JSON.stringify({ userId });
  const blob = new Blob([data], { type: "application/json" });

  // sendBeacon đảm bảo request được gửi ngay cả khi tab đang đóng
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, blob);
    console.log("🔴 Sent offline via sendBeacon for user:", userId);
  }
};

/**
 * ==========================
 * SEND DATA
 * ==========================
 */
export const sendSocketData = (endpoint, body) => {
  if (!stompClient || !stompClient.connected) return;

  stompClient.publish({
    destination: endpoint,
    body: JSON.stringify(body),
  });
};

// =======================
// SEEN THEO CONVERSATION
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
    if (callback) {
      callback(msg.body);
    }
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
