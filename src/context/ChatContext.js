import { createContext, useContext, useEffect, useRef, useState } from "react";
import { getMessage, readMessage, sendReact } from "../api/service/chat";
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

const extractMessageList = (page) => {
  if (Array.isArray(page)) return page;
  if (Array.isArray(page?.messages)) return page.messages;
  if (Array.isArray(page?.items)) return page.items;
  if (Array.isArray(page?.content)) return page.content;
  if (Array.isArray(page?.data)) return page.data;

  return [];
};

const getOldestMessageId = (list = []) => {
  if (!list.length) return null;
  return list[0]?.id ?? null;
};

const getNewestMessageId = (list = []) => {
  if (!list.length) return null;
  return list[list.length - 1]?.id ?? null;
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
  const normalizedMessages = normalizeMessageList(extractMessageList(page));

  return {
    messages: normalizedMessages,
    nextBefore: page?.nextBefore ?? null,
    nextAfter: page?.nextAfter ?? null,
  };
};

const mergeMessageById = (list = [], incomingMessage) => {
  if (!incomingMessage?.id) {
    return list;
  }

  const nextList = [...list];
  const nextIndex = nextList.findIndex(
    (message) => Number(message?.id) === Number(incomingMessage.id),
  );

  if (nextIndex === -1) {
    nextList.push(incomingMessage);
  } else {
    nextList[nextIndex] = {
      ...nextList[nextIndex],
      ...incomingMessage,
      reacts: Array.isArray(incomingMessage.reacts)
        ? incomingMessage.reacts
        : nextList[nextIndex].reacts,
    };
  }

  return normalizeMessageList(nextList);
};

const mergeReactIntoMessageList = (list = [], reactPayload) => {
  const messageId = Number(reactPayload?.messageId);
  if (!messageId) return list;

  return list.map((message) => {
    if (Number(message?.id) !== messageId) return message;

    const currentReacts = Array.isArray(message?.reacts) ? message.reacts : [];
    const nextReacts = [...currentReacts];

    const sameUserIndex = nextReacts.findIndex((react) => {
      if (react?.userId != null && reactPayload?.userId != null) {
        return Number(react.userId) === Number(reactPayload.userId);
      }

      return (
        String(react?.userFirstName || "") ===
          String(reactPayload?.userFirstName || "") &&
        String(react?.userLastName || "") ===
          String(reactPayload?.userLastName || "")
      );
    });

    if (sameUserIndex === -1) {
      nextReacts.push(reactPayload);
    } else {
      nextReacts[sameUserIndex] = {
        ...nextReacts[sameUserIndex],
        ...reactPayload,
      };
    }

    return {
      ...message,
      reacts: nextReacts,
    };
  });
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
  const messagesRef = useRef(emptyPage);


  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

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
        console.log(message);
        
        const chat = activeChatRef.current;
        const incomingConversationId = getConversationId(message);
        if (incomingConversationId == null || message?.id == null) return;

        const isActiveConversation =
          Number(chat?.conversationId) === Number(incomingConversationId);

        const existingMessage = messagesRef.current.messages.some(
          (item) => Number(item?.id) === Number(message?.id),
        );
        if (!existingMessage) {
          setLastRealtimeMessage(message);
        }

        if (isActiveConversation) {
          setMessages((prev) => {
            const mergedMessages = mergeMessageById(prev.messages, message);

            return {
              ...prev,
              messages: mergedMessages,
              nextAfter: mergedMessages.length
                ? mergedMessages[mergedMessages.length - 1].id
                : prev.nextAfter,
            };
          });

          if (existingMessage) {
            return;
          }

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
      onReceiveReact: (reactPayload) => {
        
        if (!reactPayload?.messageId) return;

        const messageExists = messagesRef.current.messages.some(
          (item) => Number(item?.id) === Number(reactPayload?.messageId),
        );

        if (!messageExists) return;

        setMessages((prev) => ({
          ...prev,
          messages: mergeReactIntoMessageList(prev.messages, reactPayload),
        }));
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

      // Bỏ qua event do chính mình trigger khi vừa mở chat / đọc message.
      if (Number(seenUserId) === Number(currentUser?.id)) {
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
    if (!currentUser?.id) return;

    const hasConversationId = Boolean(friend?.conversationId);
    const hasFriendId = Boolean(friend?.friendId);

    if (!hasConversationId && !hasFriendId) {
      return;
    }

    try {
      setMessages(emptyPage);
      setSeenByFriend(false);
      setHasMoreOlderMessages(true);

      let data = null;
      let conversationId = friend?.conversationId ?? null;

      if (!conversationId && hasFriendId) {
        data = await getOrCreateConversation({
          userId: friend.friendId,
        });
        conversationId = data?.conversationId;
      }

      if (!conversationId) {
        return;
      }

      const chat = {
        ...friend,
        conversationId,
        type: friend?.type ?? data?.type,
        avatarUrl: friend?.avatarUrl ?? data?.avatarUrl,
        displayName: friend?.displayName ?? data?.nameGroup ?? friend?.friendName,
        friendName: friend?.friendName ?? friend?.displayName ?? data?.nameGroup,
      };
      setActiveChat(chat);

      const page = await getMessage({ conversationId, size: PAGE_SIZE });
      const normalizedPage = normalizePage(page);

      setMessages(normalizedPage);
      setHasMoreOlderMessages(normalizedPage.nextBefore != null);

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

    const currentMessages = messagesRef.current?.messages ?? [];
    const before = getOldestMessageId(currentMessages) ?? messages?.nextBefore;
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

      setHasMoreOlderMessages(normalizedPage.nextBefore != null);
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

    const currentMessages = messagesRef.current?.messages ?? [];
    const after = getNewestMessageId(currentMessages) ?? messages?.nextAfter;
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
      const mergedMessages = mergeMessageById(prev.messages, message);

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

  const reactToMessage = async ({ messageId, reactTypeId }) => {
    if (!currentUser?.id || !messageId || !reactTypeId) return null;

    try {
      const response = await sendReact({ messageId, reactTypeId });
      if (response) {
        setMessages((prev) => ({
          ...prev,
          messages: response?.id
            ? mergeMessageById(prev.messages, response)
            : mergeReactIntoMessageList(prev.messages, response),
        }));
      }

      return response;
    } catch (error) {
      console.error("❌ Send react error:", error);
      return null;
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
        reactToMessage,
        isLoadingOlderMessages,
        hasMoreOlderMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
