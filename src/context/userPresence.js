export const normalizeFriendRequest = (requestData) => ({
  id: requestData.id,
  senderId: requestData.senderId,
  receiverId: requestData.receiverId,
  senderName: requestData.senderName,
  phone: requestData.phone ?? null,
  createdAt: requestData.createdAt,
  status: requestData.status,
  senderAvatarUrl: requestData.senderAvatarUrl || requestData.avatar || null,
});
