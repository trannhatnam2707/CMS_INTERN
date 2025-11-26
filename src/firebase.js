import { initializeApp } from "firebase/app" ;   
import { getAuth } from "firebase/auth"; ;   
import { getFirestore } from "firebase/firestore";

const firebaseConfig = { 
  apiKey : "AIzaSyAxk_Pb7x7VWVZPL-Cqj0276IDkQd4VlXM" , 
  authDomain : "mini-zalo-app-f49b2.firebaseapp.com" , 
  projectId : "mini-zalo-app-f49b2" , 
  storageBucket : "mini-zalo-app-f49b2.firebasestorage.app" , 
  messagingSenderId : "769050370991" , 
  appId : "1:769050370991:web:bb1d11023b4179c45c055a" , 
  measurementId : "G-936J3QYCKQ" 
};

const app = initializeApp ( firebaseConfig );
export const db = getFirestore(app);
export const auth = getAuth(app);


