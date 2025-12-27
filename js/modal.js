/**
 * Modal - Manages modal window for product details
 */
export class Modal {
  constructor(modalElement) {
    this.modal = modalElement;
    this.overlay = modalElement.querySelector('.modal__overlay');
    this.content = modalElement.querySelector('.modal__content');
    this.closeButton = modalElement.querySelector('.modal__close');
    this.body = modalElement.querySelector('.modal__body');
    this.currentProduct = null;
    this.slideshowInterval = null;

    this.init();
  }

  /**
   * Initialize modal event listeners
   */
  init() {
    // Close button click
    this.closeButton.addEventListener('click', () => this.close());

    // Overlay click
    this.overlay.addEventListener('click', () => this.close());

    // ESC key press
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });

    // Prevent content click from closing modal
    this.content.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

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
   * Open modal with product details
   * @param {Object} product - Product object
   */
  open(product) {
    if (!product) {
      console.error('No product provided to modal');
      return;
    }

    // Save scroll position before opening modal
    this.savedScrollPosition = window.pageYOffset || document.documentElement.scrollTop;

    this.currentProduct = product;
    this.renderContent(product);
    this.modal.classList.add('modal--open');
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${this.savedScrollPosition}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    
    // Focus close button for accessibility
    this.closeButton.focus();
  }

  /**
   * Close modal
   */
  close() {
    // Stop slideshow
    if (this.slideshowInterval) {
      clearInterval(this.slideshowInterval);
      this.slideshowInterval = null;
    }
    
    // Stop video when closing modal
    const modalVideo = document.getElementById('modalLocalVideo');
    if (modalVideo) {
      modalVideo.pause();
      modalVideo.currentTime = 0;
    }
    
    this.modal.classList.remove('modal--open');
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    
    // Restore scroll position
    if (this.savedScrollPosition !== undefined) {
      window.scrollTo({
        top: this.savedScrollPosition,
        left: 0,
        behavior: 'instant'
      });
    }
    
    this.currentProduct = null;
  }

  /**
   * Check if modal is open
   * @returns {boolean}
   */
  isOpen() {
    return this.modal.classList.contains('modal--open');
  }

  /**
   * Render modal content
   * @param {Object} product - Product object
   */
  renderContent(product) {
    this.body.innerHTML = '';

    // Back button at the top
    const backBtn = document.createElement('button');
    backBtn.className = 'modal__back-btn';
    backBtn.innerHTML = '← Назад';
    backBtn.onclick = () => this.close();
    this.body.appendChild(backBtn);

    // Image Gallery with slideshow
    const gallery = document.createElement('div');
    gallery.className = 'modal__gallery';
    
    // Main display area (for images and video)
    const mainDisplay = document.createElement('div');
    mainDisplay.className = 'modal__main-display';
    
    const mainImage = document.createElement('img');
    mainImage.className = 'modal__image modal__image--main';
    mainImage.id = 'modalMainImage';
    
    // Get global video settings
    const settings = JSON.parse(localStorage.getItem('siteSettings') || '{}');
    const globalVideoEnabled = settings.globalVideoEnabled !== false;
    const globalVideoUrl = settings.globalVideo || 'azizov hulk.MOV';
    
    // Check if trainer has personal video
    const hasPersonalVideo = product.videos && product.videos.length > 0 && product.videos[0];
    const videoToUse = hasPersonalVideo ? product.videos[0] : globalVideoUrl;
    const showVideo = globalVideoEnabled || hasPersonalVideo;
    
    // Video container - local video for all trainers
    const videoContainer = document.createElement('div');
    videoContainer.className = 'modal__video-container';
    videoContainer.id = 'modalVideoContainer';
    videoContainer.style.display = 'none';
    
    if (showVideo) {
      videoContainer.innerHTML = `
        <video 
          id="modalLocalVideo"
          width="100%" 
          controls
          playsinline
          preload="metadata"
          style="max-height: 500px; background: #000;">
          <source src="${videoToUse}" type="video/mp4">
          <source src="${videoToUse}" type="video/quicktime">
          Ваш браузер не поддерживает видео
        </video>
      `;
    }
    
    mainDisplay.appendChild(mainImage);
    mainDisplay.appendChild(videoContainer);
    gallery.appendChild(mainDisplay);

    // Get images array
    let images = [];
    if (product.images && product.images.length > 0) {
      images = [...product.images];
    } else if (product.image) {
      images = [product.image];
    }

    // Total slides = images + 1 video (if enabled)
    const totalSlides = showVideo ? images.length + 1 : images.length;
    const videoIndex = images.length; // Video is the last slide

    // Current slide index
    let currentSlide = 0;

    // Function to show slide (including video)
    const showSlide = (index) => {
      if (index < 0) index = totalSlides - 1;
      if (index >= totalSlides) index = 0;
      currentSlide = index;
      
      const modalVideo = document.getElementById('modalLocalVideo');
      
      if (showVideo && currentSlide === videoIndex) {
        // Show video
        mainImage.style.display = 'none';
        videoContainer.style.display = 'block';
        if (modalVideo) {
          modalVideo.play().catch(e => console.log('Video autoplay blocked:', e));
        }
      } else {
        // Show image
        mainImage.style.display = 'block';
        videoContainer.style.display = 'none';
        if (modalVideo) {
          modalVideo.pause();
          modalVideo.currentTime = 0;
        }
        mainImage.src = images[currentSlide];
      }
      
      // Update thumbnails
      document.querySelectorAll('.modal__thumbnail').forEach((t, i) => {
        t.classList.toggle('modal__thumbnail--active', i === currentSlide);
      });
    };

    // Set first image
    if (images.length > 0) {
      mainImage.src = images[0];
      mainImage.alt = product.imageAlt || product.title;
      mainImage.onerror = () => {
        mainImage.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="400"%3E%3Crect fill="%233a3a3a" width="600" height="400"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23999" font-size="16"%3EИзображение недоступно%3C/text%3E%3C/svg%3E';
      };
    }

    // Navigation arrows (always show if more than 1 slide including video)
    if (totalSlides > 1) {
      const prevBtn = document.createElement('button');
      prevBtn.className = 'modal__nav-btn modal__nav-btn--prev';
      prevBtn.innerHTML = '‹';
      prevBtn.onclick = (e) => {
        e.stopPropagation();
        showSlide(currentSlide - 1);
      };
      
      const nextBtn = document.createElement('button');
      nextBtn.className = 'modal__nav-btn modal__nav-btn--next';
      nextBtn.innerHTML = '›';
      nextBtn.onclick = (e) => {
        e.stopPropagation();
        showSlide(currentSlide + 1);
      };
      
      mainDisplay.appendChild(prevBtn);
      mainDisplay.appendChild(nextBtn);
      
      // Touch/swipe support
      let touchStartX = 0;
      let touchEndX = 0;
      
      mainDisplay.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });
      
      mainDisplay.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
          if (diff > 0) {
            showSlide(currentSlide + 1);
          } else {
            showSlide(currentSlide - 1);
          }
        }
      }, { passive: true });
    }

    // Thumbnails (images + video at the end)
    const thumbnails = document.createElement('div');
    thumbnails.className = 'modal__thumbnails';
    
    // Image thumbnails
    images.forEach((imgSrc, index) => {
      const thumb = document.createElement('img');
      thumb.className = 'modal__thumbnail';
      if (index === 0) thumb.classList.add('modal__thumbnail--active');
      thumb.src = imgSrc;
      thumb.alt = `${product.title} фото ${index + 1}`;
      thumb.onerror = () => {
        thumb.style.display = 'none';
      };
      thumb.onclick = () => {
        showSlide(index);
      };
      thumbnails.appendChild(thumb);
    });
    
    // Video thumbnail at the end (only if video is enabled)
    if (showVideo) {
      const videoThumb = document.createElement('div');
      videoThumb.className = 'modal__thumbnail modal__thumbnail--video';
      videoThumb.innerHTML = `
        <svg viewBox="0 0 24 24" width="30" height="30" fill="#f4d03f">
          <path d="M8 5v14l11-7z"/>
        </svg>
      `;
      videoThumb.onclick = () => {
        showSlide(videoIndex);
      };
      thumbnails.appendChild(videoThumb);
    }
    
    gallery.appendChild(thumbnails);
    this.body.appendChild(gallery);

    // Title with role
    const title = document.createElement('h2');
    title.className = 'modal__title';
    title.textContent = product.title;

    // Role/Position subtitle
    const roleText = document.createElement('p');
    roleText.className = 'modal__role';
    roleText.textContent = product.description || '';

    // Detailed Description
    const description = document.createElement('p');
    description.className = 'modal__description';
    description.textContent = product.detailedDescription || '';

    this.body.appendChild(title);
    this.body.appendChild(roleText);
    if (product.detailedDescription) {
      this.body.appendChild(description);
    }

    // Specialization
    if (product.specialization && product.specialization.length > 0) {
      const specTitle = document.createElement('h3');
      specTitle.textContent = 'СПЕЦИАЛИЗАЦИЯ:';
      specTitle.className = 'modal__section-title';
      
      const specList = document.createElement('ul');
      specList.className = 'modal__list';
      
      product.specialization.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `— ${item}`;
        specList.appendChild(li);
      });

      this.body.appendChild(specTitle);
      this.body.appendChild(specList);
    }

    // Education
    if (product.education) {
      const eduTitle = document.createElement('h3');
      eduTitle.textContent = 'ОБРАЗОВАНИЕ:';
      eduTitle.className = 'modal__section-title';
      
      const eduText = document.createElement('p');
      eduText.className = 'modal__education';
      eduText.textContent = product.education;

      this.body.appendChild(eduTitle);
      this.body.appendChild(eduText);
    }

    // Features (if available and no specialization)
    if (!product.specialization && product.features && product.features.length > 0) {
      const featuresTitle = document.createElement('h3');
      featuresTitle.textContent = 'Специализация:';
      featuresTitle.className = 'modal__section-title';
      
      const featuresList = document.createElement('ul');
      featuresList.className = 'modal__features';
      
      product.features.forEach(feature => {
        const li = document.createElement('li');
        li.textContent = feature;
        featuresList.appendChild(li);
      });

      this.body.appendChild(featuresTitle);
      this.body.appendChild(featuresList);
    }

    // FAQ Section based on category
    const faqSection = this.renderFAQ(product.category);
    if (faqSection) {
      this.body.appendChild(faqSection);
    }

    // Action buttons container
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'modal__actions';

    // WhatsApp button with pre-filled message
    const whatsappBtn = document.createElement('a');
    whatsappBtn.className = 'modal__button modal__button--whatsapp';
    const whatsappMessage = encodeURIComponent('Салам алейкум! Хочу записаться на персональные тренировки');
    whatsappBtn.href = `https://wa.me/79882931193?text=${whatsappMessage}`;
    whatsappBtn.target = '_blank';
    whatsappBtn.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> Написать в WhatsApp';
    
    actionsContainer.appendChild(whatsappBtn);

    // "Записаться" button - shows options
    const actionBtn = document.createElement('button');
    actionBtn.className = 'modal__button';
    actionBtn.textContent = 'Записаться на тренировку →';
    actionBtn.onclick = () => {
      this.showContactOptions();
    };
    
    actionsContainer.appendChild(actionBtn);
    this.body.appendChild(actionsContainer);

    // Contact options popup (hidden by default) - add to document body for proper positioning
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
  }

  /**
   * Show contact options popup
   */
  showContactOptions() {
    const popup = document.getElementById('contactPopup');
    if (popup) {
      popup.classList.add('modal__contact-popup--open');
    }
  }

  /**
   * Render FAQ section based on trainer category
   * @param {string} category - Trainer category
   * @returns {HTMLElement|null}
   */
  renderFAQ(category) {
    const faqData = {
      'Фитнес': [
        {
          q: 'Сколько тренировок входит в месяц?',
          a: 'В месяц входит 12 тренировок. Если вы без причины пропускаете тренировку — она сгорает. Если вы заболели — сообщаете тренеру и ваши тренировки заморозятся.'
        },
        {
          q: 'Входит ли в стоимость тренировок сам абонемент?',
          a: 'Нет. Абонемент вы приобретаете отдельно. Услуги тренера оплачиваются отдельно. Сделать это можно в отделе продаж фитнес-клуба. Тел. 93-11-93'
        }
      ],
      'Кроссфит': [
        {
          q: 'Что такое кроссфит?',
          a: 'Кроссфит — это система функциональных высокоинтенсивных тренировок, в основу которой включены элементы таких дисциплин, как тяжелая атлетика, гимнастика, аэробика, гиревой спорт, упражнения стронгменов и других видов спорта. Эти упражнения развивают физические качества, необходимые каждый день: выносливость, гибкость, координацию, ловкость и мышечную силу.'
        },
        {
          q: 'Что мне даст кроссфит?',
          a: 'В результате тренировок вы сможете: освоить правильную технику выполняемых упражнений, ускорить набор мышечной массы и снизить объем жировых отложений, прокачать показатели выносливости и силы, наработать функциональную базу физических навыков, получить поддержку на каждом витке спортивного развития, принимать участие в соревновательной жизни клуба.'
        },
        {
          q: 'Сколько тренировок входит в месяц?',
          a: 'В месяц входит 12 тренировок. Если вы без причины пропускаете тренировку — она сгорает. Если вы заболели — сообщаете тренеру и ваши тренировки заморозятся.'
        },
        {
          q: 'Входит ли в стоимость тренировок сам абонемент?',
          a: 'Нет. Абонемент вы приобретаете отдельно. Услуги тренера оплачиваются отдельно. Сделать это можно в отделе продаж фитнес-клуба. Тел. 93-11-93'
        }
      ]
    };

    const faqs = faqData[category];
    if (!faqs || faqs.length === 0) return null;

    const container = document.createElement('div');
    container.className = 'modal__faq';

    const title = document.createElement('h3');
    title.className = 'modal__section-title';
    title.textContent = 'ВОПРОС / ОТВЕТ';
    container.appendChild(title);

    faqs.forEach(faq => {
      const item = document.createElement('div');
      item.className = 'modal__faq-item';

      const question = document.createElement('div');
      question.className = 'modal__faq-question';
      question.textContent = faq.q;
      question.onclick = () => {
        item.classList.toggle('modal__faq-item--open');
      };

      const answer = document.createElement('div');
      answer.className = 'modal__faq-answer';
      answer.textContent = faq.a;

      item.appendChild(question);
      item.appendChild(answer);
      container.appendChild(item);
    });

    return container;
  }
}
