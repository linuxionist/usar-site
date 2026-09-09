import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

// The member portal runs inside the same session as the admin module:
// members sign in through /auth/login/ and share the "usar_admin_token" the
// admin flow stores. These endpoints only ever expose the signed-in user's
// own data, so a shared token cannot leak another member's profile.
export const portalApi = axios.create({ baseURL });

portalApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("usar_admin_token");
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export const portalEndpoints = {
  profile: () => portalApi.get("/member-portal/profile/").then((r) => r.data),
  updateProfile: (payload) => portalApi.patch("/member-portal/update_profile/", payload).then((r) => r.data),
};