// firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAdnCKJslmTIVx0h7wir6Zs0jyqWnwWggE",
  authDomain: "shopifyftp.firebaseapp.com",
  projectId: "shopifyftp",
  storageBucket: "shopifyftp.firebasestorage.app",
  messagingSenderId: "272724463914",
  appId: "1:272724463914:web:466fecc145417cecd68e53",
  measurementId: "G-LDMWEZZVMG"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app); // ✅ Correct way to initialize auth

export { app, analytics, auth };
