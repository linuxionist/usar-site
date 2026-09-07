// Field type -> input type mapping applied by ResourceForm.
export const CHOICES = {
  capabilityCategory: [
    ["heavy_technical", "Heavy/Technical Rescue"],
    ["k9", "Canine (K9) Unit"],
    ["technical_search", "Technical Search"],
    ["medical", "Medical Task Force"],
    ["hazmat", "Hazardous Materials & Technical Support"],
  ],
  newsCategory: [
    ["news", "Team Update"],
    ["dispatch", "Dispatch Log"],
    ["exercise", "Training Exercise"],
  ],
  deploymentStatus: [
    ["active", "Active Operation"],
    ["completed", "Completed"],
  ],
  partnerType: [
    ["agency", "Sponsoring Agency"],
    ["fire_department", "Fire Department"],
    ["ngo", "NGO / Nonprofit Partner"],
  ],
  teamStatus: [
    ["ready", "Ready for Deployment"],
    ["training", "Training in Progress"],
    ["deployed", "Active Deployment"],
  ],
  pipelinePhase: [
    ["application", "Phase 1: Prerequisite and Application"],
    ["screening", "Phase 2: Screening and Background"],
    ["probation", "Phase 3: Physical and Practical Evaluation"],
    ["board", "Phase 4: Board Review and Final Approval"],
    ["active", "Phase 5: Training or Rejection"],
  ],
};

// Helpers to build concise field entries.
const pair = (label, en, es, type = "text") => ({
  kind: "pair",
  label,
  en,
  es,
  type,
});

const single = (name, label, type = "text", extra = {}) => ({
  kind: "single",
  name,
  label,
  type,
  ...extra,
});

const choice = (name, label, options, extra = {}) =>
  single(name, label, "select", { options, ...extra });

