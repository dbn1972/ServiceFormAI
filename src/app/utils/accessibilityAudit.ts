/**
 * Accessibility Audit Utilities
 * WCAG 2.1 AA compliance checking and automated accessibility testing
 */

export interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info';
  category: 'perceivable' | 'operable' | 'understandable' | 'robust';
  wcagCriterion: string;
  element?: HTMLElement;
  message: string;
  recommendation: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
}

export interface AccessibilityAuditResult {
  passed: boolean;
  score: number; // 0-100
  issues: AccessibilityIssue[];
  summary: {
    total: number;
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
}

/**
 * Run comprehensive accessibility audit on a container
 */
export function auditAccessibility(container: HTMLElement): AccessibilityAuditResult {
  const issues: AccessibilityIssue[] = [];

  // 1. Check color contrast
  issues.push(...checkColorContrast(container));

  // 2. Check form labels
  issues.push(...checkFormLabels(container));

  // 3. Check ARIA attributes
  issues.push(...checkARIAAttributes(container));

  // 4. Check keyboard accessibility
  issues.push(...checkKeyboardAccessibility(container));

  // 5. Check image alt text
  issues.push(...checkImageAltText(container));

  // 6. Check heading hierarchy
  issues.push(...checkHeadingHierarchy(container));

  // 7. Check touch targets (mobile)
  issues.push(...checkTouchTargets(container));

  // 8. Check focus indicators
  issues.push(...checkFocusIndicators(container));

  // Calculate summary
  const summary = {
    total: issues.length,
    critical: issues.filter(i => i.impact === 'critical').length,
    serious: issues.filter(i => i.impact === 'serious').length,
    moderate: issues.filter(i => i.impact === 'moderate').length,
    minor: issues.filter(i => i.impact === 'minor').length,
  };

  // Calculate score (100 - deductions)
  const score = Math.max(0, 100 - (
    summary.critical * 20 +
    summary.serious * 10 +
    summary.moderate * 5 +
    summary.minor * 2
  ));

  return {
    passed: summary.critical === 0 && summary.serious === 0,
    score,
    issues,
    summary,
  };
}

/**
 * Check color contrast ratios
 * WCAG 2.1 AA requires 4.5:1 for normal text, 3:1 for large text
 */
function checkColorContrast(container: HTMLElement): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  const textElements = container.querySelectorAll('p, span, a, button, label, input, textarea, select, h1, h2, h3, h4, h5, h6');

  textElements.forEach((element) => {
    const htmlElement = element as HTMLElement;
    const styles = window.getComputedStyle(htmlElement);

    const color = styles.color;
    const backgroundColor = styles.backgroundColor;
    const fontSize = parseFloat(styles.fontSize);
    const fontWeight = parseInt(styles.fontWeight);

    // Large text: 18pt+ or 14pt+ bold (approximately 24px+ or 18.5px+ bold)
    const isLargeText = fontSize >= 24 || (fontSize >= 18.5 && fontWeight >= 700);
    const requiredRatio = isLargeText ? 3 : 4.5;

    const ratio = calculateContrastRatio(color, backgroundColor);

    if (ratio < requiredRatio) {
      issues.push({
        type: 'error',
        category: 'perceivable',
        wcagCriterion: '1.4.3 Contrast (Minimum)',
        element: htmlElement,
        message: `Insufficient color contrast ratio: ${ratio.toFixed(2)}:1 (required: ${requiredRatio}:1)`,
        recommendation: `Increase contrast between text and background to at least ${requiredRatio}:1`,
        impact: 'serious',
      });
    }
  });

  return issues;
}

/**
 * Calculate contrast ratio between two colors
 */
