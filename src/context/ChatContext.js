import { createContext, useContext, useEffect, useRef, useState } from "react";
import { getMessage, readMessage } from "../api/service/chat";
import { getOrCreateConversation } from "../api/service/conversation";
import {
  connectWebSocket,
  disconnectWebSocket,
  subscribeToConversationSeen,
  unsubscribeFromConversationSeen,
} from "../api/websocket";
import { UserContext } from "./userContext";

const ChatContext = createContext();
export const useChat = () => useContext(ChatContext);

const PAGE_SIZE = 20;

const emptyPage = {
  messages: [],
  nextBefore: null,
  nextAfter: null,
};

const getConversationId = (message) =>
   message?.conversationId ?? null;

const getSenderId = (message) => Number(message?.senderId ?? 0);

const normalizeMessageList = (list = []) => {
  const uniqueMap = new Map();

  list.forEach((message) => {
    if (message?.id == null) return;
    uniqueMap.set(message.id, message);
  });

  return [...uniqueMap.values()].sort((a, b) => Number(a.id) - Number(b.id));
};

const normalizePage = (page) => {
  const normalizedMessages = normalizeMessageList(page?.messages ?? []);

  return {
    messages: normalizedMessages,
    nextBefore:
      page?.nextBefore ??
      (normalizedMessages.length ? normalizedMessages[0].id : null),
    nextAfter:
      page?.nextAfter ??
      (normalizedMessages.length
        ? normalizedMessages[normalizedMessages.length - 1].id
        : null),
  };
};

const getSeenUserId = (payload) => {
  if (payload == null) return null;
  if (typeof payload === "object") {
    return Number(payload.userId ?? payload.seenUserId ?? payload.senderId ?? null);
  }

  return Number(payload);
};

