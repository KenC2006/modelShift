import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "../firebase";
import axios from "axios";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  axios.defaults.baseURL =
    process.env.REACT_APP_API_URL || "http://localhost:5000";

  axios.interceptors.request.use(
    async (config) => {
      if (currentUser) {
        config.headers.Authorization = `Bearer ${await currentUser.getIdToken()}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        signOut(auth);
      }
      return Promise.reject(error);
    }
  );

  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithRedirect(auth, provider);
    } catch (error) {
      throw error;
    }
  }

  async function signInWithEmail(email, password) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error) {
      throw error;
    }
  }

  async function signUpWithEmail(email, password) {
    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      return result.user;
    } catch (error) {
      throw error;
    }
  }

  async function logout() {
    try {
      await signOut(auth);
      setUserData(null);
    } catch (error) {
      throw error;
    }
  }

  const verifyUser = useCallback(async () => {
    if (!currentUser) {
      return null;
    }

    try {
      const token = await currentUser.getIdToken();
      const response = await axios.get("/api/auth/verify", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUserData(response.data.user);
      return response.data.user;
    } catch (error) {
      console.error("Error verifying user:", error);
      return null;
    }
  }, [currentUser]);

  async function refreshUserData() {
    if (currentUser) {
      await verifyUser();
    }
  }

  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        await getRedirectResult(auth);
      } catch (error) {
        console.error("Error getting redirect result:", error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        await verifyUser();
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    handleRedirectResult();

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    logout,
    verifyUser,
    refreshUserData,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
