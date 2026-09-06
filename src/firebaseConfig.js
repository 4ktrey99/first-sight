import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBPRh-oqw1aOJSGB2Nd8GQcsJEaP6s_DaM",
  authDomain: "first-sight-281d3.firebaseapp.com",
  projectId: "first-sight-281d3",
  storageBucket: "first-sight-281d3.firebasestorage.app",
  messagingSenderId: "530984702168",
  appId: "1:530984702168:web:a3001f83c28c8da8ec87ad",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