function calculateContrastRatio(color1: string, color2: string): number {
  const lum1 = getRelativeLuminance(color1);
  const lum2 = getRelativeLuminance(color2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Get relative luminance from color string
 */
function getRelativeLuminance(color: string): number {
  const rgb = parseRGBColor(color);
  if (!rgb) return 0;

  const channels = rgb.map(val => {
    const channel = val / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  const [r, g, b] = [channels[0] ?? 0, channels[1] ?? 0, channels[2] ?? 0];

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Parse RGB color from various formats
 */
function parseRGBColor(color: string): [number, number, number] | null {
  // rgb(r, g, b) or rgba(r, g, b, a)
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return [parseInt(rgbMatch[1] ?? '0'), parseInt(rgbMatch[2] ?? '0'), parseInt(rgbMatch[3] ?? '0')];
  }

  // #rrggbb or #rgb
  const hexMatch = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    const hex = hexMatch[1]!;
    if (hex.length === 3) {
      return [
        parseInt((hex[0] ?? '0') + (hex[0] ?? '0'), 16),
        parseInt((hex[1] ?? '0') + (hex[1] ?? '0'), 16),
        parseInt((hex[2] ?? '0') + (hex[2] ?? '0'), 16),
      ];
    } else {
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
      ];
    }
  }

  return null;
}

/**
 * Check form labels and associations
 */
function checkFormLabels(container: HTMLElement): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  const inputs = container.querySelectorAll('input, select, textarea');

  inputs.forEach((input) => {
    const htmlInput = input as HTMLInputElement;

    // Skip hidden inputs
    if (htmlInput.type === 'hidden') return;

    const id = htmlInput.id;
    const hasLabel = id && container.querySelector(`label[for="${id}"]`);
    const hasAriaLabel = htmlInput.hasAttribute('aria-label') || htmlInput.hasAttribute('aria-labelledby');

    if (!hasLabel && !hasAriaLabel) {
      issues.push({
        type: 'error',
        category: 'perceivable',
        wcagCriterion: '1.3.1 Info and Relationships',
        element: htmlInput,
        message: 'Form input missing label',
        recommendation: 'Add a <label> element with for attribute, aria-label, or aria-labelledby',
        impact: 'critical',
      });
    }

    // Check required field indicators
    if (htmlInput.hasAttribute('required') && !htmlInput.hasAttribute('aria-required')) {
      issues.push({
        type: 'warning',
        category: 'understandable',
        wcagCriterion: '3.3.2 Labels or Instructions',
        element: htmlInput,
        message: 'Required field missing aria-required attribute',
        recommendation: 'Add aria-required="true" to required fields',
        impact: 'moderate',
      });
    }
  });

  return issues;
}

/**
 * Check ARIA attributes validity
 */
function checkARIAAttributes(container: HTMLElement): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  const elementsWithAria = container.querySelectorAll('[aria-invalid], [aria-describedby], [aria-labelledby]');

  elementsWithAria.forEach((element) => {
    const htmlElement = element as HTMLElement;

    // Check aria-invalid with error messages
    if (htmlElement.getAttribute('aria-invalid') === 'true') {
      const describedby = htmlElement.getAttribute('aria-describedby');
      if (!describedby) {
        issues.push({
          type: 'error',
          category: 'perceivable',
          wcagCriterion: '3.3.1 Error Identification',
          element: htmlElement,
          message: 'Invalid field missing error message reference',
          recommendation: 'Add aria-describedby pointing to error message element',
          impact: 'serious',
        });
      } else {
        // Check if referenced element exists
        const errorElement = container.querySelector(`#${describedby}`);
        if (!errorElement) {
          issues.push({
            type: 'error',
            category: 'robust',
            wcagCriterion: '4.1.2 Name, Role, Value',
            element: htmlElement,
            message: `aria-describedby references non-existent element: ${describedby}`,
            recommendation: 'Ensure error message element exists with correct ID',
            impact: 'serious',
          });
        }
      }
    }
  });

  return issues;
}

/**
 * Check keyboard accessibility
 */
function checkKeyboardAccessibility(container: HTMLElement): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  // Check for elements with click handlers but no keyboard handlers
  const clickableElements = container.querySelectorAll('[onclick], [ng-click]');

  clickableElements.forEach((element) => {
    const htmlElement = element as HTMLElement;
    const tagName = htmlElement.tagName.toLowerCase();

    // Interactive elements (button, a) are keyboard accessible by default
    if (tagName === 'button' || tagName === 'a') return;

    const hasKeyboard = htmlElement.hasAttribute('onkeydown') || htmlElement.hasAttribute('onkeypress');
    const hasTabindex = htmlElement.hasAttribute('tabindex');
    const hasRole = htmlElement.hasAttribute('role');

    if (!hasKeyboard || !hasTabindex || !hasRole) {
      issues.push({
        type: 'error',
        category: 'operable',
        wcagCriterion: '2.1.1 Keyboard',
        element: htmlElement,
        message: 'Clickable element not keyboard accessible',
        recommendation: 'Add tabindex="0", role="button", and keyboard event handlers',
        impact: 'critical',
      });
    }
  });

  return issues;
}

/**
 * Check image alt text
 */
