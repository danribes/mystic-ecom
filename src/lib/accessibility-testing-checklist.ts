/**
 * T147: Manual Accessibility Testing Checklist
 *
 * This file provides structured checklists and utilities for conducting
 * manual accessibility testing with screen readers and keyboard navigation.
 */

/**
 * Screen Reader Testing Checklist
 */
export interface ScreenReaderTest {
  id: string;
  category: 'navigation' | 'forms' | 'content' | 'interactive' | 'multimedia';
  description: string;
  wcagCriteria: string;
  instructions: string;
  expectedBehavior: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  tested: boolean;
  passed: boolean | null;
  notes: string;
  screenReader?: 'NVDA' | 'JAWS' | 'VoiceOver' | 'TalkBack' | 'Narrator';
}

/**
 * Keyboard Navigation Testing Checklist
 */
export interface KeyboardTest {
  id: string;
  category: 'navigation' | 'forms' | 'interactive' | 'focus' | 'shortcuts';
  description: string;
  wcagCriteria: string;
  keySequence: string;
  expectedBehavior: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  tested: boolean;
  passed: boolean | null;
  notes: string;
}

/**
 * Accessibility Test Report
 */
export interface AccessibilityTestReport {
  testDate: string;
  tester: string;
  screenReader: string;
  browser: string;
  operatingSystem: string;
  screenReaderTests: ScreenReaderTest[];
  keyboardTests: KeyboardTest[];
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    notTested: number;
    criticalIssues: number;
    highIssues: number;
  };
  recommendations: string[];
}

/**
 * Screen Reader Test Checklist
 */
