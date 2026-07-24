// Centralized React Query key factory. Consumers and mutations must use these
// so cache invalidation stays consistent across the app.
export const queryKeys = {
  businessUnits: ["business-units"] as const,
  jobs: ["jobs"] as const,
  candidates: ["candidates"] as const,
  invitations: ["invitations"] as const,
};
