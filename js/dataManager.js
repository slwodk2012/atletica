/**
 * DataManager - Manages product data loading and validation
 */
import { FirebaseManager } from './firebase.js';

export class DataManager {
  constructor() {
    this.products = [];
    this.firebase = new FirebaseManager();
    this.useFirebase = true; // Use Firebase by default
  }

  /**
   * Load products - instant from JSON, then background sync with Firebase
   * @param {Function} onUpdate - callback when Firebase data arrives
   * @returns {Promise<Array>} Array of product objects
   */
  async loadProducts(onUpdate) {
    try {
      // Load JSON first (instant) - add cache busting
      const cacheBuster = '?v=' + Date.now();
      const response = await fetch('data/products.json' + cacheBuster, {
        cache: 'no-store'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.products && Array.isArray(data.products)) {
          this.products = data.products;
          console.log('Loaded from JSON:', this.products.length, 'trainers');
        }
      }

      // Firebase sync in background (don't wait)
      if (this.useFirebase) {
        this.syncWithFirebase(onUpdate);
      }
      
      return this.products;
    } catch (error) {
      console.error('Failed to load products:', error);
      throw error;
    }
  }

  /**
   * Sync with Firebase in background
   */
  async syncWithFirebase(onUpdate) {
    try {
      const trainers = await this.firebase.loadTrainers();
      if (trainers && trainers.length > 0) {
        // Firebase has priority - use Firebase data for display
        this.products = trainers;
        console.log('Loaded from Firebase:', trainers.length, 'trainers');
        
        // Update UI with Firebase data
        if (onUpdate && typeof onUpdate === 'function') {
          onUpdate(trainers);
        }
      } else if (this.products.length > 0) {
        // Firebase empty, initialize in background
        console.log('Initializing Firebase with JSON data...');
        this.firebase.initializeFromJSON(this.products).catch(e => 
          console.warn('Firebase init error:', e)
        );
      }
    } catch (fbError) {
      console.warn('Firebase sync error:', fbError.message);
    }
  }

  /**
   * Validate a product object has all required fields
   * @param {Object} product - Product object to validate
   * @returns {boolean} True if valid, false otherwise
   */
  validateProduct(product) {
    if (!product || typeof product !== 'object') {
      return false;
    }

    const requiredFields = ['id', 'title', 'description', 'price', 'image'];
    
    for (const field of requiredFields) {
      if (!(field in product) || product[field] === null || product[field] === undefined) {
        return false;
      }
      
      // Additional validation for specific fields
      if (field === 'title' || field === 'description' || field === 'image') {
        if (typeof product[field] !== 'string' || product[field].trim() === '') {
          return false;
        }
      }
      
      if (field === 'price') {
        if (typeof product[field] !== 'number' || product[field] < 0) {
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * Get a product by its ID
   * @param {string} id - Product ID
   * @returns {Object|null} Product object or null if not found
   */
  getProductById(id) {
    if (!id) {
      return null;
    }
    
    const product = this.products.find(p => p.id === id);
    return product || null;
  }

  /**
   * Get all valid products (filtered by validation)
   * @returns {Array} Array of valid products
   */
  getValidProducts() {
    // Return all products without strict validation
    // Just filter out completely empty ones
    return this.products.filter(product => {
      if (!product || !product.id || !product.title) {
        console.warn('Invalid product - missing id or title:', product);
        return false;
      }
      return true;
    });
  }

  /**
   * Get all products (for admin panel)
   * @returns {Array} Array of all products
   */
  getAllProducts() {
    const savedData = localStorage.getItem('trainersData');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        // Handle both array and object formats
        return Array.isArray(data) ? data : (data.products || []);
      } catch (e) {
        console.error('Error parsing saved data:', e);
      }
    }
    return this.products;
  }

  /**
   * Load data from localStorage or fallback to original data
   * @returns {Object} Data object with products array
   */
  loadData() {
    const savedData = localStorage.getItem('trainersData');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        // Handle both array and object formats
        if (Array.isArray(data)) {
          return { products: data };
        }
        return data;
      } catch (e) {
        console.error('Error parsing saved data:', e);
      }
    }
    return { products: this.products };
  }

  /**
   * Save data to localStorage
   * @param {Object} data - Data object to save
   */
  saveData(data) {
    // Save as array for consistency
    const productsArray = data.products || data;
    localStorage.setItem('trainersData', JSON.stringify(productsArray));
    this.products = productsArray;
  }

  /**
   * Generate new trainer ID
   * @returns {string} New unique trainer ID
   */
  generateTrainerId() {
    const data = this.loadData();
    const maxId = data.products.reduce((max, p) => {
      const num = parseInt(p.id.replace('prod-', ''));
      return num > max ? num : max;
    }, 0);
    return `prod-${String(maxId + 1).padStart(3, '0')}`;
  }

  /**
   * Get empty trainer template
   * @returns {Object} Empty trainer object
   */
  getEmptyTrainer() {
    return {
      id: this.generateTrainerId(),
      title: '',
      description: '',
      detailedDescription: '',
      category: 'Фитнес',
      experience: 'Стаж 1 год',
      price: 2000,
      currency: 'RUB',
      image: 'https://via.placeholder.com/400x600',
      imageAlt: '',
      images: [],
      specialization: [],
      education: ''
    };
  }

  /**
   * Save trainer (add new or update existing)
   * @param {Object} trainerData - Trainer data to save
   * @param {boolean} isNew - Whether this is a new trainer
   */
  async saveTrainer(trainerData, isNew) {
    // Save to Firebase
    if (this.useFirebase) {
      try {
        await this.firebase.saveTrainer(trainerData);
      } catch (e) {
        console.error('Firebase save error:', e);
      }
    }

    // Also update local array
    if (isNew) {
      this.products.push(trainerData);
    } else {
      const index = this.products.findIndex(p => p.id === trainerData.id);
      if (index !== -1) {
        this.products[index] = trainerData;
      }
    }
  }

  /**
   * Delete trainer by ID
   * @param {string} trainerId - ID of trainer to delete
   */
  async deleteTrainer(trainerId) {
    // Delete from Firebase
    if (this.useFirebase) {
      try {
        await this.firebase.deleteTrainer(trainerId);
      } catch (e) {
        console.error('Firebase delete error:', e);
      }
    }

    // Also update local array
    this.products = this.products.filter(p => p.id !== trainerId);
  }
}
