import { v4 as uuidv4 } from 'uuid';

/**
 * Value Object: HeroId
 *
 * PATRÓN: Value Object (Strongly Typed ID)
 * POR QUÉ: Type safety - evita pasar string IDs genéricos,
 * previene errores como pasar userId donde se espera heroId.
 * Encapsula generación y validación de UUID.
 *
 * DECISIÓN: Wrapper inmutable sobre UUID v4.
 * ALTERNATIVAS DESCARTADAS:
 * - string plano: sin type safety, cualquier string vale
 * - number autoincremental: no funciona en distributed systems, expone info de negocio
 * - ULID: más complejo, UUID v4 es estándar y suficiente
 */
export class HeroId {
  public readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  /**
   * Factory: genera nuevo ID único
   * PATRÓN: Factory Method
   */
  static generate(): HeroId {
    return new HeroId(uuidv4());
  }

  /**
   * Factory: crea desde string existente (reconstrucción desde BD)
   * Valida formato UUID
   */
  static fromString(value: string): HeroId {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new Error(`Invalid HeroId format: ${value}`);
    }
    return new HeroId(value);
  }

  equals(other: HeroId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }
}