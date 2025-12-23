# Design Document

## Overview

Веб-приложение представляет собой одностраничный сайт с галереей из 12 карточек товаров. Приложение будет построено с использованием современных веб-технологий (HTML5, CSS3, JavaScript) с акцентом на производительность, адаптивность и визуальную привлекательность. Дизайн вдохновлен референсным сайтом и реализует чистый, минималистичный подход с акцентом на визуальный контент.

## Architecture

### Technology Stack

- **Frontend**: HTML5, CSS3 (с использованием CSS Grid и Flexbox), Vanilla JavaScript
- **Data Storage**: JSON файл для хранения данных карточек
- **Build Tools**: Опционально - Vite или аналогичный инструмент для оптимизации
- **Image Optimization**: WebP формат с JPEG/PNG fallback

### Application Structure

```
product-cards-site/
├── index.html              # Главная страница
├── css/
│   ├── main.css           # Основные стили
│   ├── cards.css          # Стили карточек
│   └── responsive.css     # Медиа-запросы
├── js/
│   ├── app.js             # Главный файл приложения
│   ├── cardRenderer.js    # Рендеринг карточек
│   └── modal.js           # Модальное окно для деталей
├── data/
│   └── products.json      # Данные товаров
└── images/
    └── products/          # Изображения товаров
```

## Components and Interfaces

### 1. Card Component

Карточка товара - основной визуальный элемент приложения.

**Structure:**
```html
<div class="card">
  <div class="card-image-wrapper">
    <img src="..." alt="..." loading="lazy">
  </div>
  <div class="card-content">
    <h3 class="card-title">Product Name</h3>
    <p class="card-description">Product description</p>
    <span class="card-price">$99.99</span>
  </div>
</div>
```

**Visual Properties:**
- Aspect ratio: 3:4 для изображения
- Border radius: 8-12px
- Box shadow: subtle elevation effect
- Hover effect: scale(1.02) + увеличение тени
- Transition: 0.3s ease для всех анимаций

### 2. Gallery Grid Component

Контейнер для размещения всех карточек.

**CSS Grid Configuration:**
- Desktop (>1200px): 4 колонки
- Tablet (768px-1199px): 3 колонки
- Mobile (480px-767px): 2 колонки
- Small Mobile (<480px): 1 колонка
- Gap: 24px между карточками
- Padding: 40px по краям контейнера

### 3. Modal Component

Модальное окно для отображения детальной информации о товаре.

**Features:**
- Overlay с полупрозрачным фоном
- Центрированное позиционирование
- Крупное изображение товара
- Полное описание и характеристики
- Кнопка закрытия (X)
- Закрытие по клику на overlay или ESC

### 4. Data Manager

Модуль для загрузки и управления данными товаров.

**Interface:**
```javascript
class DataManager {
  async loadProducts(): Promise<Product[]>
  validateProduct(product: Product): boolean
  getProductById(id: string): Product | null
}
```

**Product Data Model:**
```javascript
interface Product {
  id: string
  title: string
  description: string
  price: number
  currency: string
  image: string
  imageAlt: string
  detailedDescription?: string
  features?: string[]
}
```

## Data Models

### Product Schema

```json
{
  "id": "unique-product-id",
  "title": "Product Name",
  "description": "Short description for card",
  "price": 99.99,
  "currency": "USD",
  "image": "/images/products/product-1.jpg",
  "imageAlt": "Product image description",
  "detailedDescription": "Full product description for modal",
  "features": [
    "Feature 1",
    "Feature 2",
    "Feature 3"
  ]
}
```

### Products Collection

Массив из 12 объектов Product в файле `data/products.json`:

