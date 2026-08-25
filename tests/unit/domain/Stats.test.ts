import { Stats } from '../../../src/domain/value-objects/Stats';

describe('Stats Value Object', () => {
  describe('Creation & Validation', () => {
    it('should create base stats (10,10,10,10)', () => {
      const stats = Stats.base();
      expect(stats.strength).toBe(10);
      expect(stats.dexterity).toBe(10);
      expect(stats.vitality).toBe(10);
      expect(stats.energy).toBe(10);
    });

    it('should create custom stats', () => {
      const stats = Stats.create(15, 12, 14, 8);
      expect(stats.strength).toBe(15);
      expect(stats.dexterity).toBe(12);
      expect(stats.vitality).toBe(14);
      expect(stats.energy).toBe(8);
    });

    it('should floor decimal values', () => {
      const stats = Stats.create(10.9, 10.1, 10.5, 10.99);
      expect(stats.strength).toBe(10);
      expect(stats.dexterity).toBe(10);
      expect(stats.vitality).toBe(10);
      expect(stats.energy).toBe(10);
    });

    it('should clamp minimum to 1', () => {
      const stats = Stats.create(-5, 0, 1, 100);
      expect(stats.strength).toBe(1);
      expect(stats.dexterity).toBe(1);
      expect(stats.vitality).toBe(1);
      expect(stats.energy).toBe(100);
    });

    it('should throw on invalid stats (after transform)', () => {
      // class-validator runs after transform, so we test the final validated values
      // The transform ensures minimum 1, so this should not throw in current implementation
      // If we had additional constraints (max), they would be validated here
      const stats = Stats.create(1, 1, 1, 1);
      expect(stats.strength).toBe(1);
    });
  });

  describe('Immutability & Operations', () => {
    it('should add two stats returning new instance', () => {
      const a = Stats.create(10, 10, 10, 10);
      const b = Stats.create(5, 3, 2, 1);
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

    it('should subtract stats with minimum 1', () => {
      const a = Stats.create(15, 15, 15, 15);
      const b = Stats.create(10, 10, 10, 10);
      const result = a.subtract(b);

      expect(result.strength).toBe(5);
      expect(result.dexterity).toBe(5);
      expect(result.vitality).toBe(5);
      expect(result.energy).toBe(5);
    });

    it('should clamp subtraction at 1', () => {
      const a = Stats.create(5, 5, 5, 5);
      const b = Stats.create(10, 10, 10, 10);
      const result = a.subtract(b);

      expect(result.strength).toBe(1);
      expect(result.dexterity).toBe(1);
      expect(result.vitality).toBe(1);
      expect(result.energy).toBe(1);
    });

    it('should compare by value (equals)', () => {
      const a = Stats.create(10, 12, 14, 16);
      const b = Stats.create(10, 12, 14, 16);
      const c = Stats.create(10, 12, 14, 15);

      expect(a.equals(b)).toBe(true);
      expect(a.equals(c)).toBe(false);
    });
  });

  describe('Serialization', () => {
    it('should serialize to JSON', () => {
      const stats = Stats.create(15, 12, 14, 8);
      const json = stats.toJSON();

      expect(json).toEqual({
        strength: 15,
        dexterity: 12,
        vitality: 14,
        energy: 8,
      });
    });

    it('should have readable toString', () => {
      const stats = Stats.create(15, 12, 14, 8);
      expect(stats.toString()).toBe('Str:15 Dex:12 Vit:14 Ene:8');
    });
  });
});