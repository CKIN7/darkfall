import { Hero } from '@domain/entities/Hero';
import { HeroId } from '@domain/value-objects/HeroId';

/**
 * Port: IHeroRepository
 *
 * PATRÓN: Repository Pattern (Port/Interface)
 * POR QUÉ: Define el contrato para persistencia de Heroes.
 * El dominio no sabe nada de MySQL, JSON, Redis, etc.
 * Permite:
 * - Testear con mocks (In-memory repository)
 * - Cambiar implementación sin tocar dominio
 * - Múltiples implementaciones (MySQL, Postgres, File, Memory)
 *
 * DECISIÓN: Interface pura (no abstract class) para máxima flexibilidad.
 * Métodos mínimos necesarios para el Módulo 1.
 * ALTERNATIVAS DESCARTADAS:
 * - Abstract class con implementación base: acopla a herencia, menos flexible
 * - Active Record en Entity: viola SRP, acopla dominio a BD
 * - Service locator: anti-pattern, oculta dependencias
 */
export interface IHeroRepository {
  /**
   * Guarda un héroe (create o update)
   */
  save(hero: Hero): Promise<void>;

  /**
   * Busca héroe por ID
   */
  findById(id: HeroId): Promise<Hero | null>;

  /**
   * Busca héroe por nombre (para validar unicidad)
   */
  findByName(name: string): Promise<Hero | null>;

  /**
   * Lista todos los héroes (para admin/debug)
   */
  findAll(): Promise<Hero[]>;

  /**
   * Elimina un héroe (para testing/cleanup)
   */
  delete(id: HeroId): Promise<void>;
}

/**
 * Token para Dependency Injection
 * PATRÓN: Dependency Injection Token
 * POR QUÉ: Permite inyectar implementación concreta sin acoplar a clase
 */
export const HERO_REPOSITORY_TOKEN = 'IHeroRepository';