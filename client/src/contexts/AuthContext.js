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
import apiClient from "../config/api";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

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
      let message = "An unknown error occurred. Please try again.";
      if (error.code === "auth/user-not-found") {
        message = "No user found with this email address.";
      } else if (error.code === "auth/wrong-password") {
        message = "Incorrect password. Please try again.";
      } else if (error.code === "auth/invalid-email") {
        message = "Invalid email address format.";
      } else if (error.code === "auth/too-many-requests") {
        message =
          "Too many failed login attempts. Please try again later or reset your password.";
      } else if (error.code === "auth/network-request-failed") {
        message = "Network error. Please check your connection and try again.";
      } else if (error.code === "auth/internal-error") {
        message = "Internal error. Please try again later.";
      }
      throw new Error(message);
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
      const response = await apiClient.get("/api/auth/verify");
      setUserData(response.data.user);
      return response.data.user;
    } catch (error) {
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
      } catch (error) {}
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
  }, [verifyUser]);

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
