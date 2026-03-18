import { getCurrentUser } from "../api/service/userService";
import { refesh } from "../api/service/refreshTokenService";
import { getAccessToken, setAccessToken } from "../api/tokenStorage";

export const resolveCurrentUser = async () => {
  let token = getAccessToken();

  if (!token) {
    try {
      const refreshRes = await refesh();
      const newAccessToken = refreshRes?.data?.result?.accessToken;

      if (!newAccessToken) {
        return null;
      }

      setAccessToken(newAccessToken);
      token = newAccessToken;
    } catch (error) {
      return null;
    }
  }

  try {
    const userResponse = await getCurrentUser();
    return userResponse?.result ?? userResponse;
  } catch (error) {
    console.error("Lỗi lấy user:", error);
    return null;
  }
};
