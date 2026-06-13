import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDdAsYd5bLwfEojpjYW-_oIM20hSe649Ew",
  authDomain: "professional-car-care.firebaseapp.com",
  projectId: "professional-car-care",
  storageBucket: "professional-car-care.firebasestorage.app",
  messagingSenderId: "858443611369",
  appId: "1:858443611369:web:f588c720f4e9113a790478"
};

const app = initializeApp(firebaseConfig);

console.log("Project ID:", app.options.projectId);

export const db = getFirestore(app);

console.log("Firebase DB:", db);

export { collection, getDocs, addDoc };