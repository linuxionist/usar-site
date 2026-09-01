import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

export const api = axios.create({ baseURL });

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
  trainingPipeline: () => api.get("/training-pipeline/").then((r) => r.data.results ?? r.data),
  leadership: () => api.get("/leadership/").then((r) => r.data.results ?? r.data),
  affiliations: () => api.get("/affiliations/").then((r) => r.data.results ?? r.data),
  partners: () => api.get("/partners/").then((r) => r.data.results ?? r.data),
  fundingNeeds: () => api.get("/funding-needs/").then((r) => r.data.results ?? r.data),
  sponsorshipTiers: () => api.get("/sponsorship-tiers/").then((r) => r.data.results ?? r.data),
  submitVolunteerApplication: (payload) => api.post("/volunteer-applications/", payload),
  submitContactMessage: (payload) => api.post("/contact-messages/", payload),
};
