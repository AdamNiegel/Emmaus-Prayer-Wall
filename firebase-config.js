const firebaseConfig = {
  apiKey: "AIzaSyBq3M1IRVFUKie0OueI3bcexzcZYMBh0Yc",
  authDomain: "emmaus-11bce.firebaseapp.com",
  projectId: "emmaus-11bce",
  storageBucket: "emmaus-11bce.firebasestorage.app",
  messagingSenderId: "88475048149",
  appId: "1:88475048149:web:a720776cf2e597dd06ea5c"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