export function ChatProvider({ children }) {
  // ==========================
  // STATE
  // ==========================
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState(emptyPage);
  const [unreadCount, setUnreadCount] = useState(0); // Số tin nhắn chưa đọc
  const [seenByFriend, setSeenByFriend] = useState(false);
  const [newMessageTrigger, setNewMessageTrigger] = useState(0);
  const [lastRealtimeMessage, setLastRealtimeMessage] = useState(null);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
  const [isLoadingNewerMessages, setIsLoadingNewerMessages] = useState(false);
  const [hasMoreOlderMessages, setHasMoreOlderMessages] = useState(true);
  const [activeTab, setActiveTab] = useState("chats");
  const { currentUser } = useContext(UserContext);

  // ==========================
  // REFS
  // ==========================
  const activeChatRef = useRef(null);
  const currentUserIdRef = useRef(null);


  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    currentUserIdRef.current = currentUser?.id ?? null;
  }, [currentUser?.id]);

  // ==========================
  // 🔥 WEBSOCKET CONNECT
  // ==========================
  useEffect(() => {
    if (!currentUser?.id) return;

    connectWebSocket({
      userId: currentUser.id,

      // Nhận tin nhắn realtime và merge vào page hiện tại nếu đúng conversation.
      onReceiveMessage: (message) => {
        const chat = activeChatRef.current;
        const incomingConversationId = getConversationId(message);
        if (!incomingConversationId) return;

        setLastRealtimeMessage(message);

        if (Number(chat?.conversationId) === Number(incomingConversationId)) {
          setMessages((prev) => {
            const mergedMessages = normalizeMessageList([...prev.messages, message]);

            return {
              ...prev,
              messages: mergedMessages,
              nextAfter: mergedMessages.length
                ? mergedMessages[mergedMessages.length - 1].id
                : prev.nextAfter,
            };
          });

          if (getSenderId(message) !== Number(currentUserIdRef.current)) {
            setSeenByFriend(false);
            readMessage(incomingConversationId).catch((error) => {
              console.error("❌ Read message error:", error);
            });
          }

          setNewMessageTrigger((prev) => prev + 1);
          return;
        }

        setUnreadCount((prev) => prev + 1);
        setNewMessageTrigger((prev) => prev + 1);
      },
      onReceiveReact:(msg)=>{
        console.log(msg);
        
      }
    });

    return () => disconnectWebSocket();
  }, [currentUser?.id]);

  useEffect(() => {
    const conversationId = activeChat?.conversationId;

    unsubscribeFromConversationSeen();

    if (!conversationId || !currentUser?.id) {
      setSeenByFriend(false);
      return;
    }

    subscribeToConversationSeen(conversationId, (payload) => {
      const seenUserId = getSeenUserId(payload);
      if (!seenUserId) return;

      if (Number(seenUserId) !== Number(activeChatRef.current?.friendId)) {
        return;
      }

      setSeenByFriend(true);
      setMessages((prev) => ({
        ...prev,
        messages: prev.messages.map((message) =>
          getSenderId(message) === Number(currentUser?.id)
            ? { ...message, read: true }
            : message,
        ),
      }));
    });

    return () => {
      unsubscribeFromConversationSeen();
    };
  }, [activeChat?.conversationId, currentUser?.id]);


  // ==========================
  // OPEN CHAT + FIRST PAGE
  // ==========================
  const openChat = async (friend) => {
    if (!currentUser?.id || !friend?.friendId) return;

    try {
      setMessages(emptyPage);
      setSeenByFriend(false);
      setHasMoreOlderMessages(true);

      const data = await getOrCreateConversation({
        userId: friend.friendId,
      });

      const conversationId = data.conversationId;

      const chat = { ...friend, conversationId };
      setActiveChat(chat);

      const page = await getMessage({ conversationId, size: PAGE_SIZE });
      const normalizedPage = normalizePage(page);

      setMessages(normalizedPage);
      setHasMoreOlderMessages((normalizedPage.messages ?? []).length === PAGE_SIZE);

      // Reset số tin nhắn chưa đọc khi mở chat
      setUnreadCount(0);

      await readMessage(conversationId);
      setNewMessageTrigger((prev) => prev + 1);
    } catch (err) {
      console.error("❌ Open chat error:", err);
    }
  };

  // ==========================
  // CURSOR PAGINATION - BEFORE
  // ==========================
  const loadOlderMessages = async () => {
    if (!activeChat?.conversationId || isLoadingOlderMessages || !hasMoreOlderMessages) {
      return [];
    }

    const before = messages?.nextBefore;
    if (!before) {
      setHasMoreOlderMessages(false);
      return [];
    }

    setIsLoadingOlderMessages(true);

    try {
      const page = await getMessage({
        conversationId: activeChat.conversationId,
        before,
        size: PAGE_SIZE,
      });

      const normalizedPage = normalizePage(page);

      setMessages((prev) => {
        const mergedMessages = normalizeMessageList([
          ...normalizedPage.messages,
          ...prev.messages,
        ]);

        return {
          ...prev,
          messages: mergedMessages,
          nextBefore: normalizedPage.nextBefore,
        };
      });

      setHasMoreOlderMessages(normalizedPage.messages.length === PAGE_SIZE);
      return normalizedPage.messages;
    } catch (error) {
      console.error("❌ Load older messages error:", error);
      return [];
    } finally {
      setIsLoadingOlderMessages(false);
    }
  };

  // ==========================
  // CURSOR PAGINATION - AFTER
  // ==========================
  const loadNewerMessages = async () => {
    if (!activeChat?.conversationId || isLoadingNewerMessages) {
      return [];
    }

    const after = messages?.nextAfter;
    if (!after) {
      return [];
    }

    setIsLoadingNewerMessages(true);

    try {
      const page = await getMessage({
        conversationId: activeChat.conversationId,
        after,
        size: PAGE_SIZE,
      });

      const normalizedPage = normalizePage(page);

      setMessages((prev) => {
        const mergedMessages = normalizeMessageList([
          ...prev.messages,
          ...normalizedPage.messages,
        ]);

        return {
          ...prev,
          messages: mergedMessages,
          nextAfter: normalizedPage.nextAfter,
        };
      });

      return normalizedPage.messages;
    } catch (error) {
      console.error("❌ Load newer messages error:", error);
      return [];
    } finally {
      setIsLoadingNewerMessages(false);
    }
  };

  // Append local message sau khi send thành công.
  const appendMessage = (message) => {
    setMessages((prev) => {
      const mergedMessages = normalizeMessageList([...prev.messages, message]);

      return {
        ...prev,
        messages: mergedMessages,
        nextAfter: mergedMessages.length
          ? mergedMessages[mergedMessages.length - 1].id
          : prev.nextAfter,
      };
    });
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
        activeTab,
        setActiveTab,
        seenByFriend,
        unreadCount,
        clearUnread,
        newMessageTrigger,
        lastRealtimeMessage,
        loadOlderMessages,
        loadNewerMessages,
        appendMessage,
        isLoadingOlderMessages,
        hasMoreOlderMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
