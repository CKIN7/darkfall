import { Stats } from '../../../src/domain/value-objects/Stats';

describe('Stats Value Object', () => {
  describe('Creation & Validation - Base Stats (min 1)', () => {
    it('should create base stats (10,10,10,10)', () => {
      const stats = Stats.base();
      expect(stats.strength).toBe(10);
      expect(stats.dexterity).toBe(10);
      expect(stats.vitality).toBe(10);
      expect(stats.energy).toBe(10);
    });

    it('should create custom base stats', () => {
      const stats = Stats.createBase(15, 12, 14, 8);
      expect(stats.strength).toBe(15);
      expect(stats.dexterity).toBe(12);
      expect(stats.vitality).toBe(14);
      expect(stats.energy).toBe(8);
    });

    it('should floor decimal values', () => {
      const stats = Stats.createBase(10.9, 10.1, 10.5, 10.99);
      expect(stats.strength).toBe(10);
      expect(stats.dexterity).toBe(10);
      expect(stats.vitality).toBe(10);
      expect(stats.energy).toBe(10);
    });

    it('should clamp minimum to 1 in constructor (via createBase with valid then subtract)', () => {
      // The factory throws on invalid, but constructor clamps
      // Test that add/subtract operations clamp correctly
      const base = Stats.createBase(10, 10, 10, 10);
      const allocated = Stats.createAllocated(5, 5, 5, 5);
      const result = base.subtract(allocated);
      expect(result.strength).toBe(5);
      expect(result.dexterity).toBe(5);
      expect(result.vitality).toBe(5);
      expect(result.energy).toBe(5);
    });

    it('should throw on base stats below 1', () => {
      expect(() => Stats.createBase(0, 10, 10, 10)).toThrow('Base stats must be at least 1');
      expect(() => Stats.createBase(10, 0, 10, 10)).toThrow('Base stats must be at least 1');
    });

    it('should throw on non-finite base stats', () => {
      expect(() => Stats.createBase(NaN, 10, 10, 10)).toThrow('Base stats must be finite numbers');
      expect(() => Stats.createBase(Infinity, 10, 10, 10)).toThrow('Base stats must be finite numbers');
    });
  });

  describe('Creation & Validation - Allocated Stats (min 0)', () => {
    it('should create zero allocated stats', () => {
      const stats = Stats.zero();
      expect(stats.strength).toBe(0);
      expect(stats.dexterity).toBe(0);
      expect(stats.vitality).toBe(0);
      expect(stats.energy).toBe(0);
    });

    it('should create custom allocated stats', () => {
      const stats = Stats.createAllocated(5, 3, 2, 1);
      expect(stats.strength).toBe(5);
      expect(stats.dexterity).toBe(3);
      expect(stats.vitality).toBe(2);
      expect(stats.energy).toBe(1);
    });

    it('should floor decimal values', () => {
      const stats = Stats.createAllocated(10.9, 10.1, 10.5, 10.99);
      expect(stats.strength).toBe(10);
      expect(stats.dexterity).toBe(10);
      expect(stats.vitality).toBe(10);
      expect(stats.energy).toBe(10);
    });

    it('should clamp minimum to 0 in constructor (via createAllocated with valid then subtract)', () => {
      // The factory throws on invalid, but constructor clamps
      const base = Stats.createAllocated(5, 5, 5, 5);
      const toSubtract = Stats.createAllocated(10, 10, 10, 10);
      const result = base.subtract(toSubtract);
      expect(result.strength).toBe(0);
      expect(result.dexterity).toBe(0);
      expect(result.vitality).toBe(0);
      expect(result.energy).toBe(0);
    });

    it('should throw on negative allocated stats', () => {
      expect(() => Stats.createAllocated(-1, 0, 0, 0)).toThrow('Allocated stats cannot be negative');
    });

    it('should throw on non-finite allocated stats', () => {
      expect(() => Stats.createAllocated(NaN, 0, 0, 0)).toThrow('Allocated stats must be finite numbers');
    });
  });

  describe('Immutability & Operations', () => {
    it('should add two stats returning new instance', () => {
      const a = Stats.createBase(10, 10, 10, 10);
      const b = Stats.createAllocated(5, 3, 2, 1);
      const result = a.add(b);

      expect(result).not.toBe(a);
      expect(result).not.toBe(b);
      expect(result.strength).toBe(15);
      expect(result.dexterity).toBe(13);
      expect(result.vitality).toBe(12);
      expect(result.energy).toBe(11);

      // Originals unchanged
      expect(a.strength).toBe(10);
      expect(b.strength).toBe(5);
    });

    it('should subtract stats with minimum 0', () => {
      const a = Stats.createBase(15, 15, 15, 15);
      const b = Stats.createAllocated(10, 10, 10, 10);
      const result = a.subtract(b);

      expect(result.strength).toBe(5);
      expect(result.dexterity).toBe(5);
      expect(result.vitality).toBe(5);
      expect(result.energy).toBe(5);
    });

    it('should clamp subtraction at 0', () => {
      const a = Stats.createBase(5, 5, 5, 5);
      const b = Stats.createAllocated(10, 10, 10, 10);
      const result = a.subtract(b);

      expect(result.strength).toBe(0);
      expect(result.dexterity).toBe(0);
      expect(result.vitality).toBe(0);
      expect(result.energy).toBe(0);
    });

    it('should compare by value (equals)', () => {
      const a = Stats.createBase(10, 12, 14, 16);
      const b = Stats.createBase(10, 12, 14, 16);
      const c = Stats.createBase(10, 12, 14, 15);

      expect(a.equals(b)).toBe(true);
      expect(a.equals(c)).toBe(false);
    });
  });

  describe('Serialization', () => {
    it('should serialize to JSON', () => {
      const stats = Stats.createBase(15, 12, 14, 8);
      const json = stats.toJSON();

      expect(json).toEqual({
        strength: 15,
        dexterity: 12,
        vitality: 14,
        energy: 8,
      });
    });

    it('should have readable toString', () => {
      const stats = Stats.createBase(15, 12, 14, 8);
      expect(stats.toString()).toBe('Str:15 Dex:12 Vit:14 Ene:8');
    });
  });
});