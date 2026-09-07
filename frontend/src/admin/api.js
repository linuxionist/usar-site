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

// Generic CRUD helper for a REST resource (list/get/create/update/delete).
const makeResource = (url) => ({
  list: (params) => adminApi.get(url, { params }).then((r) => r.data),
  get: (id) => adminApi.get(`${url}${id}/`).then((r) => r.data),
  create: (payload) => adminApi.post(url, payload).then((r) => r.data),
  update: (id, payload) => adminApi.patch(`${url}${id}/`, payload).then((r) => r.data),
  remove: (id) => adminApi.delete(`${url}${id}/`),
});

export const adminEndpoints = {
  login: (username, password) => adminApi.post("/auth/login/", { username, password }),
  currentUser: () => adminApi.get("/auth/me/"),

  listMembers: (params) => adminApi.get("/members/", { params }).then((r) => r.data),
  getMember: (id) => adminApi.get(`/members/${id}/`).then((r) => r.data),
  createMember: (payload) => adminApi.post("/members/", payload).then((r) => r.data),
  updateMember: (id, payload) => adminApi.patch(`/members/${id}/`, payload).then((r) => r.data),
  deleteMember: (id) => adminApi.delete(`/members/${id}/`),

  teamRoles: () => adminApi.get("/team-roles/").then((r) => r.data.results ?? r.data),
  hierarchies: () => adminApi.get("/hierarchies/").then((r) => r.data.results ?? r.data),

  // Bilingual content resources managed by the staff admin module.
  teamStatus: makeResource("/status/"),
  impactMetrics: makeResource("/impact-metrics/"),
  capabilities: makeResource("/capabilities/"),
  news: makeResource("/news/"),
  deployments: makeResource("/deployments/"),
  trainingExercises: makeResource("/training-exercises/"),
  teamRolesResource: makeResource("/team-roles/"),
  hierarchiesResource: makeResource("/hierarchies/"),
  applicantPipelinePhases: makeResource("/applicant-phases/"),
  volunteerApplications: makeResource("/volunteer-applications/"),
  // Applicant pipeline actions
  advanceApplicationPhase: (id) =>
    adminApi.post(`/volunteer-applications/${id}/advance_phase/`).then((r) => r.data),
  activateApplication: (id) =>
    adminApi.post(`/volunteer-applications/${id}/activate/`).then((r) => r.data),
  rejectApplication: (id) =>
    adminApi.post(`/volunteer-applications/${id}/reject/`).then((r) => r.data),
  flagApplication: (id) =>
    adminApi.post(`/volunteer-applications/${id}/flag_review/`).then((r) => r.data),
  archiveApplication: (id) =>
    adminApi.post(`/volunteer-applications/${id}/archive/`).then((r) => r.data),
  listCountries: () => adminApi.get("/countries/").then((r) => r.data),
  setChecklistItem: (id, itemId, done) =>
    adminApi
      .post(`/volunteer-applications/${id}/set_checklist/`, { item_id: itemId, done })
      .then((r) => r.data),
  setPhaseComment: (id, phase, text) =>
    adminApi
      .post(`/volunteer-applications/${id}/set_comment/`, { phase, text })
      .then((r) => r.data),
  approveDocument: (id, documentId) =>
    adminApi
      .post(`/volunteer-applications/${id}/approve_document/`, { document_id: documentId })
      .then((r) => r.data),
  rejectDocument: (id, documentId) =>
    adminApi
      .post(`/volunteer-applications/${id}/reject_document/`, { document_id: documentId })
      .then((r) => r.data),
  approveMedical: (id, documentId) =>
    adminApi
      .post(`/volunteer-applications/${id}/approve_medical/`, { document_id: documentId })
      .then((r) => r.data),
  rejectMedical: (id, documentId) =>
    adminApi
      .post(`/volunteer-applications/${id}/reject_medical/`, { document_id: documentId })
      .then((r) => r.data),
  affiliations: makeResource("/affiliations/"),
  partners: makeResource("/partners/"),
  fundingNeeds: makeResource("/funding-needs/"),
  sponsorshipTiers: makeResource("/sponsorship-tiers/"),
};
