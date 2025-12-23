/**
 * Auth - Manages authentication and admin panel
 */
import { FirebaseManager } from './firebase.js';

// Toast notification system
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <span class="toast__icon">${icons[type] || icons.info}</span>
    <span class="toast__message">${message}</span>
    <button class="toast__close" onclick="this.parentElement.remove()">×</button>
  `;

  container.appendChild(toast);

  // Auto remove after 4 seconds
  setTimeout(() => {
    toast.classList.add('toast--hiding');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Make it globally available
window.showToast = showToast;

export class Auth {
  constructor(visualEditor) {
    this.isAuthenticated = false;
    this.currentUser = null;
    this.visualEditor = visualEditor;
    this.firebaseManager = new FirebaseManager();
    // Cache for trainers
    this.cachedTrainers = null;
    // Undo history
    this.undoHistory = [];
    this.maxUndoSteps = 10;
    
    this.init();
  }

  async init() {
    // Check Firebase auth state
    setTimeout(async () => {
      if (this.firebaseManager.isAuthenticated()) {
        this.isAuthenticated = true;
        this.currentUser = this.firebaseManager.getCurrentUser();
        this.showAdminMenu();
      }
    }, 1000);
    
    // Clear old undo history to prevent quota issues
    try {
      const history = localStorage.getItem('undoHistory');
      if (history && history.length > 50000) {
        localStorage.removeItem('undoHistory');
      }
    } catch (e) {
      localStorage.removeItem('undoHistory');
    }

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Hamburger menu
    const hamburger = document.getElementById('hamburger');
    const sideMenu = document.getElementById('sideMenu');
    const closeSideMenu = document.getElementById('closeSideMenu');

    hamburger?.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      sideMenu.classList.toggle('active');
    });

    closeSideMenu?.addEventListener('click', () => {
      hamburger.classList.remove('active');
      sideMenu.classList.remove('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!sideMenu.contains(e.target) && !hamburger.contains(e.target)) {
        hamburger.classList.remove('active');
        sideMenu.classList.remove('active');
      }
    });

    // Login button
    document.getElementById('loginBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.openLoginModal();
    });

    // Login form
    document.getElementById('loginForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin();
    });

    // Logout button
    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleLogout();
    });

    // Admin panel buttons
    document.getElementById('manageTrainersBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.openAdminPanel('trainers');
    });

    document.getElementById('manageContentBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.openAdminPanel('content');
      // Активируем вкладку Контент
      setTimeout(() => {
        const tabs = document.querySelectorAll('.admin-tab');
        tabs.forEach(t => t.classList.remove('admin-tab--active'));
        const contentTab = document.querySelector('.admin-tab[data-tab="content"]');
        if (contentTab) contentTab.classList.add('admin-tab--active');
      }, 50);
    });

    // Visual editor button
    document.getElementById('visualEditorBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (this.visualEditor) {
        this.visualEditor.toggleEditMode();
        // Close side menu
        document.getElementById('hamburger').classList.remove('active');
        document.getElementById('sideMenu').classList.remove('active');
      }
    });

    // Login modal close
    const loginModal = document.getElementById('loginModal');
    document.getElementById('closeLoginModal')?.addEventListener('click', () => {
      this.closeLoginModal();
    });
    loginModal?.querySelector('.modal__overlay')?.addEventListener('click', () => {
      this.closeLoginModal();
    });

    // Admin modal close
    const adminModal = document.getElementById('adminModal');
    document.getElementById('closeAdminModal')?.addEventListener('click', () => {
      this.closeAdminPanel();
    });
    adminModal?.querySelector('.modal__overlay')?.addEventListener('click', () => {
      this.closeAdminPanel();
    });
  }

  openLoginModal() {
    const loginModal = document.getElementById('loginModal');
    loginModal.classList.add('modal--open');
    document.body.style.overflow = 'hidden';
  }

  closeLoginModal() {
    const loginModal = document.getElementById('loginModal');
    loginModal.classList.remove('modal--open');
    document.body.style.overflow = '';
  }

  async handleLogin() {
    const email = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    // Show loading
    const submitBtn = document.querySelector('#loginForm button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Вход...';
    submitBtn.disabled = true;

    try {
      // Login via Firebase Auth
      const result = await this.firebaseManager.login(email, password);
      
      if (result.success) {
        this.isAuthenticated = true;
        this.currentUser = result.user;
        
        this.showAdminMenu();
        this.closeLoginModal();
        showToast('Вход выполнен успешно!', 'success');
        
        // Close side menu
        document.getElementById('hamburger').classList.remove('active');
        document.getElementById('sideMenu').classList.remove('active');
      } else {
        showToast('Неверный email или пароль', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      showToast('Ошибка входа: ' + error.message, 'error');
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  }

  async handleLogout() {
    try {
      await this.firebaseManager.logout();
      this.isAuthenticated = false;
      this.currentUser = null;
      
      this.showGuestMenu();
      showToast('Вы вышли из системы', 'info');
      
      // Close side menu
      document.getElementById('hamburger').classList.remove('active');
      document.getElementById('sideMenu').classList.remove('active');
    } catch (error) {
      console.error('Logout error:', error);
      showToast('Ошибка выхода', 'error');
    }
  }

  showAdminMenu() {
    document.getElementById('guestMenu').classList.add('side-menu__nav--hidden');
    document.getElementById('adminMenu').classList.remove('side-menu__nav--hidden');
  }

  showGuestMenu() {
    document.getElementById('adminMenu').classList.add('side-menu__nav--hidden');
    document.getElementById('guestMenu').classList.remove('side-menu__nav--hidden');
  }

  openAdminPanel(tab = 'trainers') {
    if (!this.isAuthenticated) {
      alert('Необходимо войти в систему');
      return;
    }

    const adminModal = document.getElementById('adminModal');
    adminModal.classList.add('modal--open');
    document.body.style.overflow = 'hidden';

    // Close side menu
    document.getElementById('hamburger').classList.remove('active');
    document.getElementById('sideMenu').classList.remove('active');

    this.renderAdminContent(tab);
    this.setupAdminTabs();
  }

  closeAdminPanel() {
    const adminModal = document.getElementById('adminModal');
    adminModal.classList.remove('modal--open');
    document.body.style.overflow = '';
  }

  setupAdminTabs() {
    const tabs = document.querySelectorAll('.admin-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab');
        
        // Update active tab
        tabs.forEach(t => t.classList.remove('admin-tab--active'));
        tab.classList.add('admin-tab--active');
        
        // Render content
        this.renderAdminContent(tabName);
      });
    });
  }

  async renderAdminContent(tab) {
    const content = document.getElementById('adminContent');
    
    if (tab === 'trainers') {
      content.innerHTML = await this.renderTrainersPanel();
      this.setupTrainersPanel();
    } else if (tab === 'content') {
      content.innerHTML = this.renderContentPanel();
      this.setupContentPanel();
    }
  }

  async renderTrainersPanel() {
    // Load trainers from Firebase
    let trainers = [];
    try {
      const { FirebaseManager } = await import('./firebase.js');
      const firebase = new FirebaseManager();
      trainers = await firebase.loadTrainers();
      console.log('Загружено из Firebase для панели:', trainers.length);
      
      // If Firebase is empty, load from JSON
      if (trainers.length === 0) {
        const response = await fetch('data/products.json');
        const data = await response.json();
        trainers = data.products || [];
      }
      
      // Сортировка по алфавиту
      trainers.sort((a, b) => a.title.localeCompare(b.title, 'ru'));
    } catch (error) {
      console.error('Failed to load trainers:', error);
      trainers = [];
    }

    return `
      <div class="admin-section admin-section--active">
        <div class="admin-trainer-selector">
          <h3 style="color: #f4d03f; margin-bottom: 12px; font-size: 14px;">Выберите тренера для редактирования</h3>
          <select id="trainerSelect" class="admin-select" style="font-size: 13px;">
            <option value="">-- Выберите тренера --</option>
            ${trainers.map(trainer => `
              <option value="${trainer.id}">${trainer.title} (${trainer.category})</option>
            `).join('')}
          </select>
          <div style="display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap;">
            <button class="admin-btn admin-btn--add" id="addTrainerBtn" style="font-size: 12px; padding: 8px 12px;">+ Добавить тренера</button>
            <button class="admin-btn" id="undoBtn" style="font-size: 12px; padding: 8px 12px; background: #ff9800;">↩ Отменить</button>
            <button class="admin-btn" id="exportDataBtn" style="font-size: 12px; padding: 8px 12px; background: #2196F3;">Экспорт JSON</button>
          </div>
        </div>

        <div id="trainerFormContainer"></div>
      </div>
    `;
  }

  renderContentPanel() {
    const settings = JSON.parse(localStorage.getItem('siteSettings') || '{}');
    
    return `
      <div class="admin-section admin-section--active">
        <div class="admin-content-editor">
          
          <!-- Colors Section -->
          <div class="admin-content-section">
            <h3 class="admin-content-section__title">🎨 Цветовая схема</h3>
            <div class="admin-form">
              <div class="admin-form__group">
                <label>Основной цвет фона</label>
                <div class="admin-color-picker">
                  <input type="color" id="bgColor" value="${settings.bgColor || '#1a1a1a'}">
                  <input type="text" id="bgColorText" value="${settings.bgColor || '#1a1a1a'}">
                </div>
              </div>
              <div class="admin-form__group">
                <label>Цвет акцента (желтый)</label>
                <div class="admin-color-picker">
                  <input type="color" id="accentColor" value="${settings.accentColor || '#f4d03f'}">
                  <input type="text" id="accentColorText" value="${settings.accentColor || '#f4d03f'}">
                </div>
              </div>
              <div class="admin-form__group">
                <label>Цвет карточек</label>
                <div class="admin-color-picker">
                  <input type="color" id="cardColor" value="${settings.cardColor || '#3a3a3a'}">
                  <input type="text" id="cardColorText" value="${settings.cardColor || '#3a3a3a'}">
                </div>
              </div>
              <div class="admin-form__group">
                <label>Цвет текста</label>
                <div class="admin-color-picker">
                  <input type="color" id="textColor" value="${settings.textColor || '#ffffff'}">
                  <input type="text" id="textColorText" value="${settings.textColor || '#ffffff'}">
                </div>
              </div>
            </div>
          </div>

          <!-- Typography Section -->
          <div class="admin-content-section">
            <h3 class="admin-content-section__title">✍️ Типографика</h3>
            <div class="admin-form">
              <div class="admin-form__row">
                <div class="admin-form__group">
                  <label>Основной шрифт</label>
                  <select id="fontFamily">
                    <option value="'Inter', sans-serif" ${settings.fontFamily === "'Inter', sans-serif" ? 'selected' : ''}>Inter</option>
                    <option value="'Roboto', sans-serif" ${settings.fontFamily === "'Roboto', sans-serif" ? 'selected' : ''}>Roboto</option>
                    <option value="'Montserrat', sans-serif" ${settings.fontFamily === "'Montserrat', sans-serif" ? 'selected' : ''}>Montserrat</option>
                    <option value="'Oswald', sans-serif" ${settings.fontFamily === "'Oswald', sans-serif" ? 'selected' : ''}>Oswald</option>
                    <option value="'Raleway', sans-serif" ${settings.fontFamily === "'Raleway', sans-serif" ? 'selected' : ''}>Raleway</option>
                  </select>
                </div>
                <div class="admin-form__group">
                  <label>Размер основного текста (px)</label>
                  <input type="number" id="fontSize" value="${settings.fontSize || 16}" min="12" max="24">
                </div>
              </div>
              <div class="admin-form__row">
                <div class="admin-form__group">
                  <label>Размер заголовка Hero (px)</label>
                  <input type="number" id="heroTitleSize" value="${settings.heroTitleSize || 72}" min="32" max="120">
                </div>
                <div class="admin-form__group">
                  <label>Размер заголовка секции (px)</label>
                  <input type="number" id="sectionTitleSize" value="${settings.sectionTitleSize || 64}" min="24" max="96">
                </div>
              </div>
            </div>
          </div>

          <!-- Buttons Section -->
          <div class="admin-content-section">
            <h3 class="admin-content-section__title">🔘 Кнопки</h3>
            <div class="admin-form">
              <div class="admin-form__row">
                <div class="admin-form__group">
                  <label>Скругление углов кнопок (px)</label>
                  <input type="range" id="buttonRadius" min="0" max="50" value="${settings.buttonRadius || 8}">
                  <span id="buttonRadiusValue">${settings.buttonRadius || 8}px</span>
                </div>
                <div class="admin-form__group">
                  <label>Размер кнопок</label>
                  <select id="buttonSize">
                    <option value="small" ${settings.buttonSize === 'small' ? 'selected' : ''}>Маленькие</option>
                    <option value="medium" ${settings.buttonSize === 'medium' ? 'selected' : ''}>Средние</option>
                    <option value="large" ${settings.buttonSize === 'large' ? 'selected' : ''}>Большие</option>
                  </select>
                </div>
              </div>
              <div class="admin-form__group">
                <label>Стиль кнопок</label>
                <select id="buttonStyle">
                  <option value="solid" ${settings.buttonStyle === 'solid' ? 'selected' : ''}>Сплошной</option>
                  <option value="outline" ${settings.buttonStyle === 'outline' ? 'selected' : ''}>Контурный</option>
                  <option value="ghost" ${settings.buttonStyle === 'ghost' ? 'selected' : ''}>Прозрачный</option>
                </select>
              </div>
              <div class="admin-form__group">
                <label>Показывать иконки на кнопках</label>
                <input type="checkbox" id="showButtonIcons" ${settings.showButtonIcons !== false ? 'checked' : ''}>
              </div>
            </div>
          </div>

          <!-- Cards Section -->
          <div class="admin-content-section">
            <h3 class="admin-content-section__title">🃏 Карточки тренеров</h3>
            <div class="admin-form">
              <div class="admin-form__row">
                <div class="admin-form__group">
                  <label>Скругление углов карточек (px)</label>
                  <input type="range" id="cardRadius" min="0" max="30" value="${settings.cardRadius || 12}">
                  <span id="cardRadiusValue">${settings.cardRadius || 12}px</span>
                </div>
                <div class="admin-form__group">
                  <label>Тень карточек</label>
                  <select id="cardShadow">
                    <option value="none" ${settings.cardShadow === 'none' ? 'selected' : ''}>Без тени</option>
                    <option value="small" ${settings.cardShadow === 'small' ? 'selected' : ''}>Маленькая</option>
                    <option value="medium" ${settings.cardShadow === 'medium' ? 'selected' : ''}>Средняя</option>
                    <option value="large" ${settings.cardShadow === 'large' ? 'selected' : ''}>Большая</option>
                  </select>
                </div>
              </div>
              <div class="admin-form__group">
                <label>Эффект при наведении</label>
                <select id="cardHoverEffect">
                  <option value="lift" ${settings.cardHoverEffect === 'lift' ? 'selected' : ''}>Подъем</option>
                  <option value="scale" ${settings.cardHoverEffect === 'scale' ? 'selected' : ''}>Увеличение</option>
                  <option value="glow" ${settings.cardHoverEffect === 'glow' ? 'selected' : ''}>Свечение</option>
                  <option value="none" ${settings.cardHoverEffect === 'none' ? 'selected' : ''}>Без эффекта</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Spacing Section -->
          <div class="admin-content-section">
            <h3 class="admin-content-section__title">📏 Отступы и размеры</h3>
            <div class="admin-form">
              <div class="admin-form__row">
                <div class="admin-form__group">
                  <label>Отступ между карточками (px)</label>
                  <input type="range" id="cardGap" min="10" max="50" value="${settings.cardGap || 24}">
                  <span id="cardGapValue">${settings.cardGap || 24}px</span>
                </div>
                <div class="admin-form__group">
                  <label>Отступ секций (px)</label>
                  <input type="range" id="sectionPadding" min="20" max="100" value="${settings.sectionPadding || 60}">
                  <span id="sectionPaddingValue">${settings.sectionPadding || 60}px</span>
                </div>
              </div>
              <div class="admin-form__group">
                <label>Максимальная ширина контента (px)</label>
                <input type="number" id="maxWidth" value="${settings.maxWidth || 1400}" min="1000" max="2000" step="100">
              </div>
            </div>
          </div>

          <!-- Hero Section -->
          <div class="admin-content-section">
            <h3 class="admin-content-section__title">🎬 Hero секция</h3>
            <div class="admin-form">
              <div class="admin-form__group">
                <label>Фоновое изображение Hero (URL)</label>
                <input type="text" id="heroBackground" value="${settings.heroBackground || ''}" placeholder="https://...">
              </div>
              <div class="admin-form__group">
                <label>Затемнение фона (0-1)</label>
                <input type="range" id="heroOverlay" min="0" max="1" step="0.1" value="${settings.heroOverlay || 0.7}">
                <span id="heroOverlayValue">${settings.heroOverlay || 0.7}</span>
              </div>
              <div class="admin-form__group">
                <label>Высота Hero секции (vh)</label>
                <input type="range" id="heroHeight" min="50" max="100" value="${settings.heroHeight || 100}">
                <span id="heroHeightValue">${settings.heroHeight || 100}vh</span>
              </div>
            </div>
          </div>

          <!-- Icons Section -->
          <div class="admin-content-section">
            <h3 class="admin-content-section__title">🎯 Иконки</h3>
            <div class="admin-form">
              <div class="admin-form__group">
                <label>Стиль иконок</label>
                <select id="iconStyle">
                  <option value="solid" ${settings.iconStyle === 'solid' ? 'selected' : ''}>Сплошные</option>
                  <option value="outline" ${settings.iconStyle === 'outline' ? 'selected' : ''}>Контурные</option>
                  <option value="duotone" ${settings.iconStyle === 'duotone' ? 'selected' : ''}>Двухцветные</option>
                </select>
              </div>
              <div class="admin-form__group">
                <label>Размер иконок</label>
                <input type="range" id="iconSize" min="16" max="48" value="${settings.iconSize || 24}">
                <span id="iconSizeValue">${settings.iconSize || 24}px</span>
              </div>
            </div>
          </div>

          <!-- Text Content Section -->
          <div class="admin-content-section">
            <h3 class="admin-content-section__title">📝 Текстовый контент</h3>
            <div class="admin-form">
              <div class="admin-form__group">
                <label>Заголовок Hero</label>
                <textarea id="heroTitle" rows="3">${settings.heroTitle || 'СОБЕРИ ЛУЧШУЮ ВЕРСИЮ СЕБЯ А МЫ ПОМОЖЕМ'}</textarea>
              </div>
              <div class="admin-form__group">
                <label>Подзаголовок Hero</label>
                <textarea id="heroSubtitle" rows="2">${settings.heroSubtitle || 'Профессиональный тренерский состав'}</textarea>
              </div>
              <div class="admin-form__group">
                <label>Текст кнопки Hero</label>
                <input type="text" id="heroButtonText" value="${settings.heroButtonText || 'Выбрать себе тренера'}">
              </div>
              <div class="admin-form__group">
                <label>Заголовок секции тренеров</label>
                <input type="text" id="trainersTitle" value="${settings.trainersTitle || 'ТИТУЛОВАННЫЙ ТРЕНЕРСКИЙ СОСТАВ'}">
              </div>
              <div class="admin-form__group">
                <label>Подзаголовок секции тренеров</label>
                <textarea id="trainersSubtitle" rows="2">${settings.trainersSubtitle || 'Наша команда профессиональных дипломированных специалистов'}</textarea>
              </div>
            </div>
          </div>

          <!-- Animation Section -->
          <div class="admin-content-section">
            <h3 class="admin-content-section__title">✨ Анимации</h3>
            <div class="admin-form">
              <div class="admin-form__group">
                <label>Включить анимации при прокрутке</label>
                <input type="checkbox" id="enableScrollAnimations" ${settings.enableScrollAnimations !== false ? 'checked' : ''}>
              </div>
              <div class="admin-form__group">
                <label>Скорость анимаций (ms)</label>
                <input type="range" id="animationSpeed" min="100" max="1000" step="100" value="${settings.animationSpeed || 300}">
                <span id="animationSpeedValue">${settings.animationSpeed || 300}ms</span>
              </div>
            </div>
          </div>

          <!-- Filters Section -->
          <div class="admin-content-section">
            <h3 class="admin-content-section__title">🏷️ Фильтры категорий</h3>
            <p style="color: #999; font-size: 13px; margin-bottom: 15px;">
              Управление кнопками фильтрации тренеров. Перетащите для изменения порядка.
            </p>
            <div class="admin-form">
              <div id="filtersContainer">
                ${this.renderFiltersEditor(settings)}
              </div>
              <button type="button" class="admin-btn admin-btn--add admin-btn--small" id="addFilterBtn" style="margin-top: 15px;">+ Добавить фильтр</button>
              <div class="admin-form__row" style="margin-top: 15px;">
                <button type="button" class="admin-btn admin-btn--small" id="sortFiltersAlpha">Сортировать А-Я</button>
                <button type="button" class="admin-btn admin-btn--small" id="sortFiltersNum">Сортировать по номеру</button>
              </div>
            </div>
          </div>

          <div class="admin-form-actions">
            <button class="admin-btn admin-btn--add" id="saveContentBtn">Сохранить и применить</button>
            <button class="admin-btn admin-btn--delete" id="resetContentBtn">Сбросить к умолчанию</button>
          </div>
        </div>
      </div>
    `;
  }
  
  renderFiltersEditor(settings) {
    const defaultFilters = [
      { id: 1, text: 'Фитнес', filter: 'all', color: '#f4d03f', textColor: '#1a1a1a', active: true },
      { id: 2, text: 'Кроссфит', filter: 'Кроссфит', color: 'transparent', textColor: '#ffffff', active: false },
      { id: 3, text: 'Бодибилдинг', filter: 'Бодибилдинг', color: 'transparent', textColor: '#ffffff', active: false },
      { id: 4, text: 'Тренер по боксу', filter: 'Бокс', color: 'transparent', textColor: '#ffffff', active: false },
      { id: 5, text: 'Боевые единоборства', filter: 'Единоборства', color: 'transparent', textColor: '#ffffff', active: false }
    ];
    
    const filters = settings.filters || defaultFilters;
    
    return filters.map((f, index) => `
      <div class="admin-filter-item" data-index="${index}" draggable="true">
        <span class="admin-filter-drag">☰</span>
        <input type="text" class="filter-text-input" value="${f.text}" placeholder="Текст кнопки" data-index="${index}">
        <input type="text" class="filter-value-input" value="${f.filter}" placeholder="Значение фильтра" data-index="${index}" style="width: 120px;">
        <input type="color" class="filter-color-input" value="${f.color === 'transparent' ? '#3a3a3a' : f.color}" data-index="${index}" title="Цвет фона">
        <input type="color" class="filter-text-color-input" value="${f.textColor}" data-index="${index}" title="Цвет текста">
        <button type="button" class="admin-btn admin-btn--delete admin-btn--small remove-filter-btn" data-index="${index}">✕</button>
      </div>
    `).join('');
  }

  setupTrainersPanel() {
    // Trainer selector
    const trainerSelect = document.getElementById('trainerSelect');
    trainerSelect?.addEventListener('change', async (e) => {
      const trainerId = e.target.value;
      if (trainerId) {
        await this.showDetailedTrainerForm(trainerId);
      } else {
        document.getElementById('trainerFormContainer').innerHTML = '';
      }
    });

    // Add trainer button
    document.getElementById('addTrainerBtn')?.addEventListener('click', async () => {
      await this.showDetailedTrainerForm();
    });
    
    // Undo button
    document.getElementById('undoBtn')?.addEventListener('click', async () => {
      await this.undoLastAction();
    });

    // Export data button
    document.getElementById('exportDataBtn')?.addEventListener('click', async () => {
      let trainers = [];
      try {
        const { FirebaseManager } = await import('./firebase.js');
        const firebase = new FirebaseManager();
        trainers = await firebase.loadTrainers();
      } catch (e) {
        console.warn('Firebase error:', e);
      }
      
      if (trainers.length === 0) {
        const response = await fetch('data/products.json');
        const data = await response.json();
        trainers = data.products || [];
      }
      
      const jsonData = JSON.stringify({ products: trainers }, null, 2);
      
      // Create download
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  setupContentPanel() {
    // Color pickers sync
    const syncColorPicker = (colorId, textId) => {
      const colorInput = document.getElementById(colorId);
      const textInput = document.getElementById(textId);
      
      colorInput?.addEventListener('input', (e) => {
        textInput.value = e.target.value;
      });
      
      textInput?.addEventListener('input', (e) => {
        colorInput.value = e.target.value;
      });
    };

    syncColorPicker('bgColor', 'bgColorText');
    syncColorPicker('accentColor', 'accentColorText');
    syncColorPicker('cardColor', 'cardColorText');
    syncColorPicker('textColor', 'textColorText');

    // Range sliders with value display
    const setupRangeSlider = (sliderId, valueId) => {
      const slider = document.getElementById(sliderId);
      const valueDisplay = document.getElementById(valueId);
      
      slider?.addEventListener('input', (e) => {
        const value = e.target.value;
        const unit = valueId.includes('Radius') || valueId.includes('Gap') || valueId.includes('Padding') || valueId.includes('Size') ? 'px' : 
                     valueId.includes('Height') ? 'vh' : 
                     valueId.includes('Speed') ? 'ms' : '';
        valueDisplay.textContent = value + unit;
      });
    };

    setupRangeSlider('buttonRadius', 'buttonRadiusValue');
    setupRangeSlider('cardRadius', 'cardRadiusValue');
    setupRangeSlider('cardGap', 'cardGapValue');
    setupRangeSlider('sectionPadding', 'sectionPaddingValue');
    setupRangeSlider('heroOverlay', 'heroOverlayValue');
    setupRangeSlider('heroHeight', 'heroHeightValue');
    setupRangeSlider('iconSize', 'iconSizeValue');
    setupRangeSlider('animationSpeed', 'animationSpeedValue');

    // Save button
    document.getElementById('saveContentBtn')?.addEventListener('click', () => {
      this.saveContentSettings();
    });

    // Reset button
    document.getElementById('resetContentBtn')?.addEventListener('click', () => {
      if (confirm('Сбросить все настройки к значениям по умолчанию?')) {
        localStorage.removeItem('siteSettings');
        showToast('Настройки сброшены!', 'success');
        setTimeout(() => window.location.reload(), 1000);
      }
    });
    
    // Filter editor handlers
    this.setupFilterEditorHandlers();
  }
  
  setupFilterEditorHandlers() {
    // Add filter button
    document.getElementById('addFilterBtn')?.addEventListener('click', () => {
      const container = document.getElementById('filtersContainer');
      const index = container.children.length;
      const newFilter = document.createElement('div');
      newFilter.className = 'admin-filter-item';
      newFilter.dataset.index = index;
      newFilter.draggable = true;
      newFilter.innerHTML = `
        <span class="admin-filter-drag">☰</span>
        <input type="text" class="filter-text-input" value="" placeholder="Текст кнопки" data-index="${index}">
        <input type="text" class="filter-value-input" value="" placeholder="Значение фильтра" data-index="${index}" style="width: 120px;">
        <input type="color" class="filter-color-input" value="#3a3a3a" data-index="${index}" title="Цвет фона">
        <input type="color" class="filter-text-color-input" value="#ffffff" data-index="${index}" title="Цвет текста">
        <button type="button" class="admin-btn admin-btn--delete admin-btn--small remove-filter-btn" data-index="${index}">✕</button>
      `;
      container.appendChild(newFilter);
      this.setupFilterItemHandlers(newFilter);
    });
    
    // Sort alphabetically
    document.getElementById('sortFiltersAlpha')?.addEventListener('click', () => {
      this.sortFilters('alpha');
    });
    
    // Sort by number
    document.getElementById('sortFiltersNum')?.addEventListener('click', () => {
      this.sortFilters('num');
    });
    
    // Setup handlers for existing items
    document.querySelectorAll('.admin-filter-item').forEach(item => {
      this.setupFilterItemHandlers(item);
    });
  }
  
  setupFilterItemHandlers(item) {
    // Remove button
    item.querySelector('.remove-filter-btn')?.addEventListener('click', () => {
      item.remove();
    });
    
    // Drag and drop
    item.addEventListener('dragstart', (e) => {
      item.classList.add('dragging');
      e.dataTransfer.setData('text/plain', item.dataset.index);
    });
    
    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
    });
    
    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      item.classList.add('drag-over');
    });
    
    item.addEventListener('dragleave', () => {
      item.classList.remove('drag-over');
    });
    
    item.addEventListener('drop', (e) => {
      e.preventDefault();
      item.classList.remove('drag-over');
      const container = document.getElementById('filtersContainer');
      const dragging = container.querySelector('.dragging');
      if (dragging && dragging !== item) {
        const rect = item.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        if (e.clientY < midY) {
          container.insertBefore(dragging, item);
        } else {
          container.insertBefore(dragging, item.nextSibling);
        }
      }
    });
  }
  
  sortFilters(type) {
    const container = document.getElementById('filtersContainer');
    const items = Array.from(container.children);
    
    items.sort((a, b) => {
      const textA = a.querySelector('.filter-text-input').value;
      const textB = b.querySelector('.filter-text-input').value;
      if (type === 'alpha') {
        return textA.localeCompare(textB, 'ru');
      }
      return 0; // Keep original order for 'num'
    });
    
    items.forEach(item => container.appendChild(item));
  }

  async showDetailedTrainerForm(trainerId = null) {
    const container = document.getElementById('trainerFormContainer');
    
    // Load trainers from Firebase
    let trainers = [];
    try {
      const { FirebaseManager } = await import('./firebase.js');
      const firebase = new FirebaseManager();
      trainers = await firebase.loadTrainers();
      
      if (trainers.length === 0) {
        const response = await fetch('data/products.json');
        const data = await response.json();
        trainers = data.products || [];
      }
    } catch (error) {
      console.error('Failed to load trainers:', error);
      trainers = [];
    }
    
    const trainer = trainerId ? trainers.find(t => t.id === trainerId) : null;

    const images = trainer?.images || ['', '', ''];
    const videos = trainer?.videos || [''];
    const phone = trainer?.phone || '+7 (999) 123-45-67';
    const specialization = trainer?.specialization || [''];
    const education = trainer?.education || '';

    container.innerHTML = `
      <div class="admin-form admin-form--detailed">
        <h3 style="color: #f4d03f; margin-bottom: 20px; font-size: 24px;">
          ${trainer ? `Редактирование: ${trainer.title}` : 'Добавить нового тренера'}
        </h3>
        
        ${trainer ? `
          <button class="admin-btn admin-btn--delete" id="deleteTrainerBtn" style="margin-bottom: 20px;">
            Удалить этого тренера
          </button>
        ` : ''}

        <div class="admin-form-section">
          <h4 class="admin-form-section__title">Основная информация</h4>
          
          <div class="admin-form__group">
            <label>Имя тренера *</label>
            <input type="text" id="trainerName" value="${trainer?.title || ''}" required>
          </div>
          
          <div class="admin-form__group">
            <label>Описание *</label>
            <input type="text" id="trainerDesc" value="${trainer?.description || ''}" required>
          </div>
          
          <div class="admin-form__group">
            <label>Подробное описание</label>
            <textarea id="trainerDetailedDesc">${trainer?.detailedDescription || ''}</textarea>
          </div>
          
          <div class="admin-form__row">
            <div class="admin-form__group">
              <label>Категории * (через запятую)</label>
              <input type="text" id="trainerCategory" value="${trainer?.category || 'Фитнес'}" placeholder="Фитнес, Кроссфит, Бокс" required>
              <p style="color: #999; font-size: 11px; margin-top: 5px;">
                Доступные: Фитнес, Кроссфит, Бодибилдинг, Бокс, Кикбоксинг, Единоборства, Пауэрлифтинг, Йога, Плавание, Стретчинг
              </p>
            </div>
            
            <div class="admin-form__group">
              <label>Стаж *</label>
              <input type="text" id="trainerExp" value="${trainer?.experience || 'Стаж 10 лет'}" required>
            </div>
          </div>
        </div>

        <div class="admin-form-section">
          <h4 class="admin-form-section__title">Основное фото</h4>
          <p style="color: #999; font-size: 13px; margin-bottom: 15px;">
            Это фото будет отображаться на карточке тренера
          </p>
          <div class="admin-form__group">
            <label>URL основного фото *</label>
            <div class="photo-input-wrapper">
              <input type="text" id="mainPhotoUrl" value="${trainer?.image || ''}" placeholder="URL фотографии или загрузите файл" required>
              <label class="photo-upload-btn" for="mainPhotoFile">
                Выбрать файл
              </label>
              <input type="file" id="mainPhotoFile" class="photo-file-input" accept="image/*" style="display: none;">
              <button type="button" class="admin-btn admin-btn--delete admin-btn--small" id="deleteMainPhotoBtn" style="margin-left: 10px;">Удалить</button>
            </div>
            ${trainer?.image ? `<img src="${trainer.image}" alt="Preview" class="admin-photo-preview" id="mainPhotoPreview">` : ''}
          </div>
        </div>

        <div class="admin-form-section">
          <h4 class="admin-form-section__title">Дополнительные фотографии</h4>
          <p style="color: #999; font-size: 13px; margin-bottom: 15px;">
            Загрузите фото с устройства или вставьте URL. Можно добавить любое количество фотографий.
          </p>
          <div id="photosContainer">
            ${images.map((img, index) => `
              <div class="admin-photo-item" data-index="${index}">
                <div class="admin-form__group">
                  <label>Фото ${index + 1}</label>
                  <div class="photo-input-wrapper">
                    <input type="text" class="photo-input" data-index="${index}" value="${img}" placeholder="URL фотографии или загрузите файл">
                    <label class="photo-upload-btn" for="photoFile${index}">
                      Выбрать файл
                    </label>
                    <input type="file" id="photoFile${index}" class="photo-file-input" data-index="${index}" accept="image/*" style="display: none;">
                  </div>
                  ${img ? `<img src="${img}" alt="Preview" class="admin-photo-preview" data-index="${index}">` : ''}
                </div>
                <button type="button" class="admin-btn admin-btn--delete admin-btn--small remove-photo-btn" data-index="${index}">Удалить</button>
              </div>
            `).join('')}
          </div>
          <button type="button" class="admin-btn admin-btn--add admin-btn--small" id="addPhotoBtn">+ Добавить фото</button>
        </div>

        <div class="admin-form-section">
          <h4 class="admin-form-section__title">Видео</h4>
          <p style="color: #999; font-size: 13px; margin-bottom: 15px;">
            Загрузите видео с устройства или вставьте ссылку YouTube
          </p>
          <div id="videosContainer">
            ${videos.map((video, index) => `
              <div class="admin-video-item" data-index="${index}">
                <div class="admin-form__group">
                  <label>Видео ${index + 1}</label>
                  <div class="photo-input-wrapper">
                    <input type="text" class="video-input" data-index="${index}" value="${video}" placeholder="YouTube URL или загрузите файл">
                    <label class="photo-upload-btn" for="videoFile${index}">
                      Выбрать видео
                    </label>
                    <input type="file" id="videoFile${index}" class="video-file-input" data-index="${index}" accept="video/*" style="display: none;">
                  </div>
                </div>
                <button type="button" class="admin-btn admin-btn--delete admin-btn--small remove-video-btn" data-index="${index}">Удалить видео</button>
              </div>
            `).join('')}
          </div>
          <button type="button" class="admin-btn admin-btn--add admin-btn--small" id="addVideoBtn">+ Добавить видео</button>
        </div>

        <div class="admin-form-section">
          <h4 class="admin-form-section__title">Специализация</h4>
          <div id="specializationContainer">
            ${specialization.map((spec, index) => `
              <div class="admin-spec-item" data-index="${index}">
                <div class="admin-form__group">
                  <input type="text" class="spec-input" data-index="${index}" value="${spec}" placeholder="Например: силовой тренинг">
                </div>
                ${spec ? `<button type="button" class="admin-btn admin-btn--delete admin-btn--small remove-spec-btn" data-index="${index}">Удалить</button>` : ''}
              </div>
            `).join('')}
          </div>
          <button type="button" class="admin-btn admin-btn--add admin-btn--small" id="addSpecBtn">+ Добавить специализацию</button>
        </div>

        <div class="admin-form-section">
          <h4 class="admin-form-section__title">Дополнительные плашки</h4>
          <p style="color: #999; font-size: 11px; margin-bottom: 10px;">
            Добавьте дополнительные плашки на карточку (например: "Старший тренер", "Чемпион")
          </p>
          <div id="badgesContainer">
            ${(trainer?.badges || []).map((badge, index) => `
              <div class="admin-badge-item" data-index="${index}">
                <input type="text" class="badge-text-input" value="${typeof badge === 'string' ? badge : badge.text || ''}" placeholder="Текст плашки">
                <input type="color" class="badge-color-input" value="${badge.color || '#f4d03f'}" title="Цвет фона">
                <input type="color" class="badge-text-color-input" value="${badge.textColor || '#1a1a1a'}" title="Цвет текста">
                <button type="button" class="admin-btn admin-btn--delete admin-btn--small remove-badge-btn">✕</button>
              </div>
            `).join('')}
          </div>
          <button type="button" class="admin-btn admin-btn--add admin-btn--small" id="addBadgeBtn">+ Добавить плашку</button>
        </div>

        <div class="admin-form-section">
          <h4 class="admin-form-section__title">Образование</h4>
          <div class="admin-form__group">
            <textarea id="trainerEducation" rows="4">${education}</textarea>
          </div>
        </div>

        <div class="admin-form-section">
          <h4 class="admin-form-section__title">Контакты для консультации</h4>
          <div class="admin-form__group">
            <label>Номер телефона</label>
            <input type="tel" id="trainerPhone" value="${phone}" placeholder="+7 (999) 123-45-67">
          </div>
        </div>

        <div class="admin-form-actions">
          <button class="admin-btn admin-btn--add" id="saveTrainerBtn">Сохранить изменения</button>
          <button class="admin-btn admin-btn--delete" id="cancelTrainerBtn">Отмена</button>
        </div>
      </div>
    `;

    this.setupDetailedFormListeners(trainerId);
  }

  setupDetailedFormListeners(trainerId) {
    // Save button
    document.getElementById('saveTrainerBtn')?.addEventListener('click', async () => {
      await this.saveDetailedTrainer(trainerId);
    });

    // Cancel button
    document.getElementById('cancelTrainerBtn')?.addEventListener('click', () => {
      document.getElementById('trainerFormContainer').innerHTML = '';
      document.getElementById('trainerSelect').value = '';
    });

    // Delete trainer button
    document.getElementById('deleteTrainerBtn')?.addEventListener('click', async () => {
      await this.deleteTrainer(trainerId);
    });

    // Setup main photo file input
    const mainPhotoFile = document.getElementById('mainPhotoFile');
    if (mainPhotoFile) {
      mainPhotoFile.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
          alert('Пожалуйста, выберите изображение');
          return;
        }

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
          alert('Размер файла не должен превышать 5MB');
          return;
        }

        const mainPhotoUrl = document.getElementById('mainPhotoUrl');
        mainPhotoUrl.value = 'Загрузка...';
        mainPhotoUrl.disabled = true;

        try {
          const base64 = await this.fileToBase64(file);
          mainPhotoUrl.value = base64;
          mainPhotoUrl.disabled = false;
          
          // Update preview
          let preview = document.getElementById('mainPhotoPreview');
          if (!preview) {
            preview = document.createElement('img');
            preview.id = 'mainPhotoPreview';
            preview.className = 'admin-photo-preview';
            mainPhotoUrl.closest('.admin-form__group').appendChild(preview);
          }
          preview.src = base64;
          preview.style.display = 'block';
        } catch (error) {
          alert('Ошибка при загрузке фото');
          mainPhotoUrl.value = '';
          mainPhotoUrl.disabled = false;
        }
      });
    }

    // Delete main photo button
    document.getElementById('deleteMainPhotoBtn')?.addEventListener('click', () => {
      const mainPhotoUrl = document.getElementById('mainPhotoUrl');
      const preview = document.getElementById('mainPhotoPreview');
      if (mainPhotoUrl) mainPhotoUrl.value = '';
      if (preview) preview.style.display = 'none';
    });

    // Video file upload handlers
    document.querySelectorAll('.video-file-input').forEach(input => {
      input.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const index = e.target.dataset.index;
        const videoInput = document.querySelector(`.video-input[data-index="${index}"]`);
        
        // Для видео сохраняем имя файла (в реальном проекте нужен сервер для загрузки)
        videoInput.value = `video_${file.name}`;
        alert('Видео выбрано: ' + file.name + '\n\nВажно: Для загрузки видео на сайт нужен сервер. Пока можно использовать YouTube ссылки.');
      });
    });

    // Setup main photo URL input
    const mainPhotoUrl = document.getElementById('mainPhotoUrl');
    if (mainPhotoUrl) {
      mainPhotoUrl.addEventListener('input', (e) => {
        if (e.target.urlTimeout) clearTimeout(e.target.urlTimeout);
        e.target.urlTimeout = setTimeout(() => {
          const url = e.target.value.trim();
          if (url && url !== 'Загрузка...') {
            let preview = document.getElementById('mainPhotoPreview');
            if (!preview) {
              preview = document.createElement('img');
              preview.id = 'mainPhotoPreview';
              preview.className = 'admin-photo-preview';
              e.target.closest('.admin-form__group').appendChild(preview);
            }
            preview.src = url;
            preview.style.display = 'block';
          }
        }, 500);
      });
    }

    // Add photo button
    document.getElementById('addPhotoBtn')?.addEventListener('click', () => {
      const container = document.getElementById('photosContainer');
      const currentPhotos = container.querySelectorAll('.photo-input');
      
      // Убрано ограничение на количество фото
      const index = currentPhotos.length;
      const photoItem = document.createElement('div');
      photoItem.className = 'admin-photo-item';
      photoItem.innerHTML = `
        <div class="admin-form__group">
          <label>Фото ${index + 1}</label>
          <div class="photo-input-wrapper">
            <input type="text" class="photo-input" data-index="${index}" placeholder="URL фотографии или загрузите файл">
            <label class="photo-upload-btn" for="photoFile${index}">
              Выбрать файл
            </label>
            <input type="file" id="photoFile${index}" class="photo-file-input" data-index="${index}" accept="image/*" style="display: none;">
          </div>
          <button type="button" class="admin-btn admin-btn--delete admin-btn--small remove-photo-btn-new" data-index="${index}">Удалить</button>
        </div>
      `;
      container.appendChild(photoItem);
      
      // Setup file input listener for new photo
      this.setupPhotoFileInput(photoItem.querySelector('.photo-file-input'));
      
      // Setup URL input listener for new photo
      const textInput = photoItem.querySelector('.photo-input');
      textInput.addEventListener('input', (e) => {
        this.updatePhotoPreview(e.target);
      });
      textInput.addEventListener('blur', (e) => {
        this.updatePhotoPreview(e.target);
      });
      
      // Setup remove button for new photo
      photoItem.querySelector('.remove-photo-btn-new').addEventListener('click', (e) => {
        photoItem.remove();
      });
    });

    // Remove photo buttons
    document.querySelectorAll('.remove-photo-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const photoItem = e.target.closest('.admin-photo-item');
        // Просто удаляем весь блок фото
        photoItem.remove();
      });
    });

    // Photo preview on input (для существующих полей)
    document.querySelectorAll('.photo-input').forEach(input => {
      // Обновление при вводе (в реальном времени)
      input.addEventListener('input', (e) => {
        this.updatePhotoPreview(e.target);
      });
      // Обновление при потере фокуса
      input.addEventListener('blur', (e) => {
        this.updatePhotoPreview(e.target);
      });
    });

    // Setup file inputs for photos
    document.querySelectorAll('.photo-file-input').forEach(fileInput => {
      this.setupPhotoFileInput(fileInput);
    });

    // Add video button
    document.getElementById('addVideoBtn')?.addEventListener('click', () => {
      const container = document.getElementById('videosContainer');
      const currentVideos = container.querySelectorAll('.video-input');
      const index = currentVideos.length;
      const videoItem = document.createElement('div');
      videoItem.className = 'admin-video-item';
      videoItem.innerHTML = `
        <div class="admin-form__group">
          <label>Видео ${index + 1} (YouTube URL)</label>
          <input type="text" class="video-input" data-index="${index}" placeholder="https://www.youtube.com/watch?v=...">
        </div>
      `;
      container.appendChild(videoItem);
    });

    // Remove video buttons
    document.querySelectorAll('.remove-video-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const videoItem = e.target.closest('.admin-video-item');
        videoItem.remove();
      });
    });

    // Add specialization button
    document.getElementById('addSpecBtn')?.addEventListener('click', () => {
      const container = document.getElementById('specializationContainer');
      const currentSpecs = container.querySelectorAll('.spec-input');
      const index = currentSpecs.length;
      const specItem = document.createElement('div');
      specItem.className = 'admin-spec-item';
      specItem.innerHTML = `
        <div class="admin-form__group">
          <input type="text" class="spec-input" data-index="${index}" placeholder="Например: силовой тренинг">
        </div>
      `;
      container.appendChild(specItem);
    });

    // Remove specialization buttons
    document.querySelectorAll('.remove-spec-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const specItem = e.target.closest('.admin-spec-item');
        specItem.remove();
      });
    });
    
    // Add badge button
    document.getElementById('addBadgeBtn')?.addEventListener('click', () => {
      const container = document.getElementById('badgesContainer');
      const badgeItem = document.createElement('div');
      badgeItem.className = 'admin-badge-item';
      badgeItem.innerHTML = `
        <input type="text" class="badge-text-input" placeholder="Текст плашки">
        <input type="color" class="badge-color-input" value="#f4d03f" title="Цвет фона">
        <input type="color" class="badge-text-color-input" value="#1a1a1a" title="Цвет текста">
        <button type="button" class="admin-btn admin-btn--delete admin-btn--small remove-badge-btn">✕</button>
      `;
      container.appendChild(badgeItem);
      
      // Add remove handler
      badgeItem.querySelector('.remove-badge-btn').addEventListener('click', () => {
        badgeItem.remove();
      });
    });
    
    // Remove badge buttons (for existing)
    document.querySelectorAll('.remove-badge-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.target.closest('.admin-badge-item').remove();
      });
    });
  }

  async saveDetailedTrainer(trainerId) {
    console.log('Начало сохранения тренера:', trainerId);
    
    // Import Firebase manager
    const { FirebaseManager } = await import('./firebase.js');
    const firebase = new FirebaseManager();
    
    // Load trainers from Firebase first
    let trainers = [];
    try {
      trainers = await firebase.loadTrainers();
      console.log('Загружено из Firebase:', trainers.length);
    } catch (e) {
      console.warn('Firebase load error, trying JSON:', e);
      try {
        const response = await fetch('data/products.json');
        const data = await response.json();
        trainers = data.products || [];
      } catch (e2) {
        trainers = [];
      }
    }
    
    console.log('Текущие тренеры:', trainers.length);
    
    // Collect photos
    const photoInputs = document.querySelectorAll('.photo-input');
    const images = Array.from(photoInputs)
      .map(input => input.value.trim())
      .filter(url => url !== '');

    // Collect videos
    const videoInputs = document.querySelectorAll('.video-input');
    const videos = Array.from(videoInputs)
      .map(input => input.value.trim())
      .filter(url => url !== '');

    // Collect specialization
    const specInputs = document.querySelectorAll('.spec-input');
    const specialization = Array.from(specInputs)
      .map(input => input.value.trim())
      .filter(spec => spec !== '');

    // Collect badges
    const badgeItems = document.querySelectorAll('.admin-badge-item');
    const badges = Array.from(badgeItems)
      .map(item => ({
        text: item.querySelector('.badge-text-input')?.value.trim() || '',
        color: item.querySelector('.badge-color-input')?.value || '#f4d03f',
        textColor: item.querySelector('.badge-text-color-input')?.value || '#1a1a1a'
      }))
      .filter(badge => badge.text !== '');

    // Get main photo
    const mainPhotoInput = document.getElementById('mainPhotoUrl');
    const mainPhoto = mainPhotoInput?.value.trim() || 
                      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=600&fit=crop';

    // Generate new ID for new trainer
    let newId = trainerId;
    if (!trainerId) {
      const maxNum = trainers.reduce((max, t) => {
        const num = parseInt(t.id.replace('prod-', '')) || 0;
        return num > max ? num : max;
      }, 0);
      newId = 'prod-' + String(maxNum + 1).padStart(3, '0');
    }

    const trainerData = {
      id: newId,
      title: document.getElementById('trainerName')?.value || '',
      description: document.getElementById('trainerDesc')?.value || '',
      detailedDescription: document.getElementById('trainerDetailedDesc')?.value || '',
      category: document.getElementById('trainerCategory')?.value || 'Фитнес',
      experience: document.getElementById('trainerExp')?.value || '',
      image: mainPhoto,
      imageAlt: `Тренер ${document.getElementById('trainerName')?.value || ''}`,
      images: images.length > 0 ? images : [mainPhoto],
      videos: videos.length > 0 ? videos : [],
      specialization: specialization.length > 0 ? specialization : [],
      badges: badges.length > 0 ? badges : [],
      education: document.getElementById('trainerEducation')?.value || '',
      phone: document.getElementById('trainerPhone')?.value || '',
      price: 2500,
      currency: 'RUB'
    };

    try {
      // Save current state to undo history before making changes
      if (trainerId) {
        const oldTrainer = trainers.find(t => t.id === trainerId);
        if (oldTrainer) {
          this.addToUndoHistory({
            type: 'update',
            trainerId: trainerId,
            oldData: JSON.parse(JSON.stringify(oldTrainer)),
            newData: trainerData
          });
        }
      } else {
        this.addToUndoHistory({
          type: 'create',
          trainerId: newId,
          newData: trainerData
        });
      }
      
      // Save to Firebase
      await firebase.saveTrainer(trainerData);
      console.log('✅ Сохранено в Firebase:', trainerData.id, trainerData.title);
      
      // Show success toast
      showToast('Тренер сохранен!', 'success');
      
      // Close admin panel and refresh cards
      this.closeAdminPanel();
      
      // Reload trainers on the page
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('❌ Ошибка сохранения в Firebase:', error);
      showToast('Ошибка сохранения: ' + error.message, 'error');
    }
  }
  
  addToUndoHistory(action) {
    // Don't save base64 images to avoid quota exceeded
    const cleanAction = JSON.parse(JSON.stringify(action));
    if (cleanAction.oldData) {
      // Remove large base64 data
      if (cleanAction.oldData.image && cleanAction.oldData.image.startsWith('data:')) {
        cleanAction.oldData.image = '';
      }
      if (cleanAction.oldData.images) {
        cleanAction.oldData.images = cleanAction.oldData.images.filter(img => !img.startsWith('data:'));
      }
    }
    if (cleanAction.newData) {
      if (cleanAction.newData.image && cleanAction.newData.image.startsWith('data:')) {
        cleanAction.newData.image = '';
      }
      if (cleanAction.newData.images) {
        cleanAction.newData.images = cleanAction.newData.images.filter(img => !img.startsWith('data:'));
      }
    }
    
    this.undoHistory.push(cleanAction);
    // Keep only last 5 actions
    if (this.undoHistory.length > 5) {
      this.undoHistory.shift();
    }
    
    // Try to save to localStorage, ignore if quota exceeded
    try {
      localStorage.setItem('undoHistory', JSON.stringify(this.undoHistory));
    } catch (e) {
      console.warn('Could not save undo history:', e.message);
      // Clear old history if quota exceeded
      localStorage.removeItem('undoHistory');
      this.undoHistory = [cleanAction];
      try {
        localStorage.setItem('undoHistory', JSON.stringify(this.undoHistory));
      } catch (e2) {
        // Give up on localStorage for undo
        console.warn('Undo history disabled due to storage quota');
      }
    }
  }
  
  async undoLastAction() {
    // Load from localStorage
    const savedHistory = localStorage.getItem('undoHistory');
    if (savedHistory) {
      this.undoHistory = JSON.parse(savedHistory);
    }
    
    if (this.undoHistory.length === 0) {
      showToast('Нет действий для отмены', 'info');
      return;
    }
    
    const lastAction = this.undoHistory.pop();
    localStorage.setItem('undoHistory', JSON.stringify(this.undoHistory));
    
    const { FirebaseManager } = await import('./firebase.js');
    const firebase = new FirebaseManager();
    
    try {
      if (lastAction.type === 'update') {
        // Restore old data
        await firebase.saveTrainer(lastAction.oldData);
        showToast(`Отменено изменение: ${lastAction.oldData.title}`, 'success');
      } else if (lastAction.type === 'create') {
        // Delete created trainer
        await firebase.deleteTrainer(lastAction.trainerId);
        showToast(`Отменено создание: ${lastAction.newData.title}`, 'success');
      } else if (lastAction.type === 'delete') {
        // Restore deleted trainer
        await firebase.saveTrainer(lastAction.oldData);
        showToast(`Восстановлен: ${lastAction.oldData.title}`, 'success');
      }
      
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Undo error:', error);
      showToast('Ошибка отмены: ' + error.message, 'error');
    }
  }

  saveTrainer(trainerId) {
    const trainers = JSON.parse(localStorage.getItem('trainersData') || '[]');
    
    const trainerData = {
      id: trainerId || 'prod-' + Date.now(),
      title: document.getElementById('trainerName').value,
      description: document.getElementById('trainerDesc').value,
      category: document.getElementById('trainerCategory').value,
      experience: document.getElementById('trainerExp').value,
      image: document.getElementById('trainerImage').value,
      imageAlt: `Тренер ${document.getElementById('trainerName').value}`,
      price: 2500,
      currency: 'RUB'
    };

    if (trainerId) {
      const index = trainers.findIndex(t => t.id === trainerId);
      trainers[index] = trainerData;
    } else {
      trainers.push(trainerData);
    }

    localStorage.setItem('trainersData', JSON.stringify(trainers));
    showToast('Тренер сохранен!', 'success');
    this.closeAdminPanel();
    setTimeout(() => window.location.reload(), 1000);
  }

  async deleteTrainer(trainerId) {
    if (!confirm('Удалить этого тренера?')) return;

    try {
      // Import Firebase manager
      const { FirebaseManager } = await import('./firebase.js');
      const firebase = new FirebaseManager();
      
      // Load trainer data before deleting for undo
      const trainers = await firebase.loadTrainers();
      const trainerToDelete = trainers.find(t => t.id === trainerId);
      
      if (trainerToDelete) {
        this.addToUndoHistory({
          type: 'delete',
          trainerId: trainerId,
          oldData: JSON.parse(JSON.stringify(trainerToDelete))
        });
      }
      
      // Delete from Firebase
      await firebase.deleteTrainer(trainerId);
      console.log('✅ Удалено из Firebase:', trainerId);
      
      // Show success toast
      showToast('Тренер удален!', 'success');
      
      // Close admin panel and refresh
      this.closeAdminPanel();
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('❌ Ошибка удаления из Firebase:', error);
      showToast('Ошибка удаления: ' + error.message, 'error');
    }
  }

  saveContentSettings() {
    const settings = {
      // Colors
      bgColor: document.getElementById('bgColor').value,
      accentColor: document.getElementById('accentColor').value,
      cardColor: document.getElementById('cardColor').value,
      textColor: document.getElementById('textColor').value,
      
      // Typography
      fontFamily: document.getElementById('fontFamily').value,
      fontSize: document.getElementById('fontSize').value,
      heroTitleSize: document.getElementById('heroTitleSize').value,
      sectionTitleSize: document.getElementById('sectionTitleSize').value,
      
      // Buttons
      buttonRadius: document.getElementById('buttonRadius').value,
      buttonSize: document.getElementById('buttonSize').value,
      buttonStyle: document.getElementById('buttonStyle').value,
      showButtonIcons: document.getElementById('showButtonIcons').checked,
      
      // Cards
      cardRadius: document.getElementById('cardRadius').value,
      cardShadow: document.getElementById('cardShadow').value,
      cardHoverEffect: document.getElementById('cardHoverEffect').value,
      
      // Spacing
      cardGap: document.getElementById('cardGap').value,
      sectionPadding: document.getElementById('sectionPadding').value,
      maxWidth: document.getElementById('maxWidth').value,
      
      // Hero
      heroBackground: document.getElementById('heroBackground').value,
      heroOverlay: document.getElementById('heroOverlay').value,
      heroHeight: document.getElementById('heroHeight').value,
      
      // Icons
      iconStyle: document.getElementById('iconStyle').value,
      iconSize: document.getElementById('iconSize').value,
      
      // Text Content
      heroTitle: document.getElementById('heroTitle').value,
      heroSubtitle: document.getElementById('heroSubtitle').value,
      heroButtonText: document.getElementById('heroButtonText').value,
      trainersTitle: document.getElementById('trainersTitle').value,
      trainersSubtitle: document.getElementById('trainersSubtitle').value,
      
      // Animations
      enableScrollAnimations: document.getElementById('enableScrollAnimations').checked,
      animationSpeed: document.getElementById('animationSpeed').value,
      
      // Filters
      filters: this.collectFiltersData()
    };

    localStorage.setItem('siteSettings', JSON.stringify(settings));
    
    // Apply settings immediately
    this.applyContentSettings(settings);
    
    // Update filters on page
    this.updatePageFilters(settings.filters);
    
    showToast('Настройки сохранены!', 'success');
  }
  
  collectFiltersData() {
    const container = document.getElementById('filtersContainer');
    if (!container) return [];
    
    const filters = [];
    container.querySelectorAll('.admin-filter-item').forEach((item, index) => {
      filters.push({
        id: index + 1,
        text: item.querySelector('.filter-text-input').value,
        filter: item.querySelector('.filter-value-input').value,
        color: item.querySelector('.filter-color-input').value,
        textColor: item.querySelector('.filter-text-color-input').value
      });
    });
    return filters;
  }
  
  updatePageFilters(filters) {
    const filtersContainer = document.querySelector('.trainers-filters');
    if (!filtersContainer || !filters || filters.length === 0) return;
    
    filtersContainer.innerHTML = filters.map((f, index) => `
      <button class="filter-btn ${index === 0 ? 'filter-btn--active' : ''}" 
              data-filter="${f.filter}" 
              style="background-color: ${f.color}; color: ${f.textColor}; border-color: ${f.color === 'transparent' || f.color === '#3a3a3a' ? '#444' : f.color};">
        ${f.text}
      </button>
    `).join('');
    
    // Re-attach event listeners
    filtersContainer.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const filter = e.target.getAttribute('data-filter');
        filtersContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('filter-btn--active'));
        e.target.classList.add('filter-btn--active');
        
        // Trigger filter (dispatch custom event)
        window.dispatchEvent(new CustomEvent('filterChange', { detail: { filter } }));
      });
    });
  }

  applyContentSettings(settings) {
    const root = document.documentElement;
    
    // Apply colors
    if (settings.bgColor) root.style.setProperty('--color-background', settings.bgColor);
    if (settings.accentColor) root.style.setProperty('--color-secondary', settings.accentColor);
    if (settings.cardColor) root.style.setProperty('--color-card-bg', settings.cardColor);
    if (settings.textColor) root.style.setProperty('--color-text', settings.textColor);
    
    // Apply typography
    if (settings.fontFamily) root.style.setProperty('--font-family', settings.fontFamily);
    if (settings.fontSize) root.style.setProperty('--font-size-base', settings.fontSize + 'px');
    if (settings.heroTitleSize) {
      const heroTitle = document.querySelector('.hero__title');
      if (heroTitle) heroTitle.style.fontSize = settings.heroTitleSize + 'px';
    }
    if (settings.sectionTitleSize) {
      const trainersTitle = document.querySelector('.trainers-title');
      if (trainersTitle) trainersTitle.style.fontSize = settings.sectionTitleSize + 'px';
    }
    
    // Apply button styles
    if (settings.buttonRadius) {
      root.style.setProperty('--button-radius', settings.buttonRadius + 'px');
      document.querySelectorAll('.card__button, .hero__button, .admin-btn').forEach(btn => {
        btn.style.borderRadius = settings.buttonRadius + 'px';
      });
    }
    
    if (settings.buttonSize) {
      const sizes = { small: '10px 16px', medium: '12px 20px', large: '16px 28px' };
      document.querySelectorAll('.card__button, .hero__button').forEach(btn => {
        btn.style.padding = sizes[settings.buttonSize] || sizes.medium;
      });
    }
    
    if (settings.buttonStyle) {
      document.querySelectorAll('.card__button--primary, .hero__button').forEach(btn => {
        if (settings.buttonStyle === 'outline') {
          btn.style.background = 'transparent';
          btn.style.border = '2px solid ' + (settings.accentColor || '#f4d03f');
          btn.style.color = settings.accentColor || '#f4d03f';
        } else if (settings.buttonStyle === 'ghost') {
          btn.style.background = 'rgba(244, 208, 63, 0.1)';
          btn.style.border = 'none';
          btn.style.color = settings.accentColor || '#f4d03f';
        } else {
          btn.style.background = settings.accentColor || '#f4d03f';
          btn.style.border = 'none';
          btn.style.color = '#1a1a1a';
        }
      });
    }
    
    if (settings.showButtonIcons === false) {
      document.querySelectorAll('.button-icon, .hero__button-icon').forEach(icon => {
        icon.style.display = 'none';
      });
    } else {
      document.querySelectorAll('.button-icon, .hero__button-icon').forEach(icon => {
        icon.style.display = 'inline-flex';
      });
    }
    
    // Apply card styles
    if (settings.cardRadius) {
      root.style.setProperty('--border-radius', settings.cardRadius + 'px');
      document.querySelectorAll('.card').forEach(card => {
        card.style.borderRadius = settings.cardRadius + 'px';
      });
    }
    
    if (settings.cardShadow) {
      const shadows = {
        none: 'none',
        small: '0 2px 8px rgba(0,0,0,0.2)',
        medium: '0 4px 12px rgba(0,0,0,0.3)',
        large: '0 8px 24px rgba(0,0,0,0.4)'
      };
      document.querySelectorAll('.card').forEach(card => {
        card.style.boxShadow = shadows[settings.cardShadow] || shadows.medium;
      });
    }
    
    if (settings.cardHoverEffect) {
      document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('mouseenter', function() {
          if (settings.cardHoverEffect === 'lift') {
            this.style.transform = 'translateY(-8px)';
          } else if (settings.cardHoverEffect === 'scale') {
            this.style.transform = 'scale(1.05)';
          } else if (settings.cardHoverEffect === 'glow') {
            this.style.boxShadow = `0 0 20px ${settings.accentColor || '#f4d03f'}`;
          }
        });
        card.addEventListener('mouseleave', function() {
          this.style.transform = '';
          if (settings.cardHoverEffect === 'glow') {
            const shadows = {
              none: 'none',
              small: '0 2px 8px rgba(0,0,0,0.2)',
              medium: '0 4px 12px rgba(0,0,0,0.3)',
              large: '0 8px 24px rgba(0,0,0,0.4)'
            };
            this.style.boxShadow = shadows[settings.cardShadow] || shadows.medium;
          }
        });
      });
    }
    
    // Apply spacing
    if (settings.cardGap) {
      const gallery = document.querySelector('.gallery-container');
      if (gallery) gallery.style.gap = settings.cardGap + 'px';
    }
    
    if (settings.sectionPadding) {
      document.querySelectorAll('.trainers-section, .gym-section').forEach(section => {
        section.style.padding = settings.sectionPadding + 'px 20px';
      });
    }
    
    if (settings.maxWidth) {
      root.style.setProperty('--max-width', settings.maxWidth + 'px');
    }
    
    // Apply hero styles
    if (settings.heroBackground) {
      const hero = document.querySelector('.hero');
      if (hero) {
        hero.style.backgroundImage = `url(${settings.heroBackground})`;
        hero.style.backgroundSize = 'cover';
        hero.style.backgroundPosition = 'center';
      }
    }
    
    if (settings.heroOverlay) {
      const hero = document.querySelector('.hero');
      if (hero) {
        const overlay = hero.querySelector('.hero__container');
        if (overlay) {
          overlay.style.background = `rgba(0, 0, 0, ${settings.heroOverlay})`;
        }
      }
    }
    
    if (settings.heroHeight) {
      const hero = document.querySelector('.hero');
      if (hero) hero.style.minHeight = settings.heroHeight + 'vh';
    }
    
    // Apply icon styles
    if (settings.iconSize) {
      document.querySelectorAll('.button-icon, .hero__button-icon').forEach(icon => {
        icon.style.width = settings.iconSize + 'px';
        icon.style.height = settings.iconSize + 'px';
      });
    }
    
    // Apply text content
    if (settings.heroTitle) {
      const heroTitle = document.querySelector('.hero__title');
      if (heroTitle) heroTitle.innerHTML = settings.heroTitle.replace(/\n/g, '<br>');
    }
    
    if (settings.heroSubtitle) {
      const heroSubtitle = document.querySelector('.hero__subtitle');
      if (heroSubtitle) heroSubtitle.innerHTML = settings.heroSubtitle.replace(/\n/g, '<br>');
    }
    
    if (settings.heroButtonText) {
      const heroButton = document.querySelector('.hero__button');
      if (heroButton) {
        const icon = heroButton.querySelector('.hero__button-icon');
        heroButton.textContent = settings.heroButtonText;
        if (icon) heroButton.appendChild(icon);
      }
    }
    
    if (settings.trainersTitle) {
      const trainersTitle = document.querySelector('.trainers-title');
      if (trainersTitle) {
        const icon = trainersTitle.querySelector('.trainers-title__icon');
        trainersTitle.innerHTML = '';
        if (icon) trainersTitle.appendChild(icon);
        trainersTitle.appendChild(document.createTextNode(settings.trainersTitle));
      }
    }
    
    if (settings.trainersSubtitle) {
      const trainersSubtitle = document.querySelector('.trainers-subtitle');
      if (trainersSubtitle) trainersSubtitle.innerHTML = settings.trainersSubtitle.replace(/\n/g, '<br>');
    }
    
    // Apply animations
    if (settings.enableScrollAnimations) {
      root.style.setProperty('--animation-speed', (settings.animationSpeed || 300) + 'ms');
      
      // Add scroll animations
      const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      };
      
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }
        });
      }, observerOptions);
      
      document.querySelectorAll('.card, .trainers-header, .gym-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `all ${settings.animationSpeed || 300}ms ease`;
        observer.observe(el);
      });
    }
  }

  // Load and apply saved settings on page load
  loadSavedSettings() {
    const settings = JSON.parse(localStorage.getItem('siteSettings') || '{}');
    if (Object.keys(settings).length > 0) {
      this.applyContentSettings(settings);
    }
  }

  /**
   * Setup file input for photo upload
   * @param {HTMLInputElement} fileInput - File input element
   */
  setupPhotoFileInput(fileInput) {
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Пожалуйста, выберите изображение');
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert('Размер файла не должен превышать 5MB');
        return;
      }

      // Show loading indicator
      const photoItem = fileInput.closest('.admin-photo-item');
      if (!photoItem) {
        console.warn('Photo item container not found');
        return;
      }
      const textInput = photoItem.querySelector('.photo-input');
      if (!textInput) {
        console.warn('Photo input not found');
        return;
      }
      textInput.value = 'Загрузка...';
      textInput.disabled = true;

      try {
        // Convert to base64
        const base64 = await this.fileToBase64(file);
        
        // Update input with base64
        textInput.value = base64;
        textInput.disabled = false;
        
        // Update preview
        this.updatePhotoPreview(textInput);
        
        // Show success message
        this.showPhotoUploadSuccess(photoItem);
      } catch (error) {
        console.error('Error uploading photo:', error);
        alert('Ошибка при загрузке фото');
        textInput.value = '';
        textInput.disabled = false;
      }
    });
  }

  /**
   * Convert file to base64
   * @param {File} file - File object
   * @returns {Promise<string>} Base64 string
   */
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        resolve(reader.result);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  /**
   * Update photo preview with debounce
   * @param {HTMLInputElement} input - Text input with photo URL or base64
   */
  updatePhotoPreview(input) {
    // Clear previous timeout
    if (input.previewTimeout) {
      clearTimeout(input.previewTimeout);
    }
    
    // Set new timeout for debounce (500ms)
    input.previewTimeout = setTimeout(() => {
      const url = input.value.trim();
      if (url && url !== 'Загрузка...') {
        const photoItem = input.closest('.admin-photo-item');
        const wrapper = input.closest('.photo-input-wrapper') || input.parentElement;
        let preview = photoItem.querySelector('.admin-photo-preview');
        
        if (!preview) {
          preview = document.createElement('img');
          preview.className = 'admin-photo-preview';
          const index = input.getAttribute('data-index');
          preview.setAttribute('data-index', index);
          wrapper.parentElement.appendChild(preview);
        }
        
        preview.src = url;
        preview.onerror = () => {
          preview.style.display = 'none';
          console.error('Failed to load image:', url.substring(0, 50) + '...');
        };
        preview.onload = () => {
          preview.style.display = 'block';
        };
      }
    }, 500);
  }

  /**
   * Show success message for photo upload
   * @param {HTMLElement} photoItem - Photo item container
   */
  showPhotoUploadSuccess(photoItem) {
    const label = photoItem.querySelector('label');
    const originalText = label.textContent;
    label.textContent = '✅ Загружено!';
    label.style.color = '#4CAF50';
    
    setTimeout(() => {
      label.textContent = originalText;
      label.style.color = '';
    }, 2000);
  }
}
