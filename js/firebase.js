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
   * Login with email and password (with brute force protection)
   */
  async login(email, password) {
    // Brute force protection
    const loginAttempts = parseInt(sessionStorage.getItem('loginAttempts') || '0');
    const lastAttempt = parseInt(sessionStorage.getItem('lastLoginAttempt') || '0');
    const now = Date.now();
    
    // Block for 5 minutes after 5 failed attempts
    if (loginAttempts >= 5 && (now - lastAttempt) < 300000) {
      const waitTime = Math.ceil((300000 - (now - lastAttempt)) / 1000);
      return { success: false, error: `Слишком много попыток. Подождите ${waitTime} секунд.` };
    }
    
    // Reset attempts after 5 minutes
    if ((now - lastAttempt) > 300000) {
      sessionStorage.setItem('loginAttempts', '0');
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: 'Неверный формат email' };
    }
    
    // Validate password length
    if (!password || password.length < 6) {
      return { success: false, error: 'Пароль должен быть не менее 6 символов' };
    }
    
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      this.currentUser = userCredential.user;
      
      // Reset login attempts on success
      sessionStorage.setItem('loginAttempts', '0');
      
      console.log('Firebase Auth: Logged in as', email);
      return { success: true, user: userCredential.user };
    } catch (error) {
      // Increment failed attempts
      sessionStorage.setItem('loginAttempts', String(loginAttempts + 1));
      sessionStorage.setItem('lastLoginAttempt', String(now));
      
      console.error('Firebase Auth error:', error.code);
      
      // Don't reveal specific error details
      return { success: false, error: 'Неверный email или пароль' };
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
   * Save trainer to Firestore (with auth check)
   */
  async saveTrainer(trainer) {
    // Security check - must be authenticated
    if (!this.isAuthenticated()) {
      console.error('Security: Attempted save without authentication');
      throw new Error('Необходима авторизация для сохранения');
    }
    
    // Sanitize trainer data to prevent XSS
    const sanitizedTrainer = this.sanitizeTrainerData(trainer);
    
    try {
      await setDoc(doc(this.db, this.trainersCollection, sanitizedTrainer.id), sanitizedTrainer);
      console.log('Saved to Firebase:', sanitizedTrainer.id);
      return true;
    } catch (error) {
      console.error('Firebase save error:', error);
      throw error;
    }
  }

  /**
   * Delete trainer from Firestore (with auth check)
   */
  async deleteTrainer(trainerId) {
    // Security check - must be authenticated
    if (!this.isAuthenticated()) {
      console.error('Security: Attempted delete without authentication');
      throw new Error('Необходима авторизация для удаления');
    }
    
    // Validate trainerId
    if (!trainerId || typeof trainerId !== 'string' || trainerId.length > 50) {
      throw new Error('Неверный ID тренера');
    }
    
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
   * Sanitize trainer data to prevent XSS attacks
   */
  sanitizeTrainerData(trainer) {
    const sanitize = (str) => {
      if (typeof str !== 'string') return str;
      return str
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .substring(0, 10000); // Limit length
    };
    
    const sanitizeUrl = (url) => {
      if (typeof url !== 'string') return '';
      // Only allow http, https, and data URLs
      if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:image/')) {
        return url.substring(0, 50000); // Limit URL length
      }
      return '';
    };
    
    return {
      id: sanitize(trainer.id),
      title: sanitize(trainer.title),
      description: sanitize(trainer.description),
      detailedDescription: sanitize(trainer.detailedDescription),
      category: sanitize(trainer.category),
      experience: sanitize(trainer.experience),
      image: sanitizeUrl(trainer.image),
      imageAlt: sanitize(trainer.imageAlt),
      images: Array.isArray(trainer.images) ? trainer.images.map(sanitizeUrl).filter(Boolean) : [],
      videos: Array.isArray(trainer.videos) ? trainer.videos.map(sanitizeUrl).filter(Boolean) : [],
      specialization: Array.isArray(trainer.specialization) ? trainer.specialization.map(sanitize) : [],
      badges: Array.isArray(trainer.badges) ? trainer.badges.map(b => ({
        text: sanitize(b.text || ''),
        color: sanitize(b.color || '#f4d03f'),
        textColor: sanitize(b.textColor || '#1a1a1a')
      })) : [],
      education: sanitize(trainer.education),
      phone: sanitize(trainer.phone),
      price: typeof trainer.price === 'number' ? trainer.price : 0,
      currency: sanitize(trainer.currency || 'RUB')
    };
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
