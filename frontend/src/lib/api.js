// src/lib/api.ts
import axios from 'axios';
// Create an Axios instance with base URL
export const api = axios.create({
  baseURL:'https://task-management-jet-pi-83.vercel.app', // Vite example
});
// optional: auth header injection
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
