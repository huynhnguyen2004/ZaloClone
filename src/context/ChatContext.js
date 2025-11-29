// ChatContext.jsx
import { createContext, useContext, useState, useEffect, useRef } from "react";
import { getMessage } from "../api/service/chat";
import { useUser } from "./UserContext";
import { connectWebSocket, disconnectWebSocket } from "../api/websocket";

const ChatContext = createContext();
export const useChat = () => useContext(ChatContext);

export function ChatProvider({ children }) {
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const { currentUser } = useUser();

  const activeChatRef = useRef(null);
  const addedMessageIds = useRef(new Set()); // 🔥 Track added messages

  // Sync activeChat to ref
  useEffect(() => {
    activeChatRef.current = activeChat;
    console.log("📌 activeChat updated:", activeChat);
  }, [activeChat]);

  // ========================================
  // 🔥 KHỞI TẠO WEBSOCKET CHỈ 1 LẦN
  // ========================================
  useEffect(() => {
    if (!currentUser?.id) {
      console.log("❌ No currentUser.id");
      return;
    }

    console.log("🚀 Initializing WebSocket for user:", currentUser.id);

    connectWebSocket({
      userId: currentUser.id,

      onReceiveMessage: (msg) => {
        console.log("🎯 onReceiveMessage called with:", msg);

        const chat = activeChatRef.current;
        console.log("💬 Current activeChat:", chat);

        if (!chat) {
          console.log("⚠️ No active chat, ignoring message");
          return;
        }

        // 🔥 Chặn duplicate messages
        if (addedMessageIds.current.has(msg.id)) {
          console.log("⚠️ Duplicate message ignored:", msg.id);
          return;
        }

        // Lấy ID từ nested object
        const senderId = msg.sender?.id || msg.senderId;
        const receiverId = msg.receiver?.id || msg.receiverId;

        const isFromFriend = senderId === chat.friendId;
        const isToFriend = receiverId === chat.friendId;

        console.log("🔍 Check:", {
          senderId,
          receiverId,
          friendId: chat.friendId,
          isFromFriend,
          isToFriend,
        });

        if (isFromFriend || isToFriend) {
          console.log("✅ Message belongs to this chat, adding to UI");
          
          // 🔥 Mark as added
          addedMessageIds.current.add(msg.id);
          
          setMessages((prev) => {
            // 🔥 Double-check không trùng trong array
            if (prev.some(m => m.id === msg.id)) {
              console.log("⚠️ Message already in array:", msg.id);
              return prev;
            }
            
            console.log("📝 Adding message. Previous count:", prev.length);
            const updated = [...prev, msg];
            console.log("📝 New count:", updated.length);
            return updated;
          });
        } else {
          console.log("❌ Message does not belong to this chat");
        }
      },
    });

    return () => {
      console.log("🧹 Cleanup: Disconnecting WebSocket");
      disconnectWebSocket();
    };
  }, [currentUser?.id]);

  // ========================================
  // 🔥 MỞ CUỘC CHAT
  // ========================================
  const openChat = async (friend) => {
    console.log("🔓 Opening chat with:", friend);
    setActiveChat(friend);

    if (!currentUser?.id) {
      console.log("❌ No currentUser.id in openChat");
      return;
    }

    try {
      const list = await getMessage(currentUser.id, friend.friendId);
      console.log("📥 Loaded messages:", list.length);
      
      // 🔥 Reset tracking khi mở chat mới
      addedMessageIds.current = new Set(list.map(m => m.id));
      
      setMessages(list);
    } catch (error) {
      console.error("❌ Error loading messages:", error);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        setMessages,
        activeChat,
        setActiveChat,
        openChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
