// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDvPEFl-8w6THiJbDb5UcE0shyDBLn681A",
  authDomain: "lume-cume.firebaseapp.com",
  projectId: "lume-cume",
  storageBucket: "lume-cume.firebasestorage.app",
  messagingSenderId: "477762360156",
  appId: "1:477762360156:web:8de131e1fb61f626ef6799",
  measurementId: "G-EXHE73P53E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);