import { createContext, useEffect, useState } from "react";
import { getCurrentUser } from "../api/service/userService";
import { getAccessToken } from "../api/tokenStorage";

export const UserContext = createContext();
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const token = getAccessToken();
  useEffect(() => {
    if (!token) return;
    const fetchCurrentUser = async () => {
      try {
        const res = await getCurrentUser();
        if (res) {
          setUser(res);
        }
      } catch (error) {
        console.log("lỗi :"+error);
        setUser(null);
        
      }
    };

    fetchCurrentUser();
  }, [token]);
  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};
