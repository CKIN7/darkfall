import { HeroId } from '../../../src/domain/value-objects/HeroId';

describe('HeroId Value Object', () => {
  describe('Generation', () => {
    it('should generate valid UUID v4', () => {
      const id = HeroId.generate();
      expect(id.value).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('should generate unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(HeroId.generate().value);
      }
      expect(ids.size).toBe(100);
    });
  });

  describe('Reconstruction', () => {
    it('should create from valid UUID string', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const id = HeroId.fromString(uuid);
      expect(id.value).toBe(uuid);
    });

    it('should throw on invalid format', () => {
      expect(() => HeroId.fromString('invalid')).toThrow('Invalid HeroId format');
      expect(() => HeroId.fromString('550e8400-e29b-41d4-a716')).toThrow('Invalid HeroId format');
      expect(() => HeroId.fromString('')).toThrow('Invalid HeroId format');
    });
  });

  describe('Equality & Serialization', () => {
    it('should compare by value', () => {
      const id1 = HeroId.fromString('550e8400-e29b-41d4-a716-446655440000');
      const id2 = HeroId.fromString('550e8400-e29b-41d4-a716-446655440000');
      const id3 = HeroId.fromString('550e8400-e29b-41d4-a716-446655440001');

      expect(id1.equals(id2)).toBe(true);
      expect(id1.equals(id3)).toBe(false);
    });

    it('should serialize to string', () => {
      const id = HeroId.fromString('550e8400-e29b-41d4-a716-446655440000');
      expect(id.toString()).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(id.toJSON()).toBe('550e8400-e29b-41d4-a716-446655440000');
    });
  });
});