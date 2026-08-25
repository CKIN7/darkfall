import { EventEmitter } from 'events';
import { Stats } from '../value-objects/Stats';
import { HeroId } from '../value-objects/HeroId';
import { HeroClass, HeroClassType, BASE_STATS_BY_CLASS } from '../enums/HeroClass';
import {
  InvalidLevelUpError,
  InsufficientAttributePointsError,
  InvalidHeroNameError,
} from '../errors/HeroErrors';

/**
 * Constantes de juego - Fórmulas de progresión
 * Centralizadas aquí para fácil balanceo y testing
 */
export const GAME_CONSTANTS = {
  MAX_LEVEL: 50,
  BASE_XP_FORMULA: (level: number): number => level * 100 + level * level * 10,
  ATTRIBUTE_POINTS_PER_LEVEL: 5,
  HP_PER_VITALITY: 10,
  MANA_PER_ENERGY: 5,
  BASE_DAMAGE_MULTIPLIER: 2,
  BASE_DAMAGE_STRENGTH_BONUS: 0.5,
} as const;

/**
 * Domain Event: HeroLevelUp
 *
 * PATRÓN: Domain Event (Observer Pattern)
 * POR QUÉ: Desacopla side effects del level up (logging, achievements,
 * notificaciones WebSocket futuras, persistencia).
 * El dominio emite evento, la capa aplicación decide qué hacer.
 *
 * DECISIÓN: Clase simple con datos necesarios, no lógica.
 * ALTERNATIVAS DESCARTADAS:
 * - Callback en levelUp(): acopla dominio a infraestructura
 * - Promise return: mezcla async en dominio síncrono
 * - EventEmitter en entidad: acopla a Node.js, difícil testear
 */
export class HeroLevelUpEvent {
  public readonly heroId: HeroId;
  public readonly previousLevel: number;
  public readonly newLevel: number;
  public readonly attributePointsGained: number;
  public readonly timestamp: Date;

  constructor(
    heroId: HeroId,
    previousLevel: number,
    newLevel: number,
    attributePointsGained: number
  ) {
    this.heroId = heroId;
    this.previousLevel = previousLevel;
    this.newLevel = newLevel;
    this.attributePointsGained = attributePointsGained;
    this.timestamp = new Date();
  }
}

/**
 * Entidad: Hero
 *
 * PATRÓN: Entity (DDD) + Rich Domain Model
 * POR QUÉ: Encapsula estado E invariantes de negocio.
 * Métodos expresan comportamiento (levelUp, addExperience)
 * no solo setters/getters (anemic model).
 *
 * RESPONSABILIDADES:
 * - Identidad (HeroId)
 * - Stats base + calculados (con items equipados)
 * - Progresión: XP, nivel, puntos de atributo
 * - Health/Mana actuales y máximos
 * - Validaciones de negocio (level up, distribución puntos)
 *
 * NO RESPONSABILIDADES:
 * - Persistencia (Repository)
 * - HTTP/Serialization (DTOs)
 * - Logging (Application/Infrastructure)
 *
 * ALTERNATIVAS DESCARTADAS:
 * - Anemic model (solo datos + service con lógica): lógica dispersa, difícil de mantener invariantes
 * - Active Record (métodos save/find en entidad): acopla a BD, viola SRP
 * - Service con toda lógica: entidad se vuelve DTO, pierde encapsulamiento
 */
export class Hero extends EventEmitter {
  public readonly id: HeroId;
  public readonly name: string;
  public readonly classType: HeroClassType;

  private _baseStats: Stats;
  private _allocatedStats: Stats; // Puntos distribuidos al subir nivel
  private _level: number;
  private _experience: number;
  private _attributePointsAvailable: number;

  // Estado de combate (runtime, no persistido en BD necesariamente)
  private _currentHp: number;
  private _currentMana: number;

  private constructor(
    id: HeroId,
    name: string,
    classType: HeroClassType,
    baseStats: Stats,
    allocatedStats: Stats,
    level: number,
    experience: number,
    attributePointsAvailable: number
  ) {
    super();
    this.id = id;
    this.name = name;
    this.classType = classType;
    this._baseStats = baseStats;
    this._allocatedStats = allocatedStats;
    this._level = level;
    this._experience = experience;
    this._attributePointsAvailable = attributePointsAvailable;

    // Inicializar HP/Mana al máximo
    this._currentHp = this.maxHp;
    this._currentMana = this.maxMana;
  }

