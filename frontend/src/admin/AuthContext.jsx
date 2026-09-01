import { createContext, useContext, useEffect, useState } from "react";
import { adminEndpoints, tokenStore } from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = tokenStore.get();
    if (!token) {
      setChecking(false);
      return;
    }
    adminEndpoints
      .currentUser()
      .then((res) => setUser(res.data))
      .catch(() => tokenStore.clear())
      .finally(() => setChecking(false));
  }, []);

  async function login(username, password) {
    const res = await adminEndpoints.login(username, password);
    if (!res.data.is_staff) {
      throw new Error("This account does not have admin access.");
    }
    tokenStore.set(res.data.token);
    setUser({ username: res.data.username, is_staff: res.data.is_staff });
  }

  function logout() {
    tokenStore.clear();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, checking, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
