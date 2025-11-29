// src/api/websocket.js
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { API_BASE_URL } from "./api";

let stompClient = null;
let connectedUserId = null;
let currentCallbacks = {}; // 🔥 Lưu callbacks

const WS_BASE_URL = process.env.REACT_APP_WS_BASE_URL || API_BASE_URL;

/**
 * Kết nối WebSocket cho 1 user
 */
export const connectWebSocket = ({
  userId,
  onReceiveRequest,
  onReceiveAccept,
  onReceiveMessage,
}) => {
  console.log("🔌 connectWebSocket called for userId:", userId);
  
  if (!userId) {
    console.warn("❌ Cannot start WebSocket without userId");
    return;
  }

  // 🔥 MERGE callbacks thay vì ghi đè
  currentCallbacks = {
    ...currentCallbacks, // Giữ callbacks cũ
    ...(onReceiveRequest && { onReceiveRequest }),
    ...(onReceiveAccept && { onReceiveAccept }),
    ...(onReceiveMessage && { onReceiveMessage }),
  };
  
  console.log("✅ Callbacks merged:", {
    hasRequest: !!currentCallbacks.onReceiveRequest,
    hasAccept: !!currentCallbacks.onReceiveAccept,
    hasMessage: !!currentCallbacks.onReceiveMessage,
  });

  // 🔥 Nếu đã kết nối với cùng user → return sớm
  if (stompClient && connectedUserId === userId && stompClient.connected) {
    console.log("⚠ WebSocket already connected, callbacks merged");
    return;
  }

  // Hủy kết nối cũ nếu user khác
  if (stompClient && connectedUserId !== userId) {
    console.log("🔄 Switching user, disconnecting old connection");
    try {
      stompClient.deactivate();
    } catch {}
    stompClient = null;
    connectedUserId = null;
  }

  const token = sessionStorage.getItem("token");

  const normalizedBase = WS_BASE_URL.replace(/\/$/, "");
  const socketUrl = `${normalizedBase}/ws${
    token ? `?token=${encodeURIComponent(token)}` : ""
  }`;

  console.log("🔌 Connecting to:", socketUrl);

  const sock = new SockJS(socketUrl);

  stompClient = new Client({
    webSocketFactory: () => sock,
    reconnectDelay: 700,
    debug: (str) => {
      if (str.includes("MESSAGE")) {
        console.log("📨 STOMP:", str);
      }
    },
    connectHeaders: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {},
  });

  connectedUserId = userId;

  stompClient.onConnect = () => {
    console.log("🟢 WebSocket CONNECTED for userId:", userId);
    console.log("🔍 Current callbacks:", {
      hasRequest: !!currentCallbacks.onReceiveRequest,
      hasAccept: !!currentCallbacks.onReceiveAccept,
      hasMessage: !!currentCallbacks.onReceiveMessage,
    });

    // 🎯 Friend request
    stompClient.subscribe(`/topic/friend-request/${userId}`, (msg) => {
      console.log("📩 [FRIEND-REQUEST] Raw:", msg.body);
      if (msg?.body && currentCallbacks.onReceiveRequest) {
        try {
          const data = JSON.parse(msg.body);
          console.log("✅ Calling onReceiveRequest");
          currentCallbacks.onReceiveRequest(data);
        } catch (e) {
          console.error("❌ Parse error:", e);
        }
      }
    });

    // 🎯 Accept friend
    stompClient.subscribe(`/topic/friend-accept/${userId}`, (msg) => {
      console.log("📩 [FRIEND-ACCEPT] Raw:", msg.body);
      if (msg?.body && currentCallbacks.onReceiveAccept) {
        try {
          const data = JSON.parse(msg.body);
          console.log("✅ Calling onReceiveAccept");
          currentCallbacks.onReceiveAccept(data);
        } catch (e) {
          console.error("❌ Parse error:", e);
        }
      }
    });

    // 🎯 Tin nhắn gửi đến user
    stompClient.subscribe(`/topic/chat/${userId}`, (msg) => {
      console.log("📩 [CHAT-RECEIVE] Raw:", msg.body);
      console.log("🔍 Has callback?", !!currentCallbacks.onReceiveMessage);
      
      if (msg?.body && currentCallbacks.onReceiveMessage) {
        try {
          const data = JSON.parse(msg.body);
          console.log("✅ Calling onReceiveMessage with:", data);
          currentCallbacks.onReceiveMessage(data);
        } catch (e) {
          console.error("❌ Parse error:", e);
        }
      } else {
        console.warn("⚠️ No onReceiveMessage callback!");
      }
    });

    // 🎯 Tin nhắn chính mình gửi
    stompClient.subscribe(`/topic/chat-self/${userId}`, (msg) => {
      console.log("📩 [CHAT-SELF] Raw:", msg.body);
      console.log("🔍 Has callback?", !!currentCallbacks.onReceiveMessage);
      
      if (msg?.body && currentCallbacks.onReceiveMessage) {
        try {
          const data = JSON.parse(msg.body);
          console.log("✅ Calling onReceiveMessage (self) with:", data);
          currentCallbacks.onReceiveMessage(data);
        } catch (e) {
          console.error("❌ Parse error:", e);
        }
      } else {
        console.warn("⚠️ No onReceiveMessage callback!");
      }
    });

    console.log("✅ All subscriptions registered");
  };

  stompClient.onWebSocketClose = () => {
    console.warn("🔌 WebSocket closed");
    connectedUserId = null;
  };

  stompClient.onStompError = (frame) => {
    console.error("⚠ STOMP error:", frame.headers["message"], frame);
  };

  stompClient.activate();
  console.log("🚀 WebSocket activation started");
};

/**
 * Ngắt WS
 */
export const disconnectWebSocket = () => {
  if (stompClient) {
    try {
      stompClient.deactivate();
    } catch {}
    stompClient = null;
    connectedUserId = null;
    console.log("🔴 WebSocket disconnected");
  }
};

/**
 * Gửi dữ liệu WS
 */
export const sendSocketData = (endpoint, body) => {
  console.log("📤 Sending to:", endpoint, body);
  if (stompClient?.connected) {
    stompClient.publish({
      destination: endpoint,
      body: JSON.stringify(body),
    });
    console.log("✅ Message sent");
  } else {
    console.warn("⚠ WebSocket not ready, state:", stompClient?.connected);
  }
};