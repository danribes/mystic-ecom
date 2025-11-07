/**
 * T238: FAQ Structured Data Tests
 *
 * Comprehensive test suite for FAQ schema generation and validation.
 * Tests FAQPage structured data for SEO and rich results.
 */

import { describe, it, expect } from 'vitest';
import {
  generateFAQPageSchema,
  type FAQPageSchema,
} from '@/lib/structuredData';

describe('T238: FAQ Structured Data - generateFAQPageSchema', () => {
  describe('Basic Generation', () => {
    it('should generate valid FAQ schema with single question', () => {
      const questions = [
        {
          question: 'What is meditation?',
          answer: 'Meditation is a practice of mindfulness and awareness.',
        },
      ];

      const schema = generateFAQPageSchema(questions);

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('FAQPage');
      expect(schema.mainEntity).toBeDefined();
      expect(Array.isArray(schema.mainEntity)).toBe(true);
      expect(schema.mainEntity).toHaveLength(1);
    });

    it('should generate FAQ schema with multiple questions', () => {
      const questions = [
        {
          question: 'What is meditation?',
          answer: 'Meditation is a practice of mindfulness.',
        },
        {
          question: 'How long should I meditate?',
          answer: 'Start with 5-10 minutes daily.',
        },
        {
          question: 'When is the best time to meditate?',
          answer: 'Morning or evening works well for most people.',
        },
      ];

      const schema = generateFAQPageSchema(questions);

      expect(schema.mainEntity).toHaveLength(3);
    });

    it('should handle empty questions array', () => {
      const schema = generateFAQPageSchema([]);

      expect(schema['@type']).toBe('FAQPage');
      expect(schema.mainEntity).toHaveLength(0);
    });
  });

  describe('Question Structure', () => {
    it('should format question correctly', () => {
      const questions = [
        {
          question: 'What is mindfulness?',
          answer: 'Mindfulness is present-moment awareness.',
        },
      ];

      const schema = generateFAQPageSchema(questions);
      const question = schema.mainEntity[0];

      expect(question['@type']).toBe('Question');
      expect(question.name).toBe('What is mindfulness?');
    });

    it('should preserve question text exactly', () => {
      const questionText = 'How do I start a meditation practice?';
      const questions = [
        {
          question: questionText,
          answer: 'Begin with simple breathing exercises.',
        },
      ];

      const schema = generateFAQPageSchema(questions);
      const question = schema.mainEntity[0];

      expect(question.name).toBe(questionText);
    });

    it('should handle questions with special characters', () => {
      const questions = [
        {
          question: "What's the difference between meditation & mindfulness?",
          answer: 'They are related but distinct practices.',
        },
      ];

      const schema = generateFAQPageSchema(questions);
      const question = schema.mainEntity[0];

      expect(question.name).toContain('&');
      expect(question.name).toContain("'");
    });

    it('should handle questions with quotes', () => {
      const questions = [
        {
          question: 'What does "mindfulness" really mean?',
          answer: 'It means being fully present.',
        },
      ];

      const schema = generateFAQPageSchema(questions);
      const question = schema.mainEntity[0];

      expect(question.name).toContain('"');
    });
  });

  describe('Answer Structure', () => {
    it('should format answer correctly', () => {
      const questions = [
        {
          question: 'What is yoga?',
          answer: 'Yoga is a physical and spiritual practice.',
        },
      ];

      const schema = generateFAQPageSchema(questions);
      const answer = schema.mainEntity[0].acceptedAnswer;

      expect(answer['@type']).toBe('Answer');
      expect(answer.text).toBe('Yoga is a physical and spiritual practice.');
    });

    it('should preserve answer text exactly', () => {
      const answerText = 'Start with 5-10 minutes of focused breathing daily.';
      const questions = [
        {
          question: 'How should beginners start?',
          answer: answerText,
        },
      ];

      const schema = generateFAQPageSchema(questions);
      const answer = schema.mainEntity[0].acceptedAnswer;

      expect(answer.text).toBe(answerText);
    });

    it('should handle long answers', () => {
      const longAnswer =
        'Meditation has numerous benefits including reduced stress, improved focus, better emotional regulation, ' +
        'enhanced self-awareness, improved sleep quality, reduced anxiety, and increased overall well-being. ' +
        'Regular practice can lead to lasting changes in brain structure and function.';

      const questions = [
        {
          question: 'What are the benefits?',
          answer: longAnswer,
        },
      ];

      const schema = generateFAQPageSchema(questions);
      const answer = schema.mainEntity[0].acceptedAnswer;

      expect(answer.text).toBe(longAnswer);
      expect(answer.text.length).toBeGreaterThan(100);
    });

    it('should handle answers with line breaks', () => {
      const questions = [
        {
          question: 'What are the steps?',
          answer: 'Step 1: Find a quiet place\nStep 2: Sit comfortably\nStep 3: Focus on breathing',
        },
      ];

      const schema = generateFAQPageSchema(questions);
      const answer = schema.mainEntity[0].acceptedAnswer;

      expect(answer.text).toContain('\n');
    });

    it('should handle answers with special characters', () => {
      const questions = [
        {
          question: 'What about symbols?',
          answer: 'Use techniques like: breathing (★), walking (☀), and sitting (✓).',
        },
      ];

      const schema = generateFAQPageSchema(questions);
      const answer = schema.mainEntity[0].acceptedAnswer;

      expect(answer.text).toContain('★');
      expect(answer.text).toContain('☀');
      expect(answer.text).toContain('✓');
    });
  });

  describe('Multiple Questions', () => {
    it('should maintain order of questions', () => {
      const questions = [
        { question: 'First question?', answer: 'First answer' },
        { question: 'Second question?', answer: 'Second answer' },
        { question: 'Third question?', answer: 'Third answer' },
      ];

      const schema = generateFAQPageSchema(questions);

      expect(schema.mainEntity[0].name).toBe('First question?');
      expect(schema.mainEntity[1].name).toBe('Second question?');
      expect(schema.mainEntity[2].name).toBe('Third question?');
    });

    it('should handle recommended number of questions (3-10)', () => {
      const questions = Array.from({ length: 7 }, (_, i) => ({
        question: `Question ${i + 1}?`,
        answer: `Answer ${i + 1}`,
      }));

      const schema = generateFAQPageSchema(questions);

      expect(schema.mainEntity).toHaveLength(7);
      expect(schema.mainEntity.length).toBeGreaterThanOrEqual(3);
      expect(schema.mainEntity.length).toBeLessThanOrEqual(10);
    });

    it('should handle minimum questions (1)', () => {
      const questions = [
        { question: 'Single question?', answer: 'Single answer' },
      ];

      const schema = generateFAQPageSchema(questions);

      expect(schema.mainEntity).toHaveLength(1);
    });

    it('should handle maximum recommended questions (10)', () => {
      const questions = Array.from({ length: 10 }, (_, i) => ({
        question: `Question ${i + 1}?`,
        answer: `Answer ${i + 1}`,
      }));

      const schema = generateFAQPageSchema(questions);

      expect(schema.mainEntity).toHaveLength(10);
    });

    it('should handle more than recommended questions', () => {
      const questions = Array.from({ length: 15 }, (_, i) => ({
        question: `Question ${i + 1}?`,
        answer: `Answer ${i + 1}`,
      }));

      const schema = generateFAQPageSchema(questions);

      // Should still generate schema, just not optimal for SEO
      expect(schema.mainEntity).toHaveLength(15);
      expect(schema.mainEntity.length).toBeGreaterThan(10);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should generate schema for meditation course FAQs', () => {
      const questions = [
        {
          question: 'What will I learn in this meditation course?',
          answer:
            'You will learn fundamental meditation techniques, breathing exercises, mindfulness practices, ' +
            'and how to integrate meditation into your daily life.',
        },
        {
          question: 'Do I need any prior experience?',
          answer: 'No prior experience is necessary. This course is designed for complete beginners.',
        },
        {
          question: 'How long is the course?',
          answer: 'The course is 6 weeks long with 2-3 hours of content per week.',
        },
        {
          question: 'Can I access the course materials after completion?',
          answer: 'Yes, you have lifetime access to all course materials and future updates.',
        },
      ];

      const schema = generateFAQPageSchema(questions);

      expect(schema['@type']).toBe('FAQPage');
      expect(schema.mainEntity).toHaveLength(4);

      // Verify all questions are present
      const questionNames = schema.mainEntity.map((q: any) => q.name);
      expect(questionNames).toContain('What will I learn in this meditation course?');
      expect(questionNames).toContain('Do I need any prior experience?');
    });

    it('should generate schema for event FAQs', () => {
      const questions = [
        {
          question: 'Where is the retreat located?',
          answer: 'The retreat is held at our peaceful center in the mountains.',
        },
        {
          question: 'What should I bring?',
          answer: 'Comfortable clothing, a meditation cushion (if you have one), and an open mind.',
        },
        {
          question: 'Is food provided?',
          answer: 'Yes, all meals are included. We offer vegetarian and vegan options.',
        },
      ];

      const schema = generateFAQPageSchema(questions);

      expect(schema.mainEntity).toHaveLength(3);
      expect(schema.mainEntity[0].acceptedAnswer.text).toContain('mountains');
    });

    it('should generate schema for product FAQs', () => {
      const questions = [
        {
          question: 'What format is the meditation guide in?',
          answer: 'The guide is available as a PDF download with accompanying MP3 audio files.',
        },
        {
          question: 'Can I get a refund?',
          answer: 'Yes, we offer a 30-day money-back guarantee if you are not satisfied.',
        },
      ];

      const schema = generateFAQPageSchema(questions);

      expect(schema.mainEntity).toHaveLength(2);
      expect(schema.mainEntity[1].acceptedAnswer.text).toContain('30-day');
    });
  });

  describe('Schema Structure Validation', () => {
    it('should include required @context', () => {
      const questions = [
        { question: 'Test?', answer: 'Test answer' },
      ];

      const schema = generateFAQPageSchema(questions);

      expect(schema['@context']).toBeDefined();
      expect(schema['@context']).toBe('https://schema.org');
    });

    it('should include required @type', () => {
      const questions = [
        { question: 'Test?', answer: 'Test answer' },
      ];

      const schema = generateFAQPageSchema(questions);

      expect(schema['@type']).toBeDefined();
      expect(schema['@type']).toBe('FAQPage');
    });

    it('should include mainEntity array', () => {
      const questions = [
        { question: 'Test?', answer: 'Test answer' },
      ];

      const schema = generateFAQPageSchema(questions);

      expect(schema.mainEntity).toBeDefined();
      expect(Array.isArray(schema.mainEntity)).toBe(true);
    });

    it('should have correct Question type', () => {
      const questions = [
        { question: 'Test?', answer: 'Test answer' },
      ];

      const schema = generateFAQPageSchema(questions);
      const question = schema.mainEntity[0];

      expect(question['@type']).toBe('Question');
    });

    it('should have correct Answer type', () => {
      const questions = [
        { question: 'Test?', answer: 'Test answer' },
      ];

      const schema = generateFAQPageSchema(questions);
      const answer = schema.mainEntity[0].acceptedAnswer;

      expect(answer['@type']).toBe('Answer');
    });

    it('should not include extra properties', () => {
      const questions = [
        { question: 'Test?', answer: 'Test answer' },
      ];

      const schema = generateFAQPageSchema(questions);

      // Should only have @context, @type, and mainEntity
      const keys = Object.keys(schema);
      expect(keys).toEqual(['@context', '@type', 'mainEntity']);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty question text', () => {
      const questions = [
        { question: '', answer: 'Answer without question' },
      ];

      const schema = generateFAQPageSchema(questions);
      const question = schema.mainEntity[0];

      expect(question.name).toBe('');
    });

    it('should handle empty answer text', () => {
      const questions = [
        { question: 'Question without answer?', answer: '' },
      ];

      const schema = generateFAQPageSchema(questions);
      const answer = schema.mainEntity[0].acceptedAnswer;

      expect(answer.text).toBe('');
    });

    it('should handle very long question', () => {
      const longQuestion =
        'What are all the different types of meditation practices available and which one ' +
        'would be most suitable for a complete beginner who is looking to reduce stress and ' +
        'improve focus and concentration in their daily life?';

      const questions = [
        { question: longQuestion, answer: 'Start with mindfulness meditation.' },
      ];

      const schema = generateFAQPageSchema(questions);
      const question = schema.mainEntity[0];

      expect(question.name).toBe(longQuestion);
      expect(question.name.length).toBeGreaterThan(100);
    });

    it('should handle Unicode characters', () => {
      const questions = [
        {
          question: '¿Qué es la meditación? 🧘',
          answer: 'La meditación es una práctica de mindfulness. ✨',
        },
      ];

      const schema = generateFAQPageSchema(questions);

      expect(schema.mainEntity[0].name).toContain('¿');
      expect(schema.mainEntity[0].name).toContain('🧘');
      expect(schema.mainEntity[0].acceptedAnswer.text).toContain('✨');
    });

    it('should handle HTML entities in text', () => {
      const questions = [
        {
          question: 'What &amp; who?',
          answer: 'This &lt;practice&gt; helps everyone.',
        },
      ];

      const schema = generateFAQPageSchema(questions);

      expect(schema.mainEntity[0].name).toContain('&amp;');
      expect(schema.mainEntity[0].acceptedAnswer.text).toContain('&lt;');
    });

    it('should handle numbers in questions and answers', () => {
      const questions = [
        {
          question: 'How many days in 2025?',
          answer: 'There are 365 days in 2025.',
        },
      ];

      const schema = generateFAQPageSchema(questions);

      expect(schema.mainEntity[0].name).toContain('2025');
      expect(schema.mainEntity[0].acceptedAnswer.text).toContain('365');
    });
  });

  describe('JSON-LD Compatibility', () => {
    it('should be valid JSON when stringified', () => {
      const questions = [
        { question: 'Test?', answer: 'Test answer' },
      ];

      const schema = generateFAQPageSchema(questions);

      expect(() => JSON.stringify(schema)).not.toThrow();

      const jsonString = JSON.stringify(schema);
      expect(jsonString).toContain('"@context"');
      expect(jsonString).toContain('"@type"');
    });

    it('should be parseable back from JSON', () => {
      const questions = [
        { question: 'Test?', answer: 'Test answer' },
      ];

      const schema = generateFAQPageSchema(questions);
      const jsonString = JSON.stringify(schema);
      const parsed = JSON.parse(jsonString);

      expect(parsed['@type']).toBe('FAQPage');
      expect(parsed.mainEntity).toHaveLength(1);
    });

    it('should maintain structure after JSON round-trip', () => {
      const questions = [
        {
          question: 'Original question?',
          answer: 'Original answer',
        },
      ];

      const schema = generateFAQPageSchema(questions);
      const jsonString = JSON.stringify(schema);
      const parsed = JSON.parse(jsonString);

      expect(parsed).toEqual(schema);
    });
  });

  describe('Google Rich Results Compliance', () => {
    it('should meet minimum requirements for FAQ rich results', () => {
      const questions = [
        {
          question: 'What is required for FAQ rich results?',
          answer: 'FAQPage with Questions and Answers.',
        },
      ];

      const schema = generateFAQPageSchema(questions);

      // Check required properties
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('FAQPage');
      expect(schema.mainEntity).toBeDefined();
      expect(Array.isArray(schema.mainEntity)).toBe(true);

      const question = schema.mainEntity[0];
      expect(question['@type']).toBe('Question');
      expect(question.name).toBeDefined();
      expect(question.acceptedAnswer).toBeDefined();

      const answer = question.acceptedAnswer;
      expect(answer['@type']).toBe('Answer');
      expect(answer.text).toBeDefined();
    });

    it('should use correct Schema.org context URL', () => {
      const questions = [
        { question: 'Test?', answer: 'Test answer' },
      ];

      const schema = generateFAQPageSchema(questions);

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@context']).not.toBe('http://schema.org');
    });

    it('should use correct type names', () => {
      const questions = [
        { question: 'Test?', answer: 'Test answer' },
      ];

      const schema = generateFAQPageSchema(questions);

      // Type names are case-sensitive in Schema.org
      expect(schema['@type']).toBe('FAQPage');
      expect(schema['@type']).not.toBe('faqPage');
      expect(schema['@type']).not.toBe('FaqPage');

      const question = schema.mainEntity[0];
      expect(question['@type']).toBe('Question');

      const answer = question.acceptedAnswer;
      expect(answer['@type']).toBe('Answer');
    });
  });
});
