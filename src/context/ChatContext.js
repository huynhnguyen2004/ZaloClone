import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useUser } from "./UserContext";
import { getMessage } from "../api/service/chat";
import { getOrCreateConversation } from "../api/service/conversation";
import { connectWebSocket, disconnectWebSocket } from "../api/websocket";

const ChatContext = createContext();
export const useChat = () => useContext(ChatContext);

export function ChatProvider({ children }) {
  // ==========================
  // STATE
  // ==========================
  const [activeChat, setActiveChat] = useState(null); // { friend + conversationId }
  const [messages, setMessages] = useState([]);
  const [latestMessage, setLatestMessage] = useState(null); // 🔥 Tin nhắn mới nhất từ WebSocket

  const { currentUser } = useUser();

  // ==========================
  // REF (chống stale state)
  // ==========================
  const activeChatRef = useRef(null);
  const addedMessageIds = useRef(new Set());

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  // ==========================
  // 🔥 WEBSOCKET
  // ==========================
  useEffect(() => {
    if (!currentUser?.id) return;

    connectWebSocket({
      userId: currentUser.id,

      onReceiveMessage: (msg) => {
        console.log("📨 onReceiveMessage:", msg);
        const chat = activeChatRef.current;
        if (!chat) {
          console.log("⚠️ No active chat");
          return;
        }

        // 🔥 Lấy giá trị từ cấu trúc nested hoặc flat
        const msgConversationId = msg.conversation?.id || msg.conversationId;
        const msgSenderId = msg.sender?.id || msg.senderId;

        // ✅ Kiểm tra hội thoại
        const isMatchConversation = msgConversationId === chat.conversationId;
        const isMatchByUsers = msgSenderId === chat.friendId;
        
        console.log("🔍 Check:", { 
          msgConversationId, 
          chatConversationId: chat.conversationId,
          msgSenderId,
          friendId: chat.friendId,
          isMatchConversation, 
          isMatchByUsers 
        });

        if (!isMatchConversation && !isMatchByUsers) {
          console.log("⚠️ Message not for this conversation");
          return;
        }

        // ❌ Tránh duplicate
        if (addedMessageIds.current.has(msg.id)) {
          console.log("⚠️ Duplicate message:", msg.id);
          return;
        }

        console.log("✅ Adding message to chat:", msg.id);
        addedMessageIds.current.add(msg.id);

        setMessages((prev) => [...prev, msg]);
        
        // 🔥 Lưu tin nhắn mới nhất để cập nhật ConversationList
        const msgConvId = msg.conversation?.id || msg.conversationId;
        const msgContent = msg.content;
        const msgTime = msg.createdAt;
        const senderId = msg.sender?.id || msg.senderId;
        
        setLatestMessage({
          conversationId: msgConvId,
          content: msgContent,
          createdAt: msgTime,
          senderId: senderId,
        });
      },
    });

    return () => disconnectWebSocket();
  }, [currentUser?.id]);

  // ==========================
  // 🔥 OPEN CHAT (CỐT LÕI)
  // ==========================
  const openChat = async (friend) => {
    if (!currentUser?.id || !friend?.friendId) return;

    try {
      // reset state
      setMessages([]);
      addedMessageIds.current.clear();

      // 1️⃣ LẤY / TẠO CONVERSATION
      const { conversationId } = await getOrCreateConversation(
        currentUser.id,
        friend.friendId
      );

      // 2️⃣ SET ACTIVE CHAT
      const chat = {
        ...friend,
        conversationId,
      };
      setActiveChat(chat);

      // 3️⃣ LOAD MESSAGE
      const list = await getMessage(conversationId);

      addedMessageIds.current = new Set(list.map((m) => m.id));
      setMessages(list);

    } catch (error) {
      console.error("Open chat error:", error);
    }
  };

  // ==========================
  // 🔥 NOTIFY NEW MESSAGE (cập nhật ConversationList)
  // ==========================
  const notifyNewMessage = (msgData) => {
    setLatestMessage({
      conversationId: msgData.conversationId,
      content: msgData.content,
      createdAt: new Date().toISOString(),
      senderId: msgData.senderId,
      isMe: true,
    });
  };

  // ==========================
  // PROVIDER
  // ==========================
  return (
    <ChatContext.Provider
      value={{
        activeChat,
        messages,
        openChat,
        setMessages,
        setActiveChat,
        latestMessage, // 🔥 Tin nhắn mới nhất từ WebSocket
        notifyNewMessage, // 🔥 Gọi khi gửi tin nhắn
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
