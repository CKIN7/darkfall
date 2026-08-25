import { Hero } from '../../../src/domain/entities/Hero';
import { HeroClass, HeroClassType } from '../../../src/domain/enums/HeroClass';
import { Stats } from '../../../src/domain/value-objects/Stats';
import {
  InvalidLevelUpError,
  InsufficientAttributePointsError,
  MaxLevelReachedError,
  InvalidHeroNameError,
} from '../../../src/domain/errors/HeroErrors';
import { GAME_CONSTANTS } from '../../../src/domain/entities/Hero';

describe('Hero Entity', () => {
  describe('Creation', () => {
    it('should create warrior with class base stats', () => {
      const hero = Hero.create('TestHero', HeroClass.WARRIOR);
      expect(hero.name).toBe('TestHero');
      expect(hero.classType).toBe(HeroClass.WARRIOR);
      expect(hero.level).toBe(1);
      expect(hero.experience).toBe(0);
      expect(hero.attributePointsAvailable).toBe(0);
      expect(hero.baseStats.strength).toBe(12);
      expect(hero.baseStats.dexterity).toBe(8);
      expect(hero.baseStats.vitality).toBe(12);
      expect(hero.baseStats.energy).toBe(8);
    });

    it('should create mage with class base stats', () => {
      const hero = Hero.create('MageHero', HeroClass.MAGE);
      expect(hero.baseStats.strength).toBe(6);
      expect(hero.baseStats.dexterity).toBe(8);
      expect(hero.baseStats.vitality).toBe(8);
      expect(hero.baseStats.energy).toBe(18);
    });

    it('should create rogue with class base stats', () => {
      const hero = Hero.create('RogueHero', HeroClass.ROGUE);
      expect(hero.baseStats.strength).toBe(8);
      expect(hero.baseStats.dexterity).toBe(14);
      expect(hero.baseStats.vitality).toBe(8);
      expect(hero.baseStats.energy).toBe(10);
    });

    it('should default to warrior if no class provided', () => {
      const hero = Hero.create('DefaultHero');
      expect(hero.classType).toBe(HeroClass.WARRIOR);
    });

    it('should generate unique ID', () => {
      const hero1 = Hero.create('Hero1');
      const hero2 = Hero.create('Hero2');
      expect(hero1.id.equals(hero2.id)).toBe(false);
    });

    it('should initialize HP/Mana to max', () => {
      const hero = Hero.create('Hero', HeroClass.WARRIOR); // vit=12, ene=8
      expect(hero.currentHp).toBe(hero.maxHp);
      expect(hero.currentMana).toBe(hero.maxMana);
      expect(hero.maxHp).toBe(120); // 12 * 10
      expect(hero.maxMana).toBe(40); // 8 * 5
    });
  });

  describe('Name Validation', () => {
    it('should throw on empty name', () => {
      expect(() => Hero.create('')).toThrow(InvalidHeroNameError);
      expect(() => Hero.create('   ')).toThrow(InvalidHeroNameError);
    });

    it('should throw on too short name', () => {
      expect(() => Hero.create('A')).toThrow(InvalidHeroNameError);
    });

    it('should throw on too long name', () => {
      expect(() => Hero.create('A'.repeat(21))).toThrow(InvalidHeroNameError);
    });

    it('should throw on invalid characters', () => {
      expect(() => Hero.create('Hero@Name')).toThrow(InvalidHeroNameError);
      expect(() => Hero.create('Hero#Name')).toThrow(InvalidHeroNameError);
    });

    it('should accept valid characters', () => {
      expect(() => Hero.create('Hero_Name')).not.toThrow();
      expect(() => Hero.create('Hero-Name')).not.toThrow();
      expect(() => Hero.create('Hero Name')).not.toThrow();
      expect(() => Hero.create('Hero123')).not.toThrow();
    });

    it('should trim whitespace', () => {
      const hero = Hero.create('  TrimmedHero  ');
      expect(hero.name).toBe('TrimmedHero');
    });
  });

  describe('Experience & Level Up', () => {
    it('should calculate xp for next level correctly', () => {
      const hero = Hero.create('Hero');
      // Level 1: 1*100 + 1^2*10 = 110
      expect(hero.xpForNextLevel).toBe(110);

      // Simulate level 2
      hero.addExperience(110);
      // Level 2: 2*100 + 2^2*10 = 240
      expect(hero.xpForNextLevel).toBe(240);
    });

    it('should not gain xp at max level', () => {
      const hero = Hero.reconstruct(
        '550e8400-e29b-41d4-a716-446655440000',
        'Hero',
        HeroClass.WARRIOR,
        Stats.create(12, 8, 12, 8),
        Stats.create(0, 0, 0, 0),
        GAME_CONSTANTS.MAX_LEVEL,
        0,
        0
      );
      const result = hero.addExperience(10000);
      expect(result).toBe(false);
      expect(hero.experience).toBe(0);
    });

    it('should level up when xp threshold reached', () => {
      const hero = Hero.create('Hero');
      const leveledUp = hero.addExperience(110); // Exact xp for level 2

      expect(leveledUp).toBe(true);
      expect(hero.level).toBe(2);
      expect(hero.experience).toBe(0);
      expect(hero.attributePointsAvailable).toBe(5);
    });

    it('should handle multiple level ups at once', () => {
      const hero = Hero.create('Hero');
      // XP for level 2 (110) + level 3 (240) + level 4 (390) = 740
      const leveledUp = hero.addExperience(740);

      expect(leveledUp).toBe(true);
      expect(hero.level).toBe(4);
      expect(hero.attributePointsAvailable).toBe(15); // 3 levels * 5
    });

    it('should carry over excess xp', () => {
      const hero = Hero.create('Hero');
      // 110 for level 2 + 50 excess
      hero.addExperience(160);

      expect(hero.level).toBe(2);
      expect(hero.experience).toBe(50);
    });

    it('should emit levelUp event', () => {
      const hero = Hero.create('Hero');
      const events: any[] = [];
      hero.on('levelUp', (event: any) => events.push(event));

      hero.addExperience(110);

      expect(events).toHaveLength(1);
      expect(events[0].previousLevel).toBe(1);
      expect(events[0].newLevel).toBe(2);
      expect(events[0].attributePointsGained).toBe(5);
      expect(events[0].heroId.equals(hero.id)).toBe(true);
    });

    it('should not level up past max level', () => {
      const hero = Hero.reconstruct(
        '550e8400-e29b-41d4-a716-446655440000',
        'Hero',
        HeroClass.WARRIOR,
        Stats.create(12, 8, 12, 8),
        Stats.create(0, 0, 0, 0),
        GAME_CONSTANTS.MAX_LEVEL - 1,
        0,
        0
      );
      // Enough xp for 2 levels but max is 50
      hero.addExperience(10000);

      expect(hero.level).toBe(GAME_CONSTANTS.MAX_LEVEL);
    });
  });

  describe('Attribute Allocation', () => {
    let hero: Hero;

    beforeEach(() => {
      hero = Hero.create('Hero');
      hero.addExperience(110); // Level 2, 5 points available
    });

    it('should allocate points to single stat', () => {
      hero.allocateAttributePoints({ strength: 5 });
      expect(hero.allocatedStats.strength).toBe(5);
      expect(hero.attributePointsAvailable).toBe(0);
      expect(hero.totalBaseStats.strength).toBe(17); // 12 base + 5 allocated
    });

    it('should allocate points across multiple stats', () => {
      hero.allocateAttributePoints({ strength: 2, dexterity: 2, vitality: 1 });
      expect(hero.allocatedStats.strength).toBe(2);
      expect(hero.allocatedStats.dexterity).toBe(2);
      expect(hero.allocatedStats.vitality).toBe(1);
      expect(hero.allocatedStats.energy).toBe(0);
      expect(hero.attributePointsAvailable).toBe(0);
    });

    it('should throw when allocating more than available', () => {
      expect(() => hero.allocateAttributePoints({ strength: 6 })).toThrow(InsufficientAttributePointsError);
    });

    it('should throw when allocating negative points', () => {
      expect(() => hero.allocateAttributePoints({ strength: -1 })).toThrow(InvalidLevelUpError);
    });

    it('should throw when allocating zero total points', () => {
      expect(() => hero.allocateAttributePoints({})).toThrow(InvalidLevelUpError);
      expect(() => hero.allocateAttributePoints({ strength: 0 })).toThrow(InvalidLevelUpError);
    });

    it('should restore HP/Mana to max after vitality/energy increase', () => {
      // Damage hero first
      hero.takeDamage(50);
      expect(hero.currentHp).toBeLessThan(hero.maxHp);

      // Allocate to vitality
      hero.allocateAttributePoints({ vitality: 5 });

      // HP should be restored to new max
      expect(hero.currentHp).toBe(hero.maxHp);
      expect(hero.maxHp).toBe(170); // (12+5) * 10
    });
  });

  describe('Combat Stats', () => {
    it('should calculate base damage correctly', () => {
      // Warrior: str=12, baseDamage = 12*2 + 12*0.5 = 24 + 6 = 30
      const hero = Hero.create('Hero', HeroClass.WARRIOR);
      expect(hero.baseDamage).toBe(30);
    });

    it('should increase damage with allocated strength', () => {
      const hero = Hero.create('Hero', HeroClass.WARRIOR);
      hero.addExperience(110);
      hero.allocateAttributePoints({ strength: 5 }); // str = 17
      // 17*2 + 17*0.5 = 34 + 8.5 = 42.5
      expect(hero.baseDamage).toBe(42.5);
    });
  });

  describe('Combat Helpers', () => {
    it('should take damage and reduce HP', () => {
      const hero = Hero.create('Hero');
      const initialHp = hero.currentHp;
      const damage = hero.takeDamage(30);

      expect(damage).toBe(30);
      expect(hero.currentHp).toBe(initialHp - 30);
    });

    it('should not reduce HP below 0', () => {
      const hero = Hero.create('Hero');
      hero.takeDamage(hero.maxHp + 100);
      expect(hero.currentHp).toBe(0);
      expect(hero.isAlive).toBe(false);
    });

    it('should heal up to max HP', () => {
      const hero = Hero.create('Hero');
      hero.takeDamage(50);
      const healed = hero.heal(30);

      expect(healed).toBe(30);
      expect(hero.currentHp).toBe(hero.maxHp - 20);
    });

    it('should not heal above max HP', () => {
      const hero = Hero.create('Hero');
      hero.takeDamage(20);
      const healed = hero.heal(100);

      expect(healed).toBe(20);
      expect(hero.currentHp).toBe(hero.maxHp);
    });

    it('should restore full health and mana', () => {
      const hero = Hero.create('Hero');
      hero.takeDamage(50);
      hero._currentMana = 10; // Direct access for test

      hero.restoreFullHealth();

      expect(hero.currentHp).toBe(hero.maxHp);
      expect(hero.currentMana).toBe(hero.maxMana);
    });
  });

  describe('Reconstruction', () => {
    it('should reconstruct from persistence data', () => {
      const original = Hero.create('Hero', HeroClass.MAGE);
      original.addExperience(110);
      original.allocateAttributePoints({ energy: 5 });

      const data = original.toPersistence();
      const restored = Hero.reconstruct(
        data.id,
        data.name,
        data.classType,
        Stats.create(
          data.baseStats.strength,
          data.baseStats.dexterity,
          data.baseStats.vitality,
          data.baseStats.energy
        ),
        Stats.create(
          data.allocatedStats.strength,
          data.allocatedStats.dexterity,
          data.allocatedStats.vitality,
          data.allocatedStats.energy
        ),
        data.level,
        data.experience,
        data.attributePointsAvailable
      );

      expect(restored.id.equals(original.id)).toBe(true);
      expect(restored.name).toBe(original.name);
      expect(restored.classType).toBe(original.classType);
      expect(restored.level).toBe(original.level);
      expect(restored.experience).toBe(original.experience);
      expect(restored.attributePointsAvailable).toBe(original.attributePointsAvailable);
      expect(restored.totalBaseStats.equals(original.totalBaseStats)).toBe(true);
    });
  });

  describe('Serialization', () => {
    it('should serialize to persistence format', () => {
      const hero = Hero.create('Hero', HeroClass.WARRIOR);
      const data = hero.toPersistence();

      expect(data.id).toBe(hero.id.value);
      expect(data.name).toBe('Hero');
      expect(data.classType).toBe(HeroClass.WARRIOR);
      expect(data.level).toBe(1);
      expect(data.experience).toBe(0);
      expect(data.baseStats).toEqual(hero.baseStats.toJSON());
      expect(data.allocatedStats).toEqual(hero.allocatedStats.toJSON());
    });

    it('should serialize to response DTO with computed fields', () => {
      const hero = Hero.create('Hero', HeroClass.WARRIOR);
      const dto = hero.toResponseDTO();

      expect(dto.id).toBe(hero.id.value);
      expect(dto.totalStats).toEqual(hero.totalBaseStats.toJSON());
      expect(dto.maxHp).toBe(hero.maxHp);
      expect(dto.currentHp).toBe(hero.currentHp);
      expect(dto.maxMana).toBe(hero.maxMana);
      expect(dto.currentMana).toBe(hero.currentMana);
      expect(dto.baseDamage).toBe(hero.baseDamage);
      expect(dto.xpForNextLevel).toBe(110);
    });
  });
});