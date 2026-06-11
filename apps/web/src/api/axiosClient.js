import axios from 'axios';
import { tokenStorage } from '../services/storage/tokenStorage';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getToken();
    if (token && config?.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response?.data,
  (error) => {
    if (error.response?.status === 401) {
      tokenStorage.clear();
      window.location.href = '/login';
    }

    if (error.response?.data) {
      const err = error.response.data;
      throw new Error(err.msg || err.message || 'Lỗi từ máy chủ');
    }

    if (error.message === 'Network Error' || !error.response) {
      throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
    }

    throw new Error(error.message || 'Lỗi không xác định');
  }
);

export default axiosClient;
