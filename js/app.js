/**
 * Main Application Entry Point
 */
import { DataManager } from './dataManager.js';
import { CardRenderer } from './cardRenderer.js';
import { Modal } from './modal.js';
import { Auth } from './auth.js';
import { VisualEditor } from './visualEditor.js';

class App {
  constructor() {
    this.dataManager = new DataManager();
    this.cardRenderer = new CardRenderer();
    this.modal = null;
    this.auth = null;
    this.visualEditor = null;
    this.galleryContainer = null;
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      // Clear old cached data to ensure fresh load
      localStorage.removeItem('trainersData');
      
      // Get DOM elements
      this.galleryContainer = document.getElementById('gallery');
      const modalElement = document.getElementById('modal');

      if (!this.galleryContainer || !modalElement) {
        throw new Error('Required DOM elements not found');
      }

      // Initialize modal
      this.modal = new Modal(modalElement);

      // Initialize visual editor
      this.visualEditor = new VisualEditor();

      // Initialize auth system FIRST (before loading data)
      this.auth = new Auth(this.visualEditor);
      this.auth.loadSavedSettings();

      // Load products with callback for Firebase updates
      const onFirebaseUpdate = (products) => {
        // Re-render gallery when Firebase data arrives
        const valid = products.filter(p => p && p.id && p.title);
        this.cardRenderer.renderGallery(valid, this.galleryContainer, 50);
        this.setupEventListeners();
        console.log('Gallery updated from Firebase');
      };

      await this.dataManager.loadProducts(onFirebaseUpdate);
      const validProducts = this.dataManager.getValidProducts();

      console.log('Loaded products:', validProducts.length);

      if (validProducts.length === 0) {
        console.error('No valid products found!');
        this.showError('Нет доступных тренеров');
        return;
      }

      // Render gallery immediately
      this.cardRenderer.renderGallery(validProducts, this.galleryContainer, 50);
      console.log('Gallery rendered');

      // Set up event listeners
      this.setupEventListeners();

      // Load visual editor styles after DOM is fully rendered
      setTimeout(() => {
        this.visualEditor.loadStyles();
      }, 100);

    } catch (error) {
      console.error('Application initialization failed:', error);
      this.showError('Unable to load products. Please try again later.');
    }
  }

  /**
   * Show loading state
   */
  showLoading() {
    if (this.galleryContainer) {
      this.galleryContainer.innerHTML = '<p class="loading">Loading products...</p>';
    }
  }

  /**
   * Show error message
   * @param {string} message - Error message to display
   */
  showError(message) {
    if (this.galleryContainer) {
      this.galleryContainer.innerHTML = `<p class="error-message">${message}</p>`;
    }
  }

  /**
   * Set up event listeners for cards
   */
  setupEventListeners() {
    // Event delegation for card clicks
    this.galleryContainer.addEventListener('click', (e) => {
      const card = e.target.closest('.card');
      if (card) {
        this.handleCardClick(card);
      }
    });

    // Keyboard navigation for cards
    this.galleryContainer.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const card = e.target.closest('.card');
        if (card) {
          e.preventDefault();
          this.handleCardClick(card);
        }
      }
    });

    // Filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.handleFilterClick(e.target);
      });
    });
  }

  /**
   * Handle filter button click
   * @param {HTMLElement} button - Filter button element
   */
  handleFilterClick(button) {
    const filter = button.getAttribute('data-filter');
    
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.remove('filter-btn--active');
    });
    button.classList.add('filter-btn--active');

    // Filter products
    const validProducts = this.dataManager.getValidProducts();
    let filteredProducts = validProducts;

    if (filter !== 'all') {
      filteredProducts = validProducts.filter(product => {
        return product.category && product.category.includes(filter);
      });
    }

    // Re-render gallery
    this.cardRenderer.renderGallery(filteredProducts, this.galleryContainer, 50);
  }

  /**
   * Handle card click/activation
   * @param {HTMLElement} card - Card element
   */
  handleCardClick(card) {
    const productId = card.getAttribute('data-product-id');
    if (!productId) {
      console.error('Product ID not found on card');
      return;
    }

    const product = this.dataManager.getProductById(productId);
    if (!product) {
      console.error('Product not found:', productId);
      return;
    }

    this.modal.open(product);
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
  });
} else {
  const app = new App();
  app.init();
}

// Функция для открытия тренера по ID из URL
function openTrainerFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const trainerId = urlParams.get('trainer');
  
  if (trainerId) {
    // Ждем пока данные загрузятся и открываем модалку
    setTimeout(() => {
      const card = document.querySelector(`[data-product-id="${trainerId}"]`);
      if (card) {
        card.click();
        // Прокрутить к карточке
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 500);
  }
}

// Вызвать после загрузки
window.addEventListener('load', openTrainerFromURL);
