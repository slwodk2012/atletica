# Implementation Plan

- [x] 1. Set up project structure and create sample data


  - Create directory structure (css/, js/, data/, images/)
  - Create products.json with 12 sample products
  - Add placeholder images or image URLs
  - _Requirements: 5.1_



- [ ] 2. Implement data management module
- [ ] 2.1 Create DataManager class with product loading and validation
  - Write loadProducts() function to fetch and parse JSON
  - Implement validateProduct() to check required fields
  - Implement getProductById() for product lookup
  - Add error handling for data loading failures
  - _Requirements: 5.1, 5.2, 5.3_

- [ ]* 2.2 Write property test for data validation (Property 10)
  - **Property 10: Data validation**
  - **Validates: Requirements 5.3**
  - Generate products with missing fields and verify validation fails

- [ ] 3. Create HTML structure and base styles
- [ ] 3.1 Build index.html with semantic structure
  - Create HTML5 document structure
  - Add gallery container element
  - Add modal container element
  - Link CSS and JS files
  - _Requirements: 1.1, 6.2_

- [ ] 3.2 Implement main.css with CSS variables and base styles
  - Define CSS custom properties for colors, spacing, typography
  - Set up base typography and reset styles
  - Ensure color contrast meets WCAG AA standards


  - _Requirements: 6.1, 6.2, 6.5_

- [ ] 4. Implement card rendering functionality
- [ ] 4.1 Create CardRenderer module
  - Write renderCard() function to generate card DOM
  - Implement card HTML structure with BEM naming
  - Add image with lazy loading attribute
  - Include all required elements (image, title, description, price)
  - _Requirements: 1.3, 1.5, 4.2_

- [ ]* 4.2 Write property test for card content completeness (Property 3)
  - **Property 3: Card content completeness**
  - **Validates: Requirements 1.3**
  - Generate random products and verify all elements present in rendered cards



- [ ]* 4.3 Write property test for image optimization (Property 4)
  - **Property 4: Image optimization attributes**
  - **Validates: Requirements 1.5, 4.2**
  - Verify all images have loading="lazy" and valid src

- [ ] 4.4 Implement gallery rendering
  - Write renderGallery() to render all products
  - Limit display to maximum 12 cards
  - Filter out invalid products with validation
  - _Requirements: 1.1, 5.4_

- [ ]* 4.5 Write property test for card count invariant (Property 1)
  - **Property 1: Card count invariant**
  - **Validates: Requirements 1.1, 5.4**
  - Generate arrays of various sizes and verify correct number of cards rendered

- [ ] 5. Style the card component
- [ ] 5.1 Create cards.css with card styles
  - Implement card layout with image wrapper and content area
  - Add border radius, shadows, and visual effects
  - Create hover effects (scale, shadow increase)
  - Add smooth transitions (0.3s ease)
  - Ensure 3:4 aspect ratio for images
  - _Requirements: 2.1, 6.3, 6.4_

- [ ] 5.2 Implement responsive grid layout
  - Use CSS Grid for gallery container
  - Set up breakpoints: mobile (<480px), tablet (480-767px), desktop (768-1199px), large (≥1200px)
  - Configure columns: 1, 2, 3, 4 respectively
  - Add 24px gap and 40px padding
  - _Requirements: 1.2, 1.4, 3.1, 3.2, 3.3, 3.4_



- [ ]* 5.3 Write property test for responsive grid columns (Property 2)
  - **Property 2: Responsive grid columns**
  - **Validates: Requirements 1.2, 1.4, 3.4**
  - Test grid columns at different viewport widths

- [ ] 6. Implement modal functionality
- [ ] 6.1 Create Modal class for product details
  - Write openModal() to display product details
  - Write closeModal() to hide modal
  - Implement modal HTML structure with overlay
  - Add close button (X) functionality
  - Handle ESC key press to close
  - Handle overlay click to close
  - Manage focus and body scroll lock
  - _Requirements: 2.2_

- [ ]* 6.2 Write unit tests for modal functionality
  - Test modal opens with correct product data
  - Test modal closes on X button click
  - Test modal closes on overlay click
  - Test modal closes on ESC key
  - _Requirements: 2.2_

