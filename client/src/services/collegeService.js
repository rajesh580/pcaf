import api from './api';

export const collegeService = {
  getProfile: async () => {
    const res = await api.get('/college/profile');
    return res.data;
  },

  updateProfile: async (data) => {
    const res = await api.put('/college/profile', data);
    return res.data;
  },

  getDepartments: async () => {
    const res = await api.get('/college/departments');
    return res.data;
  },

  createDepartment: async (dept) => {
    const res = await api.post('/college/departments', dept);
    return res.data;
  },

  toggleDepartmentStatus: async (id, status) => {
    const res = await api.patch(`/college/departments/${id}/status`, { status });
    return res.data;
  },

  getFaculty: async (departmentCode) => {
    const res = await api.get('/college/faculty', { params: { departmentCode } });
    return res.data;
  },

  addFaculty: async (facultyData) => {
    const res = await api.post('/college/faculty', facultyData);
    return res.data;
  },

  getPlacementStats: async () => {
    const res = await api.get('/dashboards/college');
    return res.data;
  },

  getDepartmentPlacement: async (deptCode) => {
    const res = await api.get(`/college/departments/${deptCode}/placement-data`);
    return res.data;
  },

  getComprehensiveReport: async () => {
    const res = await api.get('/reports/college-report');
    return res.data;
  }
};
