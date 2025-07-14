import axios from "axios";

const API_CONFIG = {
  development: {
    baseURL: "http://localhost:5000",
  },
  production: {
    baseURL: process.env.REACT_APP_API_URL,
  },
};

const currentEnv = process.env.NODE_ENV || "development";
export const API_BASE_URL = API_CONFIG[currentEnv].baseURL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    const { getAuth } = await import("firebase/auth");
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (currentUser) {
      const token = await currentUser.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const { getAuth, signOut } = require("firebase/auth");
      const auth = getAuth();
      signOut(auth);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
