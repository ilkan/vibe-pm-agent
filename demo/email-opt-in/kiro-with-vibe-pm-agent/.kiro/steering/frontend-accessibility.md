---
inclusion: fileMatch
fileMatchPattern: "*.html"
---

# Frontend Accessibility Guidelines

## Form Accessibility Standards

### Semantic HTML Structure
- Use `<form>` element for all form containers
- Use `<label>` elements properly associated with inputs
- Use `<fieldset>` and `<legend>` for grouped form elements
- Use appropriate input types (email, text, submit)
- Include `<main>`, `<section>`, and `<article>` for page structure

```html
<form id="email-opt-in-form" novalidate>
  <fieldset>
    <legend>Subscribe to Email Updates</legend>
    
    <label for="email-input">
      Email Address
      <span class="required" aria-label="required">*</span>
    </label>
    <input 
      type="email" 
      id="email-input" 
      name="email"
      required
      aria-describedby="email-error email-help"
      autocomplete="email"
    >
    
    <div id="email-help" class="help-text">
      We'll never share your email with anyone else.
    </div>
    
    <div id="email-error" class="error-message" aria-live="polite" hidden>
      <!-- Error messages will be inserted here -->
    </div>
    
    <button type="submit" aria-describedby="submit-status">
      Subscribe
    </button>
    
    <div id="submit-status" class="status-message" aria-live="polite">
      <!-- Status messages will be inserted here -->
    </div>
  </fieldset>
</form>
```

### ARIA Attributes

#### Required ARIA Labels
- `aria-label` for buttons without visible text
- `aria-describedby` to associate help text and errors
- `aria-live` for dynamic content updates
- `aria-invalid` for form fields with errors
- `aria-expanded` for collapsible content

#### Form Validation ARIA
```html
<!-- Valid state -->
<input 
  type="email" 
  id="email" 
  aria-invalid="false"
  aria-describedby="email-help"
>

<!-- Invalid state -->
<input 
  type="email" 
  id="email" 
  aria-invalid="true"
  aria-describedby="email-error email-help"
>

<!-- Error message -->
<div id="email-error" class="error-message" role="alert" aria-live="assertive">
  Please enter a valid email address
</div>
```

## Keyboard Navigation

### Focus Management
- Ensure all interactive elements are keyboard accessible
- Provide visible focus indicators
- Implement logical tab order
- Handle focus trapping in modals
- Return focus appropriately after actions

### Keyboard Event Handling
```javascript
// Handle Enter key on form submission
form.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && event.target.type !== 'submit') {
    event.preventDefault()
    submitButton.click()
  }
})

// Handle Escape key to clear form
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    clearForm()
    emailInput.focus()
  }
})
```

## Screen Reader Support

### Meaningful Text Content
- Use descriptive button text instead of "Click here"
- Provide context for form fields
- Include instructions and help text
- Use headings to structure content
- Provide alternative text for images

### Dynamic Content Updates
```javascript
// Announce form submission status
function announceStatus(message, type = 'polite') {
  const statusElement = document.getElementById('submit-status')
  statusElement.textContent = message
  statusElement.setAttribute('aria-live', type)
  
  // For critical errors, use assertive
  if (type === 'error') {
    statusElement.setAttribute('aria-live', 'assertive')
    statusElement.setAttribute('role', 'alert')
  }
}

// Announce validation errors
function announceError(fieldId, message) {
  const errorElement = document.getElementById(`${fieldId}-error`)
  errorElement.textContent = message
  errorElement.hidden = false
  errorElement.setAttribute('role', 'alert')
  
  const field = document.getElementById(fieldId)
  field.setAttribute('aria-invalid', 'true')
}
```

## Mobile Accessibility

### Touch Target Requirements
- Minimum 44px × 44px touch targets
- Adequate spacing between interactive elements
- Avoid overlapping touch areas
- Provide visual feedback for touch interactions
- Support pinch-to-zoom functionality

### Mobile-Specific Considerations
```css
/* Ensure adequate touch targets */
button, input[type="submit"] {
  min-height: 44px;
  min-width: 44px;
  padding: 12px 16px;
}

/* Provide visual feedback */
button:active, input:active {
  transform: scale(0.98);
  background-color: var(--active-color);
}

/* Support zoom without horizontal scroll */
@media (max-width: 768px) {
  .form-container {
    max-width: 100%;
    padding: 16px;
  }
}
```

## Color and Contrast

### WCAG Color Requirements
- Minimum 4.5:1 contrast ratio for normal text
- Minimum 3:1 contrast ratio for large text
- Don't rely solely on color to convey information
- Provide alternative indicators for color-coded content
- Test with color blindness simulators

### Error State Styling
```css
/* Don't rely only on color for errors */
.error {
  color: #d32f2f;
  border-left: 4px solid #d32f2f;
}

.error::before {
  content: "⚠ ";
  font-weight: bold;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .error {
    border-width: 2px;
    border-style: solid;
  }
}
```

## Progressive Enhancement

### JavaScript Dependency
- Ensure basic functionality works without JavaScript
- Use `novalidate` attribute and provide server-side validation
- Enhance with JavaScript for better UX
- Provide fallbacks for dynamic features
- Test with JavaScript disabled

### Form Enhancement Pattern
```javascript
// Progressive enhancement approach
class EmailOptInForm {
  constructor(formElement) {
    this.form = formElement
    this.enhanceForm()
  }
  
  enhanceForm() {
    // Add client-side validation
    this.addValidation()
    
    // Add AJAX submission
    this.addAjaxSubmission()
    
    // Add accessibility enhancements
    this.addA11yFeatures()
  }
  
  addA11yFeatures() {
    // Add live regions for status updates
    // Enhance keyboard navigation
    // Add focus management
  }
}

// Initialize only if JavaScript is available
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('email-opt-in-form')
    if (form) {
      new EmailOptInForm(form)
    }
  })
}
```

## Testing Accessibility

### Automated Testing
- Use axe-core for automated accessibility testing
- Run Lighthouse accessibility audits
- Test with WAVE browser extension
- Validate HTML markup
- Check color contrast ratios

### Manual Testing
- Navigate using only keyboard
- Test with screen reader (NVDA, JAWS, VoiceOver)
- Test with high contrast mode
- Test with 200% zoom level
- Test with voice control software

### Testing Checklist
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible and clear
- [ ] Form labels are properly associated
- [ ] Error messages are announced to screen readers
- [ ] Color contrast meets WCAG standards
- [ ] Touch targets meet minimum size requirements
- [ ] Content is readable at 200% zoom
- [ ] Form works without JavaScript