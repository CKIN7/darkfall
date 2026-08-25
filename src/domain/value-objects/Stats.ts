/**
 * Value Object: Stats
 *
 * PATRÓN: Value Object
 * POR QUÉ: Los stats son inmutables, se comparan por valor (no identidad),
 * y encapsulan reglas de negocio (validaciones, cálculos derivados).
 * Evita primitive obsession - no pasamos 4 números sueltos por todo el código.
 *
 * DECISIÓN: Inmutable (readonly), validación en factory methods.
 * - Base stats (stats innatos): mínimo 1
 * - Allocated stats (puntos distribuidos): mínimo 0
 * - Total stats = base + allocated
 * ALTERNATIVAS DESCARTADAS:
 * - Interface/plano object: sin validación, mutables, lógica dispersa
 * - Class mutables con setters: rompe inmutabilidad, difícil de razonar
 * - Tuple/array [str, dex, vit, ene]: semántica perdida, índices mágicos
 */
export class Stats {
  public readonly strength: number;
  public readonly dexterity: number;
  public readonly vitality: number;
  public readonly energy: number;

  private constructor(
    strength: number,
    dexterity: number,
    vitality: number,
    energy: number
  ) {
    // Permitir 0 para allocated stats, clamp solo para evitar negativos
    this.strength = Math.max(0, Math.floor(strength));
    this.dexterity = Math.max(0, Math.floor(dexterity));
    this.vitality = Math.max(0, Math.floor(vitality));
    this.energy = Math.max(0, Math.floor(energy));
  }

  /**
   * Factory para base stats (stats innatos del héroe/items) - mínimo 1
   * PATRÓN: Factory Method
   * POR QUÉ: Valida invariante de dominio: stats base nunca pueden ser 0
   */
  static createBase(
    strength: number = 10,
    dexterity: number = 10,
    vitality: number = 10,
    energy: number = 10
  ): Stats {
    if (!Number.isFinite(strength) || !Number.isFinite(dexterity) ||
        !Number.isFinite(vitality) || !Number.isFinite(energy)) {
      throw new Error('Base stats must be finite numbers');
    }
    if (strength < 1 || dexterity < 1 || vitality < 1 || energy < 1) {
      throw new Error('Base stats must be at least 1');
    }
    return new Stats(strength, dexterity, vitality, energy);
  }

  /**
   * Factory para allocated stats (puntos distribuidos al subir nivel) - mínimo 0
   * PATRÓN: Factory Method
   */
  static createAllocated(
    strength: number = 0,
    dexterity: number = 0,
    vitality: number = 0,
    energy: number = 0
  ): Stats {
    if (!Number.isFinite(strength) || !Number.isFinite(dexterity) ||
        !Number.isFinite(vitality) || !Number.isFinite(energy)) {
      throw new Error('Allocated stats must be finite numbers');
    }
    if (strength < 0 || dexterity < 0 || vitality < 0 || energy < 0) {
      throw new Error('Allocated stats cannot be negative');
    }
    return new Stats(strength, dexterity, vitality, energy);
  }

  /**
   * Stats base para nuevo héroe (nivel 1) - alias para createBase(10,10,10,10)
   * PATRÓN: Factory Method (named constructor)
   */
  static base(): Stats {
    return Stats.createBase(10, 10, 10, 10);
  }

  /**
   * Stats allocated en cero (inicio del juego)
   */
  static zero(): Stats {
    return Stats.createAllocated(0, 0, 0, 0);
  }

  /**
   * Suma dos Stats (para bonificaciones de items, level up)
   * Inmutabilidad: retorna nueva instancia
   * El resultado puede tener cualquier valor >= 0
   */
  add(other: Stats): Stats {
    return new Stats(
      this.strength + other.strength,
      this.dexterity + other.dexterity,
      this.vitality + other.vitality,
      this.energy + other.energy
    );
  }

  /**
   * Resta Stats (para remover equipamiento)
   * No permite valores < 0
   */
  subtract(other: Stats): Stats {
    return new Stats(
      Math.max(0, this.strength - other.strength),
      Math.max(0, this.dexterity - other.dexterity),
      Math.max(0, this.vitality - other.vitality),
      Math.max(0, this.energy - other.energy)
    );
  }

  /**
   * Igualdad por valor (Value Object semantics)
   */
  equals(other: Stats): boolean {
    return (
      this.strength === other.strength &&
      this.dexterity === other.dexterity &&
      this.vitality === other.vitality &&
      this.energy === other.energy
    );
  }

  toJSON() {
    return {
      strength: this.strength,
      dexterity: this.dexterity,
      vitality: this.vitality,
      energy: this.energy,
    };
  }

  toString(): string {
    return `Str:${this.strength} Dex:${this.dexterity} Vit:${this.vitality} Ene:${this.energy}`;
  }
}