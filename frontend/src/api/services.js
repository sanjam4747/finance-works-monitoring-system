import api from './axios';

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
};

export const departmentAPI = {
  getAll: () => api.get('/departments'),
};

export const stageAPI = {
  getAll: () => api.get('/stages'),
};

export const proposalAPI = {
  getAll:         (params)       => api.get('/proposals', { params }),
  getById:        (id)           => api.get(`/proposals/${id}`),
  create:         (data)         => api.post('/proposals', data),
  move:           (id, data)     => api.post(`/proposals/${id}/move`, data),
  getMovements:   (id)           => api.get(`/proposals/${id}/movements`),
  updateStatus:   (id, status, remarks, returnAssigneeId) => api.patch(`/proposals/${id}/status`, {
    status,
    remarks,
    ...(returnAssigneeId != null ? { returnAssigneeId: String(returnAssigneeId) } : {}),
  }),
  
  // Phase 3 endpoints
  getComments:    (id)           => api.get(`/proposals/${id}/comments`),
  addComment:     (id, text)     => api.post(`/proposals/${id}/comments`, { text }),
  getAuditLogs:   (id)           => api.get(`/proposals/${id}/audit-logs`),

  // Phase 5 endpoints
  getEligibleAssignees: (id, role) => api.get(`/proposals/${id}/eligible-assignees`, { params: { role } }),
  reassign:       (id, data)     => api.post(`/proposals/${id}/reassign`, data),
};

export const dashboardAPI = {
  getStats:   () => api.get('/dashboard/stats'),
  getMyStats: () => api.get('/dashboard/my-stats'),
};

export const reportAPI = {
  getAging:                 () => api.get('/reports/aging'),
  getStageDelay:            () => api.get('/reports/stage-delay'),
  getDepartmentPerformance: () => api.get('/reports/department-performance'),
  getOfficerPerformance:    () => api.get('/reports/officer-performance'),
};

// Phase 1: Full User CRUD
export const userAPI = {
  getAll:      ()          => api.get('/users'),
  getById:     (id)        => api.get(`/users/${id}`),
  create:      (data)      => api.post('/users', data),
  update:      (id, data)  => api.put(`/users/${id}`, data),
  deactivate:  (id)        => api.patch(`/users/${id}/deactivate`),
  activate:    (id)        => api.patch(`/users/${id}/activate`),
  delete:      (id)        => api.delete(`/users/${id}`),
};

export const notificationAPI = {
  getAll:        () => api.get('/notifications'),
  markAsRead:    (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/mark-all-read'),
};
