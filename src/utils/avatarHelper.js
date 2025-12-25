import { API_BASE_URL } from "../api/api";

// Default avatar khi không có ảnh
const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/847/847969.png";

/**
 * Xử lý URL avatar từ database
 * Nếu URL đã đầy đủ (http/https) thì trả về nguyên
 * Nếu URL là relative path (ví dụ: /uploads/avatar/user_5/abc.png) thì thêm base URL
 * Nếu không có URL thì trả về default avatar
 */
export const getAvatarUrl = (avatarUrl) => {
  if (!avatarUrl) return DEFAULT_AVATAR;

  // Nếu đã là URL đầy đủ, trả về nguyên
  if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) {
    return avatarUrl;
  }

  // Nếu là relative path, thêm base URL
  // Đảm bảo không có double slash
  const cleanPath = avatarUrl.startsWith("/") ? avatarUrl : `/${avatarUrl}`;
  return `${API_BASE_URL}${cleanPath}`;
};

export { DEFAULT_AVATAR };