export const CRUD_CONFIG = {
  status: {
    noun: "Team Status",
    title: "Team Status",
    endpointKey: "teamStatus",
    listColumns: [{ key: "status" }, { key: "note" }],
    pairs: [pair("Status note", "note", "note_es")],
    singles: [choice("status", "Status", CHOICES.teamStatus)],
  },
  metrics: {
    noun: "Impact Metric",
    title: "Impact Metrics",
    endpointKey: "impactMetrics",
    listColumns: [{ key: "label" }, { key: "value" }, { key: "order", type: "number" }],
    pairs: [pair("Label", "label", "label_es")],
    singles: [single("value", "Value"), single("order", "Order", "number")],
  },
  capabilities: {
    noun: "Capability",
    title: "Capabilities",
    endpointKey: "capabilities",
    listColumns: [{ key: "title" }, { key: "category" }, { key: "order", type: "number" }],
    pairs: [
      pair("Title", "title", "title_es"),
      pair("Summary", "summary", "summary_es"),
      pair("Description", "description", "description_es", "textarea"),
    ],
    singles: [
      choice("category", "Category", CHOICES.capabilityCategory),
      single("icon", "Icon key", "text", { help: "e.g. 'shoring'" }),
      single("order", "Order", "number"),
    ],
  },
  news: {
    noun: "News Update",
    title: "News & Updates",
    endpointKey: "news",
    listColumns: [{ key: "title" }, { key: "category" }, { key: "published_at" }],
    pairs: [
      pair("Title", "title", "title_es"),
      pair("Summary", "summary", "summary_es"),
      pair("Body", "body", "body_es", "textarea"),
    ],
    singles: [
      choice("category", "Category", CHOICES.newsCategory),
      single("published_at", "Published at", "datetime"),
      single("is_published", "Published", "checkbox"),
    ],
  },
  deployments: {
    noun: "Deployment",
    title: "Deployments",
    endpointKey: "deployments",
    listColumns: [{ key: "name" }, { key: "location" }, { key: "status" }, { key: "start_date" }],
    pairs: [
      pair("Name", "name", "name_es"),
      pair("Location", "location", "location_es"),
      pair("Summary", "summary", "summary_es", "textarea"),
    ],
    singles: [
      choice("status", "Status", CHOICES.deploymentStatus),
      single("start_date", "Start date", "date"),
      single("end_date", "End date", "date"),
      single("is_public", "Public", "checkbox", { help: "Uncheck to withhold per safety protocol" }),
    ],
  },
  trainingExercises: {
    noun: "Training Exercise",
    title: "Training Exercises",
    endpointKey: "trainingExercises",
    listColumns: [{ key: "title" }, { key: "date" }],
    pairs: [
      pair("Title", "title", "title_es"),
      pair("Description", "description", "description_es", "textarea"),
    ],
    singles: [single("date", "Date", "date"), single("partner_agencies", "Partner agencies")],
  },
  teamRoles: {
    noun: "Team Role",
    title: "Team Roles",
    endpointKey: "teamRolesResource",
    listColumns: [
      { key: "title", label: "Title", sortKey: "title" },
      { key: "hierarchy_name", label: "Hierarchy", sortKey: "hierarchy__name" },
      { key: "time_commitment", label: "Time commitment", sortKey: "time_commitment" },
    ],
    sortable: true,
    pageSize: 10,
    filters: [
      {
        param: "hierarchy",
        label: "All hierarchies",
        options: { endpointKey: "hierarchiesResource", labelField: "name" },
      },
    ],
    pairs: [
      pair("Title", "title", "title_es"),
      pair("Summary", "summary", "summary_es"),
      pair("Requirements", "requirements", "requirements_es", "textarea"),
    ],
    singles: [
      single("hierarchy", "Hierarchy", "reference", {
        endpointKey: "hierarchiesResource",
        required: true,
      }),
      single("time_commitment", "Time commitment"),
    ],
  },
  hierarchy: {
    noun: "Hierarchy",
    title: "Hierarchies",
    endpointKey: "hierarchiesResource",
    listColumns: [{ key: "order", type: "number" }, { key: "name" }],
    pairs: [
      pair("Name", "name", "name_es"),
      pair("Description", "description", "description_es", "textarea"),
    ],
    singles: [single("order", "Order", "number", { help: "1 = highest rank; higher numbers = lower rank" })],
  },
  applicantPhases: {
    noun: "Pipeline Phase",
    title: "Applicant Pipeline Phases",
    endpointKey: "applicantPipelinePhases",
    listColumns: [{ key: "phase_number", type: "number" }, { key: "name" }],
    pairs: [
      pair("Name", "name", "name_es"),
      pair("Description", "description", "description_es", "textarea"),
    ],
    singles: [
      single("phase_number", "Phase number", "number", { required: true }),
      choice("pipeline_key", "Pipeline key", CHOICES.pipelinePhase, { required: true }),
    ],
  },
  affiliations: {
    noun: "Affiliation",
    title: "Affiliations",
    endpointKey: "affiliations",
    listColumns: [{ key: "name" }, { key: "url", type: "url" }],
    pairs: [pair("Name", "name", "name_es")],
    singles: [single("url", "URL", "url")],
  },
  partners: {
    noun: "Partner",
    title: "Partners",
    endpointKey: "partners",
    listColumns: [{ key: "name" }, { key: "partner_type" }],
    pairs: [pair("Name", "name", "name_es")],
    singles: [choice("partner_type", "Type", CHOICES.partnerType), single("url", "URL", "url")],
  },
  funding: {
    noun: "Funding Need",
    title: "Funding Needs",
    endpointKey: "fundingNeeds",
    listColumns: [
      { key: "item" },
      { key: "cost_estimate", type: "number" },
      { key: "is_fulfilled", type: "boolean" },
    ],
    pairs: [
      pair("Item", "item", "item_es"),
      pair("Description", "description", "description_es", "textarea"),
    ],
    singles: [
      single("cost_estimate", "Cost estimate", "number"),
      single("is_fulfilled", "Fulfilled", "checkbox"),
      single("order", "Order", "number"),
    ],
  },
  sponsorship: {
    noun: "Sponsorship Tier",
    title: "Sponsorship Tiers",
    endpointKey: "sponsorshipTiers",
    listColumns: [{ key: "name" }, { key: "annual_amount", type: "number" }, { key: "order", type: "number" }],
    pairs: [
      pair("Name", "name", "name_es"),
      pair("Benefits", "benefits", "benefits_es", "textarea"),
    ],
    singles: [single("annual_amount", "Annual amount", "number"), single("order", "Order", "number")],
  },
};

export const RESOURCE_LIST = [
  ["status", "Team Status"],
  ["metrics", "Impact Metrics"],
  ["capabilities", "Capabilities"],
  ["news", "News"],
  ["deployments", "Deployments"],
  ["trainingExercises", "Training Exercises"],
  ["affiliations", "Affiliations"],
  ["partners", "Partners"],
  ["funding", "Funding Needs"],
  ["sponsorship", "Sponsorship Tiers"],
];

// Roster sub-navigation: resources that live under the "Members" group.
export const MEMBER_SUBRESOURCES = [
  ["members", "Members", "/admin/members"],
  ["teamRoles", "Roles", "/admin/content/teamRoles"],
  ["hierarchy", "Hierarchy", "/admin/content/hierarchy"],
];
