/**
 * DataManager - Manages product data loading and validation
 */
export class DataManager {
  constructor() {
    this.products = [];
  }

  /**
   * Load products - from localStorage (admin changes) or JSON file (initial)
   * @returns {Promise<Array>} Array of product objects
   */
  async loadProducts() {
    try {
      // First try to load from JSON file (always fresh data)
      const response = await fetch('data/products.json');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.products || !Array.isArray(data.products)) {
        throw new Error('Invalid data format');
      }
      
      this.products = data.products;
      console.log('Loaded from JSON:', this.products.length, 'trainers');
      
      return this.products;
    } catch (error) {
      console.error('Failed to load products:', error);
      // Clear any corrupted localStorage
      localStorage.removeItem('trainersData');
      throw error;
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
  saveTrainer(trainerData, isNew) {
    const data = this.loadData();
    
    if (isNew) {
      data.products.push(trainerData);
    } else {
      const index = data.products.findIndex(p => p.id === trainerData.id);
      if (index !== -1) {
        data.products[index] = trainerData;
      }
    }
    
    this.saveData(data);
  }

  /**
   * Delete trainer by ID
   * @param {string} trainerId - ID of trainer to delete
   */
  deleteTrainer(trainerId) {
    const data = this.loadData();
    data.products = data.products.filter(p => p.id !== trainerId);
    this.saveData(data);
  }
}