- [ ]* 6.3 Write property test for modal display (Property 5)
  - **Property 5: Modal display on interaction**
  - **Validates: Requirements 2.2**
  - Generate random products and verify modal opens with correct data

- [ ] 6.4 Style the modal component
  - Create modal overlay with semi-transparent background
  - Center modal content
  - Style product details display
  - Add responsive modal sizing
  - Ensure modal is accessible and readable
  - _Requirements: 2.2, 6.3_

- [ ] 7. Add keyboard accessibility
- [ ] 7.1 Implement keyboard navigation for cards
  - Add tabindex to cards for focusability
  - Add Enter/Space key handlers to open modal
  - Add visible focus styles
  - Ensure logical tab order
  - _Requirements: 2.4_

- [ ]* 7.2 Write property test for keyboard accessibility (Property 6)
  - **Property 6: Keyboard accessibility**
  - **Validates: Requirements 2.4**
  - Verify cards are focusable and respond to keyboard events

- [ ] 8. Implement touch-friendly interactions
- [ ] 8.1 Ensure minimum touch target sizes
  - Set minimum 44x44px for interactive elements on mobile
  - Add appropriate padding to cards and buttons
  - Test touch interactions on mobile viewports
  - _Requirements: 3.5_

- [ ]* 8.2 Write property test for touch target size (Property 7)
  - **Property 7: Touch target minimum size**
  - **Validates: Requirements 3.5**
  - Measure interactive elements and verify minimum dimensions

- [ ] 9. Optimize images and implement modern formats
- [ ] 9.1 Add WebP support with fallbacks
  - Update image rendering to use picture element
  - Provide WebP source with JPEG/PNG fallback
  - Add error handling for failed image loads



  - Add placeholder image for errors
  - _Requirements: 4.4_

- [ ]* 9.2 Write property test for image format support (Property 8)
  - **Property 8: Modern image format support**
  - **Validates: Requirements 4.4**
  - Verify picture elements with WebP and fallback sources

- [ ] 10. Wire everything together in main app
- [ ] 10.1 Create app.js to initialize application
  - Initialize DataManager
  - Load products on page load
  - Render gallery with loaded products
  - Set up event delegation for card clicks
  - Initialize modal functionality
  - Add error handling and user feedback
  - _Requirements: 1.1, 2.2, 5.2_

- [ ]* 10.2 Write property test for data-driven rendering (Property 9)
  - **Property 9: Data-driven rendering**
  - **Validates: Requirements 5.2**
  - Verify changes to products.json reflect in rendered output

- [ ] 11. Set up testing infrastructure
- [ ] 11.1 Initialize Vitest and fast-check
  - Install Vitest and fast-check dependencies
  - Create vitest.config.js
  - Set up test environment (jsdom)
  - Configure test scripts in package.json
  - _Requirements: All (testing infrastructure)_

- [ ] 11.2 Create test generators for property tests
  - Implement validProductArbitrary generator
  - Implement partialProductArbitrary generator
  - Create helper functions for DOM testing
  - _Requirements: All (testing infrastructure)_

- [ ] 12. Checkpoint - Ensure all tests pass
  - Run all unit tests and property tests
  - Verify all 11 correctness properties pass
  - Fix any failing tests
  - Ask user if questions arise

- [ ]* 13. Add color contrast validation (Property 11)
- [ ]* 13.1 Write property test for color contrast (Property 11)
  - **Property 11: Color contrast compliance**
  - **Validates: Requirements 6.5**
  - Calculate contrast ratios for all text elements
  - Verify WCAG AA compliance (4.5:1 for normal, 3:1 for large text)

- [ ] 14. Final polish and optimization
- [ ] 14.1 Optimize CSS and JavaScript
  - Minify CSS files
  - Bundle and minify JavaScript
  - Remove unused code
  - Add comments and documentation
  - _Requirements: 4.3_

- [ ] 14.2 Add final responsive adjustments
  - Test at all breakpoints
  - Fine-tune spacing and sizing
  - Verify touch interactions work smoothly
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 15. Final Checkpoint - Ensure all tests pass
  - Run complete test suite
  - Verify all functionality works as expected
  - Ensure all requirements are met
  - Ask user if questions arise
