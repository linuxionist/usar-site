import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "/api/v1";
const TOKEN_KEY = "usar_admin_token";

export const adminApi = axios.create({ baseURL });

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export const adminEndpoints = {
  login: (username, password) => adminApi.post("/auth/login/", { username, password }),
  currentUser: () => adminApi.get("/auth/me/"),

  listMembers: (params) => adminApi.get("/members/", { params }).then((r) => r.data),
  getMember: (id) => adminApi.get(`/members/${id}/`).then((r) => r.data),
  createMember: (payload) => adminApi.post("/members/", payload).then((r) => r.data),
  updateMember: (id, payload) => adminApi.patch(`/members/${id}/`, payload).then((r) => r.data),
  deleteMember: (id) => adminApi.delete(`/members/${id}/`),

  teamRoles: () => adminApi.get("/team-roles/").then((r) => r.data.results ?? r.data),
};