```json
{
  "products": [
    { /* Product 1 */ },
    { /* Product 2 */ },
    ...
    { /* Product 12 */ }
  ]
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After reviewing the prework analysis, I've identified the following redundancies:
- Property 1.5 and 4.2 both test lazy loading attributes - these can be combined
- Properties 3.1, 3.2, 3.3 test specific breakpoints - these are examples rather than universal properties
- Several properties about visual consistency (6.1, 6.2, 6.3) are not programmatically testable

The following properties provide unique validation value:

Property 1: Card count invariant
*For any* valid products data array, when the gallery is rendered, the DOM should contain exactly the same number of card elements as products in the data (up to 12 maximum)
**Validates: Requirements 1.1, 5.4**

Property 2: Responsive grid columns
*For any* viewport width, the grid should display the appropriate number of columns according to breakpoint rules (1 column for <480px, 2 for 480-767px, 3 for 768-1199px, 4 for ≥1200px)
**Validates: Requirements 1.2, 1.4, 3.4**

Property 3: Card content completeness
*For any* product in the data, its rendered card should contain all required elements: image, title, description, and price
**Validates: Requirements 1.3**

Property 4: Image optimization attributes
*For any* image element in a card, it should have the loading="lazy" attribute and a valid src path
**Validates: Requirements 1.5, 4.2**

Property 5: Modal display on interaction
*For any* card element, when clicked, a modal should open displaying the detailed information for that specific product
**Validates: Requirements 2.2**

Property 6: Keyboard accessibility
*For any* card element, it should be keyboard-focusable (tabindex) and respond to Enter/Space key presses
**Validates: Requirements 2.4**

Property 7: Touch target minimum size
*For any* interactive element on mobile viewport, its computed dimensions should be at least 44x44 pixels
**Validates: Requirements 3.5**

Property 8: Modern image format support
*For any* product image, the markup should include WebP format with JPEG/PNG fallback using picture element or appropriate attributes
**Validates: Requirements 4.4**

Property 9: Data-driven rendering
*For any* change to the products.json file, reloading the page should reflect the updated data without code changes
**Validates: Requirements 5.2**

Property 10: Data validation
*For any* product object, the validation function should return false if any required field (id, title, description, price, image) is missing
**Validates: Requirements 5.3**

Property 11: Color contrast compliance
*For any* text element on the page, the color contrast ratio between text and background should meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
**Validates: Requirements 6.5**

## Error Handling

### Data Loading Errors

**Scenario**: products.json fails to load or is malformed

**Handling**:
- Display user-friendly error message
- Log detailed error to console for debugging
- Provide fallback empty state with retry option

```javascript
try {
  const products = await loadProducts();
} catch (error) {
  console.error('Failed to load products:', error);
  displayErrorMessage('Unable to load products. Please try again.');
}
```

### Image Loading Errors

**Scenario**: Product image fails to load

**Handling**:
- Use onerror event handler
- Display placeholder image
- Maintain card layout integrity

```javascript
img.onerror = () => {
  img.src = '/images/placeholder.jpg';
  img.alt = 'Image not available';
};
```

### Invalid Product Data

**Scenario**: Product object missing required fields

**Handling**:
- Validate each product before rendering
- Skip invalid products with console warning
- Continue rendering valid products

```javascript
const validProducts = products.filter(product => {
  if (!validateProduct(product)) {
    console.warn('Invalid product data:', product);
    return false;
  }
  return true;
});
```

### Modal Interaction Errors

**Scenario**: Modal fails to open or close properly

**Handling**:
- Ensure event listeners are properly attached
- Provide multiple close methods (X button, overlay click, ESC key)
- Reset modal state on close

### Responsive Layout Issues

**Scenario**: Layout breaks at certain viewport sizes

**Handling**:
- Use CSS Grid with minmax() for flexible sizing
- Test at common breakpoints
- Implement mobile-first approach with progressive enhancement

## Testing Strategy

### Unit Testing

We will use **Vitest** as the testing framework for its speed and modern features.

**Unit Test Coverage**:

1. **Data Manager Tests**
   - Test loadProducts() successfully loads and parses JSON
   - Test validateProduct() correctly identifies valid/invalid products
   - Test getProductById() returns correct product or null

2. **Card Renderer Tests**
   - Test renderCard() creates correct DOM structure
   - Test card contains all required elements
   - Test card click triggers modal open

3. **Modal Tests**
   - Test modal opens with correct product data
   - Test modal closes on X button click
   - Test modal closes on overlay click
   - Test modal closes on ESC key press

4. **Responsive Behavior Tests**
   - Test grid columns at mobile breakpoint (example)
   - Test grid columns at tablet breakpoint (example)
   - Test grid columns at desktop breakpoint (example)

### Property-Based Testing

We will use **fast-check** for property-based testing in JavaScript.

**Configuration**: Each property test will run a minimum of 100 iterations.

**Property Test Coverage**:

1. **Property 1: Card count invariant**
   - Generate random arrays of 1-20 products
   - Render gallery
   - Assert DOM contains min(products.length, 12) cards
   - **Feature: product-cards-site, Property 1: Card count invariant**

2. **Property 3: Card content completeness**
   - Generate random valid product objects
   - Render each as a card
   - Assert card DOM contains image, title, description, price elements
   - **Feature: product-cards-site, Property 3: Card content completeness**

3. **Property 4: Image optimization attributes**
   - Generate random product objects with various image paths
   - Render cards
   - Assert all img elements have loading="lazy" and valid src
   - **Feature: product-cards-site, Property 4: Image optimization attributes**

4. **Property 5: Modal display on interaction**
   - Generate random product objects
   - Render cards and simulate click on each
   - Assert modal opens and displays correct product data
   - **Feature: product-cards-site, Property 5: Modal display on interaction**

5. **Property 6: Keyboard accessibility**
   - Generate random product objects
   - Render cards
   - Assert each card is focusable and responds to Enter/Space
   - **Feature: product-cards-site, Property 6: Keyboard accessibility**

6. **Property 10: Data validation**
   - Generate random product objects with missing fields
   - Run validation
   - Assert validation returns false for incomplete products
   - **Feature: product-cards-site, Property 10: Data validation**

7. **Property 11: Color contrast compliance**
   - Extract all text elements from rendered page
   - Calculate contrast ratios
   - Assert all ratios meet WCAG AA standards
   - **Feature: product-cards-site, Property 11: Color contrast compliance**

**Test Generators**:

```javascript
// Generator for valid products
const validProductArbitrary = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.string({ minLength: 1, maxLength: 500 }),
  price: fc.double({ min: 0.01, max: 10000 }),
  currency: fc.constantFrom('USD', 'EUR', 'GBP'),
  image: fc.string().map(s => `/images/products/${s}.jpg`),
  imageAlt: fc.string({ minLength: 1, maxLength: 200 })
});

