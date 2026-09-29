import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL ?? '/api';

export const api = axios.create({ baseURL, timeout: 2500 });

const fallback = (value) => Promise.resolve({ data: value });
export const getInventory = () => api.get('/inventory').catch(() => fallback([]));
export const createInventory = (payload) => api.post('/inventory', payload);
export const updateInventory = (id, payload) => api.put(`/inventory/${id}`, payload);
export const deleteInventory = (id) => api.delete(`/inventory/${id}`);
export const getForecast = (bloodGroup) => api.get(`/forecast/${bloodGroup}`).catch(() => fallback([]));
export const getAlerts = () => api.get('/alerts').catch(() => fallback([]));
export const getRecommendations = () => api.get('/recommendations').catch(() => fallback([]));
export const getReports = () => api.get('/reports').catch(() => fallback({}));
