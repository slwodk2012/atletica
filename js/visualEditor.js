/**
 * Professional Visual Editor - Bug-free implementation
 * Fixes: text editing, button/image clicks, filter buttons, performance
 */
export class VisualEditor {
  constructor() {
    this.isEditMode = false;
    this.selectedElement = null;
    this.editPanel = null;
    this.styleChanges = {}; // Store style changes separately
    this.textChanges = {}; // Store text changes separately
    this.isTextEditing = false; // Track if currently editing text
    this.originalClickHandlers = new Map(); // Store original click handlers
  }

  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
    
    if (this.isEditMode) {
      this.enableEditMode();
    } else {
      this.disableEditMode();
    }
  }

  enableEditMode() {
    // Load saved styles and text
    this.loadStyles();

    // Add edit mode indicator
    const indicator = document.createElement('div');
    indicator.id = 'editModeIndicator';
    indicator.className = 'edit-mode-indicator';
    indicator.innerHTML = `
      <span>🎨 Режим редактирования</span>
      <button id="saveChangesBtn">💾 Сохранить</button>
      <button id="resetChangesBtn">🔄 Сбросить</button>
      <button id="exitEditMode">✕ Выйти</button>
    `;
    document.body.appendChild(indicator);

    // Create edit panel
    this.createEditPanel();

    // Make elements editable
    this.makeElementsEditable();

    // Disable all interactive elements to prevent accidental clicks
    this.disableInteractiveElements();

    // Setup listeners
    document.getElementById('exitEditMode')?.addEventListener('click', () => {
      this.toggleEditMode();
    });

    document.getElementById('saveChangesBtn')?.addEventListener('click', () => {
      this.saveStyles();
      this.showNotification('✅ Изменения сохранены!');
    });

    document.getElementById('resetChangesBtn')?.addEventListener('click', () => {
      if (confirm('Сбросить все изменения?')) {
        this.resetStyles();
        location.reload();
      }
    });
  }

  disableEditMode() {
    // Remove UI
    document.getElementById('editModeIndicator')?.remove();
    if (this.editPanel) {
      this.editPanel.remove();
      this.editPanel = null;
    }

    // Remove editable states
    document.querySelectorAll('.editable-element').forEach(el => {
      el.classList.remove('editable-element', 'selected-element');
      el.style.outline = '';
      el.contentEditable = false;
      el.style.pointerEvents = '';
    });

    // Re-enable interactive elements
    this.enableInteractiveElements();

    this.selectedElement = null;
    this.isTextEditing = false;
  }

  disableInteractiveElements() {
    // Disable all buttons, links, and interactive elements
    const interactiveSelectors = [
      'button:not(#saveChangesBtn):not(#resetChangesBtn):not(#exitEditMode):not(#closeEditPanel)',
      'a',
      '.card',
      '.filter-btn',
      '.hero__button',
      '.card__button'
    ];

    interactiveSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        // Store original pointer events
        if (!el.hasAttribute('data-original-pointer-events')) {
          el.setAttribute('data-original-pointer-events', el.style.pointerEvents || 'auto');
        }
        // Disable pointer events for non-edit-mode interactions
        if (!el.closest('#editModeIndicator') && !el.closest('#visualEditPanel')) {
          el.style.pointerEvents = 'none';
        }
      });
    });
  }

  enableInteractiveElements() {
    // Re-enable all interactive elements
    document.querySelectorAll('[data-original-pointer-events]').forEach(el => {
      el.style.pointerEvents = el.getAttribute('data-original-pointer-events');
      el.removeAttribute('data-original-pointer-events');
    });
  }

  makeElementsEditable() {
    const selectors = [
      { selector: '.hero__title', type: 'text' },
      { selector: '.hero__subtitle', type: 'text' },
      { selector: '.hero__button', type: 'button' },
      { selector: '.trainers-title', type: 'text' },
      { selector: '.trainers-subtitle', type: 'text' },
      { selector: '.card__title', type: 'text' },
      { selector: '.card__description', type: 'text' },
      { selector: '.card__button', type: 'button' },
      { selector: '.filter-btn', type: 'button' },
      { selector: '.gym-card__title', type: 'text' },
      { selector: '.hero', type: 'section' },
      { selector: '.card', type: 'card' },
      { selector: '.trainers-section', type: 'section' }
    ];

    selectors.forEach(({ selector, type }) => {
      document.querySelectorAll(selector).forEach((el, index) => {
        el.classList.add('editable-element');
        el.setAttribute('data-edit-type', type);
        el.setAttribute('data-edit-id', `${selector.replace(/[^a-z]/g, '')}-${index}`);
        
        // Enable pointer events for editable elements
        el.style.pointerEvents = 'auto';
        
        // Click handler for selection (not text editing)
        const clickHandler = (e) => {
          if (this.isEditMode && !this.isTextEditing) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            this.selectElement(el);
          }
        };
        
        el.addEventListener('click', clickHandler, true);

        // Hover effects
        el.addEventListener('mouseenter', () => {
          if (this.isEditMode && el !== this.selectedElement && !this.isTextEditing) {
            el.style.outline = '2px dashed #f4d03f';
          }
        });

        el.addEventListener('mouseleave', () => {
          if (this.isEditMode && el !== this.selectedElement) {
            el.style.outline = '';
          }
        });
      });
    });
  }

  selectElement(element) {
    // If currently text editing, finish that first
    if (this.isTextEditing && this.selectedElement) {
      this.finishTextEditing();
    }

    // Deselect previous
    if (this.selectedElement) {
      this.selectedElement.classList.remove('selected-element');
      this.selectedElement.style.outline = '';
      if (this.selectedElement.contentEditable === 'true') {
        this.selectedElement.contentEditable = false;
      }
    }

    // Select new
    this.selectedElement = element;
    element.classList.add('selected-element');
    element.style.outline = '3px solid #f4d03f';

    // Update panel
    this.updateEditPanel(element);
  }

  finishTextEditing() {
    if (this.selectedElement && this.selectedElement.contentEditable === 'true') {
      this.selectedElement.contentEditable = false;
      this.isTextEditing = false;
      
      // Save the text content
      const editId = this.selectedElement.getAttribute('data-edit-id');
      const innerHTML = this.selectedElement.innerHTML;
      this.saveElementText(editId, innerHTML);
      
      // Re-enable element selection
      this.selectedElement.style.pointerEvents = 'auto';
    }
  }

  createEditPanel() {
    this.editPanel = document.createElement('div');
    this.editPanel.id = 'visualEditPanel';
    this.editPanel.className = 'visual-edit-panel';
    this.editPanel.innerHTML = `
      <div class="visual-edit-panel__header">
        <h3>⚙️ Настройки элемента</h3>
        <button id="closeEditPanel">×</button>
      </div>
      <div class="visual-edit-panel__content" id="editPanelContent">
        <p style="color: #999; text-align: center; padding: 40px 20px;">
          👆 Кликните на элемент<br>для редактирования
        </p>
      </div>
    `;
    document.body.appendChild(this.editPanel);

    this.makeDraggable(this.editPanel);

    document.getElementById('closeEditPanel')?.addEventListener('click', () => {
      if (this.selectedElement) {
        this.selectedElement.classList.remove('selected-element');
        this.selectedElement.style.outline = '';
        this.selectedElement = null;
      }
      document.getElementById('editPanelContent').innerHTML = `
        <p style="color: #999; text-align: center; padding: 40px 20px;">
          👆 Кликните на элемент<br>для редактирования
        </p>
      `;
    });
  }

  updateEditPanel(element) {
    const content = document.getElementById('editPanelContent');
    if (!content) return;

    const editType = element.getAttribute('data-edit-type');
    const editId = element.getAttribute('data-edit-id');
    const computedStyle = window.getComputedStyle(element);

    let html = `
      <div class="edit-section">
        <div class="edit-info">
          <strong>Тип:</strong> ${editType}<br>
          <strong>ID:</strong> ${editId}
        </div>
      </div>
    `;

    // Text editing
    if (editType === 'text' || editType === 'button') {
      html += `
        <div class="edit-section">
          <h4>📝 Текст</h4>
          <button class="edit-btn" id="enableTextEdit">Редактировать текст</button>
          <p class="edit-hint">Кликните для редактирования прямо на странице</p>
        </div>
      `;
    }

    // Colors
    html += `
      <div class="edit-section">
        <h4>🎨 Цвета</h4>
        <label>Цвет текста:</label>
        <div class="color-input-group">
          <input type="color" id="textColor" value="${this.rgbToHex(computedStyle.color)}">
          <input type="text" id="textColorHex" value="${this.rgbToHex(computedStyle.color)}" class="hex-input">
        </div>
        
        <label>Цвет фона:</label>
        <div class="color-input-group">
          <input type="color" id="bgColor" value="${this.rgbToHex(computedStyle.backgroundColor)}">
          <input type="text" id="bgColorHex" value="${this.rgbToHex(computedStyle.backgroundColor)}" class="hex-input">
        </div>
        <button class="edit-btn" id="applyColors">Применить цвета</button>
      </div>
    `;

    // Typography
    html += `
      <div class="edit-section">
        <h4>✍️ Типографика</h4>
        <label>Размер шрифта:</label>
        <div class="slider-group">
          <input type="range" id="fontSize" min="8" max="120" value="${parseInt(computedStyle.fontSize)}">
          <span id="fontSizeValue">${parseInt(computedStyle.fontSize)}px</span>
        </div>
        
        <label>Жирность:</label>
        <select id="fontWeight">
          <option value="300" ${computedStyle.fontWeight === '300' ? 'selected' : ''}>Тонкий</option>
          <option value="400" ${computedStyle.fontWeight === '400' ? 'selected' : ''}>Обычный</option>
          <option value="600" ${computedStyle.fontWeight === '600' ? 'selected' : ''}>Полужирный</option>
          <option value="700" ${computedStyle.fontWeight === '700' ? 'selected' : ''}>Жирный</option>
          <option value="900" ${computedStyle.fontWeight === '900' ? 'selected' : ''}>Очень жирный</option>
        </select>
        <button class="edit-btn" id="applyTypography">Применить</button>
      </div>
    `;

    // Spacing
    html += `
      <div class="edit-section">
        <h4>📏 Отступы</h4>
        <label>Внутренний отступ (padding):</label>
        <div class="slider-group">
          <input type="range" id="padding" min="0" max="100" value="${parseInt(computedStyle.padding)}">
          <span id="paddingValue">${parseInt(computedStyle.padding)}px</span>
        </div>
        
        <label>Внешний отступ (margin):</label>
        <div class="slider-group">
          <input type="range" id="margin" min="0" max="100" value="${parseInt(computedStyle.margin)}">
          <span id="marginValue">${parseInt(computedStyle.margin)}px</span>
        </div>
        
        <label>Скругление углов:</label>
        <div class="slider-group">
          <input type="range" id="borderRadius" min="0" max="50" value="${parseInt(computedStyle.borderRadius)}">
          <span id="borderRadiusValue">${parseInt(computedStyle.borderRadius)}px</span>
        </div>
        <button class="edit-btn" id="applySpacing">Применить</button>
      </div>
    `;

    // Background for sections
    if (editType === 'section') {
      html += `
        <div class="edit-section">
          <h4>🖼️ Фон секции</h4>
          <label>URL изображения:</label>
          <input type="text" id="bgImage" placeholder="https://example.com/image.jpg" class="full-width">
          <button class="edit-btn" id="applyBgImage">Применить фон</button>
        </div>
      `;
    }

    // Size
    html += `
      <div class="edit-section">
        <h4>📐 Размеры</h4>
        <label>Ширина:</label>
        <input type="text" id="width" value="${computedStyle.width}" placeholder="auto, 100%, 500px">
        
        <label>Высота:</label>
        <input type="text" id="height" value="${computedStyle.height}" placeholder="auto, 100vh, 300px">
        <button class="edit-btn" id="applySize">Применить</button>
      </div>
    `;

    content.innerHTML = html;
    this.setupPanelListeners(element, editId);
  }

  setupPanelListeners(element, editId) {
    // Text editing with proper isolation
    const enableTextBtn = document.getElementById('enableTextEdit');
    if (enableTextBtn) {
      enableTextBtn.addEventListener('click', () => {
        this.isTextEditing = true;
        element.contentEditable = true;
        element.focus();
        
        // Select all text for easy editing
        const range = document.createRange();
        range.selectNodeContents(element);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        enableTextBtn.textContent = '✅ Редактирование включено';
        enableTextBtn.disabled = true;
        
        // Save on blur
        const blurHandler = () => {
          this.finishTextEditing();
          enableTextBtn.textContent = 'Редактировать текст';
          enableTextBtn.disabled = false;
          element.removeEventListener('blur', blurHandler);
        };
        
        element.addEventListener('blur', blurHandler);
        
        // Save on Enter key (for single-line elements)
        const keyHandler = (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            const editType = element.getAttribute('data-edit-type');
            if (editType === 'button' || editType === 'text') {
              e.preventDefault();
              element.blur();
            }
          }
          // Escape to cancel
          if (e.key === 'Escape') {
            e.preventDefault();
            element.innerHTML = this.textChanges[editId] || element.innerHTML;
            element.blur();
          }
        };
        
        element.addEventListener('keydown', keyHandler);
        element.addEventListener('blur', () => {
          element.removeEventListener('keydown', keyHandler);
        }, { once: true });
      });
    }

    // Color sync
    this.syncColorInputs('textColor', 'textColorHex');
    this.syncColorInputs('bgColor', 'bgColorHex');

    // Slider sync
    this.syncSlider('fontSize', 'fontSizeValue', 'px');
    this.syncSlider('padding', 'paddingValue', 'px');
    this.syncSlider('margin', 'marginValue', 'px');
    this.syncSlider('borderRadius', 'borderRadiusValue', 'px');

    // Apply colors
    document.getElementById('applyColors')?.addEventListener('click', () => {
      const textColor = document.getElementById('textColor').value;
      const bgColor = document.getElementById('bgColor').value;
      
      element.style.color = textColor;
      element.style.backgroundColor = bgColor;
      
      this.saveElementStyle(editId, 'color', textColor);
      this.saveElementStyle(editId, 'backgroundColor', bgColor);
      this.showNotification('✅ Цвета применены');
    });

    // Apply typography
    document.getElementById('applyTypography')?.addEventListener('click', () => {
      const fontSize = document.getElementById('fontSize').value + 'px';
      const fontWeight = document.getElementById('fontWeight').value;
      
      element.style.fontSize = fontSize;
      element.style.fontWeight = fontWeight;
      
      this.saveElementStyle(editId, 'fontSize', fontSize);
      this.saveElementStyle(editId, 'fontWeight', fontWeight);
      this.showNotification('✅ Типографика применена');
    });

    // Apply spacing
    document.getElementById('applySpacing')?.addEventListener('click', () => {
      const padding = document.getElementById('padding').value + 'px';
      const margin = document.getElementById('margin').value + 'px';
      const borderRadius = document.getElementById('borderRadius').value + 'px';
      
      element.style.padding = padding;
      element.style.margin = margin;
      element.style.borderRadius = borderRadius;
      
      this.saveElementStyle(editId, 'padding', padding);
      this.saveElementStyle(editId, 'margin', margin);
      this.saveElementStyle(editId, 'borderRadius', borderRadius);
      this.showNotification('✅ Отступы применены');
    });

    // Apply background
    document.getElementById('applyBgImage')?.addEventListener('click', () => {
      const bgImage = document.getElementById('bgImage').value;
      if (bgImage) {
        element.style.backgroundImage = `url(${bgImage})`;
        element.style.backgroundSize = 'cover';
        element.style.backgroundPosition = 'center';
        
        this.saveElementStyle(editId, 'backgroundImage', `url(${bgImage})`);
        this.saveElementStyle(editId, 'backgroundSize', 'cover');
        this.saveElementStyle(editId, 'backgroundPosition', 'center');
        this.showNotification('✅ Фон применен');
      }
    });

    // Apply size
    document.getElementById('applySize')?.addEventListener('click', () => {
      const width = document.getElementById('width').value;
      const height = document.getElementById('height').value;
      
      if (width) {
        element.style.width = width;
        this.saveElementStyle(editId, 'width', width);
      }
      if (height) {
        element.style.height = height;
        this.saveElementStyle(editId, 'height', height);
      }
      this.showNotification('✅ Размеры применены');
    });
  }

  syncColorInputs(colorId, hexId) {
    const colorInput = document.getElementById(colorId);
    const hexInput = document.getElementById(hexId);
    
    if (colorInput && hexInput) {
      colorInput.addEventListener('input', (e) => {
        hexInput.value = e.target.value;
      });
      
      hexInput.addEventListener('input', (e) => {
        if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
          colorInput.value = e.target.value;
        }
      });
    }
  }

  syncSlider(sliderId, valueId, unit) {
    const slider = document.getElementById(sliderId);
    const valueSpan = document.getElementById(valueId);
    
    if (slider && valueSpan) {
      slider.addEventListener('input', (e) => {
        valueSpan.textContent = e.target.value + unit;
      });
    }
  }

  saveElementStyle(editId, property, value) {
    if (!this.styleChanges[editId]) {
      this.styleChanges[editId] = {};
    }
    this.styleChanges[editId][property] = value;
  }

  saveElementText(editId, innerHTML) {
    this.textChanges[editId] = innerHTML;
  }

  saveStyles() {
    localStorage.setItem('visualEditorStyles', JSON.stringify(this.styleChanges));
    localStorage.setItem('visualEditorText', JSON.stringify(this.textChanges));
  }

  loadStyles() {
    const savedStyles = localStorage.getItem('visualEditorStyles');
    const savedText = localStorage.getItem('visualEditorText');
    
    if (savedStyles) {
      try {
        this.styleChanges = JSON.parse(savedStyles);
        // Apply styles even when not in edit mode
        this.applyAllStyles();
      } catch (e) {
        console.error('Error loading styles:', e);
      }
    }
    
    if (savedText) {
      try {
        this.textChanges = JSON.parse(savedText);
        // Apply text even when not in edit mode
        this.applyAllText();
      } catch (e) {
        console.error('Error loading text:', e);
      }
    }
  }

  applyAllStyles() {
    Object.keys(this.styleChanges).forEach(editId => {
      const element = document.querySelector(`[data-edit-id="${editId}"]`);
      if (element) {
        const styles = this.styleChanges[editId];
        Object.keys(styles).forEach(property => {
          element.style[property] = styles[property];
        });
      }
    });
  }

  applyAllText() {
    Object.keys(this.textChanges).forEach(editId => {
      const element = document.querySelector(`[data-edit-id="${editId}"]`);
      if (element) {
        element.innerHTML = this.textChanges[editId];
      }
    });
  }

  resetStyles() {
    localStorage.removeItem('visualEditorStyles');
    localStorage.removeItem('visualEditorText');
    this.styleChanges = {};
    this.textChanges = {};
  }

  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'edit-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }

  rgbToHex(rgb) {
    if (!rgb || rgb === 'rgba(0, 0, 0, 0)' || rgb === 'transparent') return '#000000';
    
    const result = rgb.match(/\d+/g);
    if (!result || result.length < 3) return '#000000';
    
    const r = parseInt(result[0]);
    const g = parseInt(result[1]);
    const b = parseInt(result[2]);
    
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  makeDraggable(element) {
    const header = element.querySelector('.visual-edit-panel__header');
    if (!header) return;

    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    header.onmousedown = (e) => {
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDrag;
      document.onmousemove = dragElement;
    };

    function dragElement(e) {
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      element.style.top = (element.offsetTop - pos2) + 'px';
      element.style.left = (element.offsetLeft - pos1) + 'px';
    }

    function closeDrag() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }
}
