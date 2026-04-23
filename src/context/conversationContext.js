import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getMyConversations } from "../api/service/conversation";
import { UserContext } from "./userContext";
import { useChat } from "./ChatContext";

const ConversationContext = createContext();
const PAGE_SIZE = 20;

const uniqueByConversationId = (list = []) => {
  const map = new Map();

  list.forEach((item) => {
    if (!item?.conversationId) return;
    map.set(item.conversationId, item);
  });

  return [...map.values()];
};

const getCursorFromLastItem = (list = []) => {
  if (!list.length) return null;

  const lastItem = list[list.length - 1];
  return lastItem?.lastMessageId ?? lastItem?.id ?? null;
};

const getRealtimeMessageContent = (message) => {
  return message?.content ?? message?.messageContent ?? "";
};

export const ConversationProvider = ({ children }) => {
  const { currentUser } = useContext(UserContext);
  const { lastRealtimeMessage } = useChat();
  const [conversations, setConversations] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [lastMessageId, setLastMessageId] = useState(null);
  const [hasMoreConversations, setHasMoreConversations] = useState(true);
  const [isLoadingMoreConversations, setIsLoadingMoreConversations] =
    useState(false);

  const fetchConversations = useCallback(async (showLoading = false) => {
    if (!currentUser?.id) {
      setConversations([]);
      setLastMessageId(null);
      setHasMoreConversations(false);
      setIsLoadingMoreConversations(false);
      setInitialLoading(false);
      return;
    }

    if (showLoading) {
      setInitialLoading(true);
    }

    try {
      const data = (await getMyConversations({ size: PAGE_SIZE })) || [];
      setConversations(uniqueByConversationId(data));
      setLastMessageId(getCursorFromLastItem(data));
      setHasMoreConversations(data.length === PAGE_SIZE);
    } catch (error) {
      console.error(error);
    } finally {
      setInitialLoading(false);
    }
  }, [currentUser?.id]);

  const loadMoreConversations = useCallback(async () => {
    if (!currentUser?.id || !hasMoreConversations || isLoadingMoreConversations) {
      return;
    }

    if (lastMessageId == null) {
      setHasMoreConversations(false);
      return;
    }

    setIsLoadingMoreConversations(true);
    try {
      const data =
        (await getMyConversations({ size: PAGE_SIZE, lastMessageId })) || [];

      if (!data.length) {
        setHasMoreConversations(false);
        return;
      }

      setConversations((prev) => uniqueByConversationId([...prev, ...data]));

      const nextCursor = getCursorFromLastItem(data);
      setLastMessageId(nextCursor);

      if (data.length < PAGE_SIZE || nextCursor == null) {
        setHasMoreConversations(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingMoreConversations(false);
    }
  }, [currentUser?.id, hasMoreConversations, isLoadingMoreConversations, lastMessageId]);

  useEffect(() => {
    fetchConversations(true);
  }, [fetchConversations]);

  useEffect(() => {
    if (!currentUser?.id || !lastRealtimeMessage?.conversationId) return;

    const targetConversationId = Number(lastRealtimeMessage.conversationId);
    let needRefreshFromApi = false;

    setConversations((prev) => {
      const index = prev.findIndex(
        (conversation) =>
          Number(conversation?.conversationId) === targetConversationId,
      );

      if (index === -1) {
        needRefreshFromApi = true;
        return prev;
      }

      const currentConversation = prev[index];
      const isCurrentUserSender =
        Number(lastRealtimeMessage?.senderId) === Number(currentUser?.id);
      const updatedConversation = {
        ...currentConversation,
        // New schema fields
        lastMessage:
          getRealtimeMessageContent(lastRealtimeMessage) ||
          currentConversation.lastMessage,
        lastMessageTime:
          lastRealtimeMessage?.createdAt || currentConversation.lastMessageTime,
        lastSenderId:
          Number(
            lastRealtimeMessage?.senderId ?? currentConversation.lastSenderId,
          ),
        isRead: isCurrentUserSender,
        lastMessageId:
          lastRealtimeMessage?.id ?? currentConversation.lastMessageId,
        // Backward compatible fields
        lastReadMessageContent:
          getRealtimeMessageContent(lastRealtimeMessage) ||
          currentConversation.lastReadMessageContent,
        createdAt:
          lastRealtimeMessage?.createdAt || currentConversation.createdAt,
        userIdLastMessage:
          Number(
            lastRealtimeMessage?.senderId ?? currentConversation.userIdLastMessage,
          ),
        isReadLastContent: isCurrentUserSender,
      };

      const next = [...prev];
      next.splice(index, 1);
      next.unshift(updatedConversation);
      return next;
    });

    if (needRefreshFromApi) {
      fetchConversations(false);
    }
  }, [currentUser?.id, fetchConversations, lastRealtimeMessage]);

  const value = useMemo(
    () => ({
      conversations,
      initialLoading,
      refreshConversations: fetchConversations,
      loadMoreConversations,
      hasMoreConversations,
      isLoadingMoreConversations,
      setConversations,
    }),
    [
      conversations,
      fetchConversations,
      hasMoreConversations,
      initialLoading,
      isLoadingMoreConversations,
      loadMoreConversations,
    ],
  );

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversation = () => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error("useConversation must be used within ConversationProvider");
  }

  return context;
};