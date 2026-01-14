import { describe, it, expect, beforeEach } from 'vitest';
import { normalizeItemData, sanitizeContent, createItemNode } from '../../src/js/features/data-loader.js';

describe('features/data-loader', () => {
  describe('normalizeItemData', () => {
    it('applies fallbacks for missing fields', () => {
      const input = { id: 1 };
      const result = normalizeItemData(input);
      expect(result).toHaveProperty('date');
      expect(result).toHaveProperty('heading');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('content');
    });

    it('preserves provided values', () => {
      const input = { id: 2, date: '01/01/2026', heading: 'Custom', summary: 'S' };
      const result = normalizeItemData(input);
      expect(result.date).toBe('01/01/2026');
      expect(result.heading).toBe('Custom');
      expect(result.summary).toBe('S');
    });
  });

  describe('sanitizeContent', () => {
    it('removes script tags', () => {
      const input = '<p>Safe</p><script>alert(1)</script>';
      const out = sanitizeContent(input);
      expect(out).not.toContain('<script>');
    });

    it('replaces h1/h2 with h3', () => {
      const input = '<h1>Hi</h1><h2>Sub</h2>';
      const out = sanitizeContent(input);
      expect(out).not.toContain('<h1>');
      expect(out).not.toContain('<h2>');
      expect(out).toContain('<h3>');
    });
  });

  describe('createItemNode', () => {
    beforeEach(() => {
      // Clean document body between tests
      document.body.innerHTML = '';
    });

    it('creates a DOM node with expected classes', () => {
      const item = { id: 42, date: '01/01/2026', heading: 'Test', summary: 'S', content: '<p>c</p>' };
      const node = createItemNode(item);
      expect(node.classList.contains('timeline__item')).toBe(true);
      expect(node.querySelector('.timeline__date')).toBeTruthy();
      expect(node.querySelector('.timeline__heading')).toBeTruthy();
      expect(node.querySelector('.timeline__modal-content')).toBeTruthy();
    });
  });
});
