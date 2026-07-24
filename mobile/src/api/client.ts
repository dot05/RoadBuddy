import axios from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Dynamic base URL for development
export const getBaseUrl = () => {
  if (__DEV__) {
    // Point directly to the developer machine's local IP address (192.168.0.28)
    // so physical mobile devices running Expo Go can communicate with the backend.
    return 'http://192.168.0.28:8000';
  }
  return 'https://api.roadbuddy.in'; // Production fallback
};

const client = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically attach Authorization header
client.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('roadbuddy_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error('Error fetching auth token from secure store', e);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default client;
