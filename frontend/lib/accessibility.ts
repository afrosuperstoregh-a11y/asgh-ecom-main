// Accessibility utilities and helpers

// Keyboard navigation utilities
export class KeyboardNavigation {
  private static instance: KeyboardNavigation;
  private focusableElementsSelector = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(', ');

  static getInstance(): KeyboardNavigation {
    if (!KeyboardNavigation.instance) {
      KeyboardNavigation.instance = new KeyboardNavigation();
    }
    return KeyboardNavigation.instance;
  }

  // Get all focusable elements within a container
  getFocusableElements(container: Element): HTMLElement[] {
    return Array.from(container.querySelectorAll(this.focusableElementsSelector)) as HTMLElement[];
  }

  // Trap focus within a modal or dialog
  trapFocus(container: Element): () => void {
    const focusableElements = this.getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: Event) => {
    const keyboardEvent = e as KeyboardEvent;
    if (keyboardEvent.key !== 'Tab') return;

    if (keyboardEvent.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  };

  container.addEventListener('keydown', handleTabKey);
  firstElement?.focus();

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleTabKey);
  };
  }

  // Handle escape key to close modals
  handleEscape(callback: () => void): () => void {
    const handleEscape = (e: Event) => {
      const keyboardEvent = e as KeyboardEvent;
      if (keyboardEvent.key === 'Escape') {
        callback();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }
}

// ARIA utilities
export const aria = {
  // Generate unique IDs for ARIA relationships
  generateId: (prefix: string = 'aria'): string => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // Set up ARIA relationships between elements
  setupRelationships: (
    labelElement: Element,
    controlledElement: Element,
    type: 'labelledby' | 'describedby' = 'labelledby'
  ): void => {
    const id = aria.generateId(type);
    controlledElement.id = id;
    
    if (type === 'labelledby') {
      labelElement.setAttribute('aria-labelledby', id);
    } else {
      labelElement.setAttribute('aria-describedby', id);
    }
  },

  // Announce messages to screen readers
  announce: (message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }
};

// Focus management
export class FocusManager {
  private static instance: FocusManager;
  private previousFocusElement: Element | null = null;

  static getInstance(): FocusManager {
    if (!FocusManager.instance) {
      FocusManager.instance = new FocusManager();
    }
    return FocusManager.instance;
  }

  // Save current focus element
  saveFocus(): void {
    this.previousFocusElement = document.activeElement;
  }

  // Restore focus to previously focused element
  restoreFocus(): void {
    if (this.previousFocusElement && this.previousFocusElement instanceof HTMLElement) {
      this.previousFocusElement.focus();
    }
  }

  // Focus first element in container
  focusFirst(container: Element): void {
    const focusableElements = KeyboardNavigation.getInstance().getFocusableElements(container);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }

  // Focus element by selector
  focusBySelector(selector: string, container: Element = document.body): void {
    const element = container.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
    }
  }
}

// Screen reader utilities
export const screenReader = {
  // Hide content visually but keep it available to screen readers
  visuallyHidden: 'sr-only',

  // Check if screen reader is likely being used
  isScreenReaderActive(): boolean {
    // This is a heuristic - not foolproof but helpful for some cases
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
           navigator.userAgent.includes('NVDA') ||
           navigator.userAgent.includes('JAWS') ||
           navigator.userAgent.includes('VoiceOver');
  },

  // Create screen reader only text
  createHiddenText: (content: string): string => {
    return `<span class="sr-only">${content}</span>`;
  }
};

// Color contrast utilities
export const colorContrast = {
  // Calculate relative luminance
  getLuminance: (rgb: [number, number, number]): number => {
    const [r, g, b] = rgb.map(val => {
      val = val / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  },

  // Calculate contrast ratio between two colors
  getContrastRatio: (color1: string, color2: string): number => {
    const hexToRgb = (hex: string): [number, number, number] => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
          ]
        : [0, 0, 0];
    };

    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);

    const lum1 = colorContrast.getLuminance(rgb1);
    const lum2 = colorContrast.getLuminance(rgb2);

    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);

    return (brightest + 0.05) / (darkest + 0.05);
  },

  // Check if contrast meets WCAG standards
  meetsWCAG: (foreground: string, background: string, level: 'AA' | 'AAA' = 'AA', size: 'normal' | 'large' = 'normal'): boolean => {
    const ratio = colorContrast.getContrastRatio(foreground, background);
    
    if (level === 'AA') {
      return size === 'large' ? ratio >= 3 : ratio >= 4.5;
    } else {
      return size === 'large' ? ratio >= 4.5 : ratio >= 7;
    }
  }
};

// Motion and animation utilities
export const motion = {
  // Check if user prefers reduced motion
  prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  // Get safe animation duration
  getSafeDuration(defaultDuration: number): number {
    return this.prefersReducedMotion() ? 0 : defaultDuration;
  },

  // Apply safe animation class
  getAnimationClass(baseClass: string, animatedClass: string): string {
    return this.prefersReducedMotion() ? baseClass : `${baseClass} ${animatedClass}`;
  }
};

