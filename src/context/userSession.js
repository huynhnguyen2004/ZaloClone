import { getCurrentUser } from "../api/service/userService";
import { getAccessToken, setAccessToken } from "../api/tokenStorage";

export const resolveCurrentUser = async () => {
  let token = getAccessToken();

  if (token) {
    try {
      const userResponse = await getCurrentUser();
      return userResponse;
    } catch (error) {
      console.error("Lỗi lấy user:", error);
      return null;
    }
  }
};
