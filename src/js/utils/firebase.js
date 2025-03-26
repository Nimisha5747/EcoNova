import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAIxRjg9LyLjeES7FI6JAMrtFH8o7XFKPc",
    authDomain: "ample-891d7.firebaseapp.com",
    projectId: "ample-891d7",
    storageBucket: "ample-891d7.firebasestorage.app",
    messagingSenderId: "786037572829",
    appId: "1:786037572829:web:284ad55d09e92d58f88734",
    measurementId: "G-6QGD7Y976G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage, app }; 