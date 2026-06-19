import axios from 'axios';
import { Env } from '../geolocation/config/environment';
import { AuthService } from './AuthService';
import { attach401Guard } from './axios401Guard';

const authAxios = axios.create({
  baseURL: Env.API_BASE_URL,
  timeout: Env.API_TIMEOUT_MS || 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

authAxios.interceptors.request.use(
  async (config) => {
    const token = await AuthService.getToken();
    if (!token) return Promise.reject(new Error('Sin sesión activa.'));
    config.headers['Authorization'] = `Bearer ${token.trim()}`;
    return config;
  },
  (error) => Promise.reject(error),
);

attach401Guard(authAxios);
import { attachOfflineInterceptor } from '../offline/offlineInterceptor';
attachOfflineInterceptor(authAxios);

export default authAxios;