export const SCREEN_READER_TESTS: Omit<ScreenReaderTest, 'tested' | 'passed' | 'notes'>[] = [
  // Navigation Tests
  {
    id: 'SR-NAV-001',
    category: 'navigation',
    description: 'Page title is announced on page load',
    wcagCriteria: '2.4.2 Page Titled (Level A)',
    instructions: 'Navigate to the page and listen for the page title announcement',
    expectedBehavior: 'Screen reader announces the page title immediately upon page load',
    priority: 'critical',
  },
  {
    id: 'SR-NAV-002',
    category: 'navigation',
    description: 'Landmarks are properly announced',
    wcagCriteria: '1.3.1 Info and Relationships (Level A)',
    instructions: 'Use landmark navigation (D key in NVDA/JAWS) to navigate between landmarks',
    expectedBehavior: 'All major page regions (header, nav, main, aside, footer) are announced as landmarks',
    priority: 'high',
  },
  {
    id: 'SR-NAV-003',
    category: 'navigation',
    description: 'Headings structure is logical and navigable',
    wcagCriteria: '2.4.6 Headings and Labels (Level AA)',
    instructions: 'Use heading navigation (H key in NVDA/JAWS) to navigate between headings',
    expectedBehavior: 'All headings are announced with correct level (h1, h2, etc.), no levels skipped',
    priority: 'high',
  },
  {
    id: 'SR-NAV-004',
    category: 'navigation',
    description: 'Skip link is available and functional',
    wcagCriteria: '2.4.1 Bypass Blocks (Level A)',
    instructions: 'Tab to first element on page, activate skip link if present',
    expectedBehavior: 'Skip link allows bypassing navigation to main content',
    priority: 'high',
  },
  {
    id: 'SR-NAV-005',
    category: 'navigation',
    description: 'Navigation menu is properly structured',
    wcagCriteria: '4.1.2 Name, Role, Value (Level A)',
    instructions: 'Navigate to main navigation menu',
    expectedBehavior: 'Menu is announced as "navigation", menu items are announced as links',
    priority: 'high',
  },

  // Form Tests
  {
    id: 'SR-FORM-001',
    category: 'forms',
    description: 'Form labels are associated with inputs',
    wcagCriteria: '3.3.2 Labels or Instructions (Level A)',
    instructions: 'Tab through form fields and listen for label announcements',
    expectedBehavior: 'Each form field has its label announced when focused',
    priority: 'critical',
  },
  {
    id: 'SR-FORM-002',
    category: 'forms',
    description: 'Required fields are indicated',
    wcagCriteria: '3.3.2 Labels or Instructions (Level A)',
    instructions: 'Tab to required fields',
    expectedBehavior: 'Required fields are announced as "required" or "invalid"',
    priority: 'critical',
  },
  {
    id: 'SR-FORM-003',
    category: 'forms',
    description: 'Error messages are announced',
    wcagCriteria: '3.3.1 Error Identification (Level A)',
    instructions: 'Submit form with validation errors',
    expectedBehavior: 'Error messages are announced immediately, associated with fields',
    priority: 'critical',
  },
  {
    id: 'SR-FORM-004',
    category: 'forms',
    description: 'Form instructions are available',
    wcagCriteria: '3.3.2 Labels or Instructions (Level A)',
    instructions: 'Navigate to complex form fields (dates, passwords, etc.)',
    expectedBehavior: 'Additional instructions or hints are announced with the field',
    priority: 'high',
  },
  {
    id: 'SR-FORM-005',
    category: 'forms',
    description: 'Radio buttons and checkboxes are properly grouped',
    wcagCriteria: '1.3.1 Info and Relationships (Level A)',
    instructions: 'Navigate to radio button or checkbox groups',
    expectedBehavior: 'Fieldset legend is announced, followed by individual options',
    priority: 'high',
  },

  // Content Tests
  {
    id: 'SR-CONT-001',
    category: 'content',
    description: 'Images have appropriate alt text',
    wcagCriteria: '1.1.1 Non-text Content (Level A)',
    instructions: 'Navigate to images using screen reader image navigation',
    expectedBehavior: 'Informative images have descriptive alt text, decorative images are silent',
    priority: 'critical',
  },
  {
    id: 'SR-CONT-002',
    category: 'content',
    description: 'Links have descriptive text',
    wcagCriteria: '2.4.4 Link Purpose (Level A)',
    instructions: 'Use link navigation (NVDA/JAWS) to list all links',
    expectedBehavior: 'Links are descriptive out of context (avoid "click here", "read more")',
    priority: 'high',
  },
  {
    id: 'SR-CONT-003',
    category: 'content',
    description: 'Lists are properly structured',
    wcagCriteria: '1.3.1 Info and Relationships (Level A)',
    instructions: 'Navigate to lists using list navigation (L key in NVDA/JAWS)',
    expectedBehavior: 'Lists are announced with number of items, list items are distinct',
    priority: 'medium',
  },
  {
    id: 'SR-CONT-004',
    category: 'content',
    description: 'Tables have proper headers',
    wcagCriteria: '1.3.1 Info and Relationships (Level A)',
    instructions: 'Navigate to data tables using table navigation (T key in NVDA/JAWS)',
    expectedBehavior: 'Table headers are announced for each cell, row/column counts provided',
    priority: 'high',
  },
  {
    id: 'SR-CONT-005',
    category: 'content',
    description: 'Language is properly set',
    wcagCriteria: '3.1.1 Language of Page (Level A)',
    instructions: 'Check screen reader language detection',
    expectedBehavior: 'Content is read in correct language, language changes announced',
    priority: 'high',
  },

  // Interactive Elements Tests
  {
    id: 'SR-INT-001',
    category: 'interactive',
    description: 'Buttons announce their purpose',
    wcagCriteria: '4.1.2 Name, Role, Value (Level A)',
    instructions: 'Navigate to buttons and listen for announcements',
    expectedBehavior: 'Buttons announced as "button" with clear purpose/label',
    priority: 'critical',
  },
  {
    id: 'SR-INT-002',
    category: 'interactive',
    description: 'Modal dialogs trap focus appropriately',
    wcagCriteria: '2.4.3 Focus Order (Level A)',
    instructions: 'Open modal dialog and try to navigate outside it',
    expectedBehavior: 'Focus stays within modal, ESC closes modal, focus returns to trigger',
    priority: 'critical',
  },
  {
    id: 'SR-INT-003',
    category: 'interactive',
    description: 'Dropdown menus are navigable',
    wcagCriteria: '4.1.2 Name, Role, Value (Level A)',
    instructions: 'Navigate to dropdown/select elements',
    expectedBehavior: 'Dropdown announced with current selection, options navigable with arrows',
    priority: 'high',
  },
  {
    id: 'SR-INT-004',
    category: 'interactive',
    description: 'Toggle switches announce state',
    wcagCriteria: '4.1.2 Name, Role, Value (Level A)',
    instructions: 'Navigate to toggle switches or checkboxes',
    expectedBehavior: 'Current state (checked/unchecked, on/off) is announced',
    priority: 'high',
  },
  {
    id: 'SR-INT-005',
    category: 'interactive',
    description: 'Loading states are announced',
    wcagCriteria: '4.1.3 Status Messages (Level AA)',
    instructions: 'Trigger actions that cause loading/waiting states',
    expectedBehavior: 'Loading indicator announced via aria-live region',
    priority: 'medium',
  },

  // Multimedia Tests
  {
    id: 'SR-MED-001',
    category: 'multimedia',
    description: 'Video players have accessible controls',
    wcagCriteria: '2.1.1 Keyboard (Level A)',
    instructions: 'Navigate to video player controls',
    expectedBehavior: 'Play, pause, volume controls are keyboard accessible and announced',
    priority: 'high',
  },
  {
    id: 'SR-MED-002',
    category: 'multimedia',
    description: 'Videos have captions available',
    wcagCriteria: '1.2.2 Captions (Level A)',
    instructions: 'Check for caption/subtitle options',
    expectedBehavior: 'Caption toggle is available and functional',
    priority: 'critical',
  },
];

