import { API_BASE_URL } from "../api/api";

// Default avatar khi không có ảnh
const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/847/847969.png";

// Default cover khi không có ảnh bìa
const DEFAULT_COVER = null;

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

/**
 * Xử lý URL cover từ database
 * Nếu URL đã đầy đủ (http/https) thì trả về nguyên
 * Nếu URL là relative path (ví dụ: /uploads/cover/user_5/abc.png) thì thêm base URL
 * Nếu không có URL thì trả về null (sẽ dùng gradient mặc định)
 */
export const getCoverUrl = (coverUrl) => {
  if (!coverUrl) return DEFAULT_COVER;

  // Nếu đã là URL đầy đủ, trả về nguyên
  if (coverUrl.startsWith("http://") || coverUrl.startsWith("https://")) {
    return coverUrl;
  }

  // Nếu là relative path, thêm base URL
  const cleanPath = coverUrl.startsWith("/") ? coverUrl : `/${coverUrl}`;
  return `${API_BASE_URL}${cleanPath}`;
};

export { DEFAULT_AVATAR, DEFAULT_COVER };
