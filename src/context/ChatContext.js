import { createContext, useContext, useEffect, useRef, useState } from "react";
import { getMessage, readMessage } from "../api/service/chat";
import { getOrCreateConversation } from "../api/service/conversation";
import {
  connectWebSocket,
  disconnectWebSocket,
  subscribeToConversationSeen,
  unsubscribeFromConversationSeen,
} from "../api/websocket";
import { AuthContext } from "./authContext";


const ChatContext = createContext();
export const useChat = () => useContext(ChatContext);

export function ChatProvider({ children }) {
  // ==========================
  // STATE
  // ==========================
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0); // Số tin nhắn chưa đọc
  const [seenByFriend, setSeenByFriend] = useState(false);
  const [newMessageTrigger, setNewMessageTrigger] = useState(0); // Trigger để refresh conversation list

  const { currentUser } = useContext(AuthContext);

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
        const msgConversationId = msg.conversation?.id || msg.conversationId;
        const senderId = Number(msg.sender?.id || msg.senderId);
        const myId = Number(currentUser.id);

        // Nếu tin nhắn do mình gửi
        if (senderId === myId) {
          if (chat && msgConversationId === chat.conversationId) {
            if (!addedMessageIds.current.has(msg.id)) {
              addedMessageIds.current.add(msg.id);
              setMessages((prev) => [...prev, msg]);
              setSeenByFriend(false);
            }
          }
          return;
        }

        // 🔥 Tin nhắn từ người khác
        // Nếu đang mở đúng chat → thêm tin nhắn vào
        if (chat && chat.conversationId === msgConversationId) {
          const friendId = Number(chat.friendId);

          if (addedMessageIds.current.has(msg.id)) return;

          addedMessageIds.current.add(msg.id);
          setMessages((prev) => [...prev, msg]);

          // Tin nhắn từ bạn bè → auto read
          if (senderId === friendId) {
            readMessage(chat.conversationId, myId).catch(console.error);
          }
        } else {
          // 🔔 Không đang mở chat này → tăng số tin nhắn chưa đọc
          setUnreadCount((prev) => prev + 1);
        }
        
        // 🔄 Trigger refresh conversation list khi nhận tin nhắn mới
        setNewMessageTrigger((prev) => prev + 1);
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

      // Reset số tin nhắn chưa đọc khi mở chat
      setUnreadCount(0);

      await readMessage(conversationId, currentUser.id);
    } catch (err) {
      console.error("❌ Open chat error:", err);
    }
  };

  // ==========================
  // CLEAR UNREAD
  // ==========================
  const clearUnread = () => setUnreadCount(0);

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
        unreadCount,
        clearUnread,
        newMessageTrigger,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
