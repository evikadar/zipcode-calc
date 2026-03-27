import { BadRequestException } from '@nestjs/common';
import { CustomParseIntPipe } from './parse-int.pipe';

describe('CustomParseIntPipe', () => {
  let pipe: CustomParseIntPipe;

  beforeEach(() => {
    pipe = new CustomParseIntPipe();
  });

  describe('valid inputs', () => {
    it('should transform "0" to 0', () => {
      const result = pipe.transform('0');
      expect(result).toBe(0);
    });

    it('should transform "1" to 1', () => {
      const result = pipe.transform('1');
      expect(result).toBe(1);
    });

    it('should transform "100" to 100', () => {
      const result = pipe.transform('100');
      expect(result).toBe(100);
    });

    it('should transform "1011" (ZIP code) to 1011', () => {
      const result = pipe.transform('1011');
      expect(result).toBe(1011);
    });

    it('should transform large number "999999"', () => {
      const result = pipe.transform('999999');
      expect(result).toBe(999999);
    });

    it('should transform "550" (max quantity)', () => {
      const result = pipe.transform('550');
      expect(result).toBe(550);
    });
  });

  describe('invalid inputs', () => {
    it('should throw BadRequestException for negative number "-5"', () => {
      expect(() => pipe.transform('-5')).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for decimal "1.5"', () => {
      expect(() => pipe.transform('1.5')).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for text "abc"', () => {
      expect(() => pipe.transform('abc')).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for mixed "123abc"', () => {
      expect(() => pipe.transform('123abc')).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for mixed "abc123"', () => {
      expect(() => pipe.transform('abc123')).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for empty string', () => {
      expect(() => pipe.transform('')).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for space " "', () => {
      expect(() => pipe.transform(' ')).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for number with spaces "1 2"', () => {
      expect(() => pipe.transform('1 2')).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for special characters "!@#"', () => {
      expect(() => pipe.transform('!@#')).toThrow(BadRequestException);
    });

    it('should throw BadRequestException with correct message', () => {
      expect(() => pipe.transform('invalid')).toThrow(
        'For zip number and quantity we expect ONLY numbers. You provided something else in the URL.',
      );
    });
  });
});
