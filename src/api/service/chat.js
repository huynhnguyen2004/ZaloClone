import api from "../api";

export const sendMessage = async (data) => {
  const res = await api.post("/api/message/send", data);
  return res.data.result;
};

export const getMessage = async ({
  conversationId,
  before,
  after,
  size = 20,
} = {}) => {
  const res = await api.get("/api/message", {
    params: {
      conversationId,
      before,
      after,
      size,
    },
  });

  return res.data.result;
};

export const readMessage = async (conversationId) => {
  const res = await api.post("/api/message/read", null, {
    params: {
      conversationId: conversationId,
    },
  });
  return res.data.result;
};
