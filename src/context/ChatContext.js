import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useUser } from "./UserContext";
import { getMessage, readMessage } from "../api/service/chat";
import { getOrCreateConversation } from "../api/service/conversation";
import {
  connectWebSocket,
  disconnectWebSocket,
  subscribeToConversationSeen,
  unsubscribeFromConversationSeen,
} from "../api/websocket";

const ChatContext = createContext();
export const useChat = () => useContext(ChatContext);

export function ChatProvider({ children }) {
  // ==========================
  // STATE
  // ==========================
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [seenByFriend, setSeenByFriend] = useState(false);

  const { currentUser } = useUser();

  // ==========================
  // REFS
  // ==========================
  const activeChatRef = useRef(null);
  const addedMessageIds = useRef(new Set());

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  // ==========================
  // 🔥 WEBSOCKET CONNECT
  // ==========================
  useEffect(() => {
    if (!currentUser?.id) return;

    connectWebSocket({
      userId: currentUser.id,

      // ==========================
      // 👁️ SEEN EVENT (realtime)
      // ==========================
      onSeenMessage: (seenUserId) => {
        const chat = activeChatRef.current;
        if (!chat) return;

        const myId = Number(currentUser.id);
        const friendId = Number(chat.friendId);
        const seenId = Number(seenUserId);

        if (seenId === friendId) {
          console.log("👁️ Friend has seen messages (realtime)");

          setSeenByFriend(true);
          setMessages((prev) =>
            prev.map((msg) =>
              Number(msg.senderId || msg.sender?.id) === myId
                ? { ...msg, read: true }
                : msg
            )
          );
        }
      },

      // ==========================
      // 📨 RECEIVE MESSAGE
      // ==========================
      onReceiveMessage: (msg) => {
        const chat = activeChatRef.current;
        if (!chat) return;

        const msgConversationId = msg.conversation?.id || msg.conversationId;
        const senderId = Number(msg.sender?.id || msg.senderId);
        const myId = Number(currentUser.id);
        const friendId = Number(chat.friendId);

        if (msgConversationId !== chat.conversationId) return;

        if (addedMessageIds.current.has(msg.id)) return;

        addedMessageIds.current.add(msg.id);
        setMessages((prev) => [...prev, msg]);

        // 🔥 Nếu đang mở chat & tin nhắn từ bạn bè → auto read
        if (senderId === friendId) {
          readMessage(chat.conversationId, myId).catch(console.error);
        }

        // Nếu mình gửi → reset seen
        if (senderId === myId) {
          setSeenByFriend(false);
        }
      },
    });

    return () => disconnectWebSocket();
  }, [currentUser?.id]);

  // ==========================
  // 🔔 SUBSCRIBE SEEN (khi đổi chat)
  // ==========================
  useEffect(() => {
    if (!activeChat?.conversationId || !currentUser?.id) return;

    const conversationId = activeChat.conversationId;
    const friendId = activeChat.friendId;
    const myId = currentUser.id;

    const handleSeen = (seenUserId) => {
      const seenId = Number(seenUserId);

      if (seenId === Number(friendId)) {
        console.log("👁️ Seen realtime callback");

        setSeenByFriend(true);
        setMessages((prev) =>
          prev.map((msg) =>
            Number(msg.senderId || msg.sender?.id) === Number(myId)
              ? { ...msg, read: true }
              : msg
          )
        );
      }
    };

    subscribeToConversationSeen(conversationId, handleSeen);

    return () => {
      unsubscribeFromConversationSeen();
    };
  }, [activeChat?.conversationId, activeChat?.friendId, currentUser?.id]);

  // ==========================
  // 🔥 OPEN CHAT
  // ==========================
  const openChat = async (friend) => {
    if (!currentUser?.id || !friend?.friendId) return;

    try {
      setMessages([]);
      addedMessageIds.current.clear();
      setSeenByFriend(false);

      const { conversationId } = await getOrCreateConversation(
        currentUser.id,
        friend.friendId
      );

      const chat = { ...friend, conversationId };
      setActiveChat(chat);

      const list = await getMessage(conversationId);
      addedMessageIds.current = new Set(list.map((m) => m.id));
      setMessages(list);

      await readMessage(conversationId, currentUser.id);
    } catch (err) {
      console.error("❌ Open chat error:", err);
    }
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
        seenByFriend,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
