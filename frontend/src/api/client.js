import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

const STORAGE_KEY = "usar_language";

export const api = axios.create({ baseURL });

// Current language for public API requests. Kept in sync with the language
// toggle so a refetch after switching languages sends the right `?lang=`
// immediately (reading localStorage from an effect would lag one render).
let apiLang = localStorage.getItem(STORAGE_KEY) || "en";
export const setApiLang = (lang) => {
  apiLang = lang;
};

// Attach the current UI language as `?lang=` on public GET requests so the API
// returns the matching translation for translatable content. Defaults to "en".
api.interceptors.request.use((config) => {
  if (config.method && config.method.toLowerCase() === "get") {
    config.params = { lang: apiLang, ...(config.params || {}) };
  }
  return config;
});

// Convenience wrappers used by the pages. Each returns the parsed
// results array (or object) so components don't deal with pagination shape.
export const endpoints = {
  status: () => api.get("/status/").then((r) => r.data.results?.[0] ?? r.data[0]),
  impactMetrics: () => api.get("/impact-metrics/").then((r) => r.data.results ?? r.data),
  capabilities: () => api.get("/capabilities/").then((r) => r.data.results ?? r.data),
  news: () => api.get("/news/").then((r) => r.data.results ?? r.data),
  deployments: () => api.get("/deployments/").then((r) => r.data.results ?? r.data),
  trainingExercises: () => api.get("/training-exercises/").then((r) => r.data.results ?? r.data),
  teamRoles: () => api.get("/team-roles/").then((r) => r.data.results ?? r.data),
  applicantPhases: () => api.get("/applicant-phases/").then((r) => r.data.results ?? r.data),
  countries: () => api.get("/countries/").then((r) => r.data.results ?? r.data),
  commandLeadership: () => api.get("/command-leadership/").then((r) => r.data.results ?? r.data),
  affiliations: () => api.get("/affiliations/").then((r) => r.data.results ?? r.data),
  partners: () => api.get("/partners/").then((r) => r.data.results ?? r.data),
  fundingNeeds: () => api.get("/funding-needs/").then((r) => r.data.results ?? r.data),
  sponsorshipTiers: () => api.get("/sponsorship-tiers/").then((r) => r.data.results ?? r.data),
  submitVolunteerApplication: (payload) => api.post("/volunteer-applications/", payload),
  submitContactMessage: (payload) => api.post("/contact-messages/", payload),
  portalLookup: (payload) => api.post("/applicant-portal/lookup/", payload).then((r) => r.data),
  portalUpload: (payload) => api.post("/applicant-portal/upload_documents/", payload).then((r) => r.data),
};
