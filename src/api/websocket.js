// src/api/websocket.js
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { API_BASE_URL } from "./api";

let stompClient = null;
let connectedUserId = null;
const WS_BASE_URL =
  process.env.REACT_APP_WS_BASE_URL || API_BASE_URL;

export const connectWebSocket = (userId, onReceiveRequest, onReceiveAccept) => {
  if (!userId) {
    console.warn("❌ Cannot start WebSocket without userId");
    return;
  }

  // Prevent duplicate connection
  if (stompClient && connectedUserId === userId && stompClient.connected) {
    console.log("⚠ WebSocket already connected:", userId);
    return;
  }

  // Close old connection if exists
  if (stompClient) {
    try { stompClient.deactivate(); } catch {}
    stompClient = null;
    connectedUserId = null;
  }

  const token = sessionStorage.getItem("token");
  const normalizedBase = WS_BASE_URL.replace(/\/$/, "");
  const socketUrl = `${normalizedBase}/ws${
    token ? `?token=${encodeURIComponent(token)}` : ""
  }`;
  const sock = new SockJS(socketUrl);

  stompClient = new Client({
    webSocketFactory: () => sock,
    reconnectDelay: 700,          // ⭐ an toàn, tránh spam
    debug: () => {},              // tắt log
    connectHeaders: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {},
  });

  // đánh dấu user đang active để tránh connect trùng khi chưa onConnect
  connectedUserId = userId;

  stompClient.onConnect = () => {
    console.log("🟢 WebSocket CONNECTED:", userId);

    // Subscribe: Friend Request
    stompClient.subscribe(`/topic/friend-request/${userId}`, (msg) => {
      if (msg?.body) onReceiveRequest(JSON.parse(msg.body));
    });

    // Subscribe: Friend Accept
    stompClient.subscribe(`/topic/friend-accept/${userId}`, (msg) => {
      if (msg?.body) onReceiveAccept(JSON.parse(msg.body));
    });
  };

  stompClient.onWebSocketClose = () => {
    console.warn("🔌 WebSocket closed");
    connectedUserId = null;
  };

  stompClient.onStompError = (frame) => {
    console.error("⚠ STOMP error:", frame.headers["message"]);
  };

  stompClient.activate();
};

export const disconnectWebSocket = () => {
  if (stompClient) {
    try { stompClient.deactivate(); } catch {}
    stompClient = null;
    connectedUserId = null;
    console.log("🔴 WebSocket disconnected");
  }
};

export const sendSocketData = (endpoint, body) => {
  if (stompClient?.connected) {
    stompClient.publish({
      destination: endpoint,
      body: JSON.stringify(body),
    });
  } else {
    console.warn("⚠ WebSocket not ready");
  }
};