// Generator for products with potentially missing fields
const partialProductArbitrary = fc.record({
  id: fc.option(fc.uuid()),
  title: fc.option(fc.string()),
  description: fc.option(fc.string()),
  price: fc.option(fc.double({ min: 0 })),
  image: fc.option(fc.string())
}, { requiredKeys: [] });
```

### Integration Testing

**Browser Testing**:
- Test in Chrome, Firefox, Safari
- Test on actual mobile devices (iOS, Android)
- Verify touch interactions work correctly

**Visual Regression Testing**:
- Capture screenshots at different breakpoints
- Compare against reference design
- Ensure visual consistency across updates

### Performance Testing

**Metrics to Monitor**:
- First Contentful Paint (FCP) < 1.5s
- Largest Contentful Paint (LCP) < 2.5s
- Time to Interactive (TTI) < 3.0s
- Image load times with lazy loading

**Tools**:
- Lighthouse for performance audits
- Chrome DevTools for network analysis
- WebPageTest for real-world testing

## Implementation Notes

### CSS Architecture

Use BEM (Block Element Modifier) naming convention:
- `.card` - block
- `.card__image` - element
- `.card--featured` - modifier

### JavaScript Patterns

- Use ES6+ modules for code organization
- Implement async/await for data loading
- Use event delegation for card clicks
- Debounce resize events for performance

### Accessibility Considerations

- Semantic HTML5 elements
- ARIA labels where needed
- Keyboard navigation support
- Screen reader friendly content
- Focus management in modal

### Browser Support

- Modern browsers (last 2 versions)
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Performance Optimizations

1. **Image Optimization**
   - Serve WebP with fallbacks
   - Use responsive images with srcset
   - Implement lazy loading
   - Compress images to <200KB

2. **CSS Optimization**
   - Minimize CSS file size
   - Use CSS containment for cards
   - Avoid expensive properties (box-shadow on scroll)

3. **JavaScript Optimization**
   - Minimize and bundle JS
   - Use passive event listeners
   - Debounce scroll/resize handlers
   - Cache DOM queries

### Deployment Considerations

- Host on CDN for fast delivery
- Enable gzip/brotli compression
- Set appropriate cache headers
- Use HTTP/2 for multiplexing
