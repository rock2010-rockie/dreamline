import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
apiKey: "AIzaSyBGoWoeL2ECu-hbthcwwFHjFXoHEFDxJ88",
  authDomain: "dreamline-ebaca.firebaseapp.com",
  projectId: "dreamline-ebaca",
  storageBucket: "dreamline-ebaca.appspot.com",
  messagingSenderId: "902058246589",
  appId: "1:902058246589:web:99639af0d94fdd4df352d4",
  measurementId: "G-4J15D0VTWC"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);