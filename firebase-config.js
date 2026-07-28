// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBq3M1IRVFUKie0OueI3bcexzcZYMBh0Yc",
  authDomain: "emmaus-11bce.firebaseapp.com",
  projectId: "emmaus-11bce",
  storageBucket: "emmaus-11bce.firebasestorage.app",
  messagingSenderId: "88475048149",
  appId: "1:88475048149:web:a720776cf2e597dd06ea5c",
  measurementId: "G-MEMNFTZH63"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);