/**
 * T146: WCAG 2.1 AA Accessibility Auditor
 *
 * Automated accessibility compliance checker for WCAG 2.1 Level AA
 *
 * WCAG 2.1 Principles (POUR):
 * - Perceivable: Information must be presentable to users
 * - Operable: UI components must be operable
 * - Understandable: Information and operation must be understandable
 * - Robust: Content must be robust enough for assistive technologies
 *
 * @module wcagAuditor
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { parse } from 'node-html-parser';
import type { HTMLElement } from 'node-html-parser';

/**
 * WCAG 2.1 Principles
 */
export type WCAGPrinciple = 'perceivable' | 'operable' | 'understandable' | 'robust';

/**
 * WCAG 2.1 Conformance Levels
 */
export type WCAGLevel = 'A' | 'AA' | 'AAA';

/**
 * Issue severity levels
 */
export type IssueSeverity = 'critical' | 'serious' | 'moderate' | 'minor';

/**
 * Accessibility check result
 */
export interface AccessibilityCheck {
  id: string;
  principle: WCAGPrinciple;
  guideline: string;
  successCriterion: string;
  level: WCAGLevel;
  name: string;
  description: string;
  status: 'pass' | 'fail' | 'warning' | 'not_applicable';
  severity: IssueSeverity;
  wcagReference: string;
  issues: AccessibilityIssue[];
  automated: boolean;
}

/**
 * Individual accessibility issue
 */
export interface AccessibilityIssue {
  element: string;
  selector?: string;
  problem: string;
  recommendation: string;
  code?: string;
  line?: number;
  file?: string;
}

/**
 * Audit report
 */
export interface WCAGAuditReport {
  timestamp: string;
  summary: {
    totalChecks: number;
    passed: number;
    failed: number;
    warnings: number;
    notApplicable: number;
    complianceScore: number; // 0-100
    criticalIssues: number;
    seriousIssues: number;
    moderateIssues: number;
    minorIssues: number;
  };
  categories: {
    [key in WCAGPrinciple]: CategoryResult;
  };
  checks: AccessibilityCheck[];
  filesScanned: number;
  overallStatus: 'compliant' | 'non_compliant' | 'needs_review';
  recommendations: string[];
}

/**
 * Category result
 */
export interface CategoryResult {
  name: string;
  description: string;
  totalChecks: number;
  passed: number;
  failed: number;
  warnings: number;
  status: 'pass' | 'fail' | 'warning';
  complianceScore: number;
}

/**
 * Audit configuration
 */
export interface WCAGAuditConfig {
  /**
   * Root directory to scan
   */
  rootDir: string;

  /**
   * File patterns to include (glob patterns)
   */
  include?: string[];

  /**
   * File patterns to exclude
   */
  exclude?: string[];

  /**
   * WCAG level to audit against
   */
  level?: WCAGLevel;

  /**
   * Maximum number of files to scan
   */
  maxFiles?: number;

  /**
   * Timeout for audit (ms)
   */
  timeout?: number;
}

/**
 * WCAG 2.1 AA Auditor
 */
export class WCAGAuditor {
  private config: Required<WCAGAuditConfig>;
  private checks: AccessibilityCheck[] = [];
  private filesScanned = 0;

  constructor(config: WCAGAuditConfig) {
    this.config = {
      rootDir: config.rootDir,
      include: config.include || ['**/*.html', '**/*.astro', '**/*.tsx', '**/*.jsx'],
      exclude: config.exclude || ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/.git/**'],
      level: config.level || 'AA',
      maxFiles: config.maxFiles || 100,
      timeout: config.timeout || 30000,
    };
  }

  /**
   * Run complete WCAG 2.1 AA audit
   */
  async audit(): Promise<WCAGAuditReport> {
    this.checks = [];
    this.filesScanned = 0;

    const startTime = Date.now();

    try {
      // Find files to scan
      const files = await this.findFiles();

      // Scan each file
      for (const file of files.slice(0, this.config.maxFiles)) {
        try {
          await this.scanFile(file);
          this.filesScanned++;
        } catch (error) {
          console.warn(`Failed to scan file: ${file}`, error);
        }

        // Check timeout
        if (Date.now() - startTime > this.config.timeout) {
          console.warn('Audit timeout reached');
          break;
        }
      }

      // Run all checks
      await this.runAllChecks();

      // Generate report
      return this.generateReport();
    } catch (error: any) {
      throw new Error(`WCAG audit failed: ${error.message}`);
    }
  }

  /**
   * Find files to scan
   */
  private async findFiles(): Promise<string[]> {
    const files: string[] = [];

    const scanDir = async (dir: string, depth = 0) => {
      if (depth > 5) return; // Limit recursion depth

      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          // Check exclude patterns
          if (this.config.exclude.some(pattern => entry.name.includes(pattern.replace('**/', '').replace('/**', '')))) {
            continue;
          }

          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            await scanDir(fullPath, depth + 1);
          } else if (entry.isFile()) {
            // Check include patterns
            const ext = path.extname(entry.name);
            if (['.html', '.astro', '.tsx', '.jsx'].includes(ext)) {
              files.push(fullPath);
            }
          }

          // Limit total files
          if (files.length >= this.config.maxFiles * 2) {
            return;
          }
        }
      } catch (error) {
        // Ignore permission errors
      }
    };

