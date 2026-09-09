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
    // Members sign in through the same flow; non-staff accounts land in the
    // portal where the UI (and backend) restricts them to their own profile.
    tokenStore.set(res.data.token);
    const next = { username: res.data.username, is_staff: res.data.is_staff };
    setUser(next);
    return next;
  }

  function logout() {
    tokenStore.clear();
    setUser(null);
  }

  async function refreshUser() {
    const res = await adminEndpoints.currentUser();
    setUser({ username: res.data.username, is_staff: res.data.is_staff });
    return res.data;
  }

  return (
    <AuthContext.Provider value={{ user, checking, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
