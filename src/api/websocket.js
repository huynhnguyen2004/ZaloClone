import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { API_BASE_URL } from "./api";
import { getAccessToken } from "./tokenStorage";
import { useRef } from "react";

// =======================
// GLOBAL STATE
// =======================
let stompClient = null;
let connectedUserId = null;

const callbacks = {
  onFriendList:null,
  onReceiveMessage: null,
  onSeenMessage: null,
  onConnected: null,
  onReceiveNotification:null,
  onUpdateRequestList:null,
   onPresenceChange:null
};

let seenSubscription = null;
let pendingSeen = null;

const WS_BASE_URL = API_BASE_URL;

// =======================
// CONNECT
// =======================
export const connectWebSocket = ({
  userId,
  onFriendList,
  onReceiveMessage,
  onSeenMessage,
  onReceiveNotification,
  onUpdateRequestList,
   onPresenceChange
}) => {
  if (!userId) {
    console.warn("❌ Missing userId");
    return;
  }
if(onFriendList!==undefined) callbacks.onFriendList=onFriendList
if (onReceiveMessage !== undefined) callbacks.onReceiveMessage = onReceiveMessage;
if (onSeenMessage !== undefined) callbacks.onSeenMessage = onSeenMessage;
if(onReceiveNotification!==undefined) callbacks.onReceiveNotification=onReceiveNotification;
if(onUpdateRequestList!==undefined) callbacks.onUpdateRequestList=onUpdateRequestList;
if( onPresenceChange!==undefined) callbacks.onPresenceChange=onPresenceChange
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

    stompClient.subscribe(`/topic/presence`,(msg)=>{
      callbacks.onPresenceChange?.(JSON.parse(msg.body));
    })
   stompClient.subscribe(`/topic/friend-list/${userId}`,(msg)=>{
    callbacks.onFriendList?.(JSON.parse(msg.body));
   })

    // ===== CHAT =====
    stompClient.subscribe(`/topic/chat/${userId}`, (msg) => {
      callbacks.onReceiveMessage?.(JSON.parse(msg.body));
    });

   
    // ===== SEEN =====
    stompClient.subscribe(`/user/${userId}/queue/seen`, (msg) => {
      callbacks.onSeenMessage?.(msg.body);
    });

    stompClient.subscribe(`/topic/notification/${userId}`,(msg)=>{
      callbacks.onReceiveNotification?.(JSON.parse(msg.body));
    })
    stompClient.subscribe(`/topic/friend-request/${userId}`,(msg)=>{
      callbacks.onUpdateRequestList?.(JSON.parse(msg.body));
      })

    // ✅ CHỈ GỬI ONLINE Ở ĐÂY
    sendUserOnline(userId);



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