import { validate } from 'class-validator';
import { Transform, Type } from 'class-transformer';

/**
 * Value Object: Stats
 *
 * PATRÓN: Value Object
 * POR QUÉ: Los stats son inmutables, se comparan por valor (no identidad),
 * y encapsulan reglas de negocio (validaciones, cálculos derivados).
 * Evita primitive obsession - no pasamos 4 números sueltos por todo el código.
 *
 * DECISIÓN: Inmutable (readonly), validación en constructor, factory methods.
 * ALTERNATIVAS DESCARTADAS:
 * - Interface/plano object: sin validación, mutables, lógica dispersa
 * - Class mutables con setters: rompe inmutabilidad, difícil de razonar
 * - Tuple/array [str, dex, vit, ene]: semántica perdida, índices mágicos
 */
export class Stats {
  @Transform(({ value }) => Math.max(1, Math.floor(value)))
  public readonly strength: number;

  @Transform(({ value }) => Math.max(1, Math.floor(value)))
  public readonly dexterity: number;

  @Transform(({ value }) => Math.max(1, Math.floor(value)))
  public readonly vitality: number;

  @Transform(({ value }) => Math.max(1, Math.floor(value)))
  public readonly energy: number;

  private constructor(
    strength: number,
    dexterity: number,
    vitality: number,
    energy: number
  ) {
    this.strength = strength;
    this.dexterity = dexterity;
    this.vitality = vitality;
    this.energy = energy;
  }

  /**
   * Factory method - crea Stats con validación
   * PATRÓN: Factory Method (dentro del Value Object)
   * POR QUÉ: Centraliza validación, garantiza instancias válidas,
   * permite valores por defecto consistentes.
   */
  static create(
    strength: number = 10,
    dexterity: number = 10,
    vitality: number = 10,
    energy: number = 10
  ): Stats {
    const stats = new Stats(strength, dexterity, vitality, energy);
    const errors = validate(stats);
    if (errors.length > 0) {
      throw new Error(`Invalid stats: ${errors.map(e => Object.values(e.constraints || {})).flat().join(', ')}`);
    }
    return stats;
  }

  /**
   * Stats base para nuevo héroe (nivel 1)
   * PATRÓN: Factory Method (named constructor)
   */
  static base(): Stats {
    return Stats.create(10, 10, 10, 10);
  }

  /**
   * Suma dos Stats (para bonificaciones de items, level up)
   * Inmutabilidad: retorna nueva instancia
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
   * No permite valores < 1
   */
  subtract(other: Stats): Stats {
    return Stats.create(
      Math.max(1, this.strength - other.strength),
      Math.max(1, this.dexterity - other.dexterity),
      Math.max(1, this.vitality - other.vitality),
      Math.max(1, this.energy - other.energy)
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