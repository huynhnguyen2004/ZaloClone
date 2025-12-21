import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { API_BASE_URL } from "./api";

let stompClient = null;
let connectedUserId = null;

// ==========================
// CALLBACK STORAGE
// ==========================
const callbacks = {
  onReceiveRequest: null,
  onReceiveAccept: null,
  onReceiveMessage: null,
  onSeenMessage: null,
};

// ==========================
// SEEN SUBSCRIPTION
// ==========================
let seenSubscription = null;
let pendingSeen = null;

const WS_BASE_URL =
  process.env.REACT_APP_WS_BASE_URL || API_BASE_URL;

/**
 * ==========================
 * CONNECT WEBSOCKET
 * ==========================
 */
export const connectWebSocket = ({
  userId,
  onReceiveRequest,
  onReceiveAccept,
  onReceiveMessage,
  onSeenMessage,
}) => {
  if (!userId) {
    console.warn("❌ WebSocket: missing userId");
    return;
  }

  // merge callbacks
  if (onReceiveRequest) callbacks.onReceiveRequest = onReceiveRequest;
  if (onReceiveAccept) callbacks.onReceiveAccept = onReceiveAccept;
  if (onReceiveMessage) callbacks.onReceiveMessage = onReceiveMessage;
  if (onSeenMessage) callbacks.onSeenMessage = onSeenMessage;

  // already connected
  if (stompClient && connectedUserId === userId && stompClient.connected) {
    console.log("⚠ WS already connected");
    return;
  }

  // disconnect old user
  if (stompClient && connectedUserId !== userId) {
    stompClient.deactivate();
    stompClient = null;
  }

  connectedUserId = userId;

  const token = sessionStorage.getItem("token");
  const base = WS_BASE_URL.replace(/\/$/, "");
  const socketUrl = `${base}/ws${token ? `?token=${token}` : ""}`;

  stompClient = new Client({
    webSocketFactory: () => new SockJS(socketUrl),
    reconnectDelay: 1000,
    connectHeaders: token
      ? { Authorization: `Bearer ${token}` }
      : {},
  });

  stompClient.onConnect = () => {
    console.log("🟢 WS CONNECTED:", userId);

    // ==========================
    // FRIEND REQUEST
    // ==========================
    stompClient.subscribe(`/topic/friend-request/${userId}`, (msg) => {
      callbacks.onReceiveRequest?.(JSON.parse(msg.body));
    });

    stompClient.subscribe(`/topic/friend-accept/${userId}`, (msg) => {
      callbacks.onReceiveAccept?.(JSON.parse(msg.body));
    });

    // ==========================
    // CHAT MESSAGE
    // ==========================
    stompClient.subscribe(`/topic/chat/${userId}`, (msg) => {
      callbacks.onReceiveMessage?.(JSON.parse(msg.body));
    });

    stompClient.subscribe(`/topic/chat-self/${userId}`, (msg) => {
      callbacks.onReceiveMessage?.(JSON.parse(msg.body));
    });

    // ==========================
    // SEEN (USER QUEUE)
    // ==========================
    stompClient.subscribe(`/user/${userId}/queue/seen`, (msg) => {
      callbacks.onSeenMessage?.(msg.body);
    });

    // process pending seen subscribe
    if (pendingSeen) {
      subscribeToConversationSeen(
        pendingSeen.conversationId,
        pendingSeen.callback
      );
      pendingSeen = null;
    }
  };

  stompClient.onStompError = (frame) => {
    console.error("❌ STOMP error:", frame);
  };

  stompClient.onWebSocketClose = () => {
    console.warn("🔌 WS closed");
    connectedUserId = null;
  };

  stompClient.activate();
};

/**
 * ==========================
 * DISCONNECT
 * ==========================
 */
export const disconnectWebSocket = () => {
  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
    connectedUserId = null;
    seenSubscription = null;
    console.log("🔴 WS disconnected");
  }
};

/**
 * ==========================
 * SEND DATA
 * ==========================
 */
export const sendSocketData = (endpoint, body) => {
  if (!stompClient?.connected) return;

  stompClient.publish({
    destination: endpoint,
    body: JSON.stringify(body),
  });
};

/**
 * ==========================
 * SEEN SUBSCRIBE (PER CONVERSATION)
 * ==========================
 */
export const subscribeToConversationSeen = (conversationId, callback) => {
  if (!stompClient?.connected) {
    pendingSeen = { conversationId, callback };
    return;
  }

  // unsubscribe old
  if (seenSubscription) {
    seenSubscription.unsubscribe();
  }

  const topic = `/topic/conversations/${conversationId}/seen`;

  seenSubscription = stompClient.subscribe(topic, (msg) => {
    callback?.(msg.body);
  });

  console.log("👁️ Subscribed seen:", topic);
};

export const unsubscribeFromConversationSeen = () => {
  if (seenSubscription) {
    seenSubscription.unsubscribe();
    seenSubscription = null;
    console.log("👁️ Unsubscribed seen");
  }
};