/**
 * Keyboard Navigation Test Checklist
 */
export const KEYBOARD_TESTS: Omit<KeyboardTest, 'tested' | 'passed' | 'notes'>[] = [
  // Navigation Tests
  {
    id: 'KB-NAV-001',
    category: 'navigation',
    description: 'Tab key moves focus forward',
    wcagCriteria: '2.1.1 Keyboard (Level A)',
    keySequence: 'Tab',
    expectedBehavior: 'Focus moves to next interactive element in logical order',
    priority: 'critical',
  },
  {
    id: 'KB-NAV-002',
    category: 'navigation',
    description: 'Shift+Tab moves focus backward',
    wcagCriteria: '2.1.1 Keyboard (Level A)',
    keySequence: 'Shift + Tab',
    expectedBehavior: 'Focus moves to previous interactive element in reverse order',
    priority: 'critical',
  },
  {
    id: 'KB-NAV-003',
    category: 'navigation',
    description: 'Focus is visible at all times',
    wcagCriteria: '2.4.7 Focus Visible (Level AA)',
    keySequence: 'Tab through page',
    expectedBehavior: 'Clear visual focus indicator on all interactive elements',
    priority: 'critical',
  },
  {
    id: 'KB-NAV-004',
    category: 'navigation',
    description: 'Skip link is keyboard accessible',
    wcagCriteria: '2.4.1 Bypass Blocks (Level A)',
    keySequence: 'Tab (first element), Enter',
    expectedBehavior: 'Skip link appears on Tab, activates with Enter, moves focus to main',
    priority: 'high',
  },
  {
    id: 'KB-NAV-005',
    category: 'navigation',
    description: 'No keyboard traps',
    wcagCriteria: '2.1.2 No Keyboard Trap (Level A)',
    keySequence: 'Tab through entire page',
    expectedBehavior: 'Can Tab out of all components, no infinite loops',
    priority: 'critical',
  },

  // Form Tests
  {
    id: 'KB-FORM-001',
    category: 'forms',
    description: 'Form fields are reachable by Tab',
    wcagCriteria: '2.1.1 Keyboard (Level A)',
    keySequence: 'Tab',
    expectedBehavior: 'All form fields can be focused with Tab key',
    priority: 'critical',
  },
  {
    id: 'KB-FORM-002',
    category: 'forms',
    description: 'Form submission with Enter key',
    wcagCriteria: '2.1.1 Keyboard (Level A)',
    keySequence: 'Enter (in text field)',
    expectedBehavior: 'Form can be submitted by pressing Enter in text field',
    priority: 'high',
  },
  {
    id: 'KB-FORM-003',
    category: 'forms',
    description: 'Radio buttons navigable with arrows',
    wcagCriteria: '2.1.1 Keyboard (Level A)',
    keySequence: 'Tab to radio group, Arrow keys',
    expectedBehavior: 'Arrow keys move between radio options, Tab moves to next control',
    priority: 'high',
  },
  {
    id: 'KB-FORM-004',
    category: 'forms',
    description: 'Checkboxes toggle with Space',
    wcagCriteria: '2.1.1 Keyboard (Level A)',
    keySequence: 'Tab to checkbox, Space',
    expectedBehavior: 'Space bar toggles checkbox checked/unchecked state',
    priority: 'high',
  },
  {
    id: 'KB-FORM-005',
    category: 'forms',
    description: 'Select dropdowns open with Space/Enter',
    wcagCriteria: '2.1.1 Keyboard (Level A)',
    keySequence: 'Tab to select, Space/Enter, Arrow keys',
    expectedBehavior: 'Dropdown opens, arrow keys navigate options, Enter selects',
    priority: 'high',
  },

  // Interactive Elements Tests
  {
    id: 'KB-INT-001',
    category: 'interactive',
    description: 'Buttons activate with Enter and Space',
    wcagCriteria: '2.1.1 Keyboard (Level A)',
    keySequence: 'Tab to button, Enter or Space',
    expectedBehavior: 'Both Enter and Space activate buttons',
    priority: 'critical',
  },
  {
    id: 'KB-INT-002',
    category: 'interactive',
    description: 'Links activate with Enter',
    wcagCriteria: '2.1.1 Keyboard (Level A)',
    keySequence: 'Tab to link, Enter',
    expectedBehavior: 'Enter key activates link (navigates or triggers action)',
    priority: 'critical',
  },
  {
    id: 'KB-INT-003',
    category: 'interactive',
    description: 'Modal closes with Escape',
    wcagCriteria: '2.1.1 Keyboard (Level A)',
    keySequence: 'Open modal, ESC',
    expectedBehavior: 'ESC key closes modal, returns focus to trigger element',
    priority: 'critical',
  },
  {
    id: 'KB-INT-004',
    category: 'interactive',
    description: 'Dropdown menus keyboard navigable',
    wcagCriteria: '2.1.1 Keyboard (Level A)',
    keySequence: 'Tab to menu, Enter, Arrow keys, ESC',
    expectedBehavior: 'Enter opens menu, arrows navigate, Enter selects, ESC closes',
    priority: 'high',
  },
  {
    id: 'KB-INT-005',
    category: 'interactive',
    description: 'Custom widgets follow ARIA patterns',
    wcagCriteria: '2.1.1 Keyboard (Level A)',
    keySequence: 'Varies by widget type',
    expectedBehavior: 'Tabs, accordions, carousels follow WAI-ARIA authoring practices',
    priority: 'high',
  },

  // Focus Management Tests
  {
    id: 'KB-FOC-001',
    category: 'focus',
    description: 'Focus order is logical',
    wcagCriteria: '2.4.3 Focus Order (Level A)',
    keySequence: 'Tab through page',
    expectedBehavior: 'Focus follows visual/reading order (top to bottom, left to right)',
    priority: 'critical',
  },
  {
    id: 'KB-FOC-002',
    category: 'focus',
    description: 'Focus returns after actions',
    wcagCriteria: '2.4.3 Focus Order (Level A)',
    keySequence: 'Enter (activate), ESC (close)',
    expectedBehavior: 'After modal/dialog closes, focus returns to trigger element',
    priority: 'high',
  },
  {
    id: 'KB-FOC-003',
    category: 'focus',
    description: 'Focus not lost during page updates',
    wcagCriteria: '2.4.3 Focus Order (Level A)',
    keySequence: 'Tab during dynamic content updates',
    expectedBehavior: 'Focus persists during AJAX updates, content additions',
    priority: 'high',
  },
  {
    id: 'KB-FOC-004',
    category: 'focus',
    description: 'Invisible elements not in tab order',
    wcagCriteria: '2.4.3 Focus Order (Level A)',
    keySequence: 'Tab through page',
    expectedBehavior: 'Hidden/off-screen elements not reachable by Tab',
    priority: 'high',
  },

  // Keyboard Shortcuts Tests
  {
    id: 'KB-SHORT-001',
    category: 'shortcuts',
    description: 'Shortcuts don\'t conflict with browser/AT',
    wcagCriteria: '2.1.4 Character Key Shortcuts (Level A)',
    keySequence: 'Try common shortcuts',
    expectedBehavior: 'Custom shortcuts don\'t override browser/screen reader commands',
    priority: 'medium',
  },
  {
    id: 'KB-SHORT-002',
    category: 'shortcuts',
    description: 'Shortcuts can be disabled/remapped',
    wcagCriteria: '2.1.4 Character Key Shortcuts (Level A)',
    keySequence: 'Check settings/preferences',
    expectedBehavior: 'Option to disable or remap keyboard shortcuts',
    priority: 'low',
  },
];

