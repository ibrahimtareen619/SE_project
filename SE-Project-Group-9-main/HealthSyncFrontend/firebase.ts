import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: "AIzaSyAhngi2KfVwmGFl6LE_mJx5FvcJ1jo0VCc",
  authDomain: "seproject-5c94f.firebaseapp.com",
  projectId: "seproject-5c94f",
  storageBucket: "seproject-5c94f.firebasestorage.app",
  messagingSenderId: "864540686054",
  appId: "1:864540686054:web:68a4d64ef4b18e15266d27",
  measurementId: "G-2HQS5MLTT8",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