    await scanDir(this.config.rootDir);
    return files;
  }

  /**
   * Scan a single file
   */
  private async scanFile(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');

      // Skip very large files
      if (content.length > 500000) {
        return;
      }

      // Parse HTML content
      try {
        const root = parse(content);

        // Store for later analysis
        if (!this.fileContents) {
          this.fileContents = new Map();
        }
        this.fileContents.set(filePath, { content, root });
      } catch (parseError) {
        // Ignore parse errors for non-HTML files
      }
    } catch (error) {
      // Ignore file read errors
    }
  }

  private fileContents?: Map<string, { content: string; root: any }>;

  /**
   * Run all accessibility checks
   */
  private async runAllChecks(): Promise<void> {
    // Perceivable checks
    this.checks.push(await this.checkTextAlternatives());
    this.checks.push(await this.checkImageAltText());
    this.checks.push(await this.checkColorContrast());
    this.checks.push(await this.checkSemanticHTML());
    this.checks.push(await this.checkHeadingStructure());
    this.checks.push(await this.checkVideoAudioAlternatives());

    // Operable checks
    this.checks.push(await this.checkKeyboardAccessible());
    this.checks.push(await this.checkFocusVisible());
    this.checks.push(await this.checkSkipLinks());
    this.checks.push(await this.checkPageTitle());
    this.checks.push(await this.checkLinkPurpose());
    this.checks.push(await this.checkMultipleWays());

    // Understandable checks
    this.checks.push(await this.checkLanguageAttribute());
    this.checks.push(await this.checkFormLabels());
    this.checks.push(await this.checkErrorIdentification());
    this.checks.push(await this.checkConsistentNavigation());
    this.checks.push(await this.checkConsistentIdentification());

    // Robust checks
    this.checks.push(await this.checkValidHTML());
    this.checks.push(await this.checkARIAUsage());
    this.checks.push(await this.checkNameRoleValue());
  }

  /**
   * 1.1.1 Non-text Content (Level A)
   */
  private async checkTextAlternatives(): Promise<AccessibilityCheck> {
    const issues: AccessibilityIssue[] = [];

    if (this.fileContents) {
      for (const [file, { root }] of this.fileContents) {
        // Check images
        const images = root.querySelectorAll('img');
        for (const img of images) {
          const alt = img.getAttribute('alt');
          const src = img.getAttribute('src');

          if (alt === null || alt === undefined) {
            issues.push({
              element: 'img',
              selector: src ? `img[src="${src}"]` : 'img',
              problem: 'Image missing alt attribute',
              recommendation: 'Add alt attribute to describe the image content or use alt="" for decorative images',
              file: path.basename(file),
            });
          }
        }

        // Check input buttons
        const inputButtons = root.querySelectorAll('input[type="image"]');
        for (const input of inputButtons) {
          const alt = input.getAttribute('alt');
          if (!alt) {
            issues.push({
              element: 'input[type="image"]',
              problem: 'Image button missing alt attribute',
              recommendation: 'Add alt attribute describing the button action',
              file: path.basename(file),
            });
          }
        }
      }
    }

    return {
      id: 'WCAG-1.1.1',
      principle: 'perceivable',
      guideline: '1.1 Text Alternatives',
      successCriterion: '1.1.1 Non-text Content',
      level: 'A',
      name: 'Text Alternatives',
      description: 'All non-text content must have a text alternative',
      status: issues.length === 0 ? 'pass' : 'fail',
      severity: 'critical',
      wcagReference: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html',
      issues,
      automated: true,
    };
  }

  /**
   * Enhanced image alt text check
   */
  private async checkImageAltText(): Promise<AccessibilityCheck> {
    const issues: AccessibilityIssue[] = [];

    if (this.fileContents) {
      for (const [file, { root }] of this.fileContents) {
        const images = root.querySelectorAll('img');
        for (const img of images) {
          const alt = img.getAttribute('alt');
          const src = img.getAttribute('src');

          if (alt !== null && alt !== undefined) {
            // Check for poor alt text
            if (alt.toLowerCase().includes('image') || alt.toLowerCase().includes('picture')) {
              issues.push({
                element: 'img',
                selector: src ? `img[src="${src}"]` : 'img',
                problem: `Alt text should not contain "image" or "picture": "${alt}"`,
                recommendation: 'Describe what the image shows, not that it is an image',
                file: path.basename(file),
              });
            }

            // Check for file names as alt text
            if (alt.includes('.jpg') || alt.includes('.png') || alt.includes('.gif')) {
              issues.push({
                element: 'img',
                selector: src ? `img[src="${src}"]` : 'img',
                problem: `Alt text appears to be a filename: "${alt}"`,
                recommendation: 'Use descriptive text instead of filename',
                file: path.basename(file),
              });
            }

            // Check for overly long alt text
            if (alt.length > 150) {
              issues.push({
                element: 'img',
                selector: src ? `img[src="${src}"]` : 'img',
                problem: `Alt text is too long (${alt.length} characters)`,
                recommendation: 'Keep alt text concise (under 150 characters). Use longdesc or adjacent text for detailed descriptions',
                file: path.basename(file),
              });
            }
          }
        }
      }
    }

    return {
      id: 'WCAG-1.1.1-ENHANCED',
      principle: 'perceivable',
      guideline: '1.1 Text Alternatives',
      successCriterion: '1.1.1 Non-text Content (Enhanced)',
      level: 'AA',
      name: 'Quality Alt Text',
      description: 'Alt text should be meaningful and concise',
      status: issues.length === 0 ? 'pass' : 'warning',
      severity: 'moderate',
      wcagReference: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html',
      issues,
      automated: true,
    };
  }

  /**
   * 1.4.3 Contrast (Minimum) (Level AA)
   */
  private async checkColorContrast(): Promise<AccessibilityCheck> {
    const issues: AccessibilityIssue[] = [];

    // This is a simplified check - proper contrast checking requires rendering
    if (this.fileContents) {
      for (const [file, { content }] of this.fileContents) {
        // Check for potential low contrast color combinations in CSS
        const lowContrastPatterns = [
          /color:\s*#([cdef][0-9a-f]{5})/gi, // Light colors on potentially white background
          /background:\s*#([0-3][0-9a-f]{5})/gi, // Dark backgrounds
        ];

        for (const pattern of lowContrastPatterns) {
          const matches = content.match(pattern);
          if (matches && matches.length > 3) {
            issues.push({
              element: 'CSS',
              problem: 'Potential low contrast color usage detected',
              recommendation: 'Verify color contrast ratios meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text)',
              file: path.basename(file),
            });
            break;
          }
        }
      }
    }

    return {
      id: 'WCAG-1.4.3',
      principle: 'perceivable',
      guideline: '1.4 Distinguishable',
      successCriterion: '1.4.3 Contrast (Minimum)',
      level: 'AA',
      name: 'Color Contrast',
      description: 'Text must have sufficient contrast against background',
      status: issues.length === 0 ? 'pass' : 'warning',
      severity: 'serious',
      wcagReference: 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html',
      issues,
      automated: false, // Requires actual rendering
    };
  }

  /**
   * 1.3.1 Info and Relationships (Level A)
   */
  private async checkSemanticHTML(): Promise<AccessibilityCheck> {
    const issues: AccessibilityIssue[] = [];

    if (this.fileContents) {
      for (const [file, { root }] of this.fileContents) {
        // Check for divs/spans used as buttons
        const divButtons = root.querySelectorAll('div[onclick], span[onclick]');
        for (const elem of divButtons) {
          const tagName = elem.tagName.toLowerCase();
          issues.push({
            element: tagName,
            problem: `${tagName} used as interactive element with onclick`,
            recommendation: 'Use semantic <button> element instead of div/span with onclick',
            file: path.basename(file),
          });
        }

        // Check for missing main landmark
        const main = root.querySelector('main');
        if (!main && root.querySelectorAll('div, section').length > 0) {
          issues.push({
            element: 'document',
            problem: 'No <main> landmark found',
            recommendation: 'Add <main> element to identify main content area',
            file: path.basename(file),
          });
        }

        // Check for missing navigation landmark
        const nav = root.querySelector('nav');
        const header = root.querySelector('header');
        if (!nav && header) {
          issues.push({
            element: 'document',
            problem: 'No <nav> landmark found',
            recommendation: 'Use <nav> element for navigation menus',
            file: path.basename(file),
          });
        }
      }
    }

    return {
      id: 'WCAG-1.3.1',
      principle: 'perceivable',
      guideline: '1.3 Adaptable',
      successCriterion: '1.3.1 Info and Relationships',
      level: 'A',
      name: 'Semantic HTML',
      description: 'Information and relationships must be programmatically determined',
      status: issues.length === 0 ? 'pass' : 'fail',
      severity: 'serious',
      wcagReference: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html',
      issues,
      automated: true,
    };
  }

  /**
   * 1.3.1 Info and Relationships - Heading Structure
   */
  private async checkHeadingStructure(): Promise<AccessibilityCheck> {
    const issues: AccessibilityIssue[] = [];

    if (this.fileContents) {
      for (const [file, { root }] of this.fileContents) {
        const headings = root.querySelectorAll('h1, h2, h3, h4, h5, h6');

        // Check for missing h1
        const h1s = root.querySelectorAll('h1');
        if (h1s.length === 0 && headings.length > 0) {
          issues.push({
            element: 'heading',
            problem: 'No <h1> found on page',
            recommendation: 'Each page should have exactly one <h1> element',
            file: path.basename(file),
          });
        }

        // Check for multiple h1s
        if (h1s.length > 1) {
          issues.push({
            element: 'h1',
            problem: `Multiple <h1> elements found (${h1s.length})`,
            recommendation: 'Use only one <h1> per page',
            file: path.basename(file),
          });
        }

        // Check for skipped heading levels
        let prevLevel = 0;
        for (const heading of headings) {
          const level = parseInt(heading.tagName[1]);
          if (prevLevel > 0 && level > prevLevel + 1) {
            issues.push({
              element: heading.tagName.toLowerCase(),
              problem: `Heading level skipped: jumped from h${prevLevel} to h${level}`,
              recommendation: 'Use consecutive heading levels (don\'t skip from h2 to h4)',
              file: path.basename(file),
            });
          }
          prevLevel = level;
        }
      }
    }

    return {
      id: 'WCAG-1.3.1-HEADINGS',
      principle: 'perceivable',
      guideline: '1.3 Adaptable',
      successCriterion: '1.3.1 Info and Relationships (Headings)',
      level: 'A',
      name: 'Heading Structure',
      description: 'Headings must be properly structured and hierarchical',
      status: issues.length === 0 ? 'pass' : 'fail',
      severity: 'serious',
      wcagReference: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html',
      issues,
      automated: true,
    };
  }

  /**
   * 1.2.1 Audio-only and Video-only (Level A)
   */
  private async checkVideoAudioAlternatives(): Promise<AccessibilityCheck> {
    const issues: AccessibilityIssue[] = [];

    if (this.fileContents) {
      for (const [file, { root }] of this.fileContents) {
        // Check video elements
        const videos = root.querySelectorAll('video');
        for (const video of videos) {
          const track = video.querySelector('track[kind="captions"], track[kind="subtitles"]');
          if (!track) {
            issues.push({
              element: 'video',
              problem: 'Video missing captions/subtitles track',
              recommendation: 'Add <track kind="captions"> element for video captions',
              file: path.basename(file),
            });
          }
        }

        // Check audio elements
        const audios = root.querySelectorAll('audio');
        for (const audio of audios) {
          // Audio should have a transcript nearby
          issues.push({
            element: 'audio',
            problem: 'Audio element found - verify transcript is provided',
            recommendation: 'Provide a text transcript for audio content',
            file: path.basename(file),
          });
        }
      }
    }

    return {
      id: 'WCAG-1.2.1',
      principle: 'perceivable',
      guideline: '1.2 Time-based Media',
      successCriterion: '1.2.1 Audio-only and Video-only',
      level: 'A',
      name: 'Media Alternatives',
      description: 'Provide alternatives for time-based media',
      status: issues.length === 0 ? 'pass' : 'warning',
      severity: 'moderate',
      wcagReference: 'https://www.w3.org/WAI/WCAG21/Understanding/audio-only-and-video-only-prerecorded.html',
      issues,
      automated: true,
    };
  }

  /**
   * 2.1.1 Keyboard (Level A)
   */
  private async checkKeyboardAccessible(): Promise<AccessibilityCheck> {
    const issues: AccessibilityIssue[] = [];

    if (this.fileContents) {
      for (const [file, { root }] of this.fileContents) {
        // Check for onclick without onkeypress
        const clickable = root.querySelectorAll('[onclick]');
        for (const elem of clickable) {
          const tagName = elem.tagName.toLowerCase();
          if (!['button', 'a'].includes(tagName)) {
            const onkeypress = elem.getAttribute('onkeypress') || elem.getAttribute('onkeydown');
            if (!onkeypress) {
              issues.push({
                element: tagName,
                problem: `${tagName} has onclick but no keyboard event handler`,
                recommendation: 'Add onkeypress or onkeydown handler, or use semantic button/link elements',
                file: path.basename(file),
              });
            }
          }
        }

        // Check for missing tabindex on interactive elements
        const interactiveNonSemantics = root.querySelectorAll('div[role="button"], span[role="button"]');
        for (const elem of interactiveNonSemantics) {
          const tabindex = elem.getAttribute('tabindex');
          if (tabindex === null) {
            issues.push({
              element: elem.tagName.toLowerCase(),
              problem: 'Interactive role without tabindex',
              recommendation: 'Add tabindex="0" to make element keyboard accessible',
              file: path.basename(file),
            });
          }
        }
      }
    }

    return {
      id: 'WCAG-2.1.1',
      principle: 'operable',
      guideline: '2.1 Keyboard Accessible',
      successCriterion: '2.1.1 Keyboard',
      level: 'A',
      name: 'Keyboard Navigation',
      description: 'All functionality must be available via keyboard',
      status: issues.length === 0 ? 'pass' : 'fail',
      severity: 'critical',
      wcagReference: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html',
      issues,
      automated: true,
    };
  }

  /**
   * 2.4.7 Focus Visible (Level AA)
   */
  private async checkFocusVisible(): Promise<AccessibilityCheck> {
    const issues: AccessibilityIssue[] = [];

    if (this.fileContents) {
      for (const [file, { content }] of this.fileContents) {
        // Check for outline: none without alternative focus indicator
        if (content.includes('outline: none') || content.includes('outline:none')) {
          // Check if there's a custom focus style
          if (!content.includes(':focus') || !content.includes('focus-visible')) {
            issues.push({
              element: 'CSS',
              problem: 'outline: none used without alternative focus indicator',
              recommendation: 'If removing outline, provide alternative focus indicator using :focus-visible',
              file: path.basename(file),
            });
          }
        }
      }
    }

    return {
      id: 'WCAG-2.4.7',
      principle: 'operable',
      guideline: '2.4 Navigable',
      successCriterion: '2.4.7 Focus Visible',
      level: 'AA',
      name: 'Focus Indicator',
      description: 'Keyboard focus must be clearly visible',
      status: issues.length === 0 ? 'pass' : 'fail',
      severity: 'serious',
      wcagReference: 'https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html',
      issues,
      automated: true,
    };
  }

  /**
   * 2.4.1 Bypass Blocks (Level A)
   */
  private async checkSkipLinks(): Promise<AccessibilityCheck> {
    const issues: AccessibilityIssue[] = [];

    if (this.fileContents) {
      for (const [file, { root }] of this.fileContents) {
        // Look for skip links
        const links = root.querySelectorAll('a[href^="#"]');
        const hasSkipLink = Array.from(links).some((link: any) => {
          const text = link.text?.toLowerCase() || '';
          return text.includes('skip') || text.includes('jump to');
        });

        const main = root.querySelector('main');
        const header = root.querySelector('header');

        if (!hasSkipLink && main && header) {
          issues.push({
            element: 'document',
            problem: 'No skip link found',
            recommendation: 'Add a "Skip to main content" link at the beginning of the page',
            file: path.basename(file),
          });
        }
      }
    }

    return {
      id: 'WCAG-2.4.1',
      principle: 'operable',
      guideline: '2.4 Navigable',
      successCriterion: '2.4.1 Bypass Blocks',
      level: 'A',
      name: 'Skip Links',
      description: 'Provide a way to skip repeated content blocks',
      status: issues.length === 0 ? 'pass' : 'fail',
      severity: 'moderate',
      wcagReference: 'https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks.html',
      issues,
      automated: true,
    };
  }

  /**
   * 2.4.2 Page Titled (Level A)
   */
  private async checkPageTitle(): Promise<AccessibilityCheck> {
    const issues: AccessibilityIssue[] = [];

    if (this.fileContents) {
      for (const [file, { root }] of this.fileContents) {
        const title = root.querySelector('title');

        if (!title) {
          issues.push({
            element: 'title',
            problem: 'Page missing <title> element',
            recommendation: 'Add <title> element in <head> with descriptive page title',
            file: path.basename(file),
          });
        } else {
          const titleText = title.text?.trim();
          if (!titleText || titleText.length === 0) {
            issues.push({
              element: 'title',
              problem: 'Page title is empty',
              recommendation: 'Provide a descriptive page title',
              file: path.basename(file),
            });
          } else if (titleText.length < 3) {
            issues.push({
              element: 'title',
              problem: `Page title is too short: "${titleText}"`,
              recommendation: 'Use a more descriptive page title',
              file: path.basename(file),
            });
          }
        }
      }
    }

    return {
      id: 'WCAG-2.4.2',
      principle: 'operable',
      guideline: '2.4 Navigable',
      successCriterion: '2.4.2 Page Titled',
      level: 'A',
      name: 'Page Titles',
      description: 'Web pages must have descriptive titles',
      status: issues.length === 0 ? 'pass' : 'fail',
      severity: 'serious',
      wcagReference: 'https://www.w3.org/WAI/WCAG21/Understanding/page-titled.html',
      issues,
      automated: true,
    };
  }

  /**
   * 2.4.4 Link Purpose (Level A)
   */
  private async checkLinkPurpose(): Promise<AccessibilityCheck> {
    const issues: AccessibilityIssue[] = [];

    if (this.fileContents) {
      for (const [file, { root }] of this.fileContents) {
        const links = root.querySelectorAll('a');

        for (const link of links) {
          const text = link.text?.trim();
          const ariaLabel = link.getAttribute('aria-label');
          const title = link.getAttribute('title');

          // Check for empty links
          if (!text && !ariaLabel && !title) {
            const href = link.getAttribute('href');
            issues.push({
              element: 'a',
              selector: href ? `a[href="${href}"]` : 'a',
              problem: 'Link has no accessible text',
              recommendation: 'Add text content, aria-label, or title attribute to describe link purpose',
              file: path.basename(file),
            });
          }

          // Check for generic link text
          const genericTexts = ['click here', 'read more', 'more', 'link', 'here'];
          if (text && genericTexts.includes(text.toLowerCase())) {
            issues.push({
              element: 'a',
              problem: `Generic link text: "${text}"`,
              recommendation: 'Use descriptive link text that makes sense out of context',
              file: path.basename(file),
            });
          }
        }
      }
    }

    return {
      id: 'WCAG-2.4.4',
      principle: 'operable',
      guideline: '2.4 Navigable',
      successCriterion: '2.4.4 Link Purpose (In Context)',
      level: 'A',
      name: 'Link Purpose',
      description: 'The purpose of each link must be clear from link text or context',
      status: issues.length === 0 ? 'pass' : 'warning',
      severity: 'moderate',
      wcagReference: 'https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-in-context.html',
      issues,
      automated: true,
    };
  }

  /**
   * 2.4.5 Multiple Ways (Level AA)
   */
  private async checkMultipleWays(): Promise<AccessibilityCheck> {
    const issues: AccessibilityIssue[] = [];

    // This check requires manual verification
    issues.push({
      element: 'document',
      problem: 'Multiple ways to access pages needs manual verification',
      recommendation: 'Ensure users can find pages through: navigation menu, search, sitemap, or related links',
    });

    return {
      id: 'WCAG-2.4.5',
      principle: 'operable',
      guideline: '2.4 Navigable',
      successCriterion: '2.4.5 Multiple Ways',
      level: 'AA',
      name: 'Multiple Ways',
      description: 'Provide multiple ways to locate pages',
      status: 'warning',
      severity: 'minor',
      wcagReference: 'https://www.w3.org/WAI/WCAG21/Understanding/multiple-ways.html',
      issues,
      automated: false,
    };
  }

  /**
   * 3.1.1 Language of Page (Level A)
   */
  private async checkLanguageAttribute(): Promise<AccessibilityCheck> {
    const issues: AccessibilityIssue[] = [];

    if (this.fileContents) {
      for (const [file, { root }] of this.fileContents) {
        const html = root.querySelector('html');

        if (html) {
          const lang = html.getAttribute('lang');
          if (!lang) {
            issues.push({
              element: 'html',
              problem: 'Missing lang attribute on <html> element',
              recommendation: 'Add lang="en" (or appropriate language code) to <html> element',
              file: path.basename(file),
            });
          } else if (lang.length < 2) {
            issues.push({
              element: 'html',
              problem: `Invalid lang attribute: "${lang}"`,
              recommendation: 'Use valid ISO 639-1 language code (e.g., "en", "es", "fr")',
              file: path.basename(file),
            });
          }
        }
      }
    }

    return {
      id: 'WCAG-3.1.1',
      principle: 'understandable',
      guideline: '3.1 Readable',
      successCriterion: '3.1.1 Language of Page',
      level: 'A',
      name: 'Language Attribute',
      description: 'The default language of each page must be programmatically determined',
      status: issues.length === 0 ? 'pass' : 'fail',
      severity: 'serious',
      wcagReference: 'https://www.w3.org/WAI/WCAG21/Understanding/language-of-page.html',
      issues,
      automated: true,
    };
  }

  /**
   * 3.3.2 Labels or Instructions (Level A)
   */
  private async checkFormLabels(): Promise<AccessibilityCheck> {
    const issues: AccessibilityIssue[] = [];

    if (this.fileContents) {
      for (const [file, { root }] of this.fileContents) {
        const inputs = root.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select');

        for (const input of inputs) {
          const id = input.getAttribute('id');
          const ariaLabel = input.getAttribute('aria-label');
          const ariaLabelledby = input.getAttribute('aria-labelledby');
          const title = input.getAttribute('title');
          const placeholder = input.getAttribute('placeholder');

          // Check for associated label
          let hasLabel = false;
          if (id) {
            const label = root.querySelector(`label[for="${id}"]`);
            hasLabel = !!label;
          }

          // Check if input has any accessible name
          if (!hasLabel && !ariaLabel && !ariaLabelledby && !title) {
            const type = input.getAttribute('type') || input.tagName.toLowerCase();
            issues.push({
              element: input.tagName.toLowerCase(),
              problem: `Form ${type} missing label`,
              recommendation: 'Add <label> element, aria-label, or aria-labelledby attribute',
              file: path.basename(file),
            });
          }

          // Warn if only using placeholder
          if (!hasLabel && !ariaLabel && !ariaLabelledby && placeholder) {
            issues.push({
              element: input.tagName.toLowerCase(),
              problem: 'Form input uses only placeholder (not accessible)',
              recommendation: 'Use <label> element or aria-label in addition to placeholder',
              file: path.basename(file),
            });
          }
        }
      }
    }

    return {
      id: 'WCAG-3.3.2',
      principle: 'understandable',
      guideline: '3.3 Input Assistance',
      successCriterion: '3.3.2 Labels or Instructions',
      level: 'A',
      name: 'Form Labels',
      description: 'Labels or instructions must be provided for user input',
      status: issues.length === 0 ? 'pass' : 'fail',
      severity: 'critical',
      wcagReference: 'https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html',
      issues,
      automated: true,
    };
  }

  /**
   * 3.3.1 Error Identification (Level A)
   */
  private async checkErrorIdentification(): Promise<AccessibilityCheck> {
    const issues: AccessibilityIssue[] = [];

    if (this.fileContents) {
      for (const [file, { root }] of this.fileContents) {
        const forms = root.querySelectorAll('form');

        for (const form of forms) {
          const hasValidation = form.getAttribute('novalidate') === null;
          const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');

          if (inputs.length > 0 && hasValidation) {
            // Check for error message elements
            const errorElements = form.querySelectorAll('[role="alert"], .error, .error-message, [aria-live="polite"]');

            if (errorElements.length === 0) {
              issues.push({
                element: 'form',
                problem: 'Form with required fields has no error message container',
                recommendation: 'Add error message elements with role="alert" or aria-live="polite"',
                file: path.basename(file),
              });
            }
          }
        }
      }
    }

    return {
      id: 'WCAG-3.3.1',
      principle: 'understandable',
      guideline: '3.3 Input Assistance',
      successCriterion: '3.3.1 Error Identification',
      level: 'A',
      name: 'Error Identification',
      description: 'Input errors must be identified and described to the user',
      status: issues.length === 0 ? 'pass' : 'warning',
      severity: 'moderate',
      wcagReference: 'https://www.w3.org/WAI/WCAG21/Understanding/error-identification.html',
      issues,
      automated: true,
    };
  }

  /**
   * 3.2.3 Consistent Navigation (Level AA)
   */
  private async checkConsistentNavigation(): Promise<AccessibilityCheck> {
    const issues: AccessibilityIssue[] = [];

    // This requires comparing multiple pages - manual check needed
    issues.push({
      element: 'document',
      problem: 'Consistent navigation needs manual verification across pages',
      recommendation: 'Ensure navigation menus appear in the same order on all pages',
    });

    return {
      id: 'WCAG-3.2.3',
      principle: 'understandable',
      guideline: '3.2 Predictable',
      successCriterion: '3.2.3 Consistent Navigation',
      level: 'AA',
      name: 'Consistent Navigation',
      description: 'Navigation mechanisms must be consistent across pages',
      status: 'warning',
      severity: 'minor',
      wcagReference: 'https://www.w3.org/WAI/WCAG21/Understanding/consistent-navigation.html',
      issues,
      automated: false,
    };
  }

  /**
   * 3.2.4 Consistent Identification (Level AA)
   */
  private async checkConsistentIdentification(): Promise<AccessibilityCheck> {
    const issues: AccessibilityIssue[] = [];

    // This requires comparing multiple pages - manual check needed
    issues.push({
      element: 'document',
      problem: 'Consistent identification needs manual verification across pages',
      recommendation: 'Ensure components with same functionality are identified consistently',
    });

    return {
      id: 'WCAG-3.2.4',
      principle: 'understandable',
      guideline: '3.2 Predictable',
      successCriterion: '3.2.4 Consistent Identification',
      level: 'AA',
      name: 'Consistent Identification',
      description: 'Components with same functionality must be identified consistently',
      status: 'warning',
      severity: 'minor',
      wcagReference: 'https://www.w3.org/WAI/WCAG21/Understanding/consistent-identification.html',
      issues,
      automated: false,
    };
  }

  /**
   * 4.1.1 Parsing (Level A)
   */
  private async checkValidHTML(): Promise<AccessibilityCheck> {
    const issues: AccessibilityIssue[] = [];

    if (this.fileContents) {
      for (const [file, { content }] of this.fileContents) {
        // Check for common HTML errors

        // Duplicate IDs
        const idMatches = content.match(/id=["']([^"']+)["']/g);
        if (idMatches) {
          const ids = idMatches.map(m => m.match(/id=["']([^"']+)["']/)?.[1]);
          const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);

          if (duplicates.length > 0) {
            issues.push({
              element: 'HTML',
              problem: `Duplicate IDs found: ${[...new Set(duplicates)].join(', ')}`,
              recommendation: 'Ensure all id attributes are unique within the page',
              file: path.basename(file),
            });
          }
        }
      }
    }

    return {
      id: 'WCAG-4.1.1',
      principle: 'robust',
      guideline: '4.1 Compatible',
      successCriterion: '4.1.1 Parsing',
      level: 'A',
      name: 'Valid HTML',
      description: 'HTML must be valid and well-formed',
      status: issues.length === 0 ? 'pass' : 'fail',
      severity: 'moderate',
      wcagReference: 'https://www.w3.org/WAI/WCAG21/Understanding/parsing.html',
      issues,
      automated: true,
    };
  }

  /**
   * 4.1.2 Name, Role, Value (Level A) - ARIA Usage
   */
  private async checkARIAUsage(): Promise<AccessibilityCheck> {
    const issues: AccessibilityIssue[] = [];

    if (this.fileContents) {
      for (const [file, { root }] of this.fileContents) {
        // Check for invalid ARIA attributes
        const elementsWithAria = root.querySelectorAll('[class*="aria-"], [role]');

        for (const elem of elementsWithAria) {
          const role = elem.getAttribute('role');

          // Check for invalid roles
          const validRoles = ['button', 'link', 'navigation', 'main', 'search', 'banner', 'contentinfo', 'complementary', 'region', 'article', 'alert', 'dialog', 'tab', 'tabpanel', 'menu', 'menuitem'];
          if (role && !validRoles.includes(role)) {
            issues.push({
              element: elem.tagName.toLowerCase(),
              problem: `Potentially invalid ARIA role: "${role}"`,
              recommendation: 'Verify role is valid and used correctly per ARIA specification',
              file: path.basename(file),
            });
          }
        }
      }
    }

    return {
      id: 'WCAG-4.1.2-ARIA',
      principle: 'robust',
      guideline: '4.1 Compatible',
      successCriterion: '4.1.2 Name, Role, Value (ARIA)',
      level: 'A',
      name: 'ARIA Usage',
      description: 'ARIA attributes must be used correctly',
      status: issues.length === 0 ? 'pass' : 'warning',
      severity: 'moderate',
      wcagReference: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html',
      issues,
      automated: true,
    };
  }

  /**
   * 4.1.2 Name, Role, Value (Level A)
   */
  private async checkNameRoleValue(): Promise<AccessibilityCheck> {
    const issues: AccessibilityIssue[] = [];

    if (this.fileContents) {
      for (const [file, { root }] of this.fileContents) {
        // Check buttons have accessible names
        const buttons = root.querySelectorAll('button');
        for (const button of buttons) {
          const text = button.text?.trim();
          const ariaLabel = button.getAttribute('aria-label');
          const ariaLabelledby = button.getAttribute('aria-labelledby');

          if (!text && !ariaLabel && !ariaLabelledby) {
            issues.push({
              element: 'button',
              problem: 'Button has no accessible name',
              recommendation: 'Add text content, aria-label, or aria-labelledby',
              file: path.basename(file),
            });
          }
        }

        // Check custom controls have proper roles
        const customControls = root.querySelectorAll('[onclick]:not(button):not(a)');
        for (const control of customControls) {
          const role = control.getAttribute('role');
          if (!role) {
            issues.push({
              element: control.tagName.toLowerCase(),
              problem: 'Interactive element without role attribute',
              recommendation: 'Add appropriate role attribute (e.g., role="button")',
              file: path.basename(file),
            });
          }
        }
      }
    }

    return {
      id: 'WCAG-4.1.2',
      principle: 'robust',
      guideline: '4.1 Compatible',
      successCriterion: '4.1.2 Name, Role, Value',
      level: 'A',
      name: 'Name, Role, Value',
      description: 'UI components must have programmatically determinable name, role, and value',
      status: issues.length === 0 ? 'pass' : 'fail',
      severity: 'critical',
      wcagReference: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html',
      issues,
      automated: true,
    };
  }

  /**
   * Generate audit report
   */
  private generateReport(): WCAGAuditReport {
    const timestamp = new Date().toISOString();

    // Calculate summary statistics
    const totalChecks = this.checks.length;
    const passed = this.checks.filter(c => c.status === 'pass').length;
    const failed = this.checks.filter(c => c.status === 'fail').length;
    const warnings = this.checks.filter(c => c.status === 'warning').length;
    const notApplicable = this.checks.filter(c => c.status === 'not_applicable').length;

    const complianceScore = totalChecks > 0 ? Math.round((passed / totalChecks) * 100) : 0;

    // Count issues by severity
    const criticalIssues = this.checks.filter(c => c.severity === 'critical' && c.status === 'fail').length;
    const seriousIssues = this.checks.filter(c => c.severity === 'serious' && c.status === 'fail').length;
    const moderateIssues = this.checks.filter(c => c.severity === 'moderate' && (c.status === 'fail' || c.status === 'warning')).length;
    const minorIssues = this.checks.filter(c => c.severity === 'minor' && c.status === 'warning').length;

    // Group by principle
    const categories: { [key in WCAGPrinciple]: CategoryResult } = {
      perceivable: this.generateCategoryResult('perceivable', 'Perceivable', 'Information and UI components must be presentable to users in ways they can perceive'),
      operable: this.generateCategoryResult('operable', 'Operable', 'UI components and navigation must be operable'),
      understandable: this.generateCategoryResult('understandable', 'Understandable', 'Information and operation of UI must be understandable'),
      robust: this.generateCategoryResult('robust', 'Robust', 'Content must be robust enough to be interpreted by assistive technologies'),
    };

    // Determine overall status
    const overallStatus: 'compliant' | 'non_compliant' | 'needs_review' =
      criticalIssues > 0 || failed > 5 ? 'non_compliant' :
      warnings > 0 || failed > 0 ? 'needs_review' :
      'compliant';

    // Generate recommendations
    const recommendations = this.generateRecommendations();

    return {
      timestamp,
      summary: {
        totalChecks,
        passed,
        failed,
        warnings,
        notApplicable,
        complianceScore,
        criticalIssues,
        seriousIssues,
        moderateIssues,
        minorIssues,
      },
      categories,
      checks: this.checks,
      filesScanned: this.filesScanned,
      overallStatus,
      recommendations,
    };
  }

  /**
   * Generate category result
   */
  private generateCategoryResult(principle: WCAGPrinciple, name: string, description: string): CategoryResult {
    const categoryChecks = this.checks.filter(c => c.principle === principle);
    const totalChecks = categoryChecks.length;
    const passed = categoryChecks.filter(c => c.status === 'pass').length;
    const failed = categoryChecks.filter(c => c.status === 'fail').length;
    const warnings = categoryChecks.filter(c => c.status === 'warning').length;

    const status: 'pass' | 'fail' | 'warning' =
      failed > 0 ? 'fail' :
      warnings > 0 ? 'warning' :
      'pass';

    const complianceScore = totalChecks > 0 ? Math.round((passed / totalChecks) * 100) : 100;

    return {
      name,
      description,
      totalChecks,
      passed,
      failed,
      warnings,
      status,
      complianceScore,
    };
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    const failedChecks = this.checks.filter(c => c.status === 'fail');

    // Priority recommendations based on critical issues
    const criticalChecks = failedChecks.filter(c => c.severity === 'critical');
    if (criticalChecks.length > 0) {
      recommendations.push(`Fix ${criticalChecks.length} critical accessibility issues immediately`);

      // Specific recommendations
      const textAlternatives = criticalChecks.find(c => c.id === 'WCAG-1.1.1');
      if (textAlternatives && textAlternatives.issues.length > 0) {
        recommendations.push(`Add alt text to ${textAlternatives.issues.length} images`);
      }

      const formLabels = criticalChecks.find(c => c.id === 'WCAG-3.3.2');
      if (formLabels && formLabels.issues.length > 0) {
        recommendations.push(`Add labels to ${formLabels.issues.length} form inputs`);
      }

      const keyboard = criticalChecks.find(c => c.id === 'WCAG-2.1.1');
      if (keyboard && keyboard.issues.length > 0) {
        recommendations.push(`Make ${keyboard.issues.length} interactive elements keyboard accessible`);
      }
    }

    // Serious issues
    const seriousChecks = failedChecks.filter(c => c.severity === 'serious');
    if (seriousChecks.length > 0) {
      recommendations.push(`Address ${seriousChecks.length} serious accessibility issues`);
    }

    // General recommendations
    if (this.checks.some(c => c.id === 'WCAG-2.4.1' && c.status === 'fail')) {
      recommendations.push('Add skip navigation links to improve keyboard navigation');
    }

    if (this.checks.some(c => c.id === 'WCAG-3.1.1' && c.status === 'fail')) {
      recommendations.push('Add lang attribute to all HTML pages');
    }

    if (this.checks.some(c => c.id === 'WCAG-1.3.1' && c.status === 'fail')) {
      recommendations.push('Use semantic HTML elements instead of divs with click handlers');
    }

    // If no critical issues
    if (recommendations.length === 0) {
      recommendations.push('Great work! Continue to monitor accessibility with manual testing');
      recommendations.push('Consider running manual tests with screen readers (NVDA, JAWS, VoiceOver)');
      recommendations.push('Test keyboard navigation throughout the application');
    }

    return recommendations;
  }
}

/**
 * Helper function to run WCAG audit
 */
export async function runWCAGAudit(config?: Partial<WCAGAuditConfig>): Promise<WCAGAuditReport> {
  const auditor = new WCAGAuditor({
    rootDir: config?.rootDir || process.cwd(),
    ...config,
  });

  return await auditor.audit();
}
