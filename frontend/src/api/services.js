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
  updateStatus:   (id, status)   => api.patch(`/proposals/${id}/status`, { status }),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

export const reportAPI = {
  getAging:                () => api.get('/reports/aging'),
  getStageDelay:           () => api.get('/reports/stage-delay'),
  getDepartmentPerformance:() => api.get('/reports/department-performance'),
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
