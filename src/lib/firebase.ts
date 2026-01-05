import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAQ0AWFa60v9BKkrPzTL1iexowg2wOvRdY",
  authDomain: "consejerodelobrero-31110.firebaseapp.com",
  projectId: "consejerodelobrero-31110",
  storageBucket: "consejerodelobrero-31110.firebasestorage.app",
  messagingSenderId: "185054276664",
  appId: "1:185054276664:web:761b4e7c260efddc288acd",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