  /**
   * Factory: Crea nuevo héroe nivel 1
   * PATRÓN: Factory Method (en Entity)
   * POR QUÉ: Centraliza creación compleja, garantiza invariantes iniciales.
   * Usa Stats.base() y BASE_STATS_BY_CLASS para stats iniciales.
   */
  static create(name: string, classType: HeroClassType = HeroClass.WARRIOR): Hero {
    if (!name || name.trim().length < 2) {
      throw new InvalidHeroNameError('Name must be at least 2 characters');
    }
    if (name.trim().length > 20) {
      throw new InvalidHeroNameError('Name must be at most 20 characters');
    }
    if (!/^[a-zA-Z0-9_\-\s]+$/.test(name)) {
      throw new InvalidHeroNameError('Name contains invalid characters');
    }

    const classBaseStats = BASE_STATS_BY_CLASS[classType];
    const baseStats = Stats.createBase(
      classBaseStats.strength,
      classBaseStats.dexterity,
      classBaseStats.vitality,
      classBaseStats.energy
    );

    return new Hero(
      HeroId.generate(),
      name.trim(),
      classType,
      baseStats,
      Stats.zero(), // Sin puntos分配ados aún
      1, // Nivel 1
      0, // 0 XP
      0 // Sin puntos disponibles hasta primer level up
    );
  }

  /**
   * Factory: Reconstruye héroe desde persistencia (BD)
   * PATRÓN: Factory Method (Reconstruction)
   * POR QUÉ: Controla reconstrucción, valida integridad de datos.
   */
  static reconstruct(
    id: string,
    name: string,
    classType: HeroClassType,
    baseStats: Stats,
    allocatedStats: Stats,
    level: number,
    experience: number,
    attributePointsAvailable: number
  ): Hero {
    return new Hero(
      HeroId.fromString(id),
      name,
      classType,
      baseStats,
      allocatedStats,
      level,
      experience,
      attributePointsAvailable
    );
  }

  // ========== GETTERS (Read-only access) ==========

  get level(): number {
    return this._level;
  }

  get experience(): number {
    return this._experience;
  }

  get attributePointsAvailable(): number {
    return this._attributePointsAvailable;
  }

  get baseStats(): Stats {
    return this._baseStats;
  }

  get allocatedStats(): Stats {
    return this._allocatedStats;
  }

  /**
   * Stats totales = base + allocated (sin items equipados aún)
   * Items se aplican en capa de aplicación/servicio
   */
  get totalBaseStats(): Stats {
    return this._baseStats.add(this._allocatedStats);
  }

  // ========== COMBAT STATS (Derived) ==========

  get maxHp(): number {
    return this.totalBaseStats.vitality * GAME_CONSTANTS.HP_PER_VITALITY;
  }

  get maxMana(): number {
    return this.totalBaseStats.energy * GAME_CONSTANTS.MANA_PER_ENERGY;
  }

  get baseDamage(): number {
    return (
      this.totalBaseStats.strength * GAME_CONSTANTS.BASE_DAMAGE_MULTIPLIER +
      this.totalBaseStats.strength * GAME_CONSTANTS.BASE_DAMAGE_STRENGTH_BONUS
    );
  }

  get currentHp(): number {
    return this._currentHp;
  }

  get currentMana(): number {
    return this._currentMana;
  }

  get isAlive(): boolean {
    return this._currentHp > 0;
  }

  // ========== EXPERIENCE & LEVEL UP ==========

  /**
   * XP necesario para siguiente nivel
   * Fórmula: level * 100 + level^2 * 10
   */
  get xpForNextLevel(): number {
    if (this._level >= GAME_CONSTANTS.MAX_LEVEL) return Infinity;
    return GAME_CONSTANTS.BASE_XP_FORMULA(this._level);
  }

  get xpProgress(): number {
    if (this._level >= GAME_CONSTANTS.MAX_LEVEL) return 1;
    return this._experience / this.xpForNextLevel;
  }

  /**
   * Añade experiencia y procesa level ups
   * Retorna true si subió de nivel
   */
  addExperience(amount: number): boolean {
    if (amount <= 0) return false;
    if (this._level >= GAME_CONSTANTS.MAX_LEVEL) return false;

    this._experience += amount;
    let leveledUp = false;

    while (this._experience >= this.xpForNextLevel && this._level < GAME_CONSTANTS.MAX_LEVEL) {
      this._experience -= this.xpForNextLevel;
      this.levelUp();
      leveledUp = true;
    }

    return leveledUp;
  }

