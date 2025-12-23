/**
 * CardRenderer - Renders product cards
 */
export class CardRenderer {
  /**
   * Format price with currency
   * @param {number} price - Price value
   * @param {string} currency - Currency code
   * @returns {string} Formatted price string
   */
  formatPrice(price, currency = 'RUB') {
    const currencySymbols = {
      'RUB': '₽',
      'USD': '$',
      'EUR': '€',
      'GBP': '£'
    };
    
    const symbol = currencySymbols[currency] || currency;
    return `${price} ${symbol}`;
  }

  /**
   * Render a single product card
   * @param {Object} product - Product object
   * @returns {HTMLElement} Card DOM element
   */
  renderCard(product) {
    const card = document.createElement('div');
    card.className = 'card';
    card.setAttribute('data-product-id', product.id);
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `View details for ${product.title}`);

    // Image wrapper
    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'card__image-wrapper';

    // Badges
    const badges = document.createElement('div');
    badges.className = 'card__badges';
    
    // Category badge (yellow) - can be multiple categories separated by comma
    const categories = (product.category || 'Товар').split(',').map(c => c.trim());
    categories.forEach(cat => {
      const categoryBadge = document.createElement('span');
      categoryBadge.className = 'card__badge';
      categoryBadge.textContent = cat;
      badges.appendChild(categoryBadge);
    });
    
    // Experience badge (dark)
    if (product.experience) {
      const expBadge = document.createElement('span');
      expBadge.className = 'card__badge card__badge--dark';
      expBadge.textContent = product.experience;
      badges.appendChild(expBadge);
    }
    
    // Custom badges from array
    if (product.badges && Array.isArray(product.badges)) {
      product.badges.forEach(badge => {
        const customBadge = document.createElement('span');
        customBadge.className = 'card__badge';
        if (badge.dark) {
          customBadge.classList.add('card__badge--dark');
        }
        if (badge.color) {
          customBadge.style.backgroundColor = badge.color;
          customBadge.style.color = badge.textColor || '#1a1a1a';
        }
        customBadge.textContent = badge.text || badge;
        badges.appendChild(customBadge);
      });
    }
    
    imageWrapper.appendChild(badges);

    // Check if product has local video for card cover
    if (product.cardVideoLocal) {
      // Local video element
      const videoContainer = document.createElement('div');
      videoContainer.className = 'card__video-container';
      
      const video = document.createElement('video');
      video.src = product.cardVideoLocal;
      video.autoplay = true;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.className = 'card__video';
      
      videoContainer.appendChild(video);
      imageWrapper.appendChild(videoContainer);
    } else if (product.cardVideo) {
      // Video iframe (VK etc)
      const videoContainer = document.createElement('div');
      videoContainer.className = 'card__video-container';
      
      const iframe = document.createElement('iframe');
      iframe.src = product.cardVideo + '&autoplay=1&muted=1&loop=1';
      iframe.width = '100%';
      iframe.height = '350';
      iframe.frameBorder = '0';
      iframe.allow = 'autoplay; encrypted-media';
      iframe.setAttribute('muted', '');
      
      videoContainer.appendChild(iframe);
      imageWrapper.appendChild(videoContainer);
    } else {
      // Image
      const img = document.createElement('img');
      img.className = 'card__image';
      img.src = product.image;
      img.alt = product.imageAlt || product.title;
      img.loading = 'lazy';
      
      // Image error handling
      img.onerror = () => {
        img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="500"%3E%3Crect fill="%233a3a3a" width="400" height="500"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23999" font-size="16"%3EИзображение недоступно%3C/text%3E%3C/svg%3E';
        img.alt = 'Image not available';
      };

      imageWrapper.appendChild(img);
    }

    // Content
    const content = document.createElement('div');
    content.className = 'card__content';

    // Title
    const title = document.createElement('h3');
    title.className = 'card__title';
    title.textContent = product.title;

    // Description
    const description = document.createElement('p');
    description.className = 'card__description';
    description.textContent = product.description;

    // Actions
    const actions = document.createElement('div');
    actions.className = 'card__actions';

    // Primary button
    const primaryBtn = document.createElement('button');
    primaryBtn.className = 'card__button card__button--primary';
    primaryBtn.innerHTML = 'Подробнее о тренере <span class="button-icon">↗</span>';

    // Secondary button
    const secondaryBtn = document.createElement('button');
    secondaryBtn.className = 'card__button card__button--secondary';
    secondaryBtn.textContent = 'Записаться на консультацию';
    secondaryBtn.onclick = (e) => {
      e.stopPropagation();
      const whatsappMessage = encodeURIComponent('Салам алейкум! Хочу записаться на персональные тренировки');
      let contactPopup = document.getElementById('contactPopup');
      if (!contactPopup) {
        contactPopup = document.createElement('div');
        contactPopup.className = 'modal__contact-popup';
        contactPopup.id = 'contactPopup';
        contactPopup.innerHTML = `
          <div class="modal__contact-popup-content">
            <h3>Выберите способ связи</h3>
            <a href="tel:+79882931193" class="modal__contact-option modal__contact-option--call">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
              Позвонить: +7 988 293-11-93
            </a>
            <a href="https://wa.me/79882931193?text=${whatsappMessage}" target="_blank" class="modal__contact-option modal__contact-option--whatsapp">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Написать в WhatsApp
            </a>
            <button class="modal__contact-close" onclick="document.getElementById('contactPopup').classList.remove('modal__contact-popup--open')">Закрыть</button>
          </div>
        `;
        document.body.appendChild(contactPopup);
      }
      contactPopup.classList.add('modal__contact-popup--open');
    };

    actions.appendChild(primaryBtn);
    actions.appendChild(secondaryBtn);

    content.appendChild(title);
    content.appendChild(description);
    content.appendChild(actions);

    card.appendChild(imageWrapper);
    card.appendChild(content);

    return card;
  }

  /**
   * Render gallery of products
   * @param {Array} products - Array of product objects
   * @param {HTMLElement} container - Container element
   * @param {number} maxCards - Maximum number of cards to display
   */
  renderGallery(products, container, maxCards = 50) {
    console.log('renderGallery called with:', products.length, 'products');
    
    if (!container) {
      console.error('Container element not found');
      return;
    }

    // Clear existing content
    container.innerHTML = '';

    // Limit to maxCards
    const productsToRender = products.slice(0, maxCards);
    console.log('Rendering', productsToRender.length, 'cards');

    if (productsToRender.length === 0) {
      const emptyMessage = document.createElement('p');
      emptyMessage.className = 'error-message';
      emptyMessage.textContent = 'No products available';
      container.appendChild(emptyMessage);
      return;
    }

    // Render each card
    productsToRender.forEach((product, index) => {
      console.log(`Rendering card ${index + 1}:`, product.title);
      const card = this.renderCard(product);
      container.appendChild(card);
    });
    
    console.log('All cards rendered successfully');
  }

}
