/**
 * T147: Manual Accessibility Testing - Test Suite
 *
 * Tests for accessibility testing checklist and utilities
 */

import { describe, it, expect } from 'vitest';
import {
  SCREEN_READER_TESTS,
  KEYBOARD_TESTS,
  createEmptyTestReport,
  calculateSummary,
  generateRecommendations,
  type AccessibilityTestReport,
  type ScreenReaderTest,
  type KeyboardTest,
} from '../../src/lib/accessibility-testing-checklist';

describe('T147: Manual Accessibility Testing Checklist', () => {
  describe('Screen Reader Tests', () => {
    it('should have defined screen reader tests', () => {
      expect(SCREEN_READER_TESTS).toBeDefined();
      expect(Array.isArray(SCREEN_READER_TESTS)).toBe(true);
      expect(SCREEN_READER_TESTS.length).toBeGreaterThan(0);
    });

    it('should have tests for all categories', () => {
      const categories = ['navigation', 'forms', 'content', 'interactive', 'multimedia'];

      categories.forEach((category) => {
        const testsInCategory = SCREEN_READER_TESTS.filter((t) => t.category === category);
        expect(testsInCategory.length).toBeGreaterThan(0);
      });
    });

    it('should have valid structure for each test', () => {
      SCREEN_READER_TESTS.forEach((test) => {
        expect(test.id).toBeTruthy();
        expect(test.id).toMatch(/^SR-/); // IDs start with SR-
        expect(test.category).toBeTruthy();
        expect(test.description).toBeTruthy();
        expect(test.wcagCriteria).toBeTruthy();
        expect(test.instructions).toBeTruthy();
        expect(test.expectedBehavior).toBeTruthy();
        expect(['critical', 'high', 'medium', 'low']).toContain(test.priority);
      });
    });

    it('should have unique test IDs', () => {
      const ids = SCREEN_READER_TESTS.map((t) => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should reference valid WCAG criteria', () => {
      SCREEN_READER_TESTS.forEach((test) => {
        // WCAG criteria should be in format "X.X.X" or contain "Level A/AA/AAA"
        expect(test.wcagCriteria).toMatch(/\d\.\d\.\d|Level A|Level AA|Level AAA/);
      });
    });

    it('should have critical tests for essential functionality', () => {
      const criticalTests = SCREEN_READER_TESTS.filter((t) => t.priority === 'critical');
      expect(criticalTests.length).toBeGreaterThan(0);

      // Should have critical tests for forms and navigation at minimum
      const criticalFormTests = criticalTests.filter((t) => t.category === 'forms');
      const criticalNavTests = criticalTests.filter((t) => t.category === 'navigation');

      expect(criticalFormTests.length).toBeGreaterThan(0);
      expect(criticalNavTests.length).toBeGreaterThan(0);
    });
  });

  describe('Keyboard Tests', () => {
    it('should have defined keyboard tests', () => {
      expect(KEYBOARD_TESTS).toBeDefined();
      expect(Array.isArray(KEYBOARD_TESTS)).toBe(true);
      expect(KEYBOARD_TESTS.length).toBeGreaterThan(0);
    });

    it('should have tests for all categories', () => {
      const categories = ['navigation', 'forms', 'interactive', 'focus', 'shortcuts'];

      categories.forEach((category) => {
        const testsInCategory = KEYBOARD_TESTS.filter((t) => t.category === category);
        expect(testsInCategory.length).toBeGreaterThan(0);
      });
    });

    it('should have valid structure for each test', () => {
      KEYBOARD_TESTS.forEach((test) => {
        expect(test.id).toBeTruthy();
        expect(test.id).toMatch(/^KB-/); // IDs start with KB-
        expect(test.category).toBeTruthy();
        expect(test.description).toBeTruthy();
        expect(test.wcagCriteria).toBeTruthy();
        expect(test.keySequence).toBeTruthy();
        expect(test.expectedBehavior).toBeTruthy();
        expect(['critical', 'high', 'medium', 'low']).toContain(test.priority);
      });
    });

    it('should have unique test IDs', () => {
      const ids = KEYBOARD_TESTS.map((t) => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have Tab key navigation tests', () => {
      const tabTests = KEYBOARD_TESTS.filter((t) => t.keySequence.includes('Tab'));
      expect(tabTests.length).toBeGreaterThan(0);
    });

    it('should have Enter and Space key tests', () => {
      const enterTests = KEYBOARD_TESTS.filter((t) => t.keySequence.includes('Enter'));
      const spaceTests = KEYBOARD_TESTS.filter((t) => t.keySequence.includes('Space'));

      expect(enterTests.length).toBeGreaterThan(0);
      expect(spaceTests.length).toBeGreaterThan(0);
    });

    it('should have Escape key test for modals', () => {
      const escTests = KEYBOARD_TESTS.filter((t) => t.keySequence.includes('ESC'));
      expect(escTests.length).toBeGreaterThan(0);
    });
  });

  describe('Test Report Generation', () => {
    it('should create empty test report', () => {
      const report = createEmptyTestReport();

      expect(report).toBeDefined();
      expect(report.testDate).toBeTruthy();
      expect(report.screenReaderTests).toBeDefined();
      expect(report.keyboardTests).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.recommendations).toBeDefined();
    });

    it('should include all screen reader tests in report', () => {
      const report = createEmptyTestReport();
      expect(report.screenReaderTests.length).toBe(SCREEN_READER_TESTS.length);
    });

    it('should include all keyboard tests in report', () => {
      const report = createEmptyTestReport();
      expect(report.keyboardTests.length).toBe(KEYBOARD_TESTS.length);
    });

    it('should initialize tests as not tested', () => {
      const report = createEmptyTestReport();

      report.screenReaderTests.forEach((test) => {
        expect(test.tested).toBe(false);
        expect(test.passed).toBeNull();
        expect(test.notes).toBe('');
      });

      report.keyboardTests.forEach((test) => {
        expect(test.tested).toBe(false);
        expect(test.passed).toBeNull();
        expect(test.notes).toBe('');
      });
    });

    it('should have valid date format', () => {
      const report = createEmptyTestReport();
      const date = new Date(report.testDate);
      expect(date.getTime()).toBeGreaterThan(0);
      expect(date.toISOString()).toBeTruthy();
    });
  });

  describe('Summary Calculation', () => {
    it('should calculate summary for empty report', () => {
      const report = createEmptyTestReport();
      const summary = calculateSummary(report);

      expect(summary.totalTests).toBe(SCREEN_READER_TESTS.length + KEYBOARD_TESTS.length);
      expect(summary.passed).toBe(0);
      expect(summary.failed).toBe(0);
      expect(summary.notTested).toBe(summary.totalTests);
      expect(summary.criticalIssues).toBe(0);
      expect(summary.highIssues).toBe(0);
    });

    it('should calculate summary for partially tested report', () => {
      const report = createEmptyTestReport();

      // Mark some tests as passed
      report.screenReaderTests[0].tested = true;
      report.screenReaderTests[0].passed = true;

      // Mark some tests as failed
      report.screenReaderTests[1].tested = true;
      report.screenReaderTests[1].passed = false;
      report.screenReaderTests[1].priority = 'critical';

      const summary = calculateSummary(report);

      expect(summary.passed).toBe(1);
      expect(summary.failed).toBe(1);
      expect(summary.notTested).toBe(summary.totalTests - 2);
      expect(summary.criticalIssues).toBe(1);
    });

    it('should count critical and high priority issues separately', () => {
      const report = createEmptyTestReport();

      // Add critical issue
      report.screenReaderTests[0].tested = true;
      report.screenReaderTests[0].passed = false;
      report.screenReaderTests[0].priority = 'critical';

      // Add high priority issue
      report.keyboardTests[0].tested = true;
      report.keyboardTests[0].passed = false;
      report.keyboardTests[0].priority = 'high';

      // Add medium priority issue (should not be counted in critical/high)
      report.keyboardTests[1].tested = true;
      report.keyboardTests[1].passed = false;
      report.keyboardTests[1].priority = 'medium';

      const summary = calculateSummary(report);

      expect(summary.criticalIssues).toBe(1);
      expect(summary.highIssues).toBe(1);
      expect(summary.failed).toBe(3); // Total failures includes all priorities
    });
  });

  describe('Recommendations Generation', () => {
    it('should generate recommendations for critical issues', () => {
      const report = createEmptyTestReport();

      // Add critical failure
      report.screenReaderTests[0].tested = true;
      report.screenReaderTests[0].passed = false;
      report.screenReaderTests[0].priority = 'critical';

      const recommendations = generateRecommendations(report);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some((r) => r.includes('critical'))).toBe(true);
    });

    it('should recommend addressing screen reader issues', () => {
      const report = createEmptyTestReport();

      // Add screen reader failure
      report.screenReaderTests[0].tested = true;
      report.screenReaderTests[0].passed = false;

      const recommendations = generateRecommendations(report);

      expect(recommendations.some((r) => r.includes('screen reader'))).toBe(true);
    });

    it('should recommend addressing keyboard navigation issues', () => {
      const report = createEmptyTestReport();

      // Add keyboard failure
      report.keyboardTests[0].tested = true;
      report.keyboardTests[0].passed = false;

      const recommendations = generateRecommendations(report);

      expect(recommendations.some((r) => r.includes('keyboard'))).toBe(true);
    });

    it('should mention untested cases', () => {
      const report = createEmptyTestReport();

      // Leave all tests as untested
      const recommendations = generateRecommendations(report);

      expect(recommendations.some((r) => r.includes('remaining test'))).toBe(true);
    });

    it('should congratulate on all tests passing', () => {
      const report = createEmptyTestReport();

      // Mark all tests as passed
      report.screenReaderTests.forEach((test) => {
        test.tested = true;
        test.passed = true;
      });
      report.keyboardTests.forEach((test) => {
        test.tested = true;
        test.passed = true;
      });

      const recommendations = generateRecommendations(report);

      expect(recommendations.some((r) => r.includes('passed'))).toBe(true);
    });
  });

  describe('Test Coverage', () => {
    it('should cover all WCAG Level A criteria', () => {
      const allTests = [...SCREEN_READER_TESTS, ...KEYBOARD_TESTS];
      const levelATests = allTests.filter((t) => t.wcagCriteria.includes('Level A'));

      expect(levelATests.length).toBeGreaterThan(10);
    });

    it('should cover WCAG Level AA criteria', () => {
      const allTests = [...SCREEN_READER_TESTS, ...KEYBOARD_TESTS];
      const levelAATests = allTests.filter((t) => t.wcagCriteria.includes('Level AA'));

      expect(levelAATests.length).toBeGreaterThan(0);
    });

    it('should have minimum number of tests', () => {
      // Should have at least 20 screen reader tests
      expect(SCREEN_READER_TESTS.length).toBeGreaterThanOrEqual(20);

      // Should have at least 20 keyboard tests
      expect(KEYBOARD_TESTS.length).toBeGreaterThanOrEqual(20);
    });
  });

  describe('Test Data Validation', () => {
    it('should have non-empty descriptions', () => {
      const allTests = [...SCREEN_READER_TESTS, ...KEYBOARD_TESTS];

      allTests.forEach((test) => {
        expect(test.description.length).toBeGreaterThan(10);
      });
    });

    it('should have detailed instructions', () => {
      SCREEN_READER_TESTS.forEach((test) => {
        expect(test.instructions.length).toBeGreaterThan(10);
      });
    });

    it('should have clear expected behavior', () => {
      const allTests = [...SCREEN_READER_TESTS, ...KEYBOARD_TESTS];

      allTests.forEach((test) => {
        expect(test.expectedBehavior.length).toBeGreaterThan(10);
      });
    });

    it('should have valid keyboard sequences', () => {
      KEYBOARD_TESTS.forEach((test) => {
        expect(test.keySequence.length).toBeGreaterThan(0);
        // All keySequence values should be non-empty strings
        expect(typeof test.keySequence).toBe('string');
      });
    });
  });

  describe('Type Safety', () => {
    it('should enforce ScreenReaderTest interface', () => {
      const test: ScreenReaderTest = {
        id: 'SR-TEST-001',
        category: 'navigation',
        description: 'Test description',
        wcagCriteria: '1.1.1 Level A',
        instructions: 'Test instructions',
        expectedBehavior: 'Expected behavior',
        priority: 'high',
        tested: false,
        passed: null,
        notes: '',
      };

      expect(test).toBeDefined();
    });

    it('should enforce KeyboardTest interface', () => {
      const test: KeyboardTest = {
        id: 'KB-TEST-001',
        category: 'navigation',
        description: 'Test description',
        wcagCriteria: '2.1.1 Level A',
        keySequence: 'Tab',
        expectedBehavior: 'Expected behavior',
        priority: 'critical',
        tested: false,
        passed: null,
        notes: '',
      };

      expect(test).toBeDefined();
    });

    it('should enforce AccessibilityTestReport interface', () => {
      const report: AccessibilityTestReport = {
        testDate: new Date().toISOString(),
        tester: 'Test User',
        screenReader: 'NVDA',
        browser: 'Firefox',
        operatingSystem: 'Windows 10',
        screenReaderTests: [],
        keyboardTests: [],
        summary: {
          totalTests: 0,
          passed: 0,
          failed: 0,
          notTested: 0,
          criticalIssues: 0,
          highIssues: 0,
        },
        recommendations: [],
      };

      expect(report).toBeDefined();
    });
  });
});