  /**
   * Sube un nivel - lógica pura de dominio
   * Emite evento HeroLevelUpEvent para side effects
   */
  private levelUp(): void {
    const previousLevel = this._level;
    this._level += 1;
    const pointsGained = GAME_CONSTANTS.ATTRIBUTE_POINTS_PER_LEVEL;
    this._attributePointsAvailable += pointsGained;

    // Emitir evento de dominio (Observer Pattern)
    this.emit('levelUp', new HeroLevelUpEvent(this.id, previousLevel, this._level, pointsGained));
  }

  /**
   * Distribuye puntos de atributo disponibles
   * VALIDACIONES DE NEGOCIO:
   * - No más puntos de los disponibles
   * - No stats negativos
   * - No exceder nivel máximo (ya validado en levelUp)
   */
  allocateAttributePoints(allocation: { strength?: number; dexterity?: number; vitality?: number; energy?: number }): void {
    const totalRequested =
      (allocation.strength || 0) +
      (allocation.dexterity || 0) +
      (allocation.vitality || 0) +
      (allocation.energy || 0);

    if (totalRequested > this._attributePointsAvailable) {
      throw new InsufficientAttributePointsError(this._attributePointsAvailable, totalRequested);
    }

    if (totalRequested <= 0) {
      throw new InvalidLevelUpError('Must allocate at least 1 attribute point');
    }

    // Validar que no sean negativos
    for (const [key, value] of Object.entries(allocation)) {
      if (value !== undefined && value < 0) {
        throw new InvalidLevelUpError(`${key} cannot be negative`);
      }
    }

    // Aplicar分配ación (inmutabilidad: nuevo Stats)
    this._allocatedStats = Stats.createAllocated(
      this._allocatedStats.strength + (allocation.strength || 0),
      this._allocatedStats.dexterity + (allocation.dexterity || 0),
      this._allocatedStats.vitality + (allocation.vitality || 0),
      this._allocatedStats.energy + (allocation.energy || 0)
    );

    this._attributePointsAvailable -= totalRequested;

    // Restaurar HP/Mana al máximo tras subir vitalidad/energía
    this._currentHp = this.maxHp;
    this._currentMana = this.maxMana;
  }

  // ========== COMBAT HELPERS ==========

  takeDamage(amount: number): number {
    const actualDamage = Math.min(amount, this._currentHp);
    this._currentHp -= actualDamage;
    return actualDamage;
  }

  heal(amount: number): number {
    const actualHeal = Math.min(amount, this.maxHp - this._currentHp);
    this._currentHp += actualHeal;
    return actualHeal;
  }

  restoreFullHealth(): void {
    this._currentHp = this.maxHp;
    this._currentMana = this.maxMana;
  }

  // ========== SERIALIZATION ==========

  toPersistence(): HeroPersistenceData {
    return {
      id: this.id.value,
      name: this.name,
      classType: this.classType,
      baseStats: this._baseStats.toJSON(),
      allocatedStats: this._allocatedStats.toJSON(),
      level: this._level,
      experience: this._experience,
      attributePointsAvailable: this._attributePointsAvailable,
    };
  }

  toResponseDTO(): HeroResponseData {
    return {
      id: this.id.value,
      name: this.name,
      classType: this.classType,
      level: this._level,
      experience: this._experience,
      xpForNextLevel: this.xpForNextLevel,
      attributePointsAvailable: this._attributePointsAvailable,
      baseStats: this._baseStats.toJSON(),
      allocatedStats: this._allocatedStats.toJSON(),
      totalStats: this.totalBaseStats.toJSON(),
      maxHp: this.maxHp,
      currentHp: this._currentHp,
      maxMana: this.maxMana,
      currentMana: this._currentMana,
      baseDamage: this.baseDamage,
    };
  }
}

// ========== TYPES FOR SERIALIZATION ==========

export interface HeroPersistenceData {
  id: string;
  name: string;
  classType: HeroClassType;
  baseStats: ReturnType<Stats['toJSON']>;
  allocatedStats: ReturnType<Stats['toJSON']>;
  level: number;
  experience: number;
  attributePointsAvailable: number;
}

export interface HeroResponseData {
  id: string;
  name: string;
  classType: HeroClassType;
  level: number;
  experience: number;
  xpForNextLevel: number;
  attributePointsAvailable: number;
  baseStats: ReturnType<Stats['toJSON']>;
  allocatedStats: ReturnType<Stats['toJSON']>;
  totalStats: ReturnType<Stats['toJSON']>;
  maxHp: number;
  currentHp: number;
  maxMana: number;
  currentMana: number;
  baseDamage: number;
}