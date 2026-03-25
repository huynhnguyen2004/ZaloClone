import { createContext, useEffect, useState } from "react";
import { getCurrentUser } from "../api/service/userService";
import { getAccessToken } from "../api/tokenStorage";
import { useNavigate } from "react-router-dom";

export const UserContext = createContext();
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const token = getAccessToken();


  const fetchCurrentUser = async () => {
    try {
      const res = await getCurrentUser();
      if (res) {
        setUser(res);
        return res;
      }
    } catch (error) {
      console.log("lỗi :" + error);
      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
     
    fetchCurrentUser();
  }, [token]);

  return (
    <UserContext.Provider value={{user,setUser,fetchCurrentUser }}>
      {children}
    </UserContext.Provider>
  );
};