/**
 * Generate empty test report template
 */
export function createEmptyTestReport(): AccessibilityTestReport {
  return {
    testDate: new Date().toISOString(),
    tester: '',
    screenReader: '',
    browser: '',
    operatingSystem: '',
    screenReaderTests: SCREEN_READER_TESTS.map((test) => ({
      ...test,
      tested: false,
      passed: null,
      notes: '',
    })),
    keyboardTests: KEYBOARD_TESTS.map((test) => ({
      ...test,
      tested: false,
      passed: null,
      notes: '',
    })),
    summary: {
      totalTests: SCREEN_READER_TESTS.length + KEYBOARD_TESTS.length,
      passed: 0,
      failed: 0,
      notTested: SCREEN_READER_TESTS.length + KEYBOARD_TESTS.length,
      criticalIssues: 0,
      highIssues: 0,
    },
    recommendations: [],
  };
}

/**
 * Calculate test report summary
 */
export function calculateSummary(report: AccessibilityTestReport): AccessibilityTestReport['summary'] {
  const allTests = [...report.screenReaderTests, ...report.keyboardTests];

  const passed = allTests.filter((t) => t.tested && t.passed === true).length;
  const failed = allTests.filter((t) => t.tested && t.passed === false).length;
  const notTested = allTests.filter((t) => !t.tested).length;

  const criticalIssues = allTests.filter(
    (t) => t.tested && t.passed === false && t.priority === 'critical'
  ).length;

  const highIssues = allTests.filter(
    (t) => t.tested && t.passed === false && t.priority === 'high'
  ).length;

  return {
    totalTests: allTests.length,
    passed,
    failed,
    notTested,
    criticalIssues,
    highIssues,
  };
}

