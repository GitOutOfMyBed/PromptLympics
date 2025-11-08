import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBftdOYmi74Jy6FKco_XRJaRDPX2EI7ubo",
  authDomain: "promptlympics.firebaseapp.com",
  projectId: "promptlympics",
  storageBucket: "promptlympics.firebasestorage.app",
  messagingSenderId: "147915374399",
  appId: "1:147915374399:web:fae5025790b71d4d41dd8a",
  measurementId: "G-XT228GKNG4",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();
