/**
 * Domain Errors - Excepciones de dominio personalizadas
 *
 * PATRÓN: Custom Domain Exceptions
 * POR QUÉ: Errores semánticos del dominio (no técnicos).
 * Permiten catch específico en aplicación, mapeo a HTTP codes,
 * y mensajes claros para el cliente sin exponer internos.
 *
 * DECISIÓN: Clases extendiendo Error con code y statusCode.
 * ALTERNATIVAS DESCARTADAS:
 * - Error genérico + mensaje: no permite catch diferenciado
 * - Códigos de error en string: propensos a typos, sin type safety
 * - Result/Either monad: añade complejidad funcional innecesaria en TS
 */

export abstract class DomainError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code: string, statusCode: number) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class HeroNotFoundError extends DomainError {
  constructor(heroId: string) {
    super(`Hero with id ${heroId} not found`, 'HERO_NOT_FOUND', 404);
  }
}

export class InvalidLevelUpError extends DomainError {
  constructor(message: string) {
    super(message, 'INVALID_LEVEL_UP', 400);
  }
}

export class InsufficientAttributePointsError extends DomainError {
  constructor(available: number, requested: number) {
    super(
      `Insufficient attribute points: ${available} available, ${requested} requested`,
      'INSUFFICIENT_ATTRIBUTE_POINTS',
      400
    );
  }
}

export class HeroAlreadyExistsError extends DomainError {
  constructor(name: string) {
    super(`Hero with name "${name}" already exists`, 'HERO_ALREADY_EXISTS', 409);
  }
}

export class InvalidHeroNameError extends DomainError {
  constructor(reason: string) {
    super(`Invalid hero name: ${reason}`, 'INVALID_HERO_NAME', 400);
  }
}

export class MaxLevelReachedError extends DomainError {
  constructor(level: number) {
    super(`Hero has reached maximum level (${level})`, 'MAX_LEVEL_REACHED', 400);
  }
}

/**
 * Type guard para detectar errores de dominio
 */
export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}