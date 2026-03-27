import { BadRequestException } from '@nestjs/common';
import { ParseBoolPipe } from './parse-bool.pipe';

describe('ParseBoolPipe', () => {
  let pipe: ParseBoolPipe;

  beforeEach(() => {
    pipe = new ParseBoolPipe();
  });

  describe('valid inputs', () => {
    it('should transform "true" string to true boolean', () => {
      const result = pipe.transform('true');
      expect(result).toBe(true);
    });

    it('should transform "false" string to false boolean', () => {
      const result = pipe.transform('false');
      expect(result).toBe(false);
    });

    it('should handle uppercase "TRUE"', () => {
      const result = pipe.transform('TRUE');
      expect(result).toBe(true);
    });

    it('should handle uppercase "FALSE"', () => {
      const result = pipe.transform('FALSE');
      expect(result).toBe(false);
    });

    it('should handle mixed case "TrUe"', () => {
      const result = pipe.transform('TrUe');
      expect(result).toBe(true);
    });

    it('should handle mixed case "FaLsE"', () => {
      const result = pipe.transform('FaLsE');
      expect(result).toBe(false);
    });
  });

  describe('invalid inputs', () => {
    it('should throw BadRequestException for "1"', () => {
      expect(() => pipe.transform('1')).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for "0"', () => {
      expect(() => pipe.transform('0')).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for "yes"', () => {
      expect(() => pipe.transform('yes')).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for "no"', () => {
      expect(() => pipe.transform('no')).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for empty string', () => {
      expect(() => pipe.transform('')).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for random string', () => {
      expect(() => pipe.transform('random')).toThrow(BadRequestException);
    });

    it('should throw BadRequestException with correct message', () => {
      expect(() => pipe.transform('invalid')).toThrow(
        'The true/false param in the URL is not valid. We accept true or false.',
      );
    });
  });
});