/**
 * Generate recommendations based on test results
 */
export function generateRecommendations(report: AccessibilityTestReport): string[] {
  const recommendations: string[] = [];
  const allTests = [...report.screenReaderTests, ...report.keyboardTests];

  // Critical issues
  const criticalFailures = allTests.filter(
    (t) => t.tested && t.passed === false && t.priority === 'critical'
  );

  if (criticalFailures.length > 0) {
    recommendations.push(
      `Fix ${criticalFailures.length} critical accessibility issue(s) immediately. These prevent users from accessing core functionality.`
    );
  }

  // Screen reader issues
  const srFailures = report.screenReaderTests.filter((t) => t.tested && t.passed === false);
  if (srFailures.length > 0) {
    recommendations.push(
      `Address ${srFailures.length} screen reader compatibility issue(s) to improve experience for blind users.`
    );
  }

  // Keyboard navigation issues
  const kbFailures = report.keyboardTests.filter((t) => t.tested && t.passed === false);
  if (kbFailures.length > 0) {
    recommendations.push(
      `Fix ${kbFailures.length} keyboard navigation issue(s) to support users who cannot use a mouse.`
    );
  }

  // Untested areas
  const untested = allTests.filter((t) => !t.tested);
  if (untested.length > 0) {
    recommendations.push(
      `Complete testing for ${untested.length} remaining test case(s) to ensure comprehensive accessibility coverage.`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push('All accessibility tests passed! Continue monitoring for regressions.');
  }

  return recommendations;
}
