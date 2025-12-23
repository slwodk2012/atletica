/**
 * Firebase Configuration and Database Manager
 */

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyH-dDrBQi4F_znZApbQo7aPOCO-kpkDWU",
  authDomain: "atletica-34ab2.firebaseapp.com",
  projectId: "atletica-34ab2",
  storageBucket: "atletica-34ab2.firebasestorage.app",
  messagingSenderId: "942801359590",
  appId: "1:942801359590:web:5Ad58ab145e59b2c6be977",
  measurementId: "G-JRDZVNbS4S"
};

// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

/**
 * Firebase Database Manager
 */
export class FirebaseManager {
  constructor() {
    this.db = db;
    this.auth = auth;
    this.trainersCollection = 'trainers';
    this.currentUser = null;
    
    // Listen for auth state changes
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      console.log('Auth state:', user ? 'Logged in as ' + user.email : 'Not logged in');
    });
  }

  /**
   * Login with email and password
   */
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      this.currentUser = userCredential.user;
      console.log('Firebase Auth: Logged in as', email);
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Firebase Auth error:', error.code, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Logout
   */
  async logout() {
    try {
      await signOut(this.auth);
      this.currentUser = null;
      console.log('Firebase Auth: Logged out');
      return { success: true };
    } catch (error) {
      console.error('Firebase logout error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return this.currentUser !== null;
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Load all trainers from Firestore
   */
  async loadTrainers() {
    try {
      const querySnapshot = await getDocs(collection(this.db, this.trainersCollection));
      const trainers = [];
      querySnapshot.forEach((doc) => {
        trainers.push({ id: doc.id, ...doc.data() });
      });
      console.log('Loaded from Firebase:', trainers.length, 'trainers');
      return trainers;
    } catch (error) {
      console.error('Firebase load error:', error);
      throw error;
    }
  }

  /**
   * Save trainer to Firestore
   */
  async saveTrainer(trainer) {
    try {
      await setDoc(doc(this.db, this.trainersCollection, trainer.id), trainer);
      console.log('Saved to Firebase:', trainer.id);
      return true;
    } catch (error) {
      console.error('Firebase save error:', error);
      throw error;
    }
  }

  /**
   * Delete trainer from Firestore
   */
  async deleteTrainer(trainerId) {
    try {
      await deleteDoc(doc(this.db, this.trainersCollection, trainerId));
      console.log('Deleted from Firebase:', trainerId);
      return true;
    } catch (error) {
      console.error('Firebase delete error:', error);
      throw error;
    }
  }

  /**
   * Initialize database with data from JSON file
   */
  async initializeFromJSON(trainers) {
    try {
      for (const trainer of trainers) {
        await this.saveTrainer(trainer);
      }
      console.log('Initialized Firebase with', trainers.length, 'trainers');
      return true;
    } catch (error) {
      console.error('Firebase init error:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time updates
   */
  subscribeToChanges(callback) {
    return onSnapshot(collection(this.db, this.trainersCollection), (snapshot) => {
      const trainers = [];
      snapshot.forEach((doc) => {
        trainers.push({ id: doc.id, ...doc.data() });
      });
      callback(trainers);
    });
  }
}

export { db, app, auth };
