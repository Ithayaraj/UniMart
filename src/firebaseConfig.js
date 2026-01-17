import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
    apiKey: "AIzaSyDJ6Flv3egXYVUIV1KPTvO6gffSCWkLDrw",
    authDomain: "university-marketplace-39d89.firebaseapp.com",
    projectId: "university-marketplace-39d89",
    storageBucket: "university-marketplace-39d89.appspot.com",
    messagingSenderId: "308211194603",
    appId: "1:308211194603:web:572eb8031a9555dbc1fcae",
    measurementId: "G-J84RQJEVS2"
};

const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence based on Platform
let auth;
if (Platform.OS === 'web') {
    auth = getAuth(app);
} else {
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
    });
}

export { auth };
export const db = getFirestore(app);
export const storage = getStorage(app);