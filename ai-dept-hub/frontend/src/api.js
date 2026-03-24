/**
 * API service — Axios instance + helpers for all backend calls.
 */
import axios from 'axios';

const API_BASE = 'https://mediainfobot-h1ji.onrender.com';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const registerUser = (data) => api.post('/auth/register', data);
export const loginUser = (data) => api.post('/auth/login', data);

// Resources
export const uploadResource = (formData) =>
  api.post('/resources/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const fetchResources = (params) => api.get('/resources', { params });
export const fetchResource = (id) => api.get(`/resources/${id}`);
export const deleteResource = (id) => api.delete(`/resources/${id}`);
export const searchResources = (q) => api.get('/resources/search', { params: { q } });

// AI
export const askAI = (question) => api.post('/ai/ask', { question });
export const summarizeResource = (resource_id, text) =>
  api.post('/ai/summarize', { resource_id, text });
export const debugCode = (code, language) =>
  api.post('/ai/debug', { code, language });
export const postAssist = (formData) => api.post('/ai/assist', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
  timeout: 60000 // 60 seconds timeout for OCR + LLM
});

// Search
export const unifiedSearch = (q) => api.get('/search', { params: { q } });

// Dashboard
export const fetchAnalytics = () => api.get('/dashboard/analytics');
export const createTopic = (data) => api.post('/topics/create', data);
export const fetchTopics = (subject) =>
  api.get('/topics', { params: subject ? { subject } : {} });
export const fetchUsers = () => api.get('/dashboard/users');
export const promoteUser = (userId) => api.post(`/dashboard/users/${userId}/promote`);
export const removeUser = (userId) => api.delete(`/dashboard/users/${userId}`);

// File download URL
export const getFileUrl = (filePath) => `${API_BASE}/uploads/${filePath}`;

export default api;
