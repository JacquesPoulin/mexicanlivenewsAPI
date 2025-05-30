import { testUrl, testText } from './functions.js';

describe('Helper Functions', () => {
  describe('testUrl(url, base)', () => {
    it('should return the original url if it already contains the base', () => {
      expect(testUrl('http://example.com/page', 'http://example.com')).toBe('http://example.com/page');
    });

    it('should return base + url if url does not contain the base', () => {
      expect(testUrl('/page', 'http://example.com')).toBe('http://example.com/page');
    });

    it('should return base if url is empty', () => {
      expect(testUrl('', 'http://example.com')).toBe('http://example.com');
    });

    it('should return url if base is empty', () => {
      expect(testUrl('/page', '')).toBe('/page');
      expect(testUrl('http://another.com/path', '')).toBe('http://another.com/path');
    });
  });

  describe('testText(title)', () => {
    it('should return placeholder for title with <picture> tag', () => {
      expect(testText('Title with <picture>some image</picture>'))
        .toBe('[Image in title - Original title not displayed]');
    });

    it('should return placeholder for title with <img> tag', () => {
      expect(testText('Title with <img src="image.jpg">'))
        .toBe('[Image in title - Original title not displayed]');
    });

    it('should return original title if no image tags are present', () => {
      expect(testText('A normal title')).toBe('A normal title');
    });

    it('should return an empty string if title is empty', () => {
      expect(testText('')).toBe('');
    });

    it('should return original title for title with other html tags', () => {
      expect(testText('Title with <b>bold</b> text')).toBe('Title with <b>bold</b> text');
    });
  });
});