function checkImageAltText(container: HTMLElement): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  const images = container.querySelectorAll('img');

  images.forEach((img) => {
    const hasAlt = img.hasAttribute('alt');
    const altText = img.getAttribute('alt') || '';

    if (!hasAlt) {
      issues.push({
        type: 'error',
        category: 'perceivable',
        wcagCriterion: '1.1.1 Non-text Content',
        element: img,
        message: 'Image missing alt attribute',
        recommendation: 'Add alt text describing the image, or alt="" for decorative images',
        impact: 'serious',
      });
    } else if (altText.length > 150) {
      issues.push({
        type: 'warning',
        category: 'perceivable',
        wcagCriterion: '1.1.1 Non-text Content',
        element: img,
        message: `Alt text too long (${altText.length} characters)`,
        recommendation: 'Keep alt text concise (under 150 characters)',
        impact: 'minor',
      });
    }
  });

  return issues;
}

/**
 * Check heading hierarchy
 */
function checkHeadingHierarchy(container: HTMLElement): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'));

  let previousLevel = 0;

  headings.forEach((heading) => {
    const level = parseInt(heading.tagName[1] ?? '0');

    // Check for skipped levels
    if (level > previousLevel + 1) {
      issues.push({
        type: 'error',
        category: 'perceivable',
        wcagCriterion: '1.3.1 Info and Relationships',
        element: heading as HTMLElement,
        message: `Heading level skipped (h${previousLevel} to h${level})`,
        recommendation: 'Maintain proper heading hierarchy without skipping levels',
        impact: 'moderate',
      });
    }

    previousLevel = level;
  });

  return issues;
}

/**
 * Check touch target sizes (minimum 44x44px for WCAG 2.1 AA)
 */
function checkTouchTargets(container: HTMLElement): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  const interactiveElements = container.querySelectorAll('button, a, input[type="button"], input[type="submit"], input[type="checkbox"], input[type="radio"]');

  interactiveElements.forEach((element) => {
    const htmlElement = element as HTMLElement;
    const rect = htmlElement.getBoundingClientRect();

    const minSize = 44; // WCAG 2.1 AA minimum

    if (rect.width < minSize || rect.height < minSize) {
      issues.push({
        type: 'warning',
        category: 'operable',
        wcagCriterion: '2.5.5 Target Size',
        element: htmlElement,
        message: `Touch target too small (${rect.width.toFixed(0)}x${rect.height.toFixed(0)}px, minimum: ${minSize}x${minSize}px)`,
        recommendation: `Increase target size to at least ${minSize}x${minSize}px for better mobile accessibility`,
        impact: 'moderate',
      });
    }
  });

  return issues;
}

/**
 * Check focus indicators
 */
function checkFocusIndicators(container: HTMLElement): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];

  const interactiveElements = container.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');

  interactiveElements.forEach((element) => {
    const htmlElement = element as HTMLElement;
    const styles = window.getComputedStyle(htmlElement, ':focus');

    const outline = styles.getPropertyValue('outline');
    const outlineWidth = styles.getPropertyValue('outline-width');
    const boxShadow = styles.getPropertyValue('box-shadow');

    // Check if there's a visible focus indicator
    const hasOutline = outline !== 'none' && outlineWidth !== '0px';
    const hasBoxShadow = boxShadow !== 'none';

    if (!hasOutline && !hasBoxShadow) {
      issues.push({
        type: 'warning',
        category: 'operable',
        wcagCriterion: '2.4.7 Focus Visible',
        element: htmlElement,
        message: 'No visible focus indicator',
        recommendation: 'Add visible focus outline or box-shadow for keyboard navigation',
        impact: 'serious',
      });
    }
  });

  return issues;
}

/**
 * Log audit results to console
 */
export function logAuditResults(result: AccessibilityAuditResult) {
  console.group('♿ Accessibility Audit Results');
  console.log(`Score: ${result.score}/100`);
  console.log(`Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Total Issues: ${result.summary.total}`);
  console.log(`  Critical: ${result.summary.critical}`);
  console.log(`  Serious: ${result.summary.serious}`);
  console.log(`  Moderate: ${result.summary.moderate}`);
  console.log(`  Minor: ${result.summary.minor}`);

  if (result.issues.length > 0) {
    console.group('Issues:');
    result.issues.forEach((issue, index) => {
      const icon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️';
      console.group(`${icon} ${index + 1}. ${issue.message}`);
      console.log(`WCAG: ${issue.wcagCriterion}`);
      console.log(`Impact: ${issue.impact}`);
      console.log(`Recommendation: ${issue.recommendation}`);
      if (issue.element) {
        console.log('Element:', issue.element);
      }
      console.groupEnd();
    });
    console.groupEnd();
  }

  console.groupEnd();
}

/**
 * Run audit on current page (for development)
 */
export function auditCurrentPage() {
  const result = auditAccessibility(document.body);
  logAuditResults(result);
  return result;
}
