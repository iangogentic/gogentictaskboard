export const tags = {
  projects: (id?: string) => (id ? `projects:${id}` : 'projects'),
  tasks: (pid: string) => `tasks:project:${pid}`,
  reports: 'reports',
  users: 'users',
  dashboard: 'dashboard',
  myWork: (userId: string) => `my-work:${userId}`,
  timeEntries: (taskId: string) => `time-entries:${taskId}`,
  deliverables: (projectId: string) => `deliverables:${projectId}`,
};