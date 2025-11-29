import { createContext, useContext, useState } from "react";

const ChatContext = createContext();
export const useChat = () => useContext(ChatContext);
export function ChatProvider({ children }) {
  const [activeChat, setActiveChat] = useState(null); // ChatSession
  const [messages, setMessages] = useState([]); // List Message
  const openChat = (user) => {
    setActiveChat(user);
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
