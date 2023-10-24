// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth,GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDE6H5JG8ZPE31Ywl08Mn4eYwu6amvQhhY",
    authDomain: "chat-3b369.firebaseapp.com",
    databaseURL: "https://chat-3b369-default-rtdb.firebaseio.com",
    projectId: "chat-3b369",
    storageBucket: "chat-3b369.appspot.com",
    messagingSenderId: "525413968649",
    appId: "1:525413968649:web:07a09cfc55613b6d3f01d8",
    measurementId: "G-TNC41BW74M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db=getFirestore();
const auth=getAuth();
const provider=new GoogleAuthProvider()
export{db,auth,provider, app}; 