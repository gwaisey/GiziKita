export const queryKeys = {
  logistics: (userId: string) => ['logistics', userId] as const,
  pendingUsers: ['approvals', 'users'] as const,
  pendingSchools: ['approvals', 'schools'] as const,
  schools: (province: string) => ['schools', province] as const,
  provinces: ['schools', 'provinces'] as const,
  feedback: (filter: string) => ['feedback', filter] as const,
  feedbackDetail: (id: string) => ['feedback', 'detail', id] as const,
  notifications: (userId: string) => ['notifications', userId] as const,
  vehicles: ['vehicles'] as const,
  infrastructure: ['logistics', 'infrastructure'] as const,
};