// Form accessibility utilities
export const formAccessibility = {
  // Generate error message ID
  generateErrorId: (fieldId: string): string => `${fieldId}-error`,

  // Generate description ID
  generateDescriptionId: (fieldId: string): string => `${fieldId}-description`,

  // Set up field accessibility attributes
  setupField: (
    field: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
    options: {
      label?: string;
      description?: string;
      error?: string;
      required?: boolean;
    } = {}
  ): void => {
    const { label, description, error, required } = options;

    // Set required attribute
    if (required) {
      field.setAttribute('required', '');
      field.setAttribute('aria-required', 'true');
    }

    // Set up error message
    if (error) {
      const errorId = formAccessibility.generateErrorId(field.id || 'field');
      field.setAttribute('aria-invalid', 'true');
      field.setAttribute('aria-describedby', errorId);
    }

    // Set up description
    if (description) {
      const descId = formAccessibility.generateDescriptionId(field.id || 'field');
      const existingDesc = field.getAttribute('aria-describedby');
      field.setAttribute('aria-describedby', existingDesc ? `${existingDesc} ${descId}` : descId);
    }
  },

  // Announce form errors to screen readers
  announceErrors: (errors: Record<string, string>): void => {
    const errorMessages = Object.values(errors);
    if (errorMessages.length > 0) {
      aria.announce(`Form has ${errorMessages.length} error${errorMessages.length > 1 ? 's' : ''}: ${errorMessages.join(', ')}`, 'assertive');
    }
  }
};

// Table accessibility utilities
export const tableAccessibility = {
  // Set up table for accessibility
  setupTable: (table: HTMLTableElement): void => {
    // Add caption if missing
    if (!table.caption) {
      const caption = document.createElement('caption');
      caption.className = 'sr-only';
      caption.textContent = 'Data table';
      table.insertBefore(caption, table.firstChild);
    }

    // Ensure headers have proper scope
    const headers = table.querySelectorAll('th');
    headers.forEach(header => {
      if (!header.getAttribute('scope')) {
        header.setAttribute('scope', 'col');
      }
    });

    // Add sorting indicators if needed
    const sortableHeaders = table.querySelectorAll('th[aria-sort]');
    sortableHeaders.forEach(header => {
      const sortButton = document.createElement('button');
      sortButton.setAttribute('aria-label', `Sort by ${header.textContent}`);
      sortButton.innerHTML = header.innerHTML;
      header.innerHTML = '';
      header.appendChild(sortButton);
    });
  },

  // Make table responsive
  makeResponsive: (table: HTMLTableElement): void => {
    const wrapper = document.createElement('div');
    wrapper.className = 'table-wrapper';
    wrapper.setAttribute('role', 'region');
    wrapper.setAttribute('aria-label', 'Scrollable table');
    wrapper.setAttribute('tabindex', '0');
    
    table.parentNode?.insertBefore(wrapper, table);
    wrapper.appendChild(table);
  }
};

// Link accessibility utilities
export const linkAccessibility = {
  // Ensure external links are properly identified
  setupExternalLinks: (container: Element = document.body): void => {
    const links = container.querySelectorAll('a[href^="http"]');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href && !href.includes(window.location.hostname)) {
        link.setAttribute('aria-label', `${link.textContent} (opens in new window)`);
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      }
    });
  },

  // Add skip links for keyboard navigation
  addSkipLinks: (): void => {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'skip-link';
    
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // Ensure main content has id
    const main = document.querySelector('main, [role="main"]') || document.getElementById('main-content');
    if (main && !main.id) {
      main.id = 'main-content';
    }
  }
};

// Utility to add comprehensive accessibility to existing components
export function enhanceAccessibility(container: Element = document.body): void {
  // Setup keyboard navigation
  const keyboardNav = KeyboardNavigation.getInstance();

  // Setup external links
  linkAccessibility.setupExternalLinks(container);

  // Setup tables
  const tables = container.querySelectorAll('table');
  tables.forEach(table => {
    if (table instanceof HTMLTableElement) {
      tableAccessibility.setupTable(table);
      tableAccessibility.makeResponsive(table);
    }
  });

  // Add focus indicators to interactive elements
  const interactiveElements = container.querySelectorAll('button, a, input, select, textarea');
  interactiveElements.forEach(element => {
    if (!element.getAttribute('tabindex')) {
      element.setAttribute('tabindex', '0');
    }
  });

  // Announce page changes to screen readers
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Check if significant content was added
        const hasSignificantContent = Array.from(mutation.addedNodes).some(node => 
          node.nodeType === Node.ELEMENT_NODE && (
            (node as Element).tagName === 'MAIN' ||
            (node as Element).tagName === 'ARTICLE' ||
            (node as Element).querySelector('h1, h2')
          )
        );
        
        if (hasSignificantContent) {
          aria.announce('Page content updated');
        }
      }
    });
  });

  observer.observe(container, {
    childList: true,
    subtree: true
  });
}

export default {
  KeyboardNavigation,
  aria,
  FocusManager,
  screenReader,
  colorContrast,
  motion,
  formAccessibility,
  tableAccessibility,
  linkAccessibility,
  enhanceAccessibility
};
